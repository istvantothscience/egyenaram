import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MISSIONS,
  checkMission3Circuit,
  checkMission4Circuit,
  type FaultId,
} from '../missions/missions';
import { COMPONENT_REGISTRY } from '../physics/components';
import {
  clampComponentPosition,
  findFirstFreeSlot,
  sameTerminal,
  wireConnectsTerminals,
} from '../physics/geometry';
import { evaluateCircuitStatus, solveCircuit } from '../physics/solver';
import type {
  CircuitComponent,
  ComponentProps,
  ComponentType,
  Rotation,
  Selection,
  TerminalRef,
  ViewMode,
  Wire,
} from '../physics/types';

function nextId(prefix: string, counterRef: React.MutableRefObject<number>): string {
  counterRef.current += 1;
  return `${prefix}-${counterRef.current}`;
}

export function useCircuitStore() {
  const idCounter = useRef(0);

  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('real');
  const [showElectrons, setShowElectrons] = useState<boolean>(true);
  const [showConventional, setShowConventional] = useState<boolean>(false);

  // Mission tracking state (kept strictly in memory, never localStorage)
  const [activeMissionId, setActiveMissionId] = useState<string>('m1');
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Behavioral milestones for dynamic missions
  const [m2SawOff, setM2SawOff] = useState<boolean>(false);
  const [m2SawOn, setM2SawOn] = useState<boolean>(false);
  const [m3CircuitVerified, setM3CircuitVerified] = useState<boolean>(false);
  const [m4CircuitVerified, setM4CircuitVerified] = useState<boolean>(false);
  const [m5ActiveFaultId, setM5ActiveFaultId] = useState<FaultId | null>(null);
  const [m5FixedFaults, setM5FixedFaults] = useState<FaultId[]>([]);
  const [m6SawShortCircuit, setM6SawShortCircuit] = useState<boolean>(false);

  const prevLitWithSwitchRef = useRef<number | null>(null);

  const solution = useMemo(() => solveCircuit(components, wires), [components, wires]);
  const status = useMemo(
    () => evaluateCircuitStatus(components, wires, solution),
    [components, wires, solution]
  );

  // Track mission milestones and auto-completion
  useEffect(() => {
    const hasSwitch = components.some((c) => c.type === 'switch');
    const litCount = solution.litBulbIds.length;

    if (hasSwitch && !solution.isShortCircuit) {
      const prev = prevLitWithSwitchRef.current;
      if (prev !== null) {
        if (prev > 0 && litCount === 0) {
          setM2SawOff(true);
        } else if (prev === 0 && litCount > 0) {
          setM2SawOn(true);
        }
      }
      prevLitWithSwitchRef.current = litCount;
    } else {
      prevLitWithSwitchRef.current = null;
    }

    if (solution.isShortCircuit) {
      setM6SawShortCircuit(true);
    }

    if (
      m5ActiveFaultId &&
      !solution.isShortCircuit &&
      litCount >= 1 &&
      !m5FixedFaults.includes(m5ActiveFaultId)
    ) {
      setM5FixedFaults((prev) =>
        prev.includes(m5ActiveFaultId) ? prev : [...prev, m5ActiveFaultId]
      );
    }
  }, [components, solution, m5ActiveFaultId, m5FixedFaults]);

  const missionContext = useMemo(
    () => ({
      components,
      wires,
      solution,
      showElectrons,
      showConventional,
      m2SawOff,
      m2SawOn,
      m3CircuitVerified,
      m4CircuitVerified,
      m5FixedFaults,
      m6SawShortCircuit,
      quizAnswers,
    }),
    [
      components,
      wires,
      solution,
      showElectrons,
      showConventional,
      m2SawOff,
      m2SawOn,
      m3CircuitVerified,
      m4CircuitVerified,
      m5FixedFaults,
      m6SawShortCircuit,
      quizAnswers,
    ]
  );

  // Sticky verification flags for quiz-gated missions (M3 & M4)
  useEffect(() => {
    if (!m3CircuitVerified && checkMission3Circuit(missionContext)) {
      setM3CircuitVerified(true);
    }
    if (!m4CircuitVerified && checkMission4Circuit(missionContext)) {
      setM4CircuitVerified(true);
    }
  }, [missionContext, m3CircuitVerified, m4CircuitVerified]);

  // Auto-detect mission completions
  useEffect(() => {
    setCompletedMissions((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const m of MISSIONS) {
        if (!next[m.id] && m.isCompleted(missionContext)) {
          next[m.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [missionContext]);

  const addComponent = useCallback(
    (type: ComponentType) => {
      const def = COMPONENT_REGISTRY[type];
      const slot = findFirstFreeSlot(components);
      const id = nextId(type, idCounter);
      const created: CircuitComponent = {
        id,
        type,
        x: slot.x,
        y: slot.y,
        rotation: 0,
        props: { ...def.defaultProps },
      };
      setComponents((prev) => [...prev, created]);
      setSelection({ kind: 'component', id });
    },
    [components]
  );

  const moveComponent = useCallback((id: string, rawX: number, rawY: number) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const clamped = clampComponentPosition(rawX, rawY, c.rotation);
        if (clamped.x === c.x && clamped.y === c.y) return c;
        return { ...c, x: clamped.x, y: clamped.y };
      })
    );
  }, []);

  const rotateComponent = useCallback((id: string) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextRot = (((c.rotation + 90) % 360) as Rotation);
        const clamped = clampComponentPosition(c.x, c.y, nextRot);
        return { ...c, rotation: nextRot, x: clamped.x, y: clamped.y };
      })
    );
  }, []);

  const rotateSelected = useCallback(() => {
    if (selection?.kind === 'component') {
      rotateComponent(selection.id);
    }
  }, [selection, rotateComponent]);

  const deleteSelected = useCallback(() => {
    if (!selection) return;
    if (selection.kind === 'component') {
      const targetId = selection.id;
      setComponents((prev) => prev.filter((c) => c.id !== targetId));
      setWires((prev) =>
        prev.filter(
          (w) => w.from.componentId !== targetId && w.to.componentId !== targetId
        )
      );
      setSelection(null);
    } else if (selection.kind === 'wire') {
      const targetId = selection.id;
      setWires((prev) => prev.filter((w) => w.id !== targetId));
      setSelection(null);
    }
  }, [selection]);

  const clearBoard = useCallback(() => {
    setComponents([]);
    setWires([]);
    setSelection(null);
    setM5ActiveFaultId(null);
  }, []);

  const toggleSwitch = useCallback((id: string) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.type !== 'switch') return c;
        return {
          ...c,
          props: { ...c.props, closed: !c.props.closed },
        };
      })
    );
  }, []);

  const updateComponentProps = useCallback(
    (id: string, patch: Partial<ComponentProps>) => {
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          return { ...c, props: { ...c.props, ...patch } };
        })
      );
    },
    []
  );

  const addWire = useCallback((from: TerminalRef, to: TerminalRef) => {
    if (sameTerminal(from, to)) return;
    setWires((prev) => {
      if (prev.some((w) => wireConnectsTerminals(w, from, to))) {
        return prev;
      }
      const id = nextId('wire', idCounter);
      return [...prev, { id, from, to, elbowDir: 'hv' }];
    });
  }, []);

  const toggleWireElbow = useCallback((id: string) => {
    setWires((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, elbowDir: w.elbowDir === 'hv' ? 'vh' : 'hv' }
          : w
      )
    );
  }, []);

  const loadFaultPreset = useCallback(
    (faultId: FaultId, presetComponents: CircuitComponent[], presetWires: Wire[]) => {
      setComponents(presetComponents.map((c) => ({ ...c, props: { ...c.props } })));
      setWires(presetWires.map((w) => ({ ...w, from: { ...w.from }, to: { ...w.to } })));
      setSelection(null);
      setM5ActiveFaultId(faultId);
      setActiveMissionId('m5');
    },
    []
  );

  const revealNextHint = useCallback((missionId: string) => {
    setHintLevels((prev) => {
      const current = prev[missionId] ?? 0;
      if (current >= 2) return prev;
      return { ...prev, [missionId]: current + 1 };
    });
  }, []);

  const selectQuizOption = useCallback((missionId: string, optionId: string) => {
    setQuizAnswers((prev) => ({ ...prev, [missionId]: optionId }));
  }, []);

  const resetMissionProgress = useCallback(() => {
    setCompletedMissions({});
    setHintLevels({});
    setQuizAnswers({});
    setM2SawOff(false);
    setM2SawOn(false);
    setM3CircuitVerified(false);
    setM4CircuitVerified(false);
    setM5FixedFaults([]);
    setM5ActiveFaultId(null);
    setM6SawShortCircuit(false);
    setActiveMissionId('m1');
  }, []);

  return {
    components,
    wires,
    selection,
    viewMode,
    showElectrons,
    showConventional,
    solution,
    status,
    activeMissionId,
    completedMissions,
    hintLevels,
    quizAnswers,
    m5ActiveFaultId,
    m5FixedFaults,
    missionContext,
    setSelection,
    setViewMode,
    setShowElectrons,
    setShowConventional,
    setActiveMissionId,
    addComponent,
    moveComponent,
    rotateSelected,
    deleteSelected,
    clearBoard,
    toggleSwitch,
    updateComponentProps,
    addWire,
    toggleWireElbow,
    loadFaultPreset,
    revealNextHint,
    selectQuizOption,
    resetMissionProgress,
  };
}
