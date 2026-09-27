import { useState } from 'react';
import {
  ChevronRight,
  Cpu,
  Database,
  Map,
  Satellite,
  Sparkles,
  Layers,
  Activity,
  GitBranch,
  ShieldCheck
} from 'lucide-react';

interface PipelineStage {
  title: string;
  tag: string;
  summary: string;
  inputShape: string;
  outputShape: string;
  math: string;
  detail: string;
  icon: typeof Satellite;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    title: 'INSAT Satellite Ingestion',
    tag: 'SENSORY LAYER',
    summary: 'Cloud Top Temperature (TIR) and Sounder Integrated Water Vapour columns.',
    inputShape: 'Raw HDF5 / GeoTIFF (4km)',
    outputShape: 'Grid (2, 64, 64) @ t-3..t',
    math: 'T_{B} = B^{-1}(\lambda, I_{\lambda}), \\quad IWV = \\int_{0}^{p_s} q \\frac{dp}{g}',
    detail: 'Continuous half-hourly geostationary observations from INSAT-3D/3DR over the Garhwal-Kumaon Himalayan sector (29.80°N–31.40°N, 78.00°E–80.60°E). Tracks glacial cloud tops cooling down to -71°C.',
    icon: Satellite
  },
  {
    title: 'IMD / ERA5 Atmospheric Fusion',
    tag: 'DYNAMIC LAYER',
    summary: 'Thermodynamic buoyancy, moisture flux convergence, and vertical wind shear.',
    inputShape: 'GRIB2 0.25° Grids',
    outputShape: 'Grid (4, 64, 64) @ t-3..t',
    math: 'CAPE = \\int_{z_f}^{z_n} g \\left(\\frac{T_{v,parcel} - T_{v,env}}{T_{v,env}}\\right) dz, \\quad \\nabla \\cdot (q \\mathbf{V})',
    detail: 'Blends hourly CAPE, CIN, 850 hPa wind convergence, and 0-6 km deep-layer shear vectors. Identifies high-risk convective pre-conditioning before mountain storm triggers.',
    icon: Database
  },
  {
    title: 'SRTM 30m Orographic Elevation',
    tag: 'TERRAIN LAYER',
    summary: 'High-resolution Digital Elevation Model and spatial slope gradient vectors.',
    inputShape: 'SRTM 1-ArcSecond (30m)',
    outputShape: 'Static (2, 64, 64) [Elev, Slope]',
    math: 'S = \\arctan\\left(\\sqrt{(\\partial z / \\partial x)^2 + (\\partial z / \\partial y)^2}\\right)',
    detail: 'Static topographic constraints representing steep Himalayan valley walls (Mandakini, Alaknanda, Bhagirathi, Kali gorges) that physically anchor orographic lift and govern hydraulic gravity runoff.',
    icon: Map
  },
  {
    title: '8-Channel Tensor Packaging',
    tag: 'TENSOR PACK',
    summary: 'Normalized 4-hour historical window packed into spatio-temporal PyTorch tensor.',
    inputShape: 'Multi-source heterogeneous',
    outputShape: '(Batch, 4, 8, 64, 64)',
    math: 'X_t = \\text{Concat}[TIR, IWV, CAPE, CIN, WCONV, VWS, DEM, Slope]_{t-3:t}',
    detail: 'Standardized to physical bounds [min, max] and mapped onto the 64×64 spatial grid with ~2.7 km latitude and ~4.0 km longitude resolution covering all of Uttarakhand.',
    icon: Layers
  },
  {
    title: 'Multi-Scale Residual Encoder',
    tag: 'RESIDUAL BACKBONE',
    summary: 'Three-stage residual convolutional blocks extracting multi-scale spatial representations.',
    inputShape: '(B×4, 8, 64, 64)',
    outputShape: '(B×4, 64, 16, 16)',
    math: 'F(x) = \\sigma(BN(W_2 * \\sigma(BN(W_1 * x)))) + W_s x, \\quad [8 \\to 32 \\to 48 \\to 64]',
    detail: 'Extracts deep hierarchical spatial features of convective storm cores and terrain ridges without vanishing gradients. Employs LeakyReLU(0.1) and batch normalization.',
    icon: Cpu
  },
  {
    title: 'Stacked 2-Layer ConvLSTM',
    tag: 'RECURRENT MEMORY',
    summary: 'Spatiotemporal recurrent cells modeling cell advection, growth, and dissipation.',
    inputShape: '(B, 4, 64, 16, 16)',
    outputShape: '(B, 4, 64, 16, 16) + (h_2, c_2)',
    math: 'i_t = \\sigma(W_{xi} * x_t + W_{hi} * h_{t-1} + b_i), \\quad c_t = f_t \\odot c_{t-1} + i_t \\odot \\tanh(W_{xc} * x_t + W_{hc} * h_{t-1})',
    detail: 'Two stacked convolutional LSTM layers maintain localized 2D spatial feature states across past timesteps, retaining cloud momentum and valley trapping dynamics.',
    icon: Cpu
  },
  {
    title: '8-Head Temporal Transformer',
    tag: 'ATTENTION MECHANISM',
    summary: 'Self-attention across timesteps to capture long-range synoptic interactions.',
    inputShape: '(B, 4, 64×16×16)',
    outputShape: '(B, 4, 64×16×16)',
    math: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V, \\quad \\text{heads}=8, \\, d_{model}=64',
    detail: 'Enables the model to correlate sudden Western Disturbance cold pool intrusions with earlier moisture buildup, overcoming the forgetting horizon of pure RNN architectures.',
    icon: Sparkles
  },
  {
    title: 'Autoregressive Rain Decoder',
    tag: '0-6H RAIN FORECAST',
    summary: 'Step-by-step unrolling predicting gridded precipitation at +1h to +6h lead horizons.',
    inputShape: '(B, 64, 16, 16) Latent state',
    outputShape: '(B, 6, 1, 64, 64) mm/hr continuous',
    math: '\\hat{Y}_{t+k} = \\text{Decoder}(h_{t+k-1}), \\quad \\mathcal{L}_{rain} = \\text{BMSE} + 0.1 \\times \\text{BMAE}',
    detail: 'Employs sub-pixel convolution upsampling to reconstruct fine 64×64 precipitation fields. Trained with Balanced MSE loss to penalize under-prediction of extreme localized cloudbursts.',
    icon: Activity
  },
  {
    title: 'Multi-Hazard Risk Head',
    tag: 'HAZARD PROBABILITIES',
    summary: 'Jointly estimates probabilities for Thunderstorm, Cloudburst, and Flash Flood.',
    inputShape: 'Global pooled latent + Rain maps',
    outputShape: '(B, 6, 3) Calibrated Probabilities',
    math: 'P_{h, t+k} = \\sigma(W_h \\cdot \\text{AdaptiveAvgPool}(Z_{t+k}) + b_h), \\quad h \\in [Storm, Burst, Flood]',
    detail: 'Calibrated binary cross-entropy with focal weighting yields precise risk curves for disaster management teams, achieving a Brier calibration score of 0.0048.',
    icon: GitBranch
  },
  {
    title: 'Explainability & Civil Advisory',
    tag: 'XAI DECISION ENGINE',
    summary: 'Gradient saliency attribution and catchment-level automated evacuation advisories.',
    inputShape: '(B, 6, 3) + Spatial Grids',
    outputShape: 'GeoJSON Alert Vectors & Bulletins',
    math: 'Saliency(c) = \\left| \\frac{\\partial P_{hazard}}{\\partial X_{channel}} \\right|, \\quad \\text{Lead Gain} = \\tau_{AI} - \\tau_{radar}',
    detail: 'Translates raw neural weights into transparent civil defense insights, highlighting exactly which factor (e.g. CTT plunging to -71°C or steep slope runoff) triggered the hazard warning.',
    icon: ShieldCheck
  }
];

export default function Pipeline() {
  const [active, setActive] = useState(0);
  const current = PIPELINE_STAGES[active];
  const Icon = current.icon;

  return (
    <div className="pipeline-card" style={{ marginBottom: '20px' }}>
      <div className="section-top" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div className="kicker" style={{ color: '#38bdf8' }}>NEURAL ARCHITECTURE SPECIFICATION</div>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '18px' }}>
            VajraNowcastNet V2 • Spatio-Temporal Hybrid Pipeline
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            className="simulation-chip"
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              borderColor: 'rgba(34, 197, 94, 0.35)',
              fontWeight: 700,
              fontSize: '10px',
              padding: '5px 10px',
              borderRadius: '6px'
            }}
          >
            ACTIVE PRODUCTION V2 ARCHITECTURE
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            398K Params • PyTorch 2.x
          </span>
        </div>
      </div>

      {/* Horizontal Scroll Nodes */}
      <div className="pipeline-scroll" style={{ padding: '12px 14px', gap: '4px' }}>
        {PIPELINE_STAGES.map((stage, i) => {
          const NodeIcon = stage.icon;
          const isSelected = active === i;
          return (
            <button
              key={stage.title}
              className={`pipeline-node ${isSelected ? 'active' : ''}`}
              onClick={() => setActive(i)}
              style={{
                minWidth: '150px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: isSelected ? '1px solid #38bdf8' : '1px solid #1a3045',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : 'rgba(11, 23, 38, 0.7)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <NodeIcon
                  size={16}
                  style={{
                    color: isSelected ? '#38bdf8' : '#64748b',
                    flexShrink: 0
                  }}
                />
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '8px',
                      color: isSelected ? '#38bdf8' : '#64748b',
                      fontWeight: 700,
                      letterSpacing: '0.08em'
                    }}
                  >
                    STEP 0{i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {stage.title}
                  </div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight size={13} style={{ color: '#334155', flexShrink: 0 }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      <div
        className="pipeline-detail"
        style={{
          padding: '18px 20px',
          background: 'rgba(10, 20, 32, 0.75)',
          borderTop: '1px solid #172a3e',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <Icon size={18} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase'
                }}
              >
                STAGE 0{active + 1} • {current.tag}
              </span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#f1f5f9' }}>
                {current.title}
              </h3>
            </div>
          </div>
          <p style={{ margin: '6px 0 12px 0', color: '#cbd5e1', fontSize: '12px', lineHeight: 1.6 }}>
            {current.detail}
          </p>
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#38bdf8'
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block', marginBottom: '2px' }}>
              Mathematical / Operator Formulation:
            </span>
            {current.math}
          </div>
        </div>

        {/* Input / Output Tensor Shapes Spec */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '10px',
            border: '1px solid #1e293b',
            padding: '14px 16px'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#64748b',
              fontWeight: 700,
              letterSpacing: '0.1em',
              marginBottom: '10px'
            }}
          >
            TENSOR CONTRACT
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(2, 6, 23, 0.6)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Input Format / Geometry</span>
              <code style={{ fontSize: '12px', color: '#facc15', fontWeight: 600 }}>{current.inputShape}</code>
            </div>
            <div
              style={{
                background: 'rgba(2, 6, 23, 0.6)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Output Transformation</span>
              <code style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>{current.outputShape}</code>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '6px',
                fontSize: '10px',
                color: '#64748b'
              }}
            >
              <span>Domain: Uttarakhand 64×64</span>
              <span style={{ color: '#38bdf8' }}>Latent d=64</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
