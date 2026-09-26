"""
Meteorological & Machine Learning Evaluation Metrics for VAJRA Spatiotemporal Nowcasting:
Calculates:
- POD (Probability of Detection / Recall)
- Precision (Positive Predictive Value)
- F1-Score
- FAR (False Alarm Ratio)
- CSI (Critical Success Index / Threat Score)
- Confusion Matrix (Hits/TP, False Alarms/FP, Misses/FN, Correct Negatives/TN)
- Brier Score (Probability Calibration Quality)
- RMSE & MAE in physical mm/hr
- Lead-time specific performance breakdown (+1h through +6h)
"""

import numpy as np
import torch
from typing import Dict, Any

from config import MAX_RAINFALL_MM_HR, NUM_HAZARDS, OUTPUT_SEQ_LEN


def compute_meteorological_scores(
    pred_rain: torch.Tensor,
    target_rain: torch.Tensor,
    pred_haz: torch.Tensor = None,
    target_haz: torch.Tensor = None,
    threshold_mm: float = 25.0
) -> Dict[str, Any]:
    """
    Computes comprehensive meteorological & statistical metrics.
    pred_rain, target_rain: tensors in [0, 1] normalized scale.
    pred_haz, target_haz: tensors in [0, 1] probability scale.
    threshold_mm: precipitation threshold in mm/hr for severe weather event.
    """
    # Convert normalized rain back to physical mm/hr
    pred_mm = (pred_rain * MAX_RAINFALL_MM_HR).detach().cpu().numpy()
    target_mm = (target_rain * MAX_RAINFALL_MM_HR).detach().cpu().numpy()

    # Binarize based on severe precipitation threshold
    pred_binary = (pred_mm >= threshold_mm)
    target_binary = (target_mm >= threshold_mm)

    tp = int(np.logical_and(pred_binary, target_binary).sum())
    fn = int(np.logical_and(~pred_binary, target_binary).sum())
    fp = int(np.logical_and(pred_binary, ~target_binary).sum())
    tn = int(np.logical_and(~pred_binary, ~target_binary).sum())

    # Probability of Detection (Recall)
    pod = tp / (tp + fn + 1e-6)
    # Precision
    precision = tp / (tp + fp + 1e-6)
    # F1 Score
    f1 = 2 * (precision * pod) / (precision + pod + 1e-6)
    # False Alarm Ratio
    far = fp / (tp + fp + 1e-6)
    # False Alarm Rate (FPR = FP / (FP + TN))
    fpr = fp / (fp + tn + 1e-6)
    # Critical Success Index (Threat Score)
    csi = tp / (tp + fn + fp + 1e-6)

    # Physical error metrics
    rmse = float(np.sqrt(np.mean((pred_mm - target_mm) ** 2)))
    mae = float(np.mean(np.abs(pred_mm - target_mm)))

    # Lead-time specific breakdown (for each future hour t+1 to t+6)
    lead_time_metrics = []
    t_out = pred_mm.shape[1]
    for h in range(t_out):
        h_pred_mm = pred_mm[:, h]
        h_target_mm = target_mm[:, h]
        h_pred_bin = (h_pred_mm >= threshold_mm)
        h_target_bin = (h_target_mm >= threshold_mm)

        h_tp = int(np.logical_and(h_pred_bin, h_target_bin).sum())
        h_fn = int(np.logical_and(~h_pred_bin, h_target_bin).sum())
        h_fp = int(np.logical_and(h_pred_bin, ~h_target_bin).sum())

        h_pod = h_tp / (h_tp + h_fn + 1e-6)
        h_csi = h_tp / (h_tp + h_fn + h_fp + 1e-6)
        h_rmse = float(np.sqrt(np.mean((h_pred_mm - h_target_mm) ** 2)))
        h_mae = float(np.mean(np.abs(h_pred_mm - h_target_mm)))

        lead_time_metrics.append({
            "horizon": f"+{h+1} HR",
            "hour": h + 1,
            "pod": float(h_pod),
            "csi": float(h_csi),
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
            h_tp = int(np.logical_and(p_bin, t_bin).sum())
            h_fp = int(np.logical_and(p_bin, ~t_bin).sum())
            h_fn = int(np.logical_and(~p_bin, t_bin).sum())
            h_tn = int(np.logical_and(~p_bin, ~t_bin).sum())
            
            h_rec = h_tp / (h_tp + h_fn + 1e-6)
            h_prec = h_tp / (h_tp + h_fp + 1e-6)
            h_f1 = 2 * (h_prec * h_rec) / (h_prec + h_rec + 1e-6)
            
            hazard_metrics[h_name] = {
                "precision": float(h_prec),
                "recall": float(h_rec),
                "f1_score": float(h_f1),
                "confusion_matrix": {
                    "true_positive": h_tp,
                    "false_positive": h_fp,
                    "false_negative": h_fn,
                    "true_negative": h_tn
                }
            }
        hazard_metrics["brier_score"] = brier

    return {
        "POD": float(pod),
        "Recall": float(pod),
        "Precision": float(precision),
        "F1_Score": float(f1),
        "FAR": float(far),
        "FPR": float(fpr),
        "CSI": float(csi),
        "RMSE_mm_hr": float(rmse),
        "MAE_mm_hr": float(mae),
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "false_negative": fn,
            "true_negative": tn
        },
        "lead_time_performance": lead_time_metrics,
        "hazard_evaluation": hazard_metrics
    }
