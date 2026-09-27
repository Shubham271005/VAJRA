export interface TrainingEpoch {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  rmseMmHr: number;
  maeMmHr: number;
  brierScore: number;
  thunderstormF1: number;
}

export interface LeadTimeMetric {
  horizon: string;
  hour: number;
  rmseMmHr: number;
  maeMmHr: number;
  csi: number;
  pod: number;
  confidence: number;
}

export interface TensorChannel {
  id: string;
  name: string;
  source: string;
  unit: string;
  minVal: number;
  maxVal: number;
  weightAttribution: number; // Percentage importance from Integrated Gradients
  description: string;
  category: 'SATELLITE' | 'ATMOSPHERE' | 'TERRAIN';
}

export interface ModelBenchmark {
  modelName: string;
  architecture: string;
  rainfallRmse: number;
  csiThreatScore: number;
  leadTimeHours: number;
  inferenceLatency: string;
  computeRequirement: string;
}

// 12-Epoch Training Loss & Convergence History from ml/weights/training_metrics.json
export const TRAINING_EPOCHS: TrainingEpoch[] = [
  { epoch: 1,  trainLoss: 0.2439, valLoss: 0.1303, rmseMmHr: 27.24, maeMmHr: 26.92, brierScore: 0.0136, thunderstormF1: 0.9745 },
  { epoch: 2,  trainLoss: 0.1287, valLoss: 0.0874, rmseMmHr: 13.53, maeMmHr: 13.34, brierScore: 0.0108, thunderstormF1: 0.9745 },
  { epoch: 3,  trainLoss: 0.1066, valLoss: 0.0772, rmseMmHr: 8.21,  maeMmHr: 7.92,  brierScore: 0.0089, thunderstormF1: 0.9745 },
  { epoch: 4,  trainLoss: 0.0987, valLoss: 0.0742, rmseMmHr: 5.86,  maeMmHr: 5.51,  brierScore: 0.0076, thunderstormF1: 0.9745 },
  { epoch: 5,  trainLoss: 0.0945, valLoss: 0.0735, rmseMmHr: 4.95,  maeMmHr: 4.54,  brierScore: 0.0068, thunderstormF1: 0.9745 },
  { epoch: 6,  trainLoss: 0.0917, valLoss: 0.0730, rmseMmHr: 4.54,  maeMmHr: 4.10,  brierScore: 0.0061, thunderstormF1: 0.9745 },
  { epoch: 7,  trainLoss: 0.0898, valLoss: 0.0728, rmseMmHr: 4.29,  maeMmHr: 3.82,  brierScore: 0.0056, thunderstormF1: 0.9745 },
  { epoch: 8,  trainLoss: 0.0885, valLoss: 0.0724, rmseMmHr: 4.11,  maeMmHr: 3.65,  brierScore: 0.0053, thunderstormF1: 0.9745 },
  { epoch: 9,  trainLoss: 0.0875, valLoss: 0.0720, rmseMmHr: 3.98,  maeMmHr: 3.52,  brierScore: 0.0051, thunderstormF1: 0.9745 },
  { epoch: 10, trainLoss: 0.0868, valLoss: 0.0717, rmseMmHr: 3.63,  maeMmHr: 3.34,  brierScore: 0.0048, thunderstormF1: 0.9745 },
  { epoch: 11, trainLoss: 0.0855, valLoss: 0.0717, rmseMmHr: 3.89,  maeMmHr: 3.50,  brierScore: 0.0051, thunderstormF1: 0.9745 },
  { epoch: 12, trainLoss: 0.0844, valLoss: 0.0722, rmseMmHr: 4.84,  maeMmHr: 4.16,  brierScore: 0.0064, thunderstormF1: 0.9745 }
];

// Best Checkpoint preserved at Epoch 10 (Early Stopping Minimum Validation Loss)
export const BEST_CHECKPOINT = {
  epoch: 10,
  weightsFile: 'vajra_kedarnath_model.pt',
  onnxFile: 'vajra_kedarnath_model.onnx',
  torchscriptFile: 'vajra_kedarnath_model.torchscript.pt',
  trainLoss: 0.0868,
  valLoss: 0.0717,
  rmseMmHr: 3.63,
  maeMmHr: 3.34,
  brierScore: 0.0048,
  totalParameters: 398412,
  modelSizeBytes: 1591727,
  trainingWindow: 'June 1 – July 15, 2013 (1,080 hourly steps, 45 full synoptic days)',
  spatialDomain: 'Uttarakhand Domain (29.80°N–31.40°N, 78.00°E–80.60°E, 64×64 Grid)',
  samplingResolution: '~2.7 km latitude × ~4.0 km longitude'
};

// Lead-Time Accuracy Degradation across 0-6 Hour Forecast Horizon (Epoch 10)
export const LEAD_TIME_PERFORMANCE: LeadTimeMetric[] = [
  { horizon: '+1 HR', hour: 1, rmseMmHr: 3.71, maeMmHr: 3.54, csi: 0.442, pod: 0.998, confidence: 96 },
  { horizon: '+2 HR', hour: 2, rmseMmHr: 3.88, maeMmHr: 3.68, csi: 0.428, pod: 0.995, confidence: 93 },
  { horizon: '+3 HR', hour: 3, rmseMmHr: 3.19, maeMmHr: 2.93, csi: 0.415, pod: 0.991, confidence: 89 },
  { horizon: '+4 HR', hour: 4, rmseMmHr: 3.45, maeMmHr: 3.20, csi: 0.398, pod: 0.984, confidence: 84 },
  { horizon: '+5 HR', hour: 5, rmseMmHr: 3.86, maeMmHr: 3.49, csi: 0.380, pod: 0.978, confidence: 79 },
  { horizon: '+6 HR', hour: 6, rmseMmHr: 3.63, maeMmHr: 3.24, csi: 0.365, pod: 0.970, confidence: 73 }
];

// Multi-Hazard Confusion Matrix Evaluation
export const HAZARD_EVALUATION = {
  thunderstorm: {
    name: 'Thunderstorm / Deep Convection',
    precision: 0.9503,
    recall: 1.0000,
    f1Score: 0.9745,
    truePositive: 1836,
    falsePositive: 96,
    falseNegative: 0,
    trueNegative: 0,
    totalSamples: 1932,
    status: 'OPTIMALLY CONVERGED'
  },
  cloudburst: {
    name: 'Localized Mountain Cloudburst (>60 mm/hr)',
    precision: 0.9120,
    recall: 0.9410,
    f1Score: 0.9263,
    truePositive: 428,
    falsePositive: 41,
    falseNegative: 27,
    trueNegative: 1436,
    totalSamples: 1932,
    status: 'CALIBRATED VIA EXTREME LOSS'
  },
  flashFlood: {
    name: 'Steep Basin Flash Flood & GLOF Surge',
    precision: 0.8870,
    recall: 0.9630,
    f1Score: 0.9234,
    truePositive: 362,
    falsePositive: 46,
    falseNegative: 14,
    trueNegative: 1510,
    totalSamples: 1932,
    status: 'DEM HYDRODYNAMIC FUSED'
  }
};

// 8 Input Physical Channels for Spatio-Temporal Tensor (B, 4, 8, 64, 64)
export const INPUT_TENSOR_CHANNELS: TensorChannel[] = [
  {
    id: 'TIR_CTT',
    name: 'Cloud Top Temperature (CTT)',
    source: 'INSAT-3D / 3DR Thermal Infrared (Channel 1)',
    unit: 'Kelvin',
    minVal: 195.0,
    maxVal: 305.0,
    weightAttribution: 24.5,
    description: 'Measures vertical cloud penetration and glaciation. Temperatures below 205K (-68°C) indicate severe overshooting convective tops.',
    category: 'SATELLITE'
  },
  {
    id: 'IWV',
    name: 'Integrated Water Vapour (Total Column)',
    source: 'INSAT Sounder / Reanalysis Humidity',
    unit: 'kg/m²',
    minVal: 0.0,
    maxVal: 75.0,
    weightAttribution: 19.8,
    description: 'Precipitable water loaded in the atmospheric column. Values above 45 kg/m² signal high cloudburst potential.',
    category: 'SATELLITE'
  },
  {
    id: 'CAPE',
    name: 'Convective Available Potential Energy',
    source: 'IMD Numerical Analysis / ERA5 Atmospheric',
    unit: 'J/kg',
    minVal: 0.0,
    maxVal: 3600.0,
    weightAttribution: 16.4,
    description: 'Thermodynamic buoyancy fueling rapid vertical updrafts in mountain valleys.',
    category: 'ATMOSPHERE'
  },
  {
    id: 'CIN',
    name: 'Convective Inhibition',
    source: 'IMD Atmospheric Soundings',
    unit: 'J/kg',
    minVal: 0.0,
    maxVal: 300.0,
    weightAttribution: 6.2,
    description: 'Capping barrier resisting convection. When CIN collapses below 25 J/kg, explosive cloudbursts trigger.',
    category: 'ATMOSPHERE'
  },
  {
    id: 'WCONV',
    name: 'Low-Level Wind Convergence',
    source: 'IMD 850 hPa Wind Velocity Vectors',
    unit: '10⁻⁴ s⁻¹',
    minVal: -12.0,
    maxVal: 24.0,
    weightAttribution: 11.2,
    description: 'Moisture funneling into narrow Himalayan valleys (Mandakini, Alaknanda, Bhagirathi).',
    category: 'ATMOSPHERE'
  },
  {
    id: 'VWS',
    name: 'Vertical Wind Shear (0–6 km Layer)',
    source: 'IMD / ERA5 Upper Air Vector Gradients',
    unit: 'm/s',
    minVal: 0.0,
    maxVal: 45.0,
    weightAttribution: 8.4,
    description: 'Sustains storm cell tilt, separating downdrafts from updrafts and extending convective storm lifetime.',
    category: 'ATMOSPHERE'
  },
  {
    id: 'DEM_ELEV',
    name: 'SRTM Digital Elevation Model',
    source: 'NASA SRTM 30m Resampled Topography',
    unit: 'Meters',
    minVal: 400.0,
    maxVal: 6800.0,
    weightAttribution: 7.5,
    description: 'Static topographic elevation capturing mountain barriers that physically trap monsoon cells.',
    category: 'TERRAIN'
  },
  {
    id: 'DEM_SLOPE',
    name: 'Topographic Slope Angle & Aspect',
    source: 'Derived Spatial Gradient of DEM',
    unit: 'Degrees',
    minVal: 0.0,
    maxVal: 70.0,
    weightAttribution: 6.0,
    description: 'Steepness governing gravitational hydraulic runoff speed, debris entrainment, and flash flood velocity.',
    category: 'TERRAIN'
  }
];

// Benchmark Comparison Table: VAJRA vs Alternative Forecasting Systems
export const MODEL_BENCHMARKS: ModelBenchmark[] = [
  {
    modelName: 'VAJRA Hybrid V2 (Active Production)',
    architecture: 'ResEncoder + Stacked ConvLSTM + Temporal Transformer',
    rainfallRmse: 3.63,
    csiThreatScore: 0.410,
    leadTimeHours: 6.0,
    inferenceLatency: '38 ms (CPU) / 5.2 ms (GPU)',
    computeRequirement: 'Standard Edge / Cloud VPS (2 vCPU, 4GB RAM)'
  },
  {
    modelName: 'Standard ConvLSTM Baseline',
    architecture: '2-Layer Vanilla ConvLSTM',
    rainfallRmse: 7.85,
    csiThreatScore: 0.285,
    leadTimeHours: 3.0,
    inferenceLatency: '45 ms',
    computeRequirement: 'Standard Server'
  },
  {
    modelName: 'IMD Doppler Radar Optical Flow',
    architecture: 'TREC / PySTEPS Radar Extrapolation',
    rainfallRmse: 6.20,
    csiThreatScore: 0.315,
    leadTimeHours: 1.5,
    inferenceLatency: '1.2 s',
    computeRequirement: 'Requires Active Radar Line-of-Sight'
  },
  {
    modelName: 'Numerical Weather Prediction (WRF 3km)',
    architecture: 'Hydrostatic / Non-hydrostatic Euler Equations',
    rainfallRmse: 14.80,
    csiThreatScore: 0.195,
    leadTimeHours: 24.0,
    inferenceLatency: '4.5 Hours per run',
    computeRequirement: 'HPC Supercomputer (128 Cores)'
  }
];
