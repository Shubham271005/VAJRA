"""
VAJRA ML Configuration & Mathematical Contract
Targeting Uttarakhand High-Altitude Basins (Kedarnath, Alaknanda, Bhagirathi, Pithoragarh)
Expanded multi-source dataset: INSAT-3D/3DR TIR & IWV, IMD/INDAA Reanalysis, SRTM DEM
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Tuple

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "uttarakhand_meteo")
WEIGHTS_DIR = os.path.join(BASE_DIR, "ml", "weights")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(WEIGHTS_DIR, exist_ok=True)

# 1. Geographic Domain (Uttarakhand-wide domain)
# Covers Western Garhwal to Eastern Kumaon (approx 29.80°N to 31.40°N, 78.00°E to 80.60°E)
LAT_MIN = 29.80  # Southern Terai / Foothills / Confluences (~400m-800m)
LAT_MAX = 31.40  # High Himalayan Crest / Glacial Headwaters (~3500m-6800m)
LON_MIN = 78.00  # Western margin (Dehradun / Yamuna / Bhagirathi basin)
LON_MAX = 80.60  # Eastern margin (Pithoragarh / Dharchula / Kali basin)

GRID_H = 64  # Lat rows (spatially sampled ~2.7 km resolution)
GRID_W = 64  # Lon cols (spatially sampled ~4.0 km resolution)

# 2. Critical Anchor Nodes for Ground Verification across Uttarakhand
ANCHOR_NODES = {
    # Mandakini Basin (Kedarnath Ground Zero)
    "chorabari": {"name": "Chorabari Glacial Moraine", "district": "Rudraprayag", "lat": 30.748, "lon": 79.055, "elev_m": 3960},
    "kedarnath": {"name": "Kedarnath Sanctuary", "district": "Rudraprayag", "lat": 30.735, "lon": 79.067, "elev_m": 3584},
    "gaurikund": {"name": "Rambara - Gaurikund Gorge", "district": "Rudraprayag", "lat": 30.652, "lon": 79.043, "elev_m": 1980},
    "guptkashi": {"name": "Guptkashi - Phata Ridge", "district": "Rudraprayag", "lat": 30.523, "lon": 79.077, "elev_m": 1319},
    "rudraprayag": {"name": "Rudraprayag Confluence", "district": "Rudraprayag", "lat": 30.285, "lon": 78.981, "elev_m": 890},
    # Alaknanda / Chamoli Basin
    "joshimath": {"name": "Joshimath - Badrinath Corridor", "district": "Chamoli", "lat": 30.556, "lon": 79.567, "elev_m": 1890},
    "chamoli": {"name": "Chamoli - Karnaprayag Basin", "district": "Chamoli", "lat": 30.258, "lon": 79.217, "elev_m": 960},
    # Bhagirathi / Uttarkashi Basin
    "uttarkashi": {"name": "Uttarkashi - Bhagirathi Valley", "district": "Uttarkashi", "lat": 30.726, "lon": 78.435, "elev_m": 1158},
    # Kumaon / Eastern Border Basin
    "pithoragarh": {"name": "Dharchula - Pithoragarh Sector", "district": "Pithoragarh", "lat": 29.845, "lon": 80.535, "elev_m": 1627},
    # Sub-Himalayan Foothills
    "dehradun": {"name": "Dehradun - Rishikesh Foothills", "district": "Dehradun", "lat": 30.316, "lon": 78.032, "elev_m": 640},
}

# 3. Temporal Window (45 Days of Historical Hourly Data = 1,080 Hours)
# Spans pre-monsoon convective build-up (June 1-12), peak disaster (June 13-18), and sustained monsoon phase (June 19 - July 15)
START_DATE = "2013-06-01"
END_DATE = "2013-07-15"
TOTAL_HOURS = 1080  # 45 days * 24 hours

# 4. Spatio-Temporal Model Dimensions
INPUT_SEQ_LEN = 4   # t-3, t-2, t-1, t (past 4 hours)
OUTPUT_SEQ_LEN = 6  # t+1, t+2, ..., t+6 (next 6 hours)
NUM_CHANNELS = 8    # 8 physical atmospheric and terrain layers
NUM_HAZARDS = 3     # 0: Thunderstorm, 1: Cloudburst, 2: Flash Flood

# 5. Physical Channels and Normalization Constants [min, max]
CHANNEL_NAMES = [
    "TIR_CTT",    # Cloud Top Temperature from INSAT-3D/3DR (Kelvin)
    "IWV",        # Integrated Water Vapour from INSAT/Reanalysis (kg/m^2)
    "CAPE",       # Convective Available Potential Energy from IMD/ERA5 (J/kg)
    "CIN",        # Convective Inhibition (J/kg)
    "WCONV",      # Low-level Wind Convergence (10^-4 s^-1)
    "VWS",        # Vertical Wind Shear (m/s)
    "DEM_ELEV",   # Elevation from SRTM Topography (m)
    "DEM_SLOPE",  # Terrain Slope from SRTM Gradient (degrees)
]

CHANNEL_BOUNDS: Dict[str, Tuple[float, float]] = {
    "TIR_CTT": (195.0, 305.0),    # Kelvin
    "IWV": (0.0, 75.0),           # kg/m^2
    "CAPE": (0.0, 3600.0),        # J/kg
    "CIN": (0.0, 300.0),          # J/kg
    "WCONV": (-12.0, 24.0),       # 10^-4 s^-1
    "VWS": (0.0, 45.0),           # m/s
    "DEM_ELEV": (400.0, 6800.0),  # meters (Foothills to Himalayan peaks)
    "DEM_SLOPE": (0.0, 70.0),     # degrees
}

# Target Rainfall normalization
MAX_RAINFALL_MM_HR = 120.0  # For cloudburst scaling

