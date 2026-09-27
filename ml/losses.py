"""
Improved Loss Functions for VAJRA V2 Severe Mountain Weather Nowcasting.
Addresses extreme class imbalance in cloudburst and flash flood events with:
- Asymmetric quantile loss penalizing under-prediction of heavy rain
- Focal BCE with positive weighting for extreme rain binary detection
- Focal BCE for multi-hazard classification
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple

from config import MAX_RAINFALL_MM_HR


class WeightedPrecipitationLoss(nn.Module):
    """
    Enhanced Weighted MSE with asymmetric quantile penalty.
    The standard WMSE drives overall regression accuracy, while the quantile
    component harshly penalizes under-prediction of extreme rainfall events
    (tau=0.85 means under-prediction is ~5.7x more costly than over-prediction).
    """
    def __init__(self, heavy_rain_weight: float = 15.0, quantile_tau: float = 0.85):
        super().__init__()
        self.heavy_rain_weight = heavy_rain_weight
        self.quantile_tau = quantile_tau

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # Intensity-weighted MSE: heavier weight for higher target rain
        # target**1.5 makes the weight grow super-linearly with rain intensity
        intensity_weight = 1.0 + (self.heavy_rain_weight * target ** 1.5)
        squared_err = (pred - target) ** 2
        wmse = (intensity_weight * squared_err).mean()

        # Asymmetric quantile loss: penalize under-prediction more for significant rain
        residual = target - pred
        quantile_loss = torch.where(
            residual > 0,
            self.quantile_tau * residual,            # Under-prediction penalty (harsh)
            (1.0 - self.quantile_tau) * (-residual)  # Over-prediction penalty (mild)
        )
        # Apply only where target indicates significant rain (> ~18 mm/hr normalized)
        rain_mask = (target > 0.15).float()
        quantile_loss = (quantile_loss * rain_mask).sum() / (rain_mask.sum() + 1e-6)

        return wmse + 0.5 * quantile_loss


class ExtremeDetectionLoss(nn.Module):
    """
    Focal BCE for the extreme rain binary detection auxiliary head.
    Uses positive class weighting to address severe class imbalance
    (extreme events are rare, calm weather dominates).
    """
    def __init__(self, gamma: float = 2.0, pos_weight: float = 5.0):
        super().__init__()
        self.gamma = gamma
        self.pos_weight = pos_weight

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        eps = 1e-7
        pred = torch.clamp(pred, eps, 1.0 - eps)

        # Weighted focal BCE: pos_weight amplifies the cost of missing true positives
        bce = -(self.pos_weight * target * torch.log(pred) +
                (1.0 - target) * torch.log(1.0 - pred))
        p_t = target * pred + (1.0 - target) * (1.0 - pred)
        focal_weight = (1.0 - p_t) ** self.gamma

        return (focal_weight * bce).mean()


class MultiHazardLoss(nn.Module):
    """
    Binary Cross Entropy with focal weight for multi-hazard classification.
    """
    def __init__(self, gamma: float = 2.0):
        super().__init__()
        self.gamma = gamma

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # Clamped for numerical stability
        eps = 1e-7
        pred = torch.clamp(pred, eps, 1.0 - eps)

        # Focal formulation: -alpha * (1 - p_t)^gamma * log(p_t)
        bce = - (target * torch.log(pred) + (1.0 - target) * torch.log(1.0 - pred))
        p_t = target * pred + (1.0 - target) * (1.0 - pred)
        focal_weight = (1.0 - p_t) ** self.gamma

        return (focal_weight * bce).mean()


class VajraLoss(nn.Module):
    """
    Combined Multi-Task Loss V2:
    L_total = L_precipitation + λ_ext * L_extreme + λ_haz * L_hazards

    The extreme detection head uses on-the-fly label generation from rain targets:
    a lead time is "extreme" if the max spatial rain exceeds the threshold.
    """
    def __init__(self, lambda_haz: float = 1.5, lambda_extreme: float = 2.0,
                 heavy_rain_weight: float = 15.0, extreme_threshold_norm: float = 0.167):
        super().__init__()
        self.rain_loss_fn = WeightedPrecipitationLoss(heavy_rain_weight=heavy_rain_weight)
        self.extreme_loss_fn = ExtremeDetectionLoss(pos_weight=5.0)
        self.haz_loss_fn = MultiHazardLoss()
        self.lambda_haz = lambda_haz
        self.lambda_extreme = lambda_extreme
        self.extreme_threshold_norm = extreme_threshold_norm  # 20mm / 120mm ≈ 0.167

    def forward(
        self,
        rain_pred: torch.Tensor,
        rain_target: torch.Tensor,
        extreme_pred: torch.Tensor,
        haz_pred: torch.Tensor,
        haz_target: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        l_rain = self.rain_loss_fn(rain_pred, rain_target)

        # Compute extreme target from rain target on-the-fly
        # rain_target: (B, T, 1, H, W), extreme_pred: (B, T, 1)
        # Extreme = 1 if max spatial rain in that lead-time hour exceeds threshold
        extreme_target = (rain_target.amax(dim=(-2, -1)) >= self.extreme_threshold_norm).float()
        l_extreme = self.extreme_loss_fn(extreme_pred, extreme_target)

        l_haz = self.haz_loss_fn(haz_pred, haz_target)

        l_total = l_rain + (self.lambda_extreme * l_extreme) + (self.lambda_haz * l_haz)
        return l_total, l_rain, l_extreme, l_haz
