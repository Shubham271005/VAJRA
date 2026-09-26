"""
VAJRA Neural Architecture: Spatio-Temporal ConvLSTM & Multi-Hazard Dual-Head Network
Tailored for Hyper-Local Mountain Nowcasting (Kedarnath Mandakini Basin).
"""

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


class VajraNowcastNet(nn.Module):
    """
    Spatio-Temporal Nowcasting Network with Dual Heads:
    1. Gridded Future Precipitation (0-6 hours)
    2. Multi-Hazard Probability Vector [Thunderstorm, Cloudburst, Flash Flood]
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

        # 2. Temporal Recurrent Engine (ConvLSTM)
        self.convlstm = ConvLSTMCell(hidden_channels, hidden_channels)

        # 3. Head A: Multi-Hour Precipitation Forecasting Decoder
        # Decodes temporal hidden state into 6 future hourly rain maps
        self.rain_decoder = nn.Sequential(
            nn.Conv2d(hidden_channels, hidden_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(hidden_channels),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(hidden_channels, out_seq_len, kernel_size=1),
            nn.Sigmoid()  # normalized rain [0, 1]
        )

        # 4. Head B: Multi-Hazard Risk Probability Classifier
        # Global pooling + MLP across the 6 future horizons
        self.hazard_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.hazard_fc = nn.Sequential(
            nn.Linear(hidden_channels, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, out_seq_len * num_hazards),
            nn.Sigmoid()  # output probabilities [0, 1]
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Input:
            x: (B, T_in, C_in, H, W) -> (B, 4, 8, 65, 35)
        Outputs:
            rain_pred:   (B, T_out, 1, H, W) -> (B, 6, 1, 65, 35)
            hazard_pred: (B, T_out, NUM_HAZARDS) -> (B, 6, 3)
        """
        b, t_in, c, h, w = x.shape
        device = x.device

        # Initialize ConvLSTM hidden & cell states
        h_t = torch.zeros(b, self.hidden_channels, h, w, device=device)
        c_t = torch.zeros(b, self.hidden_channels, h, w, device=device)

        # Process input temporal sequence
        for t in range(t_in):
            x_t = x[:, t]  # (B, C, H, W)
            feat_t = self.encoder(x_t)
            h_t, c_t = self.convlstm(feat_t, h_t, c_t)

        # Head A: Rain Forecast (B, T_out, H, W) -> reshape to (B, T_out, 1, H, W)
        rain_out = self.rain_decoder(h_t)  # (B, 6, H, W)
        rain_pred = rain_out.unsqueeze(2)  # (B, 6, 1, H, W)

        # Head B: Multi-Hazard Classification
        pooled = self.hazard_pool(h_t).view(b, self.hidden_channels)
        hazard_raw = self.hazard_fc(pooled)  # (B, 6 * 3)
        hazard_pred = hazard_raw.view(b, self.out_seq_len, self.num_hazards)  # (B, 6, 3)

        return rain_pred, hazard_pred


if __name__ == "__main__":
    # Test model shape verification
    model = VajraNowcastNet()
    dummy_input = torch.randn(2, 4, 8, GRID_H, GRID_W)
    rain, haz = model(dummy_input)
    print("VajraNowcastNet model test passed:")
    print("Rain output shape:  ", rain.shape)
    print("Hazard output shape:", haz.shape)
    assert rain.shape == (2, 6, 1, GRID_H, GRID_W)
    assert haz.shape == (2, 6, 3)
