import type React from 'react';
import { HU } from '../i18n/hu';
import { AmmeterRealSymbol, AmmeterSchematicSymbol } from '../ui/symbols/AmmeterSymbol';
import {
  BatteryRealSymbol,
  BatterySchematicSymbol,
  type SymbolRenderProps,
} from '../ui/symbols/BatterySymbol';
import { BulbRealSymbol, BulbSchematicSymbol } from '../ui/symbols/BulbSymbol';
import { SwitchRealSymbol, SwitchSchematicSymbol } from '../ui/symbols/SwitchSymbol';
import { VoltmeterRealSymbol, VoltmeterSchematicSymbol } from '../ui/symbols/VoltmeterSymbol';
import { TERMINAL_OFFSET } from './geometry';
import type { ComponentProps, ComponentType } from './types';

export const ENABLE_OHM_TOOLS = false;

export const WIRE_RESISTANCE = 0.01;

export interface TerminalDef {
  id: 0 | 1;
  x: number;
  y: number;
  label?: string;
}

export interface StampContext {
  node0: number;
  node1: number;
  props: ComponentProps;
  addConductance: (nodeA: number, nodeB: number, g: number) => void;
  addCurrentSource: (fromNode: number, toNode: number, current: number) => void;
}

export interface EditablePropDef {
  key: keyof ComponentProps;
  labelHu: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export interface ComponentDef {
  type: ComponentType;
  nameHu: string;
  terminals: [TerminalDef, TerminalDef];
  defaultProps: ComponentProps;
  showInPalette: boolean;
  editableProps?: EditablePropDef[];
  stamp: (ctx: StampContext) => void;
  computeBranchCurrent: (v0: number, v1: number, props: ComponentProps) => number;
  RealSymbol: React.FC<SymbolRenderProps>;
  SchematicSymbol: React.FC<SymbolRenderProps>;
}

function stampResistor(ctx: StampContext, resistance: number) {
  const safeR = Math.max(1e-4, resistance);
  ctx.addConductance(ctx.node0, ctx.node1, 1 / safeR);
}

function resistorBranchCurrent(v0: number, v1: number, resistance: number): number {
  const safeR = Math.max(1e-4, resistance);
  return (v0 - v1) / safeR;
}

export const COMPONENT_REGISTRY: Record<ComponentType, ComponentDef> = {
  battery: {
    type: 'battery',
    nameHu: HU.components.battery,
    terminals: [
      { id: 0, x: -TERMINAL_OFFSET, y: 0, label: '−' },
      { id: 1, x: TERMINAL_OFFSET, y: 0, label: '+' },
    ],
    defaultProps: {
      voltage: 4.5,
      internalResistance: 1,
    },
    showInPalette: true,
    editableProps: [
      {
        key: 'voltage',
        labelHu: 'Feszültség',
        unit: 'V',
        min: 1.5,
        max: 12,
        step: 0.5,
      },
      {
        key: 'internalResistance',
        labelHu: 'Belső ellenállás',
        unit: 'Ω',
        min: 0.5,
        max: 5,
        step: 0.5,
      },
    ],
    stamp: ({ node0, node1, props, addConductance, addCurrentSource }) => {
      const voltage = props.voltage ?? 4.5;
      const rInt = Math.max(1e-4, props.internalResistance ?? 1);
      const g = 1 / rInt;
      const iSource = voltage * g;
      addConductance(node0, node1, g);
      addCurrentSource(node0, node1, iSource);
    },
    computeBranchCurrent: (v0, v1, props) => {
      const voltage = props.voltage ?? 4.5;
      const rInt = Math.max(1e-4, props.internalResistance ?? 1);
      return (voltage - (v1 - v0)) / rInt;
    },
    RealSymbol: BatteryRealSymbol,
    SchematicSymbol: BatterySchematicSymbol,
  },

  bulb: {
    type: 'bulb',
    nameHu: HU.components.bulb,
    terminals: [
      { id: 0, x: -TERMINAL_OFFSET, y: 0 },
      { id: 1, x: TERMINAL_OFFSET, y: 0 },
    ],
    defaultProps: {
      resistance: 15,
    },
    showInPalette: true,
    editableProps: [
      {
        key: 'resistance',
        labelHu: 'Ellenállás',
        unit: 'Ω',
        min: 5,
        max: 100,
        step: 1,
      },
    ],
    stamp: (ctx) => {
      stampResistor(ctx, ctx.props.resistance ?? 15);
    },
    computeBranchCurrent: (v0, v1, props) => {
      return resistorBranchCurrent(v0, v1, props.resistance ?? 15);
    },
    RealSymbol: BulbRealSymbol,
    SchematicSymbol: BulbSchematicSymbol,
  },

  switch: {
    type: 'switch',
    nameHu: HU.components.switch,
    terminals: [
      { id: 0, x: -TERMINAL_OFFSET, y: 0 },
      { id: 1, x: TERMINAL_OFFSET, y: 0 },
    ],
    defaultProps: {
      closed: true,
      resistance: 0.01,
    },
    showInPalette: true,
    stamp: (ctx) => {
      if (ctx.props.closed) {
        stampResistor(ctx, ctx.props.resistance ?? 0.01);
      }
    },
    computeBranchCurrent: (v0, v1, props) => {
      if (!props.closed) return 0;
      return resistorBranchCurrent(v0, v1, props.resistance ?? 0.01);
    },
    RealSymbol: SwitchRealSymbol,
    SchematicSymbol: SwitchSchematicSymbol,
  },

  ammeter: {
    type: 'ammeter',
    nameHu: HU.components.ammeter,
    terminals: [
      { id: 0, x: -TERMINAL_OFFSET, y: 0 },
      { id: 1, x: TERMINAL_OFFSET, y: 0 },
    ],
    defaultProps: {
      resistance: 0.01,
    },
    showInPalette: true,
    stamp: (ctx) => {
      stampResistor(ctx, ctx.props.resistance ?? 0.01);
    },
    computeBranchCurrent: (v0, v1, props) => {
      return resistorBranchCurrent(v0, v1, props.resistance ?? 0.01);
    },
    RealSymbol: AmmeterRealSymbol,
    SchematicSymbol: AmmeterSchematicSymbol,
  },

  voltmeter: {
    type: 'voltmeter',
    nameHu: HU.components.voltmeter,
    terminals: [
      { id: 0, x: -TERMINAL_OFFSET, y: 0 },
      { id: 1, x: TERMINAL_OFFSET, y: 0 },
    ],
    defaultProps: {
      resistance: 1e7,
    },
    showInPalette: false,
    stamp: (ctx) => {
      stampResistor(ctx, ctx.props.resistance ?? 1e7);
    },
    computeBranchCurrent: (v0, v1, props) => {
      return resistorBranchCurrent(v0, v1, props.resistance ?? 1e7);
    },
    RealSymbol: VoltmeterRealSymbol,
    SchematicSymbol: VoltmeterSchematicSymbol,
  },
};

export const PALETTE_COMPONENT_DEFS: ComponentDef[] = (
  Object.values(COMPONENT_REGISTRY) as ComponentDef[]
).filter((def) => def.showInPalette);
