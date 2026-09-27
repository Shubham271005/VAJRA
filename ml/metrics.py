"""
Meteorological & Machine Learning Evaluation Metrics V2 for VAJRA Spatiotemporal Nowcasting.
Calculates:
- POD (Probability of Detection / Recall)
- Precision (Positive Predictive Value)
- F1-Score
- FAR (False Alarm Ratio)
- CSI (Critical Success Index / Threat Score)
- ETS (Equitable Threat Score / Gilbert Skill Score)
- HSS (Heidke Skill Score)
- Confusion Matrix (Hits/TP, False Alarms/FP, Misses/FN, Correct Negatives/TN)
- Brier Score (Probability Calibration Quality)
- RMSE & MAE in physical mm/hr
- Multi-threshold evaluation (10mm, 20mm, 40mm)
- Extreme detection accuracy
- Lead-time specific performance breakdown (+1h through +6h)
"""

import numpy as np
import torch
from typing import Dict, Any, Optional

from config import MAX_RAINFALL_MM_HR, NUM_HAZARDS, OUTPUT_SEQ_LEN


def _binary_contingency(pred_bin: np.ndarray, target_bin: np.ndarray) -> Dict[str, Any]:
    """Compute full contingency table and derived skill scores."""
    tp = int(np.logical_and(pred_bin, target_bin).sum())
    fn = int(np.logical_and(~pred_bin, target_bin).sum())
    fp = int(np.logical_and(pred_bin, ~target_bin).sum())
    tn = int(np.logical_and(~pred_bin, ~target_bin).sum())
    total = tp + fn + fp + tn

    # Probability of Detection (Recall)
    pod = tp / (tp + fn + 1e-6)
    # Precision
    precision = tp / (tp + fp + 1e-6)
    # F1 Score
    f1 = 2 * (precision * pod) / (precision + pod + 1e-6)
    # False Alarm Ratio
    far = fp / (tp + fp + 1e-6)
    # False Alarm Rate (FPR)
    fpr = fp / (fp + tn + 1e-6)
    # Critical Success Index (Threat Score)
    csi = tp / (tp + fn + fp + 1e-6)

    # Equitable Threat Score (Gilbert Skill Score)
    # ETS = (TP - TP_random) / (TP + FN + FP - TP_random)
    # where TP_random = (TP + FN)(TP + FP) / total
    tp_random = (tp + fn) * (tp + fp) / (total + 1e-6)
    ets = (tp - tp_random) / (tp + fn + fp - tp_random + 1e-6)

    # Heidke Skill Score
    # HSS = 2*(TP*TN - FN*FP) / ((TP+FN)*(FN+TN) + (TP+FP)*(FP+TN))
    hss_denom = (tp + fn) * (fn + tn) + (tp + fp) * (fp + tn)
    hss = 2 * (tp * tn - fn * fp) / (hss_denom + 1e-6)

    return {
        "tp": tp, "fn": fn, "fp": fp, "tn": tn,
        "pod": float(pod), "precision": float(precision), "f1": float(f1),
        "far": float(far), "fpr": float(fpr),
        "csi": float(csi), "ets": float(ets), "hss": float(hss)
    }


def compute_meteorological_scores(
    pred_rain: torch.Tensor,
    target_rain: torch.Tensor,
    pred_haz: Optional[torch.Tensor] = None,
    target_haz: Optional[torch.Tensor] = None,
    pred_extreme: Optional[torch.Tensor] = None,
    threshold_mm: float = 25.0
) -> Dict[str, Any]:
    """
    Computes comprehensive meteorological & statistical metrics.
    pred_rain, target_rain: tensors in [0, 1] normalized scale.
    pred_haz, target_haz: tensors in [0, 1] probability scale.
    pred_extreme: (B, T, 1) extreme rain detection probabilities.
    threshold_mm: precipitation threshold in mm/hr for severe weather event.
    """
    # Convert normalized rain back to physical mm/hr
    pred_mm = (pred_rain * MAX_RAINFALL_MM_HR).detach().cpu().numpy()
    target_mm = (target_rain * MAX_RAINFALL_MM_HR).detach().cpu().numpy()

    # Primary threshold evaluation
    pred_binary = (pred_mm >= threshold_mm)
    target_binary = (target_mm >= threshold_mm)
    primary = _binary_contingency(pred_binary, target_binary)

    # Physical error metrics
    rmse = float(np.sqrt(np.mean((pred_mm - target_mm) ** 2)))
    mae = float(np.mean(np.abs(pred_mm - target_mm)))

    # Multi-threshold evaluation
    multi_threshold = {}
    for thresh in [10.0, 20.0, 40.0, 60.0]:
        p_bin = (pred_mm >= thresh)
        t_bin = (target_mm >= thresh)
        mt = _binary_contingency(p_bin, t_bin)
        multi_threshold[f"{int(thresh)}mm"] = {
            "pod": mt["pod"], "csi": mt["csi"], "ets": mt["ets"],
            "far": mt["far"], "precision": mt["precision"], "f1": mt["f1"]
        }

    # Lead-time specific breakdown (for each future hour t+1 to t+6)
    lead_time_metrics = []
    t_out = pred_mm.shape[1]
    for h in range(t_out):
        h_pred_mm = pred_mm[:, h]
        h_target_mm = target_mm[:, h]
        h_pred_bin = (h_pred_mm >= threshold_mm)
        h_target_bin = (h_target_mm >= threshold_mm)

        h_scores = _binary_contingency(h_pred_bin, h_target_bin)
        h_rmse = float(np.sqrt(np.mean((h_pred_mm - h_target_mm) ** 2)))
        h_mae = float(np.mean(np.abs(h_pred_mm - h_target_mm)))

        lead_time_metrics.append({
            "horizon": f"+{h+1} HR",
            "hour": h + 1,
            "pod": h_scores["pod"],
            "csi": h_scores["csi"],
            "ets": h_scores["ets"],
            "far": h_scores["far"],
            "rmse_mm_hr": float(h_rmse),
            "mae_mm_hr": float(h_mae)
        })

    # Hazard classification metrics (if provided)
    hazard_metrics = {}
    if pred_haz is not None and target_haz is not None:
        p_haz = pred_haz.detach().cpu().numpy()
        t_haz = target_haz.detach().cpu().numpy()
        # Brier score: mean squared error of probability predictions
        brier = float(np.mean((p_haz - t_haz) ** 2))
        hazard_names = ["thunderstorm", "cloudburst", "flash_flood"]

        for idx, h_name in enumerate(hazard_names):
            p_bin = (p_haz[:, :, idx] >= 0.5)
            t_bin = (t_haz[:, :, idx] >= 0.5)
            h_scores = _binary_contingency(p_bin, t_bin)

            hazard_metrics[h_name] = {
                "precision": h_scores["precision"],
                "recall": h_scores["pod"],
                "f1_score": h_scores["f1"],
                "confusion_matrix": {
                    "true_positive": h_scores["tp"],
                    "false_positive": h_scores["fp"],
                    "false_negative": h_scores["fn"],
                    "true_negative": h_scores["tn"]
                }
            }
        hazard_metrics["brier_score"] = brier

    # Extreme detection accuracy (if provided)
    extreme_metrics = {}
    if pred_extreme is not None:
        p_ext = pred_extreme.detach().cpu().numpy()  # (B, T, 1)
        # Compute extreme target from rain target
        extreme_threshold_norm = threshold_mm / MAX_RAINFALL_MM_HR
        t_ext = (target_mm.max(axis=(-2, -1), keepdims=True) >= threshold_mm).astype(float)
        # Reshape to match
        if p_ext.ndim == 3:
            p_ext_flat = p_ext.reshape(-1)
            t_ext_flat = t_ext.reshape(-1)
        else:
            p_ext_flat = p_ext.ravel()
            t_ext_flat = t_ext.ravel()

        ext_pred_bin = (p_ext_flat >= 0.5)
        ext_target_bin = (t_ext_flat >= 0.5)
        ext_scores = _binary_contingency(ext_pred_bin, ext_target_bin)
        extreme_metrics = {
            "accuracy": float((ext_pred_bin == ext_target_bin).mean()),
            "precision": ext_scores["precision"],
            "recall": ext_scores["pod"],
            "f1": ext_scores["f1"],
            "confusion_matrix": {
                "true_positive": ext_scores["tp"],
                "false_positive": ext_scores["fp"],
                "false_negative": ext_scores["fn"],
                "true_negative": ext_scores["tn"]
            }
        }

    return {
        "POD": primary["pod"],
        "Recall": primary["pod"],
        "Precision": primary["precision"],
        "F1_Score": primary["f1"],
        "FAR": primary["far"],
        "FPR": primary["fpr"],
        "CSI": primary["csi"],
        "ETS": primary["ets"],
        "HSS": primary["hss"],
        "RMSE_mm_hr": float(rmse),
        "MAE_mm_hr": float(mae),
        "confusion_matrix": {
            "true_positive": primary["tp"],
            "false_positive": primary["fp"],
            "false_negative": primary["fn"],
            "true_negative": primary["tn"]
        },
        "multi_threshold": multi_threshold,
        "lead_time_performance": lead_time_metrics,
        "hazard_evaluation": hazard_metrics,
        "extreme_detection": extreme_metrics
    }
