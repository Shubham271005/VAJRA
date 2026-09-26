"""
VAJRA Spatio-Temporal Hybrid Architecture: ConvLSTM + Transformer Network
Proposed specifically for high-altitude mountain nowcasting (Uttarakhand Himalayan Domain).

Architecture:
1. Spatial Feature Encoder: Multiscale 2D Convolutional Encoder
2. Spatio-Temporal ConvLSTM: Spatial Recurrent Memory capturing advection & local topography
3. Temporal Transformer: Multi-Head Self-Attention capturing non-local temporal dynamics & instability surges
4. Dual-Head Decoders:
   - Head A: 0-6 Hour Gridded Precipitation Forecasting (6, 1, 64, 64)
   - Head B: Multi-Hazard Risk Probability Classifier (6, 3) [Thunderstorm, Cloudburst, Flash Flood]
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple

from config import INPUT_SEQ_LEN, NUM_CHANNELS, NUM_HAZARDS, OUTPUT_SEQ_LEN, GRID_H, GRID_W


class ConvLSTMCell(nn.Module):
    """Convolutional LSTM Cell for 2D spatial feature maps."""
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
        f = torch.sigmoid(f)
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
    def __init__(self, d_model: int = 32, nhead: int = 4, dim_feedforward: int = 128, max_seq_len: int = 8, dropout: float = 0.1):
        super().__init__()
        self.d_model = d_model
        self.pos_embedding = nn.Parameter(torch.randn(1, max_seq_len, d_model) * 0.02)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            activation="relu",
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)
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
    Proposed Spatiotemporal ConvLSTM + Transformer Hybrid Model:
    - Inputs: (B, T_in, C_in, H, W) where T_in=4 hours, C_in=8 channels
    - Encodes 2D spatial frames via Convolutional Encoder
    - Tracks spatiotemporal motion via ConvLSTM Recurrent Cell
    - Attends to cross-temporal trends via Multi-Head Attention Transformer
    - Fuses temporal context back into spatial feature maps
    - Head A: 6-hour spatial precipitation forecast maps
    - Head B: 6-hour multi-hazard risk probabilities (Severe Thunderstorm, Cloudburst, Flash Flood)
    """
    def __init__(
        self,
        in_channels: int = NUM_CHANNELS,
        hidden_channels: int = 32,
        out_seq_len: int = OUTPUT_SEQ_LEN,
        num_hazards: int = NUM_HAZARDS
    ):
        super().__init__()
        self.hidden_channels = hidden_channels
        self.out_seq_len = out_seq_len
        self.num_hazards = num_hazards

        # 1. Spatial Feature Extractor (Encoder)
        self.encoder = nn.Sequential(
            nn.Conv2d(in_channels, hidden_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(hidden_channels),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(hidden_channels, hidden_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(hidden_channels),
            nn.LeakyReLU(0.1, inplace=True),
        )

        # 2. Spatio-Temporal Recurrent Engine (ConvLSTM)
        self.convlstm = ConvLSTMCell(hidden_channels, hidden_channels)

        # 3. Temporal Transformer Engine (Multi-Head Self-Attention over sequence)
        self.spatial_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.temporal_transformer = TemporalTransformerBlock(
            d_model=hidden_channels,
            nhead=4,
            dim_feedforward=128,
            max_seq_len=INPUT_SEQ_LEN + 2,
            dropout=0.1
        )

        # 4. Spatiotemporal Cross-Modulation Gate
        # Projects temporal transformer summary vector into channel gating weights
        self.channel_gate = nn.Sequential(
            nn.Linear(hidden_channels, hidden_channels),
            nn.Sigmoid()
        )

        # 5. Head A: Multi-Horizon Precipitation Forecasting Decoder
        self.rain_decoder = nn.Sequential(
            nn.Conv2d(hidden_channels, hidden_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(hidden_channels),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(hidden_channels, out_seq_len, kernel_size=1),
            nn.Sigmoid()  # normalized rain [0, 1] relative to MAX_RAINFALL_MM_HR
        )

        # 6. Head B: Multi-Hazard Risk Probability Classifier (Dual Spatiotemporal Projection)
        self.hazard_fc = nn.Sequential(
            nn.Linear(hidden_channels * 2, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, out_seq_len * num_hazards),
            nn.Sigmoid()  # output probabilities in [0, 1]
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Input:
            x: (B, T_in, C_in, H, W) -> e.g. (B, 4, 8, 64, 64)
        Outputs:
            rain_pred:   (B, T_out, 1, H, W) -> (B, 6, 1, 64, 64)
            hazard_pred: (B, T_out, NUM_HAZARDS) -> (B, 6, 3)
        """
        b, t_in, c, h, w = x.shape
        device = x.device

        # Initialize ConvLSTM hidden & cell states
        h_t = torch.zeros(b, self.hidden_channels, h, w, device=device)
        c_t = torch.zeros(b, self.hidden_channels, h, w, device=device)

        temporal_tokens = []

        # Process input temporal sequence through ConvLSTM
        for t in range(t_in):
            x_t = x[:, t]  # (B, C, H, W)
            feat_t = self.encoder(x_t)
            h_t, c_t = self.convlstm(feat_t, h_t, c_t)
            
            # Pool spatial state at each time step to create temporal token
            tok_t = self.spatial_pool(h_t).view(b, self.hidden_channels)
            temporal_tokens.append(tok_t)

        # Stack into temporal sequence: (B, T_in, hidden_channels)
        temporal_seq = torch.stack(temporal_tokens, dim=1)

        # Apply Temporal Transformer Multi-Head Attention across time steps
        trans_tokens = self.temporal_transformer(temporal_seq)  # (B, T_in, hidden_channels)

        # Final temporal context from transformer
        trans_context = trans_tokens[:, -1, :]  # (B, hidden_channels)

        # Modulate spatial feature map with temporal transformer attention gate
        gate = self.channel_gate(trans_context).view(b, self.hidden_channels, 1, 1)
        h_fused = h_t * (1.0 + gate)

        # Head A: Multi-Hour Gridded Rain Forecast (B, T_out, H, W)
        rain_out = self.rain_decoder(h_fused)  # (B, 6, H, W)
        rain_pred = rain_out.unsqueeze(2)      # (B, 6, 1, H, W)

        # Head B: Multi-Hazard Risk Probability Classifier
        # Fuse spatial pooled representation and transformer temporal representation
        spatial_summary = self.spatial_pool(h_fused).view(b, self.hidden_channels)
        hazard_feat = torch.cat([spatial_summary, trans_context], dim=1)  # (B, hidden_channels * 2)
        hazard_raw = self.hazard_fc(hazard_feat)                           # (B, 6 * 3)
        hazard_pred = hazard_raw.view(b, self.out_seq_len, self.num_hazards)  # (B, 6, 3)

        return rain_pred, hazard_pred


if __name__ == "__main__":
    # Test model shape verification
    model = VajraNowcastNet()
    dummy_input = torch.randn(2, 4, 8, GRID_H, GRID_W)
    rain, haz = model(dummy_input)
    print("VajraNowcastNet (ConvLSTM + Transformer) test passed successfully:")
    print("Rain output shape:  ", rain.shape)
    print("Hazard output shape:", haz.shape)
    assert rain.shape == (2, 6, 1, GRID_H, GRID_W)
    assert haz.shape == (2, 6, 3)
