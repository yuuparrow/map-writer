import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Fix, LatLng, RoutePlan } from '../types';

interface Props {
  center: LatLng;
  ideal: LatLng[][] | null;
  plan: RoutePlan | null;
  fix: Fix | null;
  trace: LatLng[];
  /** ナビ中の現在経由点インデックス(踏破済み区間の減光用)。ナビ外は0 */
  navIdx: number;
  follow: boolean;
  onUserPan: () => void;
}

const toLL = (p: LatLng): [number, number] => [p.lat, p.lng];

export function MapView({ center, ideal, plan, fix, trace, navIdx, follow, onUserPan }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef({
    ideal: L.layerGroup(),
    route: L.layerGroup(),
    done: L.polyline([], { color: '#3a4a63', weight: 5, opacity: 0.9 }),
    trace: L.polyline([], { color: '#ff5a5a', weight: 3, opacity: 0.9 }),
    pos: L.circleMarker([0, 0], {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: '#2f7df6',
      fillOpacity: 1,
    }),
    accuracy: L.circle([0, 0], { radius: 0, color: '#2f7df6', weight: 1, opacity: 0.3, fillOpacity: 0.08 }),
  });
  const onUserPanRef = useRef(onUserPan);
  onUserPanRef.current = onUserPan;

  // 地図の初期化(1回のみ)
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: false, attributionControl: true });
    map.setView(toLL(center), 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    const ls = layersRef.current;
    ls.ideal.addTo(map);
    ls.done.addTo(map);
    ls.route.addTo(map);
    ls.trace.addTo(map);
    ls.accuracy.addTo(map);
    ls.pos.addTo(map);
    map.on('dragstart', () => onUserPanRef.current());
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 理想形状(薄い下書き)
  useEffect(() => {
    const g = layersRef.current.ideal;
    g.clearLayers();
    if (!ideal) return;
    for (const stroke of ideal) {
      L.polyline(stroke.map(toLL), {
        color: '#8ab4ff',
        weight: 2,
        opacity: 0.45,
        dashArray: '4 6',
      }).addTo(g);
    }
    if (!plan && ideal.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(ideal.flat().map(toLL)).pad(0.15));
    }
  }, [ideal, plan]);

  // スナップ済みルート + ストローク間コネクタ
  useEffect(() => {
    const g = layersRef.current.route;
    g.clearLayers();
    if (!plan) return;
    plan.snapped.forEach((stroke, i) => {
      L.polyline(stroke.map(toLL), {
        color: plan.snapOk[i] ? '#4da3ff' : '#ffb04d',
        weight: 4,
        opacity: 0.95,
      }).addTo(g);
      if (i > 0) {
        const prev = plan.snapped[i - 1];
        L.polyline([toLL(prev[prev.length - 1]), toLL(stroke[0])], {
          color: '#9aa4b5',
          weight: 2,
          opacity: 0.7,
          dashArray: '2 8',
        }).addTo(g);
      }
    });
    if (mapRef.current && navIdx === 0) {
      const all = plan.snapped.flat();
      if (all.length > 1) mapRef.current.fitBounds(L.latLngBounds(all.map(toLL)).pad(0.15));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // 踏破済み区間の減光
  useEffect(() => {
    const pts = plan && navIdx > 0 ? plan.navPoints.slice(0, navIdx + 1).map(toLL) : [];
    layersRef.current.done.setLatLngs(pts);
  }, [plan, navIdx]);

  // 歩行軌跡
  useEffect(() => {
    layersRef.current.trace.setLatLngs(trace.map(toLL));
  }, [trace]);

  // 現在位置マーカー + 追従
  useEffect(() => {
    if (!fix) return;
    const ls = layersRef.current;
    ls.pos.setLatLng(toLL(fix));
    ls.accuracy.setLatLng(toLL(fix));
    ls.accuracy.setRadius(fix.accuracy);
    if (follow && mapRef.current) {
      mapRef.current.panTo(toLL(fix), { animate: true });
    }
  }, [fix, follow]);

  return <div ref={divRef} className="map" />;
}
