import React from 'react';
import { formatVoltageHu } from '../../i18n/hu';
import type { SymbolRenderProps } from './BatterySymbol';

export const VoltmeterRealSymbol: React.FC<SymbolRenderProps> = ({
  component,
  v0,
  v1,
  isSelected,
}) => {
  const rot = component.rotation;
  const voltageDiff = Math.abs(v1 - v0);
  const reading = formatVoltageHu(voltageDiff, 2);

  return (
    <g>
      <line x1={-60} y1={0} x2={-26} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />
      <line x1={26} y1={0} x2={60} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />

      <circle
        cx={0}
        cy={0}
        r={26}
        fill="#152142"
        stroke={isSelected ? '#4cc9f0' : '#ffb703'}
        strokeWidth={isSelected ? 3 : 2}
      />

      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={-6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffb703"
          fontSize={15}
          fontWeight={800}
        >
          V
        </text>
        <rect
          x={-28}
          y={4}
          width={56}
          height={18}
          rx={4}
          fill="#0b1020"
          stroke="#2b3a6e"
          strokeWidth={1}
        />
        <text
          x={0}
          y={13}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#f8fafc"
          fontSize={11.5}
          fontWeight={700}
          className="font-mono-tabular"
        >
          {reading}
        </text>
      </g>
    </g>
  );
};

export const VoltmeterSchematicSymbol: React.FC<SymbolRenderProps> = ({
  component,
  v0,
  v1,
  isSelected,
}) => {
  const rot = component.rotation;
  const reading = formatVoltageHu(Math.abs(v1 - v0), 2);

  return (
    <g>
      <line x1={-60} y1={0} x2={-20} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />
      <line x1={20} y1={0} x2={60} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />

      <circle
        cx={0}
        cy={0}
        r={20}
        fill="#121a33"
        stroke={isSelected ? '#4cc9f0' : '#e2e8f0'}
        strokeWidth={2.5}
      />

      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={1}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#f8fafc"
          fontSize={17}
          fontWeight={800}
        >
          V
        </text>
        <text
          x={0}
          y={33}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#cbd5e1"
          fontSize={12}
          fontWeight={700}
          className="font-mono-tabular"
        >
          {reading}
        </text>
      </g>
    </g>
  );
};
