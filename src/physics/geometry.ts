import type { CircuitComponent, ElbowDir, Point, Rotation, TerminalRef, Wire } from './types';

export const BOARD_WIDTH = 900;
export const BOARD_HEIGHT = 560;
export const GRID_SIZE = 20;
export const TERMINAL_OFFSET = 60;
export const WIRE_SNAP_RADIUS = 26;

export const PREDEFINED_SLOTS: Point[] = [
  { x: 220, y: 140 },
  { x: 460, y: 140 },
  { x: 700, y: 140 },
  { x: 220, y: 280 },
  { x: 460, y: 280 },
  { x: 700, y: 280 },
  { x: 220, y: 420 },
  { x: 460, y: 420 },
  { x: 700, y: 420 },
  { x: 340, y: 200 },
  { x: 580, y: 200 },
  { x: 340, y: 360 },
  { x: 580, y: 360 },
  { x: 160, y: 200 },
  { x: 740, y: 200 },
  { x: 160, y: 360 },
  { x: 740, y: 360 },
];

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function clampComponentPosition(x: number, y: number, rotation: Rotation): Point {
  const isHorizontal = rotation === 0 || rotation === 180;
  const minX = isHorizontal ? 80 : 40;
  const maxX = isHorizontal ? BOARD_WIDTH - 80 : BOARD_WIDTH - 40;
  const minY = isHorizontal ? 40 : 80;
  const maxY = isHorizontal ? BOARD_HEIGHT - 40 : BOARD_HEIGHT - 80;

  return {
    x: Math.max(minX, Math.min(maxX, snapToGrid(x))),
    y: Math.max(minY, Math.min(maxY, snapToGrid(y))),
  };
}

export function rotatePoint(px: number, py: number, rotation: Rotation): Point {
  switch (rotation) {
    case 0:
      return { x: px, y: py };
    case 90:
      return { x: -py, y: px };
    case 180:
      return { x: -px, y: -py };
    case 270:
      return { x: py, y: -px };
  }
}

export function getTerminalWorldPos(
  component: CircuitComponent,
  terminalIndex: 0 | 1
): Point {
  const localX = terminalIndex === 0 ? -TERMINAL_OFFSET : TERMINAL_OFFSET;
  const rotated = rotatePoint(localX, 0, component.rotation);
  return {
    x: component.x + rotated.x,
    y: component.y + rotated.y,
  };
}

export function getComponentInternalPolyline(component: CircuitComponent): Point[] {
  return [
    getTerminalWorldPos(component, 0),
    getTerminalWorldPos(component, 1),
  ];
}

export function findTerminalPos(
  components: CircuitComponent[],
  ref: TerminalRef
): Point | null {
  const comp = components.find((c) => c.id === ref.componentId);
  if (!comp) return null;
  return getTerminalWorldPos(comp, ref.terminalIndex);
}

export function computeWirePolyline(
  p1: Point,
  p2: Point,
  elbowDir: ElbowDir,
  isSameComponent: boolean
): Point[] {
  if (isSameComponent) {
    // Route a U-shaped detour beside the component so it stays clearly visible.
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    const sign = elbowDir === 'hv' ? 1 : -1;
    nx *= sign;
    ny *= sign;

    const offset = 60;
    let c1x = p1.x + nx * offset;
    let c1y = p1.y + ny * offset;
    let c2x = p2.x + nx * offset;
    let c2y = p2.y + ny * offset;

    // Flip side automatically if detour would leave the workspace bounds.
    if (
      c1x < 20 ||
      c1x > BOARD_WIDTH - 20 ||
      c1y < 20 ||
      c1y > BOARD_HEIGHT - 20
    ) {
      nx = -nx;
      ny = -ny;
      c1x = p1.x + nx * offset;
      c1y = p1.y + ny * offset;
      c2x = p2.x + nx * offset;
      c2y = p2.y + ny * offset;
    }

    return [p1, { x: c1x, y: c1y }, { x: c2x, y: c2y }, p2];
  }

  if (Math.abs(p1.x - p2.x) < 0.5 || Math.abs(p1.y - p2.y) < 0.5) {
    return [p1, p2];
  }

  if (elbowDir === 'hv') {
    return [p1, { x: p2.x, y: p1.y }, p2];
  }
  return [p1, { x: p1.x, y: p2.y }, p2];
}

export function polylineToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function samplePolylineAt(
  points: Point[],
  distance: number
): { x: number; y: number; angleDeg: number } | null {
  if (points.length < 2) return null;
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (segLen < 1e-6) continue;
    if (remaining <= segLen || i === points.length - 1) {
      const t = Math.max(0, Math.min(1, remaining / segLen));
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angleDeg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    remaining -= segLen;
  }
  return null;
}

export function findFirstFreeSlot(components: CircuitComponent[]): Point {
  for (const slot of PREDEFINED_SLOTS) {
    const occupied = components.some(
      (c) => Math.abs(c.x - slot.x) < 110 && Math.abs(c.y - slot.y) < 70
    );
    if (!occupied) {
      return slot;
    }
  }
  const idx = components.length % 7;
  return clampComponentPosition(160 + idx * 40, 120 + idx * 40, 0);
}

export function sameTerminal(a: TerminalRef, b: TerminalRef): boolean {
  return a.componentId === b.componentId && a.terminalIndex === b.terminalIndex;
}

export function wireConnectsTerminals(wire: Wire, a: TerminalRef, b: TerminalRef): boolean {
  return (
    (sameTerminal(wire.from, a) && sameTerminal(wire.to, b)) ||
    (sameTerminal(wire.from, b) && sameTerminal(wire.to, a))
  );
}
