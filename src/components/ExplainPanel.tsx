import { X, CheckCircle2 } from 'lucide-react';
import type { ExplainabilityData } from '../api/client';

const defaultRows: [string, string, string][] = [
  ['IWV surge detected', '+34% over recent observation window', 'Strong contribution'],
  ['CAPE increasing', 'Convective instability rising', 'Strong contribution'],
  ['CIN weakening', 'Convection becoming easier to initiate', 'Moderate contribution'],
  ['Low-level wind convergence', 'Strong convergence detected', 'Moderate contribution'],
  ['Cloud Top Temperature', 'Rapid cloud development signal', 'Strong contribution']
];

interface Props {
  onClose: () => void;
  data?: ExplainabilityData | null;
}

export default function ExplainPanel({ onClose, data }: Props) {
  const rows = data?.rows || defaultRows;
  const overallConfidence = data?.overallConfidence || 'HIGH';
  const confidenceScore = data?.confidenceScore || 88;
  const hazardSplit = data?.hazardSplit || {
    cloudburst: 'HIGH',
    flood: 'MODERATE-HIGH',
    storm: 'HIGH'
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="explain-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="kicker">EXPLAINABLE AI</div>
            <h2>Why did the AI trigger this alert?</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="prototype-note">
          Prototype / Simulated Model Explanation • Deterministic Pipeline Attribution
        </div>
        {data?.summary && (
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.45 }}>
            {data.summary}
          </p>
        )}
        <div className="explain-list">
          {rows.map(([a, b, c]) => (
            <div className="explain-row" key={a}>
              <CheckCircle2 size={17} />
              <div className="explain-copy">
                <strong>{a}</strong>
                <span>{b}</span>
              </div>
              <span className="contrib">{c}</span>
            </div>
          ))}
        </div>
        <div className="overall">
          <div>
            <span>Overall confidence</span>
            <strong>{overallConfidence}</strong>
          </div>
          <div className="confidence-bar">
            <i style={{ width: `${confidenceScore}%` }} />
          </div>
        </div>
        <div className="risk-split">
          <div>
            <span>Cloudburst</span>
            <strong>{hazardSplit.cloudburst}</strong>
          </div>
          <div>
            <span>Flash Flood</span>
            <strong>{hazardSplit.flood}</strong>
          </div>
          <div>
            <span>Thunderstorm</span>
            <strong>{hazardSplit.storm}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
