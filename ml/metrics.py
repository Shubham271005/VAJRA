"""
Meteorological Evaluation Metrics for VAJRA Nowcasting:
CSI (Critical Success Index), POD (Probability of Detection), FAR (False Alarm Rate), RMSE, MAE.
"""

import numpy as np
import torch
from typing import Dict

from config import MAX_RAINFALL_MM_HR


def compute_meteorological_scores(
    pred_rain: torch.Tensor,
    target_rain: torch.Tensor,
    threshold_mm: float = 25.0
) -> Dict[str, float]:
    """
    Computes CSI, POD, FAR, and RMSE for precipitation forecasting.
    pred_rain, target_rain: tensors in [0, 1] normalized scale.
    threshold_mm: precipitation threshold in mm/hr for severe weather hits.
    """
    # Convert normalized back to physical mm/hr
    pred_mm = (pred_rain * MAX_RAINFALL_MM_HR).detach().cpu().numpy()
    target_mm = (target_rain * MAX_RAINFALL_MM_HR).detach().cpu().numpy()

    # Binarize based on severe precipitation threshold
    pred_binary = (pred_mm >= threshold_mm)
    target_binary = (target_mm >= threshold_mm)

    hits = np.logical_and(pred_binary, target_binary).sum()
    misses = np.logical_and(~pred_binary, target_binary).sum()
    false_alarms = np.logical_and(pred_binary, ~target_binary).sum()

    # Probability of Detection (Recall)
    pod = hits / (hits + misses + 1e-6)
    # False Alarm Ratio
    far = false_alarms / (hits + false_alarms + 1e-6)
    # Critical Success Index (Threat Score)
    csi = hits / (hits + misses + false_alarms + 1e-6)

    # Physical error metrics
    rmse = np.sqrt(np.mean((pred_mm - target_mm) ** 2))
    mae = np.mean(np.abs(pred_mm - target_mm))

    return {
        "POD": float(pod),
        "FAR": float(far),
        "CSI": float(csi),
        "RMSE_mm_hr": float(rmse),
        "MAE_mm_hr": float(mae),
    }
