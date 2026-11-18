import React, { useCallback, useMemo, useRef, useState } from 'react';
import { HU } from '../i18n/hu';
import { COMPONENT_REGISTRY } from '../physics/components';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  GRID_SIZE,
  WIRE_SNAP_RADIUS,
  computeWirePolyline,
  findTerminalPos,
  getTerminalWorldPos,
  polylineToSvgPath,
  sameTerminal,
  wireConnectsTerminals,
} from '../physics/geometry';
import { terminalKey } from '../physics/solver';
import type {
  CircuitComponent,
  CircuitSolution,
  Point,
  Selection,
  TerminalRef,
  ViewMode,
  Wire,
} from '../physics/types';
import { ParticlesLayer } from './ParticlesLayer';

interface BoardProps {
  components: CircuitComponent[];
  wires: Wire[];
  selection: Selection;
  viewMode: ViewMode;
  showElectrons: boolean;
  showConventional: boolean;
  solution: CircuitSolution;
  onSelect: (sel: Selection) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onToggleSwitch: (id: string) => void;
  onAddWire: (from: TerminalRef, to: TerminalRef) => void;
  onToggleWireElbow: (id: string) => void;
}

type DragState =
  | {
      kind: 'component';
      id: string;
      startClient: Point;
      startCompPos: Point;
      offset: Point;
      moved: boolean;
    }
  | {
      kind: 'wire';
      from: TerminalRef;
      fromPos: Point;
      cursor: Point;
      hoveredTarget: TerminalRef | null;
    }
  | null;

const GRID_XS = Array.from(
  { length: Math.floor(BOARD_WIDTH / GRID_SIZE) - 1 },
  (_, i) => (i + 1) * GRID_SIZE
);
const GRID_YS = Array.from(
  { length: Math.floor(BOARD_HEIGHT / GRID_SIZE) - 1 },
  (_, i) => (i + 1) * GRID_SIZE
);

export const Board: React.FC<BoardProps> = ({
  components,
  wires,
  selection,
  viewMode,
  showElectrons,
  showConventional,
  solution,
  onSelect,
  onMoveComponent,
  onToggleSwitch,
  onAddWire,
  onToggleWireElbow,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);

  const clientToSvg = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * BOARD_WIDTH,
      y: ((clientY - rect.top) / rect.height) * BOARD_HEIGHT,
    };
  }, []);

  const allTerminals = useMemo(() => {
    const list: Array<{ ref: TerminalRef; pos: Point }> = [];
    for (const comp of components) {
      list.push({
        ref: { componentId: comp.id, terminalIndex: 0 },
        pos: getTerminalWorldPos(comp, 0),
      });
      list.push({
        ref: { componentId: comp.id, terminalIndex: 1 },
        pos: getTerminalWorldPos(comp, 1),
      });
    }
    return list;
  }, [components]);

  const findSnapTarget = useCallback(
    (from: TerminalRef, cursor: Point): TerminalRef | null => {
      let best: TerminalRef | null = null;
      let bestDist = WIRE_SNAP_RADIUS;

      for (const item of allTerminals) {
        if (sameTerminal(from, item.ref)) continue;
        if (wires.some((w) => wireConnectsTerminals(w, from, item.ref))) continue;
        const d = Math.hypot(cursor.x - item.pos.x, cursor.y - item.pos.y);
        if (d <= bestDist) {
          bestDist = d;
          best = item.ref;
        }
      }
      return best;
    },
    [allTerminals, wires]
  );

  const handleBoardPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element | null;
    if (target === svgRef.current || target?.getAttribute('data-bg') === 'true') {
      onSelect(null);
    }
  };

  const handleComponentPointerDown = (
    e: React.PointerEvent<SVGGElement>,
    comp: CircuitComponent
  ) => {
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    const pt = clientToSvg(e.clientX, e.clientY);
    onSelect({ kind: 'component', id: comp.id });
    setDragState({
      kind: 'component',
      id: comp.id,
      startClient: pt,
      startCompPos: { x: comp.x, y: comp.y },
      offset: { x: pt.x - comp.x, y: pt.y - comp.y },
      moved: false,
    });
  };

  const handleTerminalPointerDown = (
    e: React.PointerEvent<SVGCircleElement>,
    ref: TerminalRef,
    pos: Point
  ) => {
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    const pt = clientToSvg(e.clientX, e.clientY);
    setDragState({
      kind: 'wire',
      from: ref,
      fromPos: pos,
      cursor: pt,
      hoveredTarget: findSnapTarget(ref, pt),
    });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;
    const pt = clientToSvg(e.clientX, e.clientY);

    if (dragState.kind === 'component') {
      const dist = Math.hypot(
        pt.x - dragState.startClient.x,
        pt.y - dragState.startClient.y
      );
      if (dist > 5 || dragState.moved) {
        onMoveComponent(
          dragState.id,
          pt.x - dragState.offset.x,
          pt.y - dragState.offset.y
        );
        if (!dragState.moved) {
          setDragState({ ...dragState, moved: true });
        }
      }
    } else if (dragState.kind === 'wire') {
      const hoveredTarget = findSnapTarget(dragState.from, pt);
      setDragState({
        ...dragState,
        cursor: pt,
        hoveredTarget,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;
    if (svgRef.current?.hasPointerCapture?.(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }

    if (dragState.kind === 'component') {
      if (!dragState.moved) {
        const comp = components.find((c) => c.id === dragState.id);
        if (comp?.type === 'switch') {
          onToggleSwitch(comp.id);
        }
      }
    } else if (dragState.kind === 'wire') {
      if (dragState.hoveredTarget) {
        onAddWire(dragState.from, dragState.hoveredTarget);
      }
    }
    setDragState(null);
  };

  const handleWireClick = (e: React.MouseEvent<SVGGElement>, wireId: string) => {
    e.stopPropagation();
    if (selection?.kind === 'wire' && selection.id === wireId) {
      onToggleWireElbow(wireId);
    } else {
      onSelect({ kind: 'wire', id: wireId });
    }
  };

  const previewWirePath = useMemo(() => {
    if (dragState?.kind !== 'wire') return null;
    const endPos = dragState.hoveredTarget
      ? findTerminalPos(components, dragState.hoveredTarget) ?? dragState.cursor
      : dragState.cursor;
    const isSameComp =
      dragState.hoveredTarget !== null &&
      dragState.hoveredTarget.componentId === dragState.from.componentId;
    const points = computeWirePolyline(
      dragState.fromPos,
      endPos,
      'hv',
      isSameComp
    );
    return polylineToSvgPath(points);
  }, [dragState, components]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#2b3a6e] bg-[#0b1020] shadow-inner">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        className="block w-full h-auto select-none"
        style={{ touchAction: 'none' }}
        role="img"
        aria-label={HU.board.ariaLabel}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Background fill */}
        <rect
          data-bg="true"
          x={0}
          y={0}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          fill="#0b1020"
        />

        {/* Layer 1: Grid (20-unit spacing) */}
        <g data-layer="grid" pointerEvents="none">
          <defs>
            <pattern
              id="lab-grid-pattern"
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={GRID_SIZE} cy={GRID_SIZE} r={1} fill="#253463" />
            </pattern>
          </defs>
          <rect
            x={0}
            y={0}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            fill="url(#lab-grid-pattern)"
          />
          {GRID_XS.filter((x) => x % 100 === 0).map((x) => (
            <line
              key={`gx-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={BOARD_HEIGHT}
              stroke="#162144"
              strokeWidth={1}
            />
          ))}
          {GRID_YS.filter((y) => y % 100 === 0).map((y) => (
            <line
              key={`gy-${y}`}
              x1={0}
              y1={y}
              x2={BOARD_WIDTH}
              y2={y}
              stroke="#162144"
              strokeWidth={1}
            />
          ))}
        </g>

        {/* Empty workspace hint */}
        {components.length === 0 && (
          <g pointerEvents="none">
            <text
              x={BOARD_WIDTH / 2}
              y={BOARD_HEIGHT / 2 - 12}
              textAnchor="middle"
              fill="#94a3b8"
              fillOpacity={0.75}
              fontSize={22}
              fontWeight={600}
            >
              {HU.board.emptyHint}
            </text>
            <text
              x={BOARD_WIDTH / 2}
              y={BOARD_HEIGHT / 2 + 18}
              textAnchor="middle"
              fill="#64748b"
              fillOpacity={0.85}
              fontSize={14}
            >
              {HU.board.emptySubHint}
            </text>
          </g>
        )}

        {/* Layer 2: Wires */}
        <g data-layer="wires">
          {wires.map((wire) => {
            const p1 = findTerminalPos(components, wire.from);
            const p2 = findTerminalPos(components, wire.to);
            if (!p1 || !p2) return null;
            const isSameComp = wire.from.componentId === wire.to.componentId;
            const d = polylineToSvgPath(
              computeWirePolyline(p1, p2, wire.elbowDir, isSameComp)
            );
            const isSelected =
              selection?.kind === 'wire' && selection.id === wire.id;
            const wireCurrent = Math.abs(solution.wireCurrents[wire.id] ?? 0);
            const isHotWire = solution.isShortCircuit && wireCurrent > 0.5;
            const strokeColor = isHotWire
              ? '#ff5d73'
              : isSelected
              ? '#4cc9f0'
              : '#7b93c9';

            return (
              <g
                key={wire.id}
                className="cursor-pointer"
                onClick={(e) => handleWireClick(e, wire.id)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Wide touch/click hit area */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {isSelected && (
                  <path
                    d={d}
                    fill="none"
                    stroke="#4cc9f0"
                    strokeOpacity={0.28}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 4.5 : 3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isHotWire ? 'animate-svg-flash' : undefined}
                />
              </g>
            );
          })}

          {previewWirePath && dragState?.kind === 'wire' && (
            <path
              d={previewWirePath}
              fill="none"
              stroke={dragState.hoveredTarget ? '#2ee59d' : '#4cc9f0'}
              strokeWidth={3}
              strokeDasharray="6 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
        </g>

        {/* Layer 3: Moving particles */}
        <ParticlesLayer
          components={components}
          wires={wires}
          solution={solution}
          showElectrons={showElectrons}
          showConventional={showConventional}
        />

        {/* Layer 4: Components */}
        <g data-layer="components">
          {components.map((comp) => {
            const def = COMPONENT_REGISTRY[comp.type];
            const SymbolComp =
              viewMode === 'real' ? def.RealSymbol : def.SchematicSymbol;
            const isSelected =
              selection?.kind === 'component' && selection.id === comp.id;
            const current = solution.componentCurrents[comp.id] ?? 0;
            const brightness = solution.bulbBrightness[comp.id] ?? 0;
            const isShort = solution.shortedBatteryIds.includes(comp.id);
            const v0 =
              solution.nodeVoltages[
                terminalKey({ componentId: comp.id, terminalIndex: 0 })
              ] ?? 0;
            const v1 =
              solution.nodeVoltages[
                terminalKey({ componentId: comp.id, terminalIndex: 1 })
              ] ?? 0;

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handleComponentPointerDown(e, comp)}
              >
                {isSelected && (
                  <rect
                    x={-52}
                    y={-36}
                    width={104}
                    height={72}
                    rx={12}
                    fill="none"
                    stroke="#4cc9f0"
                    strokeOpacity={0.55}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    pointerEvents="none"
                  />
                )}
                <SymbolComp
                  component={comp}
                  current={current}
                  brightness={brightness}
                  isShortCircuit={isShort}
                  isSelected={isSelected}
                  v0={v0}
                  v1={v1}
                />
              </g>
            );
          })}
        </g>

        {/* Layer 5: Terminal connection points (on top) */}
        <g data-layer="terminals">
          {allTerminals.map(({ ref, pos }) => {
            const isSnapTarget =
              dragState?.kind === 'wire' &&
              dragState.hoveredTarget !== null &&
              sameTerminal(dragState.hoveredTarget, ref);
            const isSource =
              dragState?.kind === 'wire' && sameTerminal(dragState.from, ref);

            return (
              <g key={terminalKey(ref)}>
                {/* Green snap ring when valid target */}
                {isSnapTarget && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={12}
                    fill="none"
                    stroke="#2ee59d"
                    strokeWidth={2.5}
                    pointerEvents="none"
                  />
                )}
                {/* Visible terminal point r=6 */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={6}
                  fill={
                    isSnapTarget
                      ? '#2ee59d'
                      : isSource
                      ? '#4cc9f0'
                      : '#121a33'
                  }
                  stroke={isSnapTarget ? '#2ee59d' : '#94a3b8'}
                  strokeWidth={2}
                  pointerEvents="none"
                />
                {/* Touch/mouse hit zone r=13 */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={13}
                  fill="transparent"
                  className="cursor-crosshair"
                  onPointerDown={(e) => handleTerminalPointerDown(e, ref, pos)}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
