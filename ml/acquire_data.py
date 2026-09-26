"""
VAJRA Data Acquisition Pipeline: Kedarnath Disaster (June 13-18, 2013)
Fetches real atmospheric reanalysis data, generates DEM topography for Mandakini Valley,
and compiles multi-channel spatio-temporal hourly cubes.
"""

import json
import math
import os
import sys
import time
import requests
import numpy as np
import torch

from config import (
    ANCHOR_NODES,
    CHANNEL_BOUNDS,
    DATA_DIR,
    END_DATE,
    GRID_H,
    GRID_W,
    LAT_MAX,
    LAT_MIN,
    LON_MAX,
    LON_MIN,
    START_DATE,
    TOTAL_HOURS,
)


def fetch_open_meteo_data(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """Fetch hourly historical weather from Open-Meteo ERA5 archive."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "dew_point_2m",
            "precipitation",
            "rain",
            "surface_pressure",
            "cloud_cover",
            "cloud_cover_high",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
        ],
        "timezone": "UTC",
    }
    
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code == 200:
                return resp.json()["hourly"]
            elif resp.status_code == 429:
                print("Rate limit reached, pausing 2s...")
                time.sleep(2.0)
            else:
                print(f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {e}")
            time.sleep(1.5)
            
    raise RuntimeError(f"Failed to fetch data for Lat {lat}, Lon {lon}")


def generate_dem_elevation_and_slope(grid_h: int, grid_w: int, lats: np.ndarray, lons: np.ndarray):
    """
    Generate realistic DEM elevation and slope rasters for the Mandakini gorge.
    Rudraprayag (South, 30.285) ~ 890m -> Gaurikund ~ 1980m -> Kedarnath ~ 3583m -> Chorabari ~ 3960m.
    Mountain ridges on East and West rise rapidly to > 4500-5500m.
    """
    elev = np.zeros((grid_h, grid_w), dtype=np.float32)
    
    # Valley centerline longitude roughly follows 79.05°E
    valley_lon = 79.055
    
    for i in range(grid_h):
        lat = lats[i]
        # Latitudinal progression along valley floor (890m at 30.20 to 4000m at 30.85)
        norm_lat = (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)
        valley_base_elev = 850.0 + (3200.0 * (norm_lat ** 1.35))
        
        for j in range(grid_w):
            lon = lons[j]
            # Distance from valley floor (lateral gorge profile)
            dist_from_thalweg = abs(lon - valley_lon) / (LON_MAX - LON_MIN)
            # Steep Himalayan gorge sidewalls
            side_ridge_elev = 1800.0 * (math.sin(dist_from_thalweg * math.pi) ** 1.5)
            
            total_elev = valley_base_elev + side_ridge_elev
            elev[i, j] = total_elev

    # Compute terrain slope (degrees) from gradient
    # Cell size is ~1100m in Lat, ~960m in Lon
    dy, dx = 1100.0, 960.0
    grad_y, grad_x = np.gradient(elev, dy, dx)
    slope_rad = np.arctan(np.sqrt(grad_y**2 + grad_x**2))
    slope_deg = np.degrees(slope_rad).astype(np.float32)

    return elev, slope_deg


def build_kedarnath_dataset():
    print(f"=== VAJRA Data Acquisition: Kedarnath 2013 ({START_DATE} to {END_DATE}) ===")
    
    lats = np.linspace(LAT_MIN, LAT_MAX, GRID_H)
    lons = np.linspace(LON_MIN, LON_MAX, GRID_W)
    
    # 1. Generate Static Topography
    print(f"[1/4] Generating DEM elevation and slope rasters ({GRID_H}x{GRID_W})...")
    elev_grid, slope_grid = generate_dem_elevation_and_slope(GRID_H, GRID_W, lats, lons)
    print(f"      Elevation range: {elev_grid.min():.1f}m to {elev_grid.max():.1f}m")
    print(f"      Slope range: {slope_grid.min():.1f}° to {slope_grid.max():.1f}°")
    
    # 2. Query Historical Reanalysis from Key Nodes
    print("[2/4] Querying Open-Meteo ERA5 hourly historical data...")
    node_meteo = {}
    for node_id, info in ANCHOR_NODES.items():
        print(f"      Fetching station: {info['name']} ({info['lat']}, {info['lon']})...")
        data = fetch_open_meteo_data(info["lat"], info["lon"], START_DATE, END_DATE)
        node_meteo[node_id] = data
        time.sleep(0.3)
        
    num_steps = len(node_meteo["kedarnath"]["temperature_2m"])
    print(f"      Retrieved {num_steps} hourly timestamps.")
    
    # 3. Synthesize Spatio-Temporal 8-Channel Grids for each timestamp
    print("[3/4] Synthesizing multi-channel physical atmospheric fields...")
    
    # Output arrays
    # Shape: (TOTAL_HOURS, NUM_CHANNELS, GRID_H, GRID_W)
    feature_cube = np.zeros((num_steps, 8, GRID_H, GRID_W), dtype=np.float32)
    # Target rainfall: (TOTAL_HOURS, GRID_H, GRID_W)
    target_rainfall = np.zeros((num_steps, GRID_H, GRID_W), dtype=np.float32)
    # Hazard labels: (TOTAL_HOURS, 3) -> [storm, cloudburst, flood]
    hazard_labels = np.zeros((num_steps, 3), dtype=np.float32)
    
    ked_rain = np.array(node_meteo["kedarnath"]["precipitation"])
    ked_temp = np.array(node_meteo["kedarnath"]["temperature_2m"])
    ked_rh = np.array(node_meteo["kedarnath"]["relative_humidity_2m"])
    ked_wind = np.array(node_meteo["kedarnath"]["wind_speed_10m"])
    ked_gust = np.array(node_meteo["kedarnath"]["wind_gusts_10m"])
    
    # Historical cloudburst amplification on June 16, 2013:
    # IMD and NCMRWF studies confirmed >325 mm rainfall over Kedarnath within 24h on June 16-17,
    # with localized cloudburst rates reaching 40-70 mm/hr in the steep gorge.
    # We calibrate the baseline reanalysis to reflect the observed extreme cloudburst peaks.
    for t in range(num_steps):
        # Base hourly precipitation from stations
        r_ked = ked_rain[t]
        t_c = ked_temp[t]
        rh = ked_rh[t] / 100.0
        w_spd = ked_wind[t]
        
        # Convective intensification factor for the peak incident window (June 16 evening to June 17 morning: t=84 to t=108)
        is_peak_window = (84 <= t <= 108)
        convective_boost = 3.5 if is_peak_window else 1.0
        
        # Channel 0: TIR_CTT (Cloud Top Temperature in Kelvin)
        # Deep convective clouds glaciation down to -55°C to -65°C (208K to 218K) during peak
        if is_peak_window or r_ked > 10.0:
            ctt_base = 215.0 - min(10.0, r_ked * 0.4)
        else:
            ctt_base = 270.0 - (rh * 35.0)
            
        # Channel 1: IWV (Integrated Water Vapour, kg/m^2)
        iwv_base = 25.0 + (rh * 25.0) + (15.0 if is_peak_window else 0.0)
        
        # Channel 2: CAPE (Convective Available Potential Energy, J/kg)
        # Strong pre-convective and convective energy pool (1500 - 2800 J/kg)
        if 60 <= t <= 96:
            cape_base = 1800.0 + (math.sin((t % 24) / 24.0 * math.pi) * 800.0)
        elif 96 < t <= 112:
            cape_base = 1400.0  # Consumed by massive storm
        else:
            cape_base = 500.0 + (rh * 700.0)
            
        # Channel 3: CIN (Convective Inhibition, J/kg)
        # Weakens close to 0-30 J/kg right before the burst
        cin_base = max(10.0, 120.0 - (cape_base * 0.04))
        
        # Channel 4: WCONV (Low level wind convergence, 10^-4 s^-1)
        wconv_base = 4.0 + (w_spd * 0.6) + (5.0 if is_peak_window else 0.0)
        
        # Channel 5: VWS (Vertical wind shear, m/s)
        vws_base = 12.0 + (ked_gust[t] * 0.5)
        
        # Spatial variation across the grid (elevation and orographic lift)
        # Precipitation and moisture concentrate along the steep valley slopes (orographic chimney)
        orographic_lift = (slope_grid / 35.0) * (wconv_base / 8.0)
        
        feature_cube[t, 0, :, :] = ctt_base - (elev_grid / 1000.0 * 2.0)  # CTT
        feature_cube[t, 1, :, :] = iwv_base * (1.0 + (orographic_lift * 0.15))  # IWV
        feature_cube[t, 2, :, :] = cape_base * (1.0 + (orographic_lift * 0.2))  # CAPE
        feature_cube[t, 3, :, :] = cin_base / (1.0 + orographic_lift * 0.3)     # CIN
        feature_cube[t, 4, :, :] = wconv_base * (1.0 + orographic_lift)          # WCONV
        feature_cube[t, 5, :, :] = vws_base                                      # VWS
        feature_cube[t, 6, :, :] = elev_grid                                     # DEM_ELEV
        feature_cube[t, 7, :, :] = slope_grid                                    # DEM_SLOPE
        
        # Target spatial rainfall
        base_rate = max(r_ked * convective_boost, 0.0)
        if is_peak_window:
            base_rate = max(base_rate, 38.0 + (math.sin(t) * 15.0))
            
        rain_map = base_rate * (0.6 + 0.8 * (elev_grid / 3500.0)) * (1.0 + orographic_lift * 0.3)
        target_rainfall[t, :, :] = np.clip(rain_map, 0.0, 120.0)
        
        # Hazard Ground Truth:
        # Thunderstorm (0): High CAPE + high VWS + cold CTT
        p_storm = min(1.0, max(0.0, (cape_base / 2500.0) * 0.6 + (vws_base / 30.0) * 0.4))
        # Cloudburst (1): Extreme rain rate > 35-50 mm/hr in mountain gorge
        p_burst = min(1.0, max(0.0, np.percentile(target_rainfall[t], 90) / 45.0))
        # Flash flood (2): High rainfall combined with antecedent saturation and steep runoff
        p_flood = min(1.0, max(0.0, (p_burst * 0.6) + (np.mean(target_rainfall[max(0, t-12):t+1]) / 30.0) * 0.4))
        
        hazard_labels[t, 0] = p_storm
        hazard_labels[t, 1] = p_burst
        hazard_labels[t, 2] = p_flood

    # 4. Save Raw Compiled Data
    print("[4/4] Saving raw compiled tensors to data directory...")
    output_path = os.path.join(DATA_DIR, "raw_meteo_2013.pt")
    save_dict = {
        "features": torch.from_numpy(feature_cube),      # (144, 8, 65, 35)
        "rainfall": torch.from_numpy(target_rainfall),    # (144, 65, 35)
        "hazards": torch.from_numpy(hazard_labels),       # (144, 3)
        "lats": lats,
        "lons": lons,
        "timestamps": node_meteo["kedarnath"]["time"],
    }
    torch.save(save_dict, output_path)
    print(f"      Successfully created: {output_path}")
    print(f"      Features shape: {feature_cube.shape}")
    print(f"      Rainfall shape: {target_rainfall.shape}")
    print(f"      Hazards shape:  {hazard_labels.shape}")


if __name__ == "__main__":
    build_kedarnath_dataset()
