const KEY = 'map-writer:v1';

export interface Settings {
  text: string;
  sizeMeters: number;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s.text === 'string' && typeof s.sizeMeters === 'number') return s;
    }
  } catch {
    // 破損データは無視
  }
  return { text: '', sizeMeters: 400 };
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // プライベートモード等では保存しない
  }
}
