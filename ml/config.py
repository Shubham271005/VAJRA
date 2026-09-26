"""
VAJRA ML Configuration & Mathematical Contract
Targeting Kedarnath / Mandakini River Valley for June 2013 Disaster
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Tuple

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "kedarnath_2013")
WEIGHTS_DIR = os.path.join(BASE_DIR, "ml", "weights")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(WEIGHTS_DIR, exist_ok=True)

# 1. Geographic Domain (Mandakini Catchment)
LAT_MIN = 30.20  # Rudraprayag downstream confluence (~890m)
LAT_MAX = 30.85  # Chorabari Glacier / Mount Kedarnath headwaters (~3960m+)
LON_MIN = 78.90  # Western ridge
LON_MAX = 79.25  # Eastern ridge

GRID_H = 65  # Lat rows (approx 1 km per cell)
GRID_W = 35  # Lon cols (approx 1 km per cell)

# 2. Critical Anchor Nodes for Ground Verification
ANCHOR_NODES = {
    "chorabari": {"name": "Chorabari Lake / Moraine", "lat": 30.748, "lon": 79.055, "elev_m": 3960},
    "kedarnath": {"name": "Kedarnath Town / Temple", "lat": 30.735, "lon": 79.067, "elev_m": 3583},
    "rambara": {"name": "Rambara Gorge", "lat": 30.686, "lon": 79.056, "elev_m": 2740},
    "gaurikund": {"name": "Gaurikund Basecamp", "lat": 30.652, "lon": 79.043, "elev_m": 1980},
    "guptkashi": {"name": "Guptkashi Mid-Valley", "lat": 30.523, "lon": 79.077, "elev_m": 1319},
    "rudraprayag": {"name": "Rudraprayag Confluence", "lat": 30.285, "lon": 78.981, "elev_m": 890},
}

# 3. Temporal Window
START_DATE = "2013-06-13"
END_DATE = "2013-06-18"
TOTAL_HOURS = 144  # 6 days * 24 hours

# 4. Spatio-Temporal Model Dimensions
INPUT_SEQ_LEN = 4   # t-3, t-2, t-1, t (past 4 hours)
OUTPUT_SEQ_LEN = 6  # t+1, t+2, ..., t+6 (next 6 hours)
NUM_CHANNELS = 8    # 8 physical atmospheric and terrain layers
NUM_HAZARDS = 3     # 0: Thunderstorm, 1: Cloudburst, 2: Flash Flood

# 5. Normalization Constants [min, max]
CHANNEL_NAMES = [
    "TIR_CTT",    # Cloud Top Temperature (K)
    "IWV",        # Integrated Water Vapour (kg/m^2)
    "CAPE",       # Convective Available Potential Energy (J/kg)
    "CIN",        # Convective Inhibition (J/kg)
    "WCONV",      # Low-level Wind Convergence (10^-4 s^-1)
    "VWS",        # Vertical Wind Shear (m/s)
    "DEM_ELEV",   # Elevation (m)
    "DEM_SLOPE",  # Terrain Slope (degrees)
]

CHANNEL_BOUNDS: Dict[str, Tuple[float, float]] = {
    "TIR_CTT": (200.0, 300.0),    # Kelvin
    "IWV": (0.0, 70.0),           # kg/m^2
    "CAPE": (0.0, 3500.0),        # J/kg
    "CIN": (0.0, 300.0),          # J/kg
    "WCONV": (-10.0, 20.0),       # 10^-4 s^-1
    "VWS": (0.0, 40.0),           # m/s
    "DEM_ELEV": (800.0, 4200.0),  # meters
    "DEM_SLOPE": (0.0, 65.0),     # degrees
}

# Target Rainfall normalization
MAX_RAINFALL_MM_HR = 120.0  # For cloudburst scaling
