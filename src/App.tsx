import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppMode, Fix, LatLng, RoutePlan } from './types';
import { buildIdealStrokes, buildPlan } from './lib/planner';
import { pathLength } from './lib/geo';
import { loadSettings, saveSettings } from './lib/storage';
import { cumulativeDistances, initNav, navStatus, stepNav, type NavState } from './nav/navigator';
import { useGeolocation } from './hooks/useGeolocation';
import { useHeading } from './hooks/useHeading';
import { useWakeLock } from './hooks/useWakeLock';
import { MapView } from './components/MapView';
import { EditSheet } from './components/EditSheet';
import { PreviewSheet } from './components/PreviewSheet';
import { NavSheet } from './components/NavSheet';
import { DoneSheet } from './components/DoneSheet';
import { SIM_ENABLED, SIM_HOME } from './dev/simulator';
import { SimBar } from './dev/SimBar';

const FALLBACK_CENTER: LatLng = SIM_HOME; // 東京駅
const RESNAP_DEBOUNCE_MS = 800;

export default function App() {
  const initial = useMemo(loadSettings, []);
  const [mode, setMode] = useState<AppMode>('edit');
  const [text, setText] = useState(initial.text);
  const [sizeMeters, setSizeMeters] = useState(initial.sizeMeters);
  const [anchor, setAnchor] = useState<LatLng | null>(null);
  const [ideal, setIdeal] = useState<LatLng[][] | null>(null);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planProgress, setPlanProgress] = useState<{ done: number; total: number } | null>(null);
  const [navState, setNavState] = useState<NavState>(initNav);
  const [trace, setTrace] = useState<Fix[]>([]);
  const [follow, setFollow] = useState(true);

  const { fix, error: gpsError } = useGeolocation(mode === 'navigating');
  const { heading, needsPermission, requestPermission } = useHeading();
  useWakeLock(mode === 'navigating');

  useEffect(() => saveSettings({ text, sizeMeters }), [text, sizeMeters]);

  // プラン生成(世代カウンタで古い結果を破棄)
  const genRef = useRef(0);
  const regenerate = useCallback((t: string, at: LatLng, size: number) => {
    const gen = ++genRef.current;
    const strokes = buildIdealStrokes(t, at, size);
    setIdeal(strokes);
    setPlan(null);
    setPlanning(true);
    setPlanProgress(null);
    buildPlan(t, at, size, strokes, (done, total) => {
      if (genRef.current === gen) setPlanProgress({ done, total });
    })
      .then((p) => {
        if (genRef.current !== gen) return;
        setPlan(p);
        setPlanning(false);
      })
      .catch(() => {
        if (genRef.current === gen) setPlanning(false);
      });
  }, []);

  const handleGenerate = useCallback(() => {
    const at = fix ?? FALLBACK_CENTER;
    setAnchor(at);
    setMode('preview');
    regenerate(text, at, sizeMeters);
  }, [fix, text, sizeMeters, regenerate]);

  // プレビュー中のサイズ変更: 下書きは即時、再スナップはデバウンス
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSizeChange = useCallback(
    (m: number) => {
      setSizeMeters(m);
      if (mode !== 'preview' || !anchor) return;
      setIdeal(buildIdealStrokes(text, anchor, m));
      setPlan(null);
      setPlanning(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => regenerate(text, anchor, m), RESNAP_DEBOUNCE_MS);
    },
    [mode, anchor, text, regenerate],
  );

  // ナビ: GPS測位ごとに状態を進める
  const planRef = useRef(plan);
  planRef.current = plan;
  useEffect(() => {
    if (mode !== 'navigating' || !fix || !planRef.current) return;
    setTrace((t) => [...t, fix]);
    setNavState((s) => {
      const next = stepNav(s, planRef.current!.navPoints, fix);
      if (next.done) setMode('done');
      return next;
    });
  }, [mode, fix]);

  const cumDist = useMemo(
    () => (plan ? cumulativeDistances(plan.navPoints) : []),
    [plan],
  );
  const status = useMemo(
    () => (plan ? navStatus(navState, plan.navPoints, cumDist, fix) : null),
    [plan, navState, cumDist, fix],
  );

  const startNav = useCallback(() => {
    setNavState(initNav());
    setTrace([]);
    setFollow(true);
    setMode('navigating');
  }, []);

  const reset = useCallback(() => {
    genRef.current++;
    setMode('edit');
    setIdeal(null);
    setPlan(null);
    setPlanning(false);
    setNavState(initNav());
    setTrace([]);
  }, []);

  return (
    <div className="app">
      <MapView
        center={anchor ?? fix ?? FALLBACK_CENTER}
        ideal={ideal}
        plan={plan}
        fix={fix}
        trace={trace}
        navIdx={mode === 'navigating' || mode === 'done' ? navState.idx : 0}
        follow={mode === 'navigating' && follow}
        onUserPan={() => setFollow(false)}
      />
      {SIM_ENABLED && <SimBar plan={plan} />}
      {mode === 'edit' && (
        <EditSheet
          text={text}
          sizeMeters={sizeMeters}
          gpsReady={fix !== null}
          gpsError={gpsError}
          onTextChange={setText}
          onSizeChange={setSizeMeters}
          onGenerate={handleGenerate}
        />
      )}
      {mode === 'preview' && (
        <PreviewSheet
          plan={plan}
          planning={planning}
          planProgress={planProgress}
          sizeMeters={sizeMeters}
          onSizeChange={handleSizeChange}
          onStart={startNav}
          onBack={reset}
        />
      )}
      {mode === 'navigating' && status && (
        <NavSheet
          status={status}
          heading={heading}
          needsCompassPermission={needsPermission}
          offRoute={navState.offRoute}
          follow={follow}
          onRequestCompass={requestPermission}
          onRecenter={() => setFollow(true)}
          onQuit={() => setMode('done')}
        />
      )}
      {mode === 'done' && (
        <DoneSheet text={text} walkedMeters={pathLength(trace)} onRestart={reset} />
      )}
    </div>
  );
}
