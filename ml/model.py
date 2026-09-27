"""
VAJRA Spatio-Temporal Hybrid Architecture V2: Deep ConvLSTM + Transformer Network
Proposed specifically for high-altitude mountain nowcasting (Uttarakhand Himalayan Domain).

Architecture Improvements over V1:
1. Deeper Multi-Scale Residual Encoder (3 blocks: 8→32→48→64)
2. Stacked 2-Layer ConvLSTM for richer spatiotemporal memory
3. Larger Temporal Transformer (d_model=64, nhead=8, 3 layers, GELU, wider FFN)
4. Autoregressive Rain Decoder (step-by-step ConvLSTM unrolling per lead time)
5. Extreme Rain Detection Auxiliary Head (binary classification per lead hour)
6. Enhanced Dual-Head Decoders:
   - Head A: 0-6 Hour Gridded Precipitation Forecasting (6, 1, 64, 64)
   - Head B: Multi-Hazard Risk Probability Classifier (6, 3) [Thunderstorm, Cloudburst, Flash Flood]
   - Head C: Extreme Rain Binary Detection (6, 1)
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple

from config import INPUT_SEQ_LEN, NUM_CHANNELS, NUM_HAZARDS, OUTPUT_SEQ_LEN, GRID_H, GRID_W


class ResidualConvBlock(nn.Module):
    """Residual convolutional block with two conv layers and skip connection."""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.skip = nn.Conv2d(in_channels, out_channels, kernel_size=1) if in_channels != out_channels else nn.Identity()
        self.act = nn.LeakyReLU(0.1, inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = self.skip(x)
        out = self.act(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return self.act(out + identity)


class ConvLSTMCell(nn.Module):
    """Convolutional LSTM Cell for 2D spatial feature maps with forget gate bias."""
    def __init__(self, in_channels: int, hidden_channels: int, kernel_size: int = 3):
        super().__init__()
        self.in_channels = in_channels
        self.hidden_channels = hidden_channels
        padding = kernel_size // 2

        self.conv = nn.Conv2d(
            in_channels + hidden_channels,
            4 * hidden_channels,
            kernel_size=kernel_size,
            padding=padding,
            bias=True
        )

    def forward(self, x: torch.Tensor, h_prev: torch.Tensor, c_prev: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        # x: (B, C_in, H, W), h_prev, c_prev: (B, C_hidden, H, W)
        combined = torch.cat([x, h_prev], dim=1)
        gates = self.conv(combined)

        i, f, g, o = torch.split(gates, self.hidden_channels, dim=1)
        i = torch.sigmoid(i)
        f = torch.sigmoid(f + 1.0)  # Forget gate bias for better gradient flow
        g = torch.tanh(g)
        o = torch.sigmoid(o)

        c_cur = f * c_prev + i * g
        h_cur = o * torch.tanh(c_cur)
        return h_cur, c_cur


class TemporalTransformerBlock(nn.Module):
    """
    Temporal Transformer with Multi-Head Self-Attention over sequential time steps.
    Learns atmospheric thermodynamic evolution, moisture influx accelerations,
    and cloud-top temperature cooling rates across time horizons.
    """
    def __init__(self, d_model: int = 64, nhead: int = 8, dim_feedforward: int = 256,
                 num_layers: int = 3, max_seq_len: int = 12, dropout: float = 0.1):
        super().__init__()
        self.d_model = d_model
        self.pos_embedding = nn.Parameter(torch.randn(1, max_seq_len, d_model) * 0.02)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            activation="gelu",
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.norm = nn.LayerNorm(d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: (B, T, d_model) - sequence of temporal summary embeddings
        returns: (B, T, d_model) - self-attended temporal tokens
        """
        b, t, d = x.shape
        x = x + self.pos_embedding[:, :t, :]
        out = self.transformer(x)
        return self.norm(out)


class VajraNowcastNet(nn.Module):
    """
    Improved Spatiotemporal ConvLSTM + Transformer Hybrid Model V2:
    - Inputs: (B, T_in, C_in, H, W) where T_in=4 hours, C_in=8 channels
    - Deep multi-scale residual encoder (3 blocks: 8→32→48→64)
    - Stacked 2-layer ConvLSTM for richer spatiotemporal memory
    - Larger Temporal Transformer (d=64, 8 heads, 3 layers)
    - Autoregressive rain decoder with step-by-step ConvLSTM unrolling
    - Head A: 6-hour spatial precipitation forecast maps
    - Head B: 6-hour multi-hazard risk probabilities (Severe Thunderstorm, Cloudburst, Flash Flood)
    - Head C: 6-hour extreme rain binary detection
    """
    def __init__(
        self,
        in_channels: int = NUM_CHANNELS,
        hidden_channels: int = 64,
        out_seq_len: int = OUTPUT_SEQ_LEN,
        num_hazards: int = NUM_HAZARDS
    ):
        super().__init__()
        self.hidden_channels = hidden_channels
        self.out_seq_len = out_seq_len
        self.num_hazards = num_hazards

        # 1. Deep Multi-Scale Residual Encoder
        self.encoder = nn.Sequential(
            ResidualConvBlock(in_channels, 32),
            ResidualConvBlock(32, 48),
            ResidualConvBlock(48, hidden_channels),
        )

        # 2. Stacked 2-Layer ConvLSTM Encoder
        self.convlstm_1 = ConvLSTMCell(hidden_channels, hidden_channels)
        self.convlstm_2 = ConvLSTMCell(hidden_channels, hidden_channels)

        # 3. Temporal Transformer Engine (larger: d=64, 8 heads, 3 layers)
        self.spatial_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.temporal_transformer = TemporalTransformerBlock(
            d_model=hidden_channels,
            nhead=8,
            dim_feedforward=256,
            num_layers=3,
            max_seq_len=INPUT_SEQ_LEN + OUTPUT_SEQ_LEN + 2,
            dropout=0.1
        )

        # 4. Spatiotemporal Cross-Modulation Gate (deeper)
        self.channel_gate = nn.Sequential(
            nn.Linear(hidden_channels, hidden_channels * 2),
            nn.GELU(),
            nn.Linear(hidden_channels * 2, hidden_channels),
            nn.Sigmoid()
        )

        # 5. Autoregressive Rain Decoder ConvLSTM
        self.decoder_lstm = ConvLSTMCell(hidden_channels, hidden_channels)
        self.rain_head = nn.Sequential(
            nn.Conv2d(hidden_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid()  # normalized rain [0, 1] relative to MAX_RAINFALL_MM_HR
        )

        # 6. Extreme Rain Detection Auxiliary Head (binary classifier per lead time)
        self.extreme_head = nn.Sequential(
            nn.Linear(hidden_channels * 2, 64),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # 7. Multi-Hazard Risk Probability Classifier (enhanced)
        # Receives decoder summary + transformer context + rain intensity signals
        self.hazard_fc = nn.Sequential(
            nn.Linear(hidden_channels * 2 + 2, 128),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(64, num_hazards),
            nn.Sigmoid()  # output probabilities in [0, 1]
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Input:
            x: (B, T_in, C_in, H, W) -> e.g. (B, 4, 8, 64, 64)
        Outputs:
            rain_pred:    (B, T_out, 1, H, W) -> (B, 6, 1, 64, 64)
            extreme_pred: (B, T_out, 1) -> (B, 6, 1)
            hazard_pred:  (B, T_out, NUM_HAZARDS) -> (B, 6, 3)
        """
        b, t_in, c, h, w = x.shape
        device = x.device

        # Initialize ConvLSTM hidden & cell states (2 layers)
        h1 = torch.zeros(b, self.hidden_channels, h, w, device=device)
        c1 = torch.zeros(b, self.hidden_channels, h, w, device=device)
        h2 = torch.zeros(b, self.hidden_channels, h, w, device=device)
        c2 = torch.zeros(b, self.hidden_channels, h, w, device=device)

        temporal_tokens = []

        # Process input temporal sequence through stacked ConvLSTM
        for t in range(t_in):
            x_t = x[:, t]  # (B, C, H, W)
            feat_t = self.encoder(x_t)
            h1, c1 = self.convlstm_1(feat_t, h1, c1)
            h2, c2 = self.convlstm_2(h1, h2, c2)

            # Pool spatial state at each time step to create temporal token
            tok_t = self.spatial_pool(h2).view(b, self.hidden_channels)
            temporal_tokens.append(tok_t)

        # Stack into temporal sequence: (B, T_in, hidden_channels)
        temporal_seq = torch.stack(temporal_tokens, dim=1)

        # Apply Temporal Transformer Multi-Head Attention across time steps
        trans_tokens = self.temporal_transformer(temporal_seq)  # (B, T_in, hidden_channels)

        # Final temporal context from transformer
        trans_context = trans_tokens[:, -1, :]  # (B, hidden_channels)

        # Modulate spatial feature map with temporal transformer attention gate
        gate = self.channel_gate(trans_context).view(b, self.hidden_channels, 1, 1)
        h_fused = h2 * (1.0 + gate)

        # Autoregressive decoder: step through each lead time
        h_dec = h_fused
        c_dec = c2.clone()

        rain_preds = []
        extreme_preds = []
        hazard_preds = []

        for step in range(self.out_seq_len):
            # Decoder ConvLSTM step (h_fused provides constant conditioning input)
            h_dec, c_dec = self.decoder_lstm(h_fused, h_dec, c_dec)

            # Head A: Rain prediction for this lead time
            rain_t = self.rain_head(h_dec)  # (B, 1, H, W)
            rain_preds.append(rain_t)

            # Pool decoder state for classification heads
            dec_summary = self.spatial_pool(h_dec).view(b, self.hidden_channels)

            # Head C: Extreme rain detection
            extreme_feat = torch.cat([dec_summary, trans_context], dim=1)  # (B, D*2)
            extreme_t = self.extreme_head(extreme_feat)  # (B, 1)
            extreme_preds.append(extreme_t)

            # Head B: Hazard classification (uses spatial, temporal, and rain intensity signals)
            rain_max = rain_t.view(b, -1).max(dim=1, keepdim=True)[0]   # (B, 1)
            rain_mean = rain_t.view(b, -1).mean(dim=1, keepdim=True)    # (B, 1)
            hazard_feat = torch.cat([dec_summary, trans_context, rain_max, rain_mean], dim=1)  # (B, D*2+2)
            hazard_t = self.hazard_fc(hazard_feat)  # (B, 3)
            hazard_preds.append(hazard_t)

        rain_pred = torch.stack(rain_preds, dim=1)       # (B, 6, 1, H, W)
        extreme_pred = torch.stack(extreme_preds, dim=1)  # (B, 6, 1)
        hazard_pred = torch.stack(hazard_preds, dim=1)    # (B, 6, 3)

        return rain_pred, extreme_pred, hazard_pred


if __name__ == "__main__":
    # Test model shape verification
    model = VajraNowcastNet()
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    dummy_input = torch.randn(2, 4, 8, GRID_H, GRID_W)
    rain, extreme, haz = model(dummy_input)
    print(f"VajraNowcastNet V2 (Deep ConvLSTM + Transformer) — {total_params:,} parameters ({trainable_params:,} trainable)")
    print("Rain output shape:    ", rain.shape)
    print("Extreme output shape: ", extreme.shape)
    print("Hazard output shape:  ", haz.shape)
    assert rain.shape == (2, 6, 1, GRID_H, GRID_W)
    assert extreme.shape == (2, 6, 1)
    assert haz.shape == (2, 6, 3)
    print("✓ All shape assertions passed!")
