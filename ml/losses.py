"""
Custom Meteorological Loss Functions for Severe Mountain Weather Nowcasting.
Addresses extreme class imbalance in cloudburst and flash flood events.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple


class WeightedPrecipitationLoss(nn.Module):
    """
    Weighted Mean Squared Error (BMSE):
    Penalizes misses on intense and extreme cloudburst rainfall much higher than light rain.
    """
    def __init__(self, heavy_rain_weight: float = 12.0):
        super().__init__()
        self.heavy_rain_weight = heavy_rain_weight

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # Both pred and target are in [0, 1] range (normalized by MAX_RAINFALL_MM_HR)
        # Weight dynamically scales with target intensity
        weights = 1.0 + (self.heavy_rain_weight * target)
        squared_err = (pred - target) ** 2
        weighted_err = weights * squared_err
        return weighted_err.mean()


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
    Combined Multi-Task Loss:
    L_total = L_precipitation + lambda_haz * L_hazards
    """
    def __init__(self, lambda_haz: float = 1.5, heavy_rain_weight: float = 12.0):
        super().__init__()
        self.rain_loss_fn = WeightedPrecipitationLoss(heavy_rain_weight=heavy_rain_weight)
        self.haz_loss_fn = MultiHazardLoss()
        self.lambda_haz = lambda_haz

    def forward(
        self,
        rain_pred: torch.Tensor,
        rain_target: torch.Tensor,
        haz_pred: torch.Tensor,
        haz_target: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        l_rain = self.rain_loss_fn(rain_pred, rain_target)
        l_haz = self.haz_loss_fn(haz_pred, haz_target)
        l_total = l_rain + (self.lambda_haz * l_haz)
        return l_total, l_rain, l_haz
