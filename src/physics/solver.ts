import { HU, formatCurrentHu } from '../i18n/hu';
import { COMPONENT_REGISTRY, WIRE_RESISTANCE } from './components';
import type {
  CircuitComponent,
  CircuitSolution,
  CircuitStatus,
  TerminalRef,
  Wire,
} from './types';

export const LEAK_CONDUCTANCE = 1e-6;
export const BULB_LIT_THRESHOLD_A = 0.03;
export const SHORT_CIRCUIT_THRESHOLD_A = 1.5;

export function terminalKey(ref: TerminalRef): string {
  return `${ref.componentId}:${ref.terminalIndex}`;
}

/**
 * Solves Ax = b in place using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  if (n === 0) return [];

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(A[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(A[row][col]);
      if (val > maxAbs) {
        maxAbs = val;
        pivotRow = row;
      }
    }

    if (pivotRow !== col) {
      const tmpRow = A[col];
      A[col] = A[pivotRow];
      A[pivotRow] = tmpRow;
      const tmpB = b[col];
      b[col] = b[pivotRow];
      b[pivotRow] = tmpB;
    }

    const pivot = A[col][col];
    if (Math.abs(pivot) < 1e-14) {
      continue;
    }

    for (let row = col + 1; row < n; row++) {
      const factor = A[row][col] / pivot;
      if (factor === 0) continue;
      for (let k = col; k < n; k++) {
        A[row][k] -= factor * A[col][k];
      }
      b[row] -= factor * b[col];
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = b[row];
    for (let col = row + 1; col < n; col++) {
      sum -= A[row][col] * x[col];
    }
    const diag = A[row][row];
    x[row] = Math.abs(diag) > 1e-14 ? sum / diag : 0;
  }

  return x;
}

export function solveCircuit(
  components: CircuitComponent[],
  wires: Wire[]
): CircuitSolution {
  if (components.length === 0) {
    return {
      nodeVoltages: {},
      componentCurrents: {},
      wireCurrents: {},
      bulbBrightness: {},
      litBulbIds: [],
      shortedBatteryIds: [],
      isShortCircuit: false,
      maxBatteryCurrent: 0,
    };
  }

  const keyToIndex = new Map<string, number>();
  const indexToKey: string[] = [];

  for (const comp of components) {
    const k0 = terminalKey({ componentId: comp.id, terminalIndex: 0 });
    const k1 = terminalKey({ componentId: comp.id, terminalIndex: 1 });
    keyToIndex.set(k0, indexToKey.length);
    indexToKey.push(k0);
    keyToIndex.set(k1, indexToKey.length);
    indexToKey.push(k1);
  }

  const n = indexToKey.length;
  const G: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const I: number[] = new Array<number>(n).fill(0);

  // Small leak conductance to ground on every node to avoid singular matrices on floating subcircuits.
  for (let i = 0; i < n; i++) {
    G[i][i] += LEAK_CONDUCTANCE;
  }

  const addConductance = (nodeA: number, nodeB: number, g: number) => {
    G[nodeA][nodeA] += g;
    G[nodeB][nodeB] += g;
    G[nodeA][nodeB] -= g;
    G[nodeB][nodeA] -= g;
  };

  const addCurrentSource = (fromNode: number, toNode: number, current: number) => {
    I[fromNode] -= current;
    I[toNode] += current;
  };

  for (const comp of components) {
    const def = COMPONENT_REGISTRY[comp.type];
    const node0 = keyToIndex.get(terminalKey({ componentId: comp.id, terminalIndex: 0 }));
    const node1 = keyToIndex.get(terminalKey({ componentId: comp.id, terminalIndex: 1 }));
    if (node0 === undefined || node1 === undefined) continue;

    def.stamp({
      node0,
      node1,
      props: comp.props,
      addConductance,
      addCurrentSource,
    });
  }

  const gWire = 1 / WIRE_RESISTANCE;
  for (const wire of wires) {
    const nodeA = keyToIndex.get(terminalKey(wire.from));
    const nodeB = keyToIndex.get(terminalKey(wire.to));
    if (nodeA === undefined || nodeB === undefined || nodeA === nodeB) continue;
    addConductance(nodeA, nodeB, gWire);
  }

  const voltages = solveLinearSystem(G, I);

  const nodeVoltages: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    nodeVoltages[indexToKey[i]] = voltages[i];
  }

  const componentCurrents: Record<string, number> = {};
  const bulbBrightness: Record<string, number> = {};
  const litBulbIds: string[] = [];
  const shortedBatteryIds: string[] = [];
  let maxBatteryCurrent = 0;

  for (const comp of components) {
    const def = COMPONENT_REGISTRY[comp.type];
    const v0 = nodeVoltages[terminalKey({ componentId: comp.id, terminalIndex: 0 })] ?? 0;
    const v1 = nodeVoltages[terminalKey({ componentId: comp.id, terminalIndex: 1 })] ?? 0;
    const current = def.computeBranchCurrent(v0, v1, comp.props);
    componentCurrents[comp.id] = current;

    if (comp.type === 'bulb') {
      const absI = Math.abs(current);
      if (absI > BULB_LIT_THRESHOLD_A) {
        const brightness = Math.min(1.4, Math.pow(absI / 0.3, 2));
        bulbBrightness[comp.id] = brightness;
        litBulbIds.push(comp.id);
      } else {
        bulbBrightness[comp.id] = 0;
      }
    }

    if (comp.type === 'battery') {
      const absI = Math.abs(current);
      if (absI > maxBatteryCurrent) {
        maxBatteryCurrent = absI;
      }
      if (absI > SHORT_CIRCUIT_THRESHOLD_A) {
        shortedBatteryIds.push(comp.id);
      }
    }
  }

  const wireCurrents: Record<string, number> = {};
  for (const wire of wires) {
    const vA = nodeVoltages[terminalKey(wire.from)] ?? 0;
    const vB = nodeVoltages[terminalKey(wire.to)] ?? 0;
    wireCurrents[wire.id] = (vA - vB) / WIRE_RESISTANCE;
  }

  return {
    nodeVoltages,
    componentCurrents,
    wireCurrents,
    bulbBrightness,
    litBulbIds,
    shortedBatteryIds,
    isShortCircuit: shortedBatteryIds.length > 0,
    maxBatteryCurrent,
  };
}

export function evaluateCircuitStatus(
  components: CircuitComponent[],
  wires: Wire[],
  solution: CircuitSolution
): CircuitStatus {
  const batteries = components.filter((c) => c.type === 'battery');
  if (batteries.length === 0) {
    return {
      kind: 'no_battery',
      message: HU.status.noBattery,
    };
  }

  if (solution.isShortCircuit) {
    return {
      kind: 'short_circuit',
      message: HU.status.shortCircuit(formatCurrentHu(solution.maxBatteryCurrent, 2)),
    };
  }

  if (solution.maxBatteryCurrent > BULB_LIT_THRESHOLD_A) {
    const formatted = formatCurrentHu(solution.maxBatteryCurrent, 2);
    const litCount = solution.litBulbIds.length;
    if (litCount === 1) {
      return {
        kind: 'closed',
        message: HU.status.closedSingleBulb(formatted),
      };
    }
    if (litCount > 1) {
      return {
        kind: 'closed',
        message: HU.status.closedMultipleBulbs(formatted, litCount),
      };
    }
    return {
      kind: 'closed',
      message: HU.status.closedNoBulb(formatted),
    };
  }

  // Check if closing open switches would close the circuit.
  const hasOpenSwitch = components.some(
    (c) => c.type === 'switch' && !c.props.closed
  );
  if (hasOpenSwitch) {
    const allClosedComponents = components.map((c) =>
      c.type === 'switch' ? { ...c, props: { ...c.props, closed: true } } : c
    );
    const hypothetical = solveCircuit(allClosedComponents, wires);
    if (hypothetical.maxBatteryCurrent > BULB_LIT_THRESHOLD_A) {
      return {
        kind: 'switch_open',
        message: HU.status.switchOpen,
      };
    }
  }

  return {
    kind: 'open',
    message: HU.status.openCircuit,
  };
}
