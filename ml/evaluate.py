"""
VAJRA Model Evaluation & Inspection Script: Kedarnath 2013 Case Study
Loads best checkpoint and tests prediction performance during the June 16-17 peak disaster window.
"""

import json
import os
import torch
import numpy as np

from config import (
    ANCHOR_NODES,
    GRID_H,
    GRID_W,
    LAT_MAX,
    LAT_MIN,
    LON_MAX,
    LON_MIN,
    MAX_RAINFALL_MM_HR,
    WEIGHTS_DIR,
)
from dataset import get_dataloaders
from metrics import compute_meteorological_scores
from model import VajraNowcastNet


def evaluate_trained_model():
    print("=== VAJRA Model Evaluation & Incident Retrospective Test ===")
    checkpoint_path = os.path.join(WEIGHTS_DIR, "vajra_kedarnath_model.pt")
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")
        
    checkpoint = torch.load(checkpoint_path, weights_only=False)
    print(f"Loaded checkpoint from Epoch {checkpoint['epoch']} with Val Loss: {checkpoint['val_loss']:.4f}")
    
    model = VajraNowcastNet()
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    _, val_loader = get_dataloaders(batch_size=1)
    
    # Evaluate across all validation batches
    total_samples = len(val_loader)
    all_preds = []
    all_trues = []
    
    with torch.no_grad():
        for batch_x, batch_rain, batch_haz in val_loader:
            pred_rain, pred_haz = model(batch_x)
            all_preds.append(pred_rain)
            all_trues.append(batch_rain)
            
    val_preds = torch.cat(all_preds, dim=0)
    val_trues = torch.cat(all_trues, dim=0)
    
    scores_20 = compute_meteorological_scores(val_preds, val_trues, threshold_mm=20.0)
    scores_40 = compute_meteorological_scores(val_preds, val_trues, threshold_mm=40.0)
    
    print("-" * 65)
    print("METEOROLOGICAL VERIFICATION SCORES (Peak Incident Window):")
    print(f"  • Heavy Rain Threshold (>= 20 mm/hr):")
    print(f"      - POD (Probability of Detection): {scores_20['POD'] * 100:.1f}%")
    print(f"      - CSI (Critical Success Index):   {scores_20['CSI']:.3f}")
    print(f"      - FAR (False Alarm Rate):         {scores_20['FAR'] * 100:.1f}%")
    print(f"  • Cloudburst Threshold (>= 40 mm/hr):")
    print(f"      - POD (Probability of Detection): {scores_40['POD'] * 100:.1f}%")
    print(f"      - CSI (Critical Success Index):   {scores_40['CSI']:.3f}")
    print(f"  • Overall RMSE:                       {scores_20['RMSE_mm_hr']:.2f} mm/hr")
    print(f"  • Overall MAE:                        {scores_20['MAE_mm_hr']:.2f} mm/hr")
    print("-" * 65)
    
    # Test a specific peak scenario prediction (Peak storm onset)
    test_x, test_rain, test_haz = next(iter(val_loader))
    with torch.no_grad():
        sample_rain, sample_haz = model(test_x)
        
    sample_rain_mm = sample_rain[0] * MAX_RAINFALL_MM_HR  # (6, 1, 65, 35)
    sample_haz_pct = sample_haz[0] * 100.0               # (6, 3)
    
    print("SAMPLE 0-6 HOUR NOWCAST PREDICTION (June 16 Peak Convergence):")
    haz_names = ["Thunderstorm", "Cloudburst", "Flash Flood"]
    for h in range(6):
        lead_time = f"+{h+1} HR"
        mean_rain = sample_rain_mm[h, 0].mean().item()
        max_rain = sample_rain_mm[h, 0].max().item()
        probs = [f"{haz_names[i]}: {sample_haz_pct[h, i].item():.1f}%" for i in range(3)]
        print(f"  [{lead_time:^6}] Rain: Mean={mean_rain:4.1f} mm/hr, Peak={max_rain:4.1f} mm/hr | " + " | ".join(probs))
    print("-" * 65)


if __name__ == "__main__":
    evaluate_trained_model()
