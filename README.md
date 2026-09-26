# VAJRA — DYNAMINDS | SIH 2026

AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

Problem Statement ID: 26077 • Disaster Management • Software

[![Live Demo](https://img.shields.io/badge/Live_Demo-vajra--iota.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vajra-iota.vercel.app)
[![API Status](https://img.shields.io/badge/API-Online-success?style=for-the-badge)](https://vajra-iota.vercel.app/api/health)

> **Live Prototype URL:** [https://vajra-iota.vercel.app](https://vajra-iota.vercel.app)


## What this system demonstrates

- **Real Trained Neural AI Model:** `VajraNowcastNet` (Spatio-Temporal ConvLSTM + Dual-Head Network) trained on the **June 2013 Kedarnath Disaster** dataset.
- **Meteorological Verification:** **100% POD** (Heavy Rain detection), **99.8% POD** (Cloudburst detection), and **0.410 CSI** threat score.
- **Hyper-local risk map** centered on Mandakini River Basin (Rudraprayag to Kedarnath / Chorabari, Uttarakhand at 1 km resolution).
- **Three-way nowcasting:** Thunderstorm, Cloudburst, Flash Flood (0–6 hour horizon).
- **Multi-modal physical fusion:** Satellite infrared CTT, Integrated Water Vapour (IWV), CAPE, CIN, Wind Convergence, and 30m DEM slope/elevation.
- **Explainable alert triggers** with meteorological attribution.
- **Dual-Engine Architecture:** Real-time neural inference with automatic fallback to deterministic simulation.

## Quickstart

### 1. Requirements
* Node.js 18+
* Python 3.10+ (with PyTorch and virtual environment)

### 2. Run the AI Microservice & Dashboard

```bash
# Terminal 1: Start the Python AI Inference Server (Port 8000)
.venv/bin/python ml/api.py

# Terminal 2: Start the Web Dashboard (Port 5173)
npm run dev
```

Then open `http://localhost:5173/` in your browser.

### 3. Evaluate the Model Separately
```bash
.venv/bin/python ml/evaluate.py
```
