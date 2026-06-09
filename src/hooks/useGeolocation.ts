import { useEffect, useState } from 'react';
import type { Fix } from '../types';
import { SIM_ENABLED, simSubscribe } from '../dev/simulator';

/**
 * 現在位置を取得する。watch=trueで連続測位(ナビ中)。
 * ?sim=1 のときは実GPSの代わりにシミュレータの位置を返す。
 */
export function useGeolocation(watch: boolean): { fix: Fix | null; error: string | null } {
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (SIM_ENABLED) {
      return simSubscribe(setFix);
    }
    if (!('geolocation' in navigator)) {
      setError('この端末は位置情報に対応していません');
      return;
    }
    const onPos = (pos: GeolocationPosition) => {
      setError(null);
      setFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    };
    const onErr = (e: GeolocationPositionError) => {
      setError(
        e.code === e.PERMISSION_DENIED
          ? '位置情報の利用が許可されていません'
          : '位置情報を取得できません',
      );
    };
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 };
    if (watch) {
      const id = navigator.geolocation.watchPosition(onPos, onErr, opts);
      return () => navigator.geolocation.clearWatch(id);
    }
    navigator.geolocation.getCurrentPosition(onPos, onErr, opts);
  }, [watch]);

  return { fix, error };
}
