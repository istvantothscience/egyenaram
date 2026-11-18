import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  computeWirePolyline,
  findTerminalPos,
  getComponentInternalPolyline,
  polylineLength,
  samplePolylineAt,
} from '../physics/geometry';
import type { CircuitComponent, CircuitSolution, Point, Wire } from '../physics/types';

interface ParticlesLayerProps {
  components: CircuitComponent[];
  wires: Wire[];
  solution: CircuitSolution;
  showElectrons: boolean;
  showConventional: boolean;
}

interface ConductorPath {
  id: string;
  points: Point[];
  length: number;
  current: number;
}

const ELECTRON_SPACING = 24;
const ARROW_SPACING = 64;
const ACTIVE_CURRENT_THRESHOLD = 0.005;

function computeParticleSpeed(absCurrent: number): number {
  if (absCurrent < ACTIVE_CURRENT_THRESHOLD) return 0;
  return Math.min(30 + 260 * absCurrent, 220);
}

function positiveMod(value: number, mod: number): number {
  return ((value % mod) + mod) % mod;
}

export const ParticlesLayer: React.FC<ParticlesLayerProps> = ({
  components,
  wires,
  solution,
  showElectrons,
  showConventional,
}) => {
  const paths = useMemo<ConductorPath[]>(() => {
    const list: ConductorPath[] = [];

    for (const wire of wires) {
      const p1 = findTerminalPos(components, wire.from);
      const p2 = findTerminalPos(components, wire.to);
      if (!p1 || !p2) continue;
      const isSameComp = wire.from.componentId === wire.to.componentId;
      const points = computeWirePolyline(p1, p2, wire.elbowDir, isSameComp);
      const length = polylineLength(points);
      if (length < 1) continue;
      list.push({
        id: wire.id,
        points,
        length,
        current: solution.wireCurrents[wire.id] ?? 0,
      });
    }

    for (const comp of components) {
      if (comp.type === 'switch' && !comp.props.closed) continue;
      if (comp.type === 'voltmeter') continue;
      const points = getComponentInternalPolyline(comp);
      const length = polylineLength(points);
      if (length < 1) continue;
      list.push({
        id: comp.id,
        points,
        length,
        current: solution.componentCurrents[comp.id] ?? 0,
      });
    }

    return list;
  }, [components, wires, solution]);

  const anyFlowing = useMemo(
    () => paths.some((p) => Math.abs(p.current) >= ACTIVE_CURRENT_THRESHOLD),
    [paths]
  );

  const phasesRef = useRef<Map<string, number>>(new Map());
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!anyFlowing || (!showElectrons && !showConventional)) {
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      for (const path of paths) {
        const absI = Math.abs(path.current);
        const speed = computeParticleSpeed(absI);
        if (speed <= 0) continue;
        const dir = path.current >= 0 ? 1 : -1;
        const prev = phasesRef.current.get(path.id) ?? 0;
        phasesRef.current.set(path.id, prev + dir * speed * dt);
      }

      setTick((t) => (t + 1) % 1000000);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [anyFlowing, paths, showElectrons, showConventional]);

  if (!showElectrons && !showConventional) {
    return null;
  }

  const electronDots: React.ReactNode[] = [];
  const conventionalArrows: React.ReactNode[] = [];

  for (const path of paths) {
    const convPhase = phasesRef.current.get(path.id) ?? 0;
    const absI = Math.abs(path.current);
    const isFlowing = absI >= ACTIVE_CURRENT_THRESHOLD;

    if (showElectrons) {
      // Electrons move opposite to conventional current (- -> + externally)
      const electronOffset = positiveMod(-convPhase, ELECTRON_SPACING);
      for (let d = electronOffset; d < path.length - 1; d += ELECTRON_SPACING) {
        const sample = samplePolylineAt(path.points, d);
        if (!sample) continue;
        electronDots.push(
          <circle
            key={`e-${path.id}-${Math.round(d * 10)}`}
            cx={sample.x}
            cy={sample.y}
            r={3.6}
            fill="#4cc9f0"
            fillOpacity={isFlowing ? 0.95 : 0.5}
            stroke="#0b1020"
            strokeWidth={0.8}
          />
        );
      }
    }

    if (showConventional && isFlowing) {
      const arrowDirAngleOffset = path.current >= 0 ? 0 : 180;
      const arrowOffset = positiveMod(convPhase, ARROW_SPACING);
      for (let d = arrowOffset; d < path.length - 2; d += ARROW_SPACING) {
        const sample = samplePolylineAt(path.points, d);
        if (!sample) continue;
        const angle = sample.angleDeg + arrowDirAngleOffset;
        conventionalArrows.push(
          <polygon
            key={`c-${path.id}-${Math.round(d * 10)}`}
            points="-6,-4.5 7,0 -6,4.5"
            fill="#ffb703"
            stroke="#0b1020"
            strokeWidth={0.9}
            transform={`translate(${sample.x}, ${sample.y}) rotate(${angle})`}
          />
        );
      }
    }
  }

  return (
    <g data-layer="particles" pointerEvents="none">
      {electronDots}
      {conventionalArrows}
    </g>
  );
};
