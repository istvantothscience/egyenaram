import React from 'react';
import { formatCurrentHu } from '../../i18n/hu';
import type { SymbolRenderProps } from './BatterySymbol';

export const AmmeterRealSymbol: React.FC<SymbolRenderProps> = ({
  component,
  current,
  isSelected,
}) => {
  const rot = component.rotation;
  const reading = formatCurrentHu(current, 2);
  const active = Math.abs(current) > 0.005;

  return (
    <g>
      {/* Leads */}
      <line x1={-60} y1={0} x2={-26} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />
      <line x1={26} y1={0} x2={60} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />

      {/* Meter casing */}
      <circle
        cx={0}
        cy={0}
        r={26}
        fill="#152142"
        stroke={isSelected ? '#4cc9f0' : active ? '#4cc9f0' : '#4b63ad'}
        strokeWidth={isSelected ? 3 : 2}
      />

      {/* Letter A inside circle */}
      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={-6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#4cc9f0"
          fontSize={15}
          fontWeight={800}
        >
          A
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
          fill={active ? '#2ee59d' : '#cbd5e1'}
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

export const AmmeterSchematicSymbol: React.FC<SymbolRenderProps> = ({
  component,
  current,
  isSelected,
}) => {
  const rot = component.rotation;
  const reading = formatCurrentHu(current, 2);
  const active = Math.abs(current) > 0.005;

  return (
    <g>
      {/* Leads */}
      <line x1={-60} y1={0} x2={-20} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />
      <line x1={20} y1={0} x2={60} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />

      {/* Standard schematic circle with A */}
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
          A
        </text>
        <text
          x={0}
          y={33}
          textAnchor="middle"
          dominantBaseline="central"
          fill={active ? '#2ee59d' : '#94a3b8'}
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
