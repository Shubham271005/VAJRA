"""
VAJRA Training & Validation Engine: Kedarnath 2013 Nowcasting
Executes multi-task optimization (Precipitation Forecasting + Multi-Hazard Classification).
"""

import json
import os
import time
import torch
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

from config import WEIGHTS_DIR
from dataset import get_dataloaders
from losses import VajraLoss
from metrics import compute_meteorological_scores
from model import VajraNowcastNet


def train_model(
    epochs: int = 20,
    batch_size: int = 4,
    learning_rate: float = 1e-3,
    weight_decay: float = 1e-4
):
    print("=== VAJRA Model Training & Optimization ===")
    print(f"Epochs: {epochs} | Batch Size: {batch_size} | LR: {learning_rate}")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training Device: {device}")
    
    # 1. Prepare Data Loaders
    train_loader, val_loader = get_dataloaders(batch_size=batch_size)
    print(f"Data ready: {len(train_loader)} train batches, {len(val_loader)} validation batches.")
    
    # 2. Instantiate Model, Loss, Optimizer, Scheduler
    model = VajraNowcastNet().to(device)
    criterion = VajraLoss(lambda_haz=1.5, heavy_rain_weight=12.0)
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    
    best_val_loss = float("inf")
    best_checkpoint_path = os.path.join(WEIGHTS_DIR, "vajra_kedarnath_model.pt")
    
    history = []
    
    print("-" * 80)
    print(f"{'Epoch':^7} | {'Train Loss':^10} | {'Val Loss':^10} | {'POD':^7} | {'FAR':^7} | {'CSI':^7} | {'RMSE (mm)':^10} | {'Time':^6}")
    print("-" * 80)
    
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        
        # --- TRAINING PHASE ---
        model.train()
        train_loss_accum = 0.0
        train_rain_accum = 0.0
        train_haz_accum = 0.0
        
        for batch_x, batch_rain, batch_haz in train_loader:
            batch_x = batch_x.to(device)
            batch_rain = batch_rain.to(device)
            batch_haz = batch_haz.to(device)
            
            optimizer.zero_grad()
            pred_rain, pred_haz = model(batch_x)
            
            loss, l_rain, l_haz = criterion(pred_rain, batch_rain, pred_haz, batch_haz)
            loss.backward()
            
            # Gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()
            
            train_loss_accum += loss.item()
            train_rain_accum += l_rain.item()
            train_haz_accum += l_haz.item()
            
        scheduler.step()
        avg_train_loss = train_loss_accum / len(train_loader)
        
        # --- VALIDATION PHASE ---
        model.eval()
        val_loss_accum = 0.0
        all_pred_rain = []
        all_true_rain = []
        
        with torch.no_grad():
            for batch_x, batch_rain, batch_haz in val_loader:
                batch_x = batch_x.to(device)
                batch_rain = batch_rain.to(device)
                batch_haz = batch_haz.to(device)
                
                pred_rain, pred_haz = model(batch_x)
                loss, _, _ = criterion(pred_rain, batch_rain, pred_haz, batch_haz)
                val_loss_accum += loss.item()
                
                all_pred_rain.append(pred_rain)
                all_true_rain.append(batch_rain)
                
        avg_val_loss = val_loss_accum / len(val_loader)
        
        # Calculate meteorological metrics across validation set
        val_preds_cat = torch.cat(all_pred_rain, dim=0)
        val_trues_cat = torch.cat(all_true_rain, dim=0)
        meteo_scores = compute_meteorological_scores(val_preds_cat, val_trues_cat, threshold_mm=20.0)
        
        elapsed = time.time() - t0
        
        print(
            f"{epoch:^7d} | {avg_train_loss:^10.4f} | {avg_val_loss:^10.4f} | "
            f"{meteo_scores['POD']:^7.2f} | {meteo_scores['FAR']:^7.2f} | "
            f"{meteo_scores['CSI']:^7.2f} | {meteo_scores['RMSE_mm_hr']:^10.2f} | {elapsed:^6.1f}s"
        )
        
        # Record history
        history.append({
            "epoch": epoch,
            "train_loss": avg_train_loss,
            "val_loss": avg_val_loss,
            "pod": meteo_scores["POD"],
            "far": meteo_scores["FAR"],
            "csi": meteo_scores["CSI"],
            "rmse_mm_hr": meteo_scores["RMSE_mm_hr"],
            "mae_mm_hr": meteo_scores["MAE_mm_hr"],
        })
        
        # Save best model checkpoint
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": avg_val_loss,
                "meteo_scores": meteo_scores,
            }, best_checkpoint_path)
            
    print("-" * 80)
    print(f"✓ Training Complete! Best Validation Loss: {best_val_loss:.4f}")
    print(f"✓ Model checkpoint saved to: {best_checkpoint_path}")
    
    # Save training metrics history
    metrics_path = os.path.join(WEIGHTS_DIR, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(history, f, indent=2)
    print(f"✓ Full training log saved to: {metrics_path}")


if __name__ == "__main__":
    train_model(epochs=15, batch_size=4, learning_rate=1e-3)
