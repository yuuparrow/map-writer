interface Props {
  text: string;
  walkedMeters: number;
  onRestart: () => void;
}

export function DoneSheet({ text, walkedMeters, onRestart }: Props) {
  return (
    <div className="sheet">
      <h1 className="title">🎉 完成!</h1>
      <p className="subtitle">
        「{text}」を {(walkedMeters / 1000).toFixed(1)}km 歩いて描きました
      </p>
      <p className="subtitle">赤い線があなたの軌跡です。スクリーンショットで保存しよう!</p>
      <button className="btn primary" onClick={onRestart}>
        新しく描く
      </button>
    </div>
  );
}
