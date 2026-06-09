interface Props {
  text: string;
  sizeMeters: number;
  gpsReady: boolean;
  gpsError: string | null;
  onTextChange: (t: string) => void;
  onSizeChange: (m: number) => void;
  onGenerate: () => void;
}

export function EditSheet({
  text,
  sizeMeters,
  gpsReady,
  gpsError,
  onTextChange,
  onSizeChange,
  onGenerate,
}: Props) {
  return (
    <div className="sheet">
      <h1 className="title">MapWriter</h1>
      <p className="subtitle">歩いて地図に文字を描こう</p>
      <input
        className="text-input"
        type="text"
        value={text}
        maxLength={10}
        placeholder="描きたい文字(例: こんにちは)"
        onChange={(e) => onTextChange(e.target.value)}
      />
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
      <div className="gps-status">
        {gpsError ? `⚠ ${gpsError}` : gpsReady ? '✓ 現在地を取得しました' : '現在地を取得中…'}
      </div>
      <button className="btn primary" disabled={text.trim() === ''} onClick={onGenerate}>
        ルートを作成
      </button>
    </div>
  );
}
