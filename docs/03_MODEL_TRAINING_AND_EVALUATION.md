# Chunk 3: Model Architecture, Training & Evaluation Summary
## Kedarnath (June 2013) Case Study Model Training

---

### 1. Neural Architecture Specifications
* **Model Name:** `VajraNowcastNet` ([`ml/model.py`](file:///home/shubham/Desktop/vajra/ml/model.py))
* **Architecture Paradigm:** Spatio-Temporal Dual-Head Network:
  1. **Spatial Encoder:** Double Conv2D blocks with BatchNorm and LeakyReLU activations mapping 8 physical channels to 32 hidden feature representations.
  2. **Temporal Core:** Convolutional LSTM (`ConvLSTMCell`) operating over the $T_{\text{in}} = 4\text{ hours}$ past observation sequence.
  3. **Head A (Precipitation Grid Decoder):** Conv2D decoder generating continuous 6-hour future rain rate grids $(B, 6, 1, 65, 35)$.
  4. **Head B (Multi-Hazard Classifier Head):** Adaptive spatial pooling + dense MLP predicting hourly probabilities for `[Thunderstorm, Cloudburst, Flash Flood]` $(B, 6, 3)$.

---

### 2. Multi-Task Meteorological Loss Function
* **Heavy Rainfall Loss:** Weighted MSE with dynamic penalty $w(y) = 1.0 + 12.0 \cdot y$ to prevent zero-prediction collapse on rare cloudburst events.
* **Hazard Loss:** Focal Cross-Entropy with $\gamma = 2.0$ for hard-positive hazard samples.
* **Combined Loss:** $\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{rain}} + 1.5 \cdot \mathcal{L}_{\text{hazard}}$.

---

### 3. Training & Validation Performance (15 Epochs)
* **Best Validation Loss:** `0.2189` (Epoch 7)
* **Checkpointed Weights:** [`ml/weights/vajra_kedarnath_model.pt`](file:///home/shubham/Desktop/vajra/ml/weights/vajra_kedarnath_model.pt)
* **Training Log:** [`ml/weights/training_metrics.json`](file:///home/shubham/Desktop/vajra/ml/weights/training_metrics.json)

#### Meteorological Verification Scores (Peak Incident Test):
| Metric | Threshold | Value | Meteorological Interpretation |
| :--- | :--- | :--- | :--- |
| **POD** (Probability of Detection) | $\ge 20\text{ mm/hr}$ | **100.0%** | Zero misses on intense rainfall frames |
| **POD** (Cloudburst Detection) | $\ge 40\text{ mm/hr}$ | **99.8%** | Effectively captures cloudburst peak intensity |
| **CSI** (Critical Success Index) | Severe rain | **0.410** | Strong threat score for mountain convection |
| **RMSE** | Continuous | **28.02 mm/hr** | Realistic physical error envelope |

---

### 4. Sample Model Output (June 16 Peak Convergence Test)
```
[+1 HR] Rain: Mean=66.8 mm/hr, Peak=76.0 mm/hr | Thunderstorm: 93.2% | Cloudburst: 79.5% | Flash Flood: 80.8%
[+2 HR] Rain: Mean=67.2 mm/hr, Peak=74.6 mm/hr | Thunderstorm: 92.1% | Cloudburst: 78.1% | Flash Flood: 82.2%
[+3 HR] Rain: Mean=61.9 mm/hr, Peak=67.1 mm/hr | Thunderstorm: 93.7% | Cloudburst: 81.3% | Flash Flood: 77.0%
[+4 HR] Rain: Mean=61.5 mm/hr, Peak=66.3 mm/hr | Thunderstorm: 95.5% | Cloudburst: 74.2% | Flash Flood: 79.4%
[+5 HR] Rain: Mean=60.2 mm/hr, Peak=70.4 mm/hr | Thunderstorm: 94.4% | Cloudburst: 84.2% | Flash Flood: 82.0%
[+6 HR] Rain: Mean=63.4 mm/hr, Peak=69.7 mm/hr | Thunderstorm: 94.4% | Cloudburst: 82.5% | Flash Flood: 83.7%
```
