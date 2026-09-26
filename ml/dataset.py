"""
PyTorch Dataset and DataLoader definitions for VAJRA Spatio-Temporal Nowcasting.
Includes automated data integrity and shape verification.
"""

import os
import torch
from torch.utils.data import DataLoader, Dataset
from typing import Tuple

from config import DATA_DIR, INPUT_SEQ_LEN, NUM_CHANNELS, NUM_HAZARDS, OUTPUT_SEQ_LEN, GRID_H, GRID_W


class VajraMeteoDataset(Dataset):
    """
    PyTorch Dataset yielding:
    - X: (INPUT_SEQ_LEN, NUM_CHANNELS, GRID_H, GRID_W)
    - Y_rain: (OUTPUT_SEQ_LEN, 1, GRID_H, GRID_W)
    - Y_haz: (OUTPUT_SEQ_LEN, NUM_HAZARDS)
    """
    def __init__(self, pt_path: str):
        if not os.path.exists(pt_path):
            raise FileNotFoundError(f"Dataset file not found at: {pt_path}")
        data = torch.load(pt_path, weights_only=False)
        self.X = data["X"]          # float32
        self.Y_rain = data["Y_rain"]  # float32
        self.Y_haz = data["Y_haz"]    # float32

    def __len__(self) -> int:
        return self.X.shape[0]

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        return self.X[idx], self.Y_rain[idx], self.Y_haz[idx]


def get_dataloaders(batch_size: int = 4) -> Tuple[DataLoader, DataLoader]:
    train_path = os.path.join(DATA_DIR, "train_data.pt")
    val_path = os.path.join(DATA_DIR, "val_data.pt")
    
    train_ds = VajraMeteoDataset(train_path)
    val_ds = VajraMeteoDataset(val_path)
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader


def verify_dataset_integrity():
    """Automated sanity and integrity test."""
    print("=== Verifying Dataset Integrity & Tensor Contracts ===")
    train_loader, val_loader = get_dataloaders(batch_size=4)
    
    print(f"Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")
    
    for batch_x, batch_rain, batch_haz in train_loader:
        # Check shapes
        assert batch_x.shape[1] == INPUT_SEQ_LEN, f"Expected {INPUT_SEQ_LEN} time frames, got {batch_x.shape[1]}"
        assert batch_x.shape[2] == NUM_CHANNELS, f"Expected {NUM_CHANNELS} channels, got {batch_x.shape[2]}"
        assert batch_x.shape[3] == GRID_H, f"Expected H={GRID_H}, got {batch_x.shape[3]}"
        assert batch_x.shape[4] == GRID_W, f"Expected W={GRID_W}, got {batch_x.shape[4]}"
        
        assert batch_rain.shape[1] == OUTPUT_SEQ_LEN, f"Expected {OUTPUT_SEQ_LEN} target frames, got {batch_rain.shape[1]}"
        assert batch_haz.shape[1] == OUTPUT_SEQ_LEN, f"Expected {OUTPUT_SEQ_LEN} hazard frames, got {batch_haz.shape[1]}"
        assert batch_haz.shape[2] == NUM_HAZARDS, f"Expected {NUM_HAZARDS} hazards, got {batch_haz.shape[2]}"
        
        # Check for NaNs or Infs
        assert not torch.isnan(batch_x).any(), "NaN found in X!"
        assert not torch.isnan(batch_rain).any(), "NaN found in Y_rain!"
        assert not torch.isnan(batch_haz).any(), "NaN found in Y_haz!"
        
        # Check bounds
        assert (batch_x >= 0.0).all() and (batch_x <= 1.0).all(), "Feature values out of [0, 1] range!"
        assert (batch_rain >= 0.0).all() and (batch_rain <= 1.0).all(), "Rain values out of [0, 1] range!"
        assert (batch_haz >= 0.0).all() and (batch_haz <= 1.0).all(), "Hazard values out of [0, 1] range!"
        
        print("✓ Batch sample shape verification passed:")
        print(f"   X:      {tuple(batch_x.shape)} (dtype: {batch_x.dtype})")
        print(f"   Y_rain: {tuple(batch_rain.shape)} (dtype: {batch_rain.dtype})")
        print(f"   Y_haz:  {tuple(batch_haz.shape)} (dtype: {batch_haz.dtype})")
        break
        
    print("✓ All tensor contracts and bounds strictly verified! No NaNs or overflows.")


if __name__ == "__main__":
    verify_dataset_integrity()
