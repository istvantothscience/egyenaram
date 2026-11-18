export type ComponentType = 'battery' | 'bulb' | 'switch' | 'ammeter' | 'voltmeter';

export type Rotation = 0 | 90 | 180 | 270;

export type ViewMode = 'real' | 'schematic';

export type ElbowDir = 'hv' | 'vh';

export interface ComponentProps {
  voltage?: number;
  internalResistance?: number;
  resistance?: number;
  closed?: boolean;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: Rotation;
  props: ComponentProps;
}

export interface TerminalRef {
  componentId: string;
  terminalIndex: 0 | 1;
}

export interface Wire {
  id: string;
  from: TerminalRef;
  to: TerminalRef;
  elbowDir: ElbowDir;
}

export type Selection =
  | { kind: 'component'; id: string }
  | { kind: 'wire'; id: string }
  | null;

export interface Point {
  x: number;
  y: number;
}

export interface CircuitSolution {
  nodeVoltages: Record<string, number>;
  componentCurrents: Record<string, number>;
  wireCurrents: Record<string, number>;
  bulbBrightness: Record<string, number>;
  litBulbIds: string[];
  shortedBatteryIds: string[];
  isShortCircuit: boolean;
  maxBatteryCurrent: number;
}

export type StatusKind = 'no_battery' | 'short_circuit' | 'closed' | 'switch_open' | 'open';

export interface CircuitStatus {
  kind: StatusKind;
  message: string;
}
