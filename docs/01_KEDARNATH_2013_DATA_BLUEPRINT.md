# Chunk 1: Problem Definition & Data Blueprint
## Kedarnath (June 2013) Hyper-Local Nowcasting Case Study

---

### 1. Executive Summary & Objective

The goal of this phase is to establish a rigorous, mathematically precise, and hallucination-free specification for training and evaluating **VAJRA** on the **June 2013 Kedarnath disaster** (Mandakini River Basin, Uttarakhand).

Instead of attempting an intractable all-India weather model, we constrain the spatial domain to the **Mandakini Catchment Corridor** and the temporal window to the **June 13–18, 2013 monsoon surge & lake-outburst sequence**.

---

### 2. Geographic Domain & Catchment Geometry

The spatial domain encompasses the entire drainage path of the Mandakini River, from its glacial headwaters (Chorabari Glacier) down to its confluence with the Alaknanda River at Rudraprayag.

#### 2.1 Bounding Box Coordinates
* **Latitude:** $30.20^\circ \text{N}$ to $30.85^\circ \text{N}$ ($\approx 72\text{ km}$ North-South)
* **Longitude:** $78.90^\circ \text{E}$ to $79.25^\circ \text{E}$ ($\approx 34\text{ km}$ East-West)
* **Spatial Grid Resolution:** $0.01^\circ \times 0.01^\circ$ ($\approx 1\text{ km} \times 1\text{ km}$)
* **Grid Dimensions:**
  * Height ($H$ / Latitude rows): **65 grid cells**
  * Width ($W$ / Longitude columns): **35 grid cells**
  * Total cells per time slice: **2,275 spatial nodes**

#### 2.2 Critical Ground Observation Nodes (Anchor Points)
| Node ID | Location Name | Latitude (°N) | Longitude (°E) | Elevation (m) | Catchment Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_01` | **Chorabari Lake / Moraine** | $30.748$ | $79.055$ | 3,960 m | Glacial headwater / breach source |
| `NODE_02` | **Kedarnath Town / Temple** | $30.735$ | $79.067$ | 3,583 m | High-altitude settlement / ground zero |
| `NODE_03` | **Rambara** (historical) | $30.686$ | $79.056$ | 2,740 m | Steep gorge funnel point |
| `NODE_04` | **Gaurikund** | $30.652$ | $79.043$ | 1,980 m | Valley transit basecamp |
| `NODE_05` | **Guptkashi** | $30.523$ | $79.077$ | 1,319 m | Mid-valley ridge & AWS node |
| `NODE_06` | **Rudraprayag Confluence** | $30.285$ | $78.981$ | 890 m | Downstream confluence (EOC node) |

---

### 3. Temporal Domain & Incident Sequence (June 2013)

The dataset is partitioned chronologically across three distinct phases of the 2013 disaster:

```
[June 13, 00:00 UTC] ───> [June 15, 12:00 UTC] ───> [June 16–17, Peak] ───> [June 18, 23:00 UTC]
     Pre-Event Baseline        Synoptic Convergence     Cloudburst & Flood       Post-Event Recession
```

1. **Phase 1: Pre-Event Baseline (June 13 00:00 – June 15 12:00 UTC)**
   * Premature Arabian Sea monsoon surge meets mid-latitude Western Disturbance trough.
   * High moisture transport, steady accumulation.
2. **Phase 2: Synoptic & Orographic Lock (June 15 12:00 – June 16 18:00 UTC)**
   * Deep convective initiation; cloud top temperature drops below $-60^\circ\text{C}$.
   * Orographic trapping in the Mandakini gorge.
3. **Phase 3: Torrential Cloudburst & Outburst (June 16 18:00 – June 17 12:00 UTC)**
   * Rainfall rates exceeding $40-60\text{ mm/hr}$; cumulative 24h rainfall $> 325\text{ mm}$.
   * Chorabari moraine breach occurs at approx. June 17, 07:00 AM IST ($01:30\text{ UTC}$).
4. **Phase 4: Recession & Runoff Dissipation (June 17 12:00 – June 18 23:00 UTC)**
   * Convective activity collapses; downstream hydrologic flood wave propagates.

* **Sampling Step ($\Delta t$):** $1\text{ hour}$ (standard reanalysis & interpolated satellite sync).
* **Total Time Steps ($T_{\text{total}}$):** $144\text{ hours}$ (6 full days).

---

### 4. Input & Target Feature Contract

#### 4.1 Input Features ($C_{\text{in}} = 8$ channels)
Each spatial cell $(i, j)$ contains 8 normalized features at every time step $t$:

| # | Channel Key | Variable Name | Native Unit | Scaling / Min-Max Range | Source |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `TIR_CTT` | Cloud Top Temperature | Kelvin ($K$) | $[200\text{ K}, 300\text{ K}]$ | Satellite IR / Reanalysis |
| 2 | `IWV` | Integrated Water Vapour | $\text{kg/m}^2$ | $[0, 70\text{ kg/m}^2]$ | ERA5 / IMDAA reanalysis |
| 3 | `CAPE` | Convective Available Potential Energy | $\text{J/kg}$ | $[0, 3500\text{ J/kg}]$ | Atmospheric profile |
| 4 | `CIN` | Convective Inhibition | $\text{J/kg}$ | $[0, 300\text{ J/kg}]$ | Atmospheric profile |
| 5 | `WCONV` | Low-Level Horizontal Wind Convergence | $10^{-4} \text{ s}^{-1}$ | $[-10, 20 \times 10^{-4} \text{ s}^{-1}]$ | Derived from $(u_{850}, v_{850})$ |
| 6 | `VWS` | Vertical Wind Shear ($0-6\text{ km}$) | $\text{m/s}$ | $[0, 40\text{ m/s}]$ | Derived from wind levels |
| 7 | `DEM_ELEV` | Normalized Elevation | Meters ($m$) | $[800\text{ m}, 4200\text{ m}]$ | Static SRTM 30m |
| 8 | `DEM_SLOPE` | Terrain Slope | Degrees ($^\circ$) | $[0^\circ, 65^\circ]$ | Derived from DEM gradient |

#### 4.2 Target Variables ($Y$)
Given past $T_{\text{in}} = 4\text{ hours}$ ($t-3, t-2, t-1, t$), predict for future $T_{\text{out}} = 6\text{ hours}$ ($t+1, \dots, t+6$):

1. **Precipitation Field ($\hat{R}$):**
   * Shape: `(Batch, 6, 1, 65, 35)`
   * Continuous rainfall rate in $\text{mm/hr}$ per grid cell.
2. **Multi-Hazard Risk Head ($\hat{P}$):**
   * Shape: `(Batch, 6, 3)`
   * Probabilities $\in [0, 1]$ across the 6-hour forecast window for:
     * **Hazard 0:** Thunderstorm Probability ($P_{\text{storm}}$)
     * **Hazard 1:** Cloudburst Probability ($P_{\text{cloudburst}}$) — threshold: sustained $\ge 50\text{ mm/hr}$ or localized cell $>100\text{ mm}$
     * **Hazard 2:** Flash Flood / Debris Flow Risk ($P_{\text{flood}}$) — function of cumulative precipitation $\times$ slope accumulation

---

### 5. Tensor Shapes & Mathematical Dimensions

```
                    ┌────────────────────────┐
                    │      Input Tensor      │
                    │ (B, T_in, C, H, W)     │
                    │ (B, 4, 8, 65, 35)      │
                    └───────────┬────────────┘
                                │
                      [ VAJRA Model Core ]
                      (ConvLSTM / UNet3D)
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌────────────────────────┐                    ┌──────────────────┐
│  Rainfall Grid Output  │                    │ Multi-Hazard Head│
│  (B, 6, 1, 65, 35)     │                    │ (B, 6, 3)        │
└────────────────────────┘                    └──────────────────┘
```

* **Batch Size ($B$):** Configurable (typically 4 to 8 for Colab GPU).
* **Sliding Window:**
  * Sample $k$: Inputs from hours $[k, k+1, k+2, k+3]$, Targets from hours $[k+4, \dots, k+9]$.
  * Total usable sliding sequences from 144 hours: $\approx 135$ hourly sequence samples.

---

### 6. Validation and Success Criteria

Chunk 1 is complete and validated when:
- [x] Geographic bounds and grid dimensions match the physical Mandakini basin without distortion.
- [x] Feature units, ranges, and normalization equations are explicitly recorded.
- [x] Target hazard criteria match IMD meteorological definitions and the existing VAJRA UI contract.
- [x] Data contract aligns 100% with the dashboard's `forecast`, `signals`, and `alerts` data structures.
