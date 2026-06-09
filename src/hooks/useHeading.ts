import { useCallback, useEffect, useState } from 'react';

interface IOSDeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * 端末の方位(0=北、時計回りdeg)。iOSはユーザー操作起点の許可が必要なため
 * needsPermission=true の間は requestPermission をボタンから呼ぶこと。
 */
export function useHeading(): {
  heading: number | null;
  needsPermission: boolean;
  requestPermission: () => void;
} {
  const [heading, setHeading] = useState<number | null>(null);
  const [granted, setGranted] = useState(
    typeof (DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent).requestPermission !==
      'function',
  );

  useEffect(() => {
    if (!granted) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkitHeading === 'number') {
        setHeading(webkitHeading);
      } else if (e.absolute && e.alpha !== null) {
        setHeading((360 - e.alpha) % 360);
      }
    };
    window.addEventListener('deviceorientationabsolute', onOrient as EventListener);
    window.addEventListener('deviceorientation', onOrient as EventListener);
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrient as EventListener);
      window.removeEventListener('deviceorientation', onOrient as EventListener);
    };
  }, [granted]);

  const requestPermission = useCallback(() => {
    const req = (DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent).requestPermission;
    if (typeof req === 'function') {
      req().then((res) => setGranted(res === 'granted')).catch(() => setGranted(false));
    } else {
      setGranted(true);
    }
  }, []);

  return { heading, needsPermission: !granted, requestPermission };
}
