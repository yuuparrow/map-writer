import type { RoutePlan } from '../types';

interface Props {
  plan: RoutePlan | null;
  planning: boolean;
  planProgress: { done: number; total: number } | null;
  sizeMeters: number;
  onSizeChange: (m: number) => void;
  onStart: () => void;
  onBack: () => void;
}

const fmtKm = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);

export function PreviewSheet({
  plan,
  planning,
  planProgress,
  sizeMeters,
  onSizeChange,
  onStart,
  onBack,
}: Props) {
  const failed = plan ? plan.snapOk.filter((ok) => !ok).length : 0;
  return (
    <div className="sheet">
      <label className="slider-row">
        <span>
          文字の高さ <strong>{sizeMeters}m</strong>
        </span>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={sizeMeters}
          onChange={(e) => onSizeChange(Number(e.target.value))}
        />
      </label>
      {planning && (
        <div className="gps-status">
          道路に沿ったルートを計算中…
          {planProgress ? ` (${planProgress.done}/${planProgress.total}画)` : ''}
        </div>
      )}
      {!planning && plan && (
        <div className="stats">
          <div>
            <span className="stat-label">総距離</span>
            <span className="stat-value">{fmtKm(plan.totalMeters)}</span>
          </div>
          <div>
            <span className="stat-label">画数</span>
            <span className="stat-value">{plan.snapped.length}</span>
          </div>
          <div>
            <span className="stat-label">形状のずれ</span>
            <span className="stat-value">±{Math.round(plan.deviationMeters)}m</span>
          </div>
        </div>
      )}
      {!planning && failed > 0 && (
        <div className="gps-status">⚠ {failed}画は道路に沿わせられず直線のままです</div>
      )}
      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← 戻る
        </button>
        <button className="btn primary" disabled={planning || !plan} onClick={onStart}>
          ナビ開始
        </button>
      </div>
    </div>
  );
}
