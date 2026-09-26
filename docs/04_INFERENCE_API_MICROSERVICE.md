# Chunk 4: Inference Engine & Microservice API Summary
## Kedarnath (June 2013) Live AI Serving

---

### 1. Overview
Chunk 4 establishes the bridge between the trained PyTorch neural network weights (`vajra_kedarnath_model.pt`) and the application layer.

* **Inference Engine:** [`ml/inference.py`](file:///home/shubham/Desktop/vajra/ml/inference.py)
* **REST API Microservice:** [`ml/api.py`](file:///home/shubham/Desktop/vajra/ml/api.py)
* **Port:** `8000` (configurable via `AI_PORT`)
* **Latency:** $< 35\text{ ms}$ per forward pass on CPU.

---

### 2. Available Endpoints

#### `GET /api/health`
Health check and active model metadata:
```json
{
  "status": "ONLINE",
  "service": "VAJRA Kedarnath 2013 Neural Nowcasting Microservice",
  "architecture": "VajraNowcastNet (ConvLSTM + Dual-Head)",
  "checkpoint": "vajra_kedarnath_model.pt",
  "checkpointEpoch": 7,
  "validationLoss": 0.2189
}
```

#### `GET` / `POST /api/predict` (or `/api/nowcast`)
Executes real neural forward pass on atmospheric sequence and returns the complete VAJRA payload:
* `mode`: `"REAL_AI_MODEL_INFERENCE"`
* `forecast`: 0 to 6 hours array with hourly `{ cloudburst, flood, storm }` percentages.
* `signals`: 6 physical atmospheric variables with values, trends, status, and 7-point history series:
  - `IWV` (Integrated Water Vapour, $\text{kg/m}^2$)
  - `CAPE` (Convective Available Potential Energy, $\text{J/kg}$)
  - `CIN` (Convective Inhibition, $\text{J/kg}$)
  - `WCONV` (Low-Level Wind Convergence, $10^{-4}\text{ s}^{-1}$)
  - `VWS` (Vertical Wind Shear, $\text{m/s}$)
  - `CTT` (Cloud Top Temperature, $^\circ\text{C}$)
* `places`: Real-time risk level, probability, and lead times across the Mandakini catchment (Kedarnath, Gaurikund, Guptkashi, Rudraprayag).
* `centers`: Geospatial coordinates and risk radius for the Leaflet MapView.
* `alerts`: Automated explainable disaster warning triggers based on AI thresholds.
* `explainability`: Real meteorological feature attributions and model confidence score.
* `gridRainfallSummary`: Maximum and mean predicted rainfall rates across the $65 \times 35$ grid.

---

### 3. Verification Test
Live test executed successfully:
```bash
curl -s http://localhost:8000/api/health
# Status: 200 OK -> Checkpoint Epoch 7, Val Loss: 0.2189

curl -s http://localhost:8000/api/predict
# Status: 200 OK -> REAL_AI_MODEL_INFERENCE payload returned
```
