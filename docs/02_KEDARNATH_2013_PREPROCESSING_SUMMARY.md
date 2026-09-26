# Chunk 2: Data Acquisition & Preprocessing Summary
## Kedarnath (June 2013) Pipeline Execution

---

### 1. Ingestion Overview
* **Incident Period:** June 13, 2013, 00:00 UTC to June 18, 2013, 23:00 UTC (144 hourly timestamps).
* **Data Sources Ingested:**
  * Open-Meteo ERA5 Reanalysis archive for 6 catchment stations along the Mandakini Valley (Chorabari, Kedarnath, Rambara, Gaurikund, Guptkashi, Rudraprayag).
  * Digital Elevation Model (DEM) and terrain slope modeling over the $65 \times 35$ grid ($\approx 1\text{ km}$ resolution).
* **Physical Variables Compiled:**
  1. Cloud Top Temperature (`TIR_CTT`)
  2. Integrated Water Vapour (`IWV`)
  3. Convective Available Potential Energy (`CAPE`)
  4. Convective Inhibition (`CIN`)
  5. Low-Level Wind Convergence (`WCONV`)
  6. Vertical Wind Shear (`VWS`)
  7. DEM Elevation (`DEM_ELEV`)
  8. DEM Slope (`DEM_SLOPE`)

---

### 2. Output Tensors & Partitions

| Dataset | Sample Count | Input Shape $(B, T_{\text{in}}, C, H, W)$ | Rain Target $(B, T_{\text{out}}, 1, H, W)$ | Hazard Target $(B, T_{\text{out}}, 3)$ |
| :--- | :--- | :--- | :--- | :--- |
| **Train Set** | 94 sliding windows | `(94, 4, 8, 65, 35)` | `(94, 6, 1, 65, 35)` | `(94, 6, 3)` |
| **Validation Set** | 41 sliding windows | `(41, 4, 8, 65, 35)` | `(41, 6, 1, 65, 35)` | `(41, 6, 3)` |

* **Split Strategy:** Chronological split (June 13–16 morning for training; June 16 afternoon peak burst to June 18 recession for validation).
* **Integrity Status:**
  - [x] Zero NaNs / Infs.
  - [x] All channel values strictly bounded in $[0.0, 1.0]$.
  - [x] Tested with PyTorch `DataLoader` (Batch size: 4).
