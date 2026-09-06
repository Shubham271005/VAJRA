# VAJRA — DYNAMINDS | SIH 2026

AI-Driven Hyper-Local Early Warning System for Severe Weather Nowcasting

Problem Statement ID: 26077 • Disaster Management • Software

## What this prototype demonstrates

- Hyper-local risk map centered on Rudraprayag / Kedarnath, Uttarakhand
- Three-way nowcasting concept: Thunderstorm, Cloudburst, Flash Flood
- INSAT + IMDAA + DEM conceptual data fusion pipeline
- Transformer + ConvLSTM proposed architecture
- DEM-aware flood overlay concept
- Explainable alert triggers
- 0–6 hour forecast timeline
- Deterministic 3–5 second nowcast simulation
- Alerts and response queue
- Kedarnath 2013 retrospective prototype simulation
- Prototype system-health dashboard

## Run

Requirements: Node.js 18+ recommended.

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Important demo note

All atmospheric values, probabilities, alert conditions and system statuses are local deterministic mock data for the SIH college-round prototype. They are explicitly presented as simulation values, not live official measurements or a production-trained weather model.

The map uses OpenStreetMap tiles when network access is available; the rest of the dashboard does not require any external weather API, database, authentication, or API key.
