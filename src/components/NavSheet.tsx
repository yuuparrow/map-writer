import type { NavStatus } from '../nav/navigator';

interface Props {
  status: NavStatus;
  heading: number | null;
  needsCompassPermission: boolean;
  offRoute: boolean;
  follow: boolean;
  onRequestCompass: () => void;
  onRecenter: () => void;
  onQuit: () => void;
}

export function NavSheet({
  status,
  heading,
  needsCompassPermission,
  offRoute,
  follow,
  onRequestCompass,
  onRecenter,
  onQuit,
}: Props) {
  // 端末方位が取れれば「自分から見た向き」、なければ北基準の方位
  const arrowDeg = status.bearingToTarget - (heading ?? 0);
  return (
    <div className="sheet nav-sheet">
      {offRoute && <div className="banner">ルートから外れています — 矢印の方向へ戻ってください</div>}
      <div className="nav-main">
        <div className="arrow-wrap">
          <svg viewBox="0 0 100 100" className="arrow" style={{ transform: `rotate(${arrowDeg}deg)` }}>
            <path d="M50 8 L78 78 L50 60 L22 78 Z" fill="#4da3ff" />
          </svg>
          {heading === null && <div className="arrow-note">北基準</div>}
        </div>
        <div className="nav-info">
          <div className="nav-distance">{Math.round(status.distanceToTarget)}m</div>
          <div className="nav-sub">
            {status.penDown ? 'なぞり中' : '次の画へ移動(自由に歩いてOK)'}
          </div>
          <div className="nav-sub">
            {status.strokeIdx + 1} / {status.strokeCount} 画目
          </div>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.round(status.progress * 100)}%` }} />
      </div>
      <div className="nav-sub center">{Math.round(status.progress * 100)}% 完了</div>
      <div className="btn-row">
        <button className="btn" onClick={onQuit}>
          終了
        </button>
        {needsCompassPermission && (
          <button className="btn" onClick={onRequestCompass}>
            コンパス許可
          </button>
        )}
        {!follow && (
          <button className="btn" onClick={onRecenter}>
            現在地へ
          </button>
        )}
      </div>
    </div>
  );
}
