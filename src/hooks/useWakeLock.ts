import { useEffect } from 'react';

/** active中は画面スリープを防止する(非対応端末では何もしない) */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // 省電力モード等で失敗することがある
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !disposed) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
}
