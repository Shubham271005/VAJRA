"""
VAJRA Data Preprocessing Pipeline: Kedarnath 2013
Performs channel normalization, sliding window extraction (T_in=4, T_out=6),
and chronological train/validation splitting.
"""

import os
import torch
import numpy as np

from config import (
    CHANNEL_BOUNDS,
    CHANNEL_NAMES,
    DATA_DIR,
    INPUT_SEQ_LEN,
    MAX_RAINFALL_MM_HR,
    OUTPUT_SEQ_LEN,
)


def normalize_channel(data: torch.Tensor, c_idx: int, c_name: str) -> torch.Tensor:
    """Min-max normalize a channel to [0, 1]."""
    min_v, max_v = CHANNEL_BOUNDS[c_name]
    normed = (data[:, c_idx, :, :] - min_v) / (max_v - min_v)
    return torch.clamp(normed, 0.0, 1.0)


def run_preprocessing():
    print("=== VAJRA Data Preprocessing: Normalization & Sliding Windows ===")
    
    raw_path = os.path.join(DATA_DIR, "raw_meteo_2013.pt")
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw data not found at {raw_path}. Run acquire_data.py first.")
        
    raw = torch.load(raw_path, weights_only=False)
    features = raw["features"]    # (144, 8, 65, 35)
    rainfall = raw["rainfall"]    # (144, 65, 35)
    hazards = raw["hazards"]      # (144, 3)
    
    num_hours, num_channels, h, w = features.shape
    print(f"[1/4] Loaded raw tensors: {num_hours} hours, {num_channels} channels, grid: {h}x{w}")
    
    # 1. Normalize each feature channel to [0, 1]
    print("[2/4] Normalizing feature channels using physical bounds...")
    norm_features = torch.zeros_like(features)
    for idx, name in enumerate(CHANNEL_NAMES):
        norm_features[:, idx, :, :] = normalize_channel(features, idx, name)
        c_min = norm_features[:, idx, :, :].min().item()
        c_max = norm_features[:, idx, :, :].max().item()
        print(f"      Channel {idx:02d} ({name:10s}): bounds [{c_min:.3f}, {c_max:.3f}]")

    # Normalize rainfall: scale [0, MAX_RAINFALL_MM_HR] -> [0, 1]
    norm_rainfall = torch.clamp(rainfall / MAX_RAINFALL_MM_HR, 0.0, 1.0)
    
    # 2. Extract Sliding Sequences (T_in = 4, T_out = 6)
    print(f"[3/4] Generating sliding sequence windows (T_in={INPUT_SEQ_LEN}, T_out={OUTPUT_SEQ_LEN})...")
    total_window = INPUT_SEQ_LEN + OUTPUT_SEQ_LEN  # 10 hours
    num_samples = num_hours - total_window + 1     # 144 - 10 + 1 = 135 samples
    
    X_list = []
    Y_rain_list = []
    Y_haz_list = []
    
    for i in range(num_samples):
        # Input sequence: [i, i+1, i+2, i+3] -> shape: (4, 8, 65, 35)
        x_seq = norm_features[i : i + INPUT_SEQ_LEN]
        
        # Target rain sequence: [i+4, ..., i+9] -> shape: (6, 1, 65, 35)
        y_rain_seq = norm_rainfall[i + INPUT_SEQ_LEN : i + total_window].unsqueeze(1)
        
        # Target hazard sequence: [i+4, ..., i+9] -> shape: (6, 3)
        y_haz_seq = hazards[i + INPUT_SEQ_LEN : i + total_window]
        
        X_list.append(x_seq)
        Y_rain_list.append(y_rain_seq)
        Y_haz_list.append(y_haz_seq)
        
    X_tensor = torch.stack(X_list)          # (135, 4, 8, 65, 35)
    Y_rain_tensor = torch.stack(Y_rain_list)  # (135, 6, 1, 65, 35)
    Y_haz_tensor = torch.stack(Y_haz_list)    # (135, 6, 3)
    
    print(f"      Created {len(X_list)} spatio-temporal sequence samples.")
    print(f"      X Tensor:       {tuple(X_tensor.shape)}")
    print(f"      Y Rain Tensor:  {tuple(Y_rain_tensor.shape)}")
    print(f"      Y Hazard Tensor:{tuple(Y_haz_tensor.shape)}")
    
    # 3. Chronological Train / Validation Split
    # To avoid data leakage, split temporally:
    # Train: samples 0 to 95 (~70%)
    # Val:   samples 95 to 135 (~30%, captures peak storm and disaster response)
    print("[4/4] Chronological train/validation splitting...")
    split_idx = int(num_samples * 0.70)
    
    train_data = {
        "X": X_tensor[:split_idx],
        "Y_rain": Y_rain_tensor[:split_idx],
        "Y_haz": Y_haz_tensor[:split_idx],
    }
    
    val_data = {
        "X": X_tensor[split_idx:],
        "Y_rain": Y_rain_tensor[split_idx:],
        "Y_haz": Y_haz_tensor[split_idx:],
    }
    
    train_path = os.path.join(DATA_DIR, "train_data.pt")
    val_path = os.path.join(DATA_DIR, "val_data.pt")
    
    torch.save(train_data, train_path)
    torch.save(val_data, val_path)
    
    print(f"      Train samples: {train_data['X'].shape[0]} -> {train_path}")
    print(f"      Val samples:   {val_data['X'].shape[0]} -> {val_path}")
    print("=== Preprocessing Complete ===")


if __name__ == "__main__":
    run_preprocessing()
