import { useState } from 'react';
import type { RoutePlan } from '../types';
import { simPauseToggle, simSetMultiplier, simStart, simToggleDrift } from './simulator';

/** ?sim=1 のときだけ表示されるGPSシミュレータ操作バー(開発用) */
export function SimBar({ plan }: { plan: RoutePlan | null }) {
  const [running, setRunning] = useState(false);
  const [mult, setMult] = useState(5);
  const [drift, setDrift] = useState(false);

  return (
    <div className="sim-bar">
      <span>SIM</span>
      <button
        disabled={!plan}
        onClick={() => {
          if (!running && plan) {
            simStart(plan.navPoints);
            setRunning(true);
          } else {
            setRunning(simPauseToggle());
          }
        }}
      >
        {running ? '⏸' : '▶'}
      </button>
      <select
        value={mult}
        onChange={(e) => {
          const x = Number(e.target.value);
          setMult(x);
          simSetMultiplier(x);
        }}
      >
        {[1, 5, 10, 20].map((x) => (
          <option key={x} value={x}>
            {x}×
          </option>
        ))}
      </select>
      <button
        className={drift ? 'active' : ''}
        onClick={() => setDrift(simToggleDrift())}
      >
        逸脱
      </button>
    </div>
  );
}
