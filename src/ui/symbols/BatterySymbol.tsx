import React from 'react';
import { HU, formatVoltageHu } from '../../i18n/hu';
import type { CircuitComponent } from '../../physics/types';

export interface SymbolRenderProps {
  component: CircuitComponent;
  current: number;
  brightness: number;
  isShortCircuit: boolean;
  isSelected: boolean;
  v0: number;
  v1: number;
}

export const BatteryRealSymbol: React.FC<SymbolRenderProps> = ({
  component,
  isShortCircuit,
  isSelected,
}) => {
  const voltage = component.props.voltage ?? 4.5;
  const label = formatVoltageHu(voltage, 1);
  const rot = component.rotation;

  return (
    <g>
      {/* Lead wires to terminals (-60 to -36, +36 to +60) */}
      <line x1={-60} y1={0} x2={-36} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />
      <line x1={36} y1={0} x2={60} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />

      {/* Negative metal cap (terminal 0) */}
      <rect x={-42} y={-9} width={7} height={18} rx={2} fill="#4cc9f0" />
      {/* Positive metal cap (terminal 1) */}
      <rect x={35} y={-11} width={8} height={22} rx={2} fill="#ff5d73" />

      {/* Battery body */}
      <rect
        x={-36}
        y={-22}
        width={72}
        height={44}
        rx={8}
        fill={isShortCircuit ? '#4a1421' : '#182447'}
        stroke={isShortCircuit ? '#ff5d73' : isSelected ? '#4cc9f0' : '#43589e'}
        strokeWidth={isShortCircuit ? 3 : isSelected ? 2.5 : 2}
        className={isShortCircuit ? 'animate-svg-flash' : undefined}
      />

      {/* Copper/Amber accent band on positive side */}
      <rect
        x={18}
        y={-21}
        width={17}
        height={42}
        rx={6}
        fill={isShortCircuit ? '#ff5d73' : '#ffb703'}
        fillOpacity={0.22}
      />

      {/* Minus (-) pole symbol near terminal 0 */}
      <text
        x={-25}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#4cc9f0"
        fontSize={16}
        fontWeight={800}
        transform={`rotate(${-rot}, -25, 0)`}
      >
        −
      </text>

      {/* Plus (+) pole symbol near terminal 1 */}
      <text
        x={26}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ff5d73"
        fontSize={16}
        fontWeight={800}
        transform={`rotate(${-rot}, 26, 0)`}
      >
        +
      </text>

      {/* Voltage label */}
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f8fafc"
        fontSize={13}
        fontWeight={700}
        className="font-mono-tabular"
        transform={`rotate(${-rot}, 0, 0)`}
      >
        {label}
      </text>

      {/* Short-circuit FORRÓ! warning above battery in world orientation */}
      {isShortCircuit && (
        <g transform={`rotate(${-rot})`}>
          <rect
            x={-34}
            y={-52}
            width={68}
            height={22}
            rx={5}
            fill="#ff5d73"
            className="animate-svg-flash"
          />
          <text
            x={0}
            y={-41}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0b1020"
            fontSize={12}
            fontWeight={900}
            letterSpacing="0.04em"
          >
            {HU.components.hotWarning}
          </text>
        </g>
      )}
    </g>
  );
};

export const BatterySchematicSymbol: React.FC<SymbolRenderProps> = ({
  component,
  isShortCircuit,
  isSelected,
}) => {
  const voltage = component.props.voltage ?? 4.5;
  const label = `${HU.components.battery} · ${formatVoltageHu(voltage, 1)}`;
  const rot = component.rotation;

  return (
    <g>
      {/* Leads */}
      <line x1={-60} y1={0} x2={-7} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />
      <line x1={7} y1={0} x2={60} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />

      {/* Short thick line (-) at terminal 0 side */}
      <line
        x1={-7}
        y1={-12}
        x2={-7}
        y2={12}
        stroke={isShortCircuit ? '#ff5d73' : '#4cc9f0'}
        strokeWidth={4.5}
        strokeLinecap="round"
        className={isShortCircuit ? 'animate-svg-flash' : undefined}
      />

      {/* Long thin line (+) at terminal 1 side */}
      <line
        x1={7}
        y1={-24}
        x2={7}
        y2={24}
        stroke={isShortCircuit ? '#ff5d73' : '#ff5d73'}
        strokeWidth={2.5}
        strokeLinecap="round"
        className={isShortCircuit ? 'animate-svg-flash' : undefined}
      />

      {/* Pole markers */}
      <text
        x={-20}
        y={-13}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#4cc9f0"
        fontSize={13}
        fontWeight={800}
        transform={`rotate(${-rot}, -20, -13)`}
      >
        −
      </text>
      <text
        x={20}
        y={-13}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ff5d73"
        fontSize={13}
        fontWeight={800}
        transform={`rotate(${-rot}, 20, -13)`}
      >
        +
      </text>

      {/* Component name + voltage */}
      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={34}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isSelected ? '#4cc9f0' : '#cbd5e1'}
          fontSize={12}
          fontWeight={600}
          className="font-mono-tabular"
        >
          {label}
        </text>
      </g>

      {isShortCircuit && (
        <g transform={`rotate(${-rot})`}>
          <rect
            x={-34}
            y={-52}
            width={68}
            height={22}
            rx={5}
            fill="#ff5d73"
            className="animate-svg-flash"
          />
          <text
            x={0}
            y={-41}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0b1020"
            fontSize={12}
            fontWeight={900}
          >
            {HU.components.hotWarning}
          </text>
        </g>
      )}
    </g>
  );
};
