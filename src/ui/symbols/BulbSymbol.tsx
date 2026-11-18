import React from 'react';
import { HU } from '../../i18n/hu';
import type { SymbolRenderProps } from './BatterySymbol';

export const BulbRealSymbol: React.FC<SymbolRenderProps> = ({
  component,
  brightness,
  isSelected,
}) => {
  const isLit = brightness > 0;
  const glowRadius = 24 + brightness * 36;
  const glowOpacity = Math.min(0.92, 0.22 + brightness * 0.52);
  const gradId = `bulb-glow-${component.id}`;
  const rot = component.rotation;

  return (
    <g>
      {isLit && (
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7cc" stopOpacity={glowOpacity} />
            <stop offset="40%" stopColor="#ffb703" stopOpacity={glowOpacity * 0.65} />
            <stop offset="100%" stopColor="#ffb703" stopOpacity={0} />
          </radialGradient>
        </defs>
      )}

      {/* Radial glow halo */}
      {isLit && (
        <circle
          cx={0}
          cy={-4}
          r={glowRadius}
          fill={`url(#${gradId})`}
          pointerEvents="none"
        />
      )}

      {/* Lead wires to terminals */}
      <line x1={-60} y1={0} x2={-20} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />
      <line x1={20} y1={0} x2={60} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />

      {/* Screw socket base */}
      <rect
        x={-22}
        y={-6}
        width={44}
        height={12}
        rx={4}
        fill="#334155"
        stroke={isSelected ? '#4cc9f0' : '#64748b'}
        strokeWidth={1.5}
      />

      {/* Glass bulb */}
      <circle
        cx={0}
        cy={-4}
        r={22}
        fill={isLit ? '#ffb703' : '#1b264a'}
        fillOpacity={isLit ? Math.min(0.45, 0.14 + brightness * 0.25) : 0.72}
        stroke={isLit ? '#ffd166' : isSelected ? '#4cc9f0' : '#64748b'}
        strokeWidth={isSelected ? 2.5 : 2}
      />

      {/* Internal filament posts & coiled filament */}
      <polyline
        points="-10,4 -7,-9 -3,-4 0,-11 3,-4 7,-9 10,4"
        fill="none"
        stroke={isLit ? '#fff8d6' : '#94a3b8'}
        strokeWidth={isLit ? 2.6 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subtle glass highlight */}
      <path
        d="M -12 -14 A 14 14 0 0 1 -2 -20"
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.28}
        strokeWidth={2}
        strokeLinecap="round"
      />

      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={32}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isSelected ? '#4cc9f0' : '#94a3b8'}
          fontSize={11}
          fontWeight={600}
        >
          {HU.components.bulb}
        </text>
      </g>
    </g>
  );
};

export const BulbSchematicSymbol: React.FC<SymbolRenderProps> = ({
  component,
  brightness,
  isSelected,
}) => {
  const isLit = brightness > 0;
  const glowRadius = 24 + brightness * 30;
  const glowOpacity = Math.min(0.85, 0.2 + brightness * 0.45);
  const gradId = `bulb-sch-glow-${component.id}`;
  const rot = component.rotation;

  return (
    <g>
      {isLit && (
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7cc" stopOpacity={glowOpacity} />
            <stop offset="50%" stopColor="#ffb703" stopOpacity={glowOpacity * 0.55} />
            <stop offset="100%" stopColor="#ffb703" stopOpacity={0} />
          </radialGradient>
        </defs>
      )}

      {isLit && (
        <circle cx={0} cy={0} r={glowRadius} fill={`url(#${gradId})`} pointerEvents="none" />
      )}

      {/* Leads */}
      <line x1={-60} y1={0} x2={-20} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />
      <line x1={20} y1={0} x2={60} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />

      {/* Schematic circle with X */}
      <circle
        cx={0}
        cy={0}
        r={20}
        fill={isLit ? '#ffb703' : '#121a33'}
        fillOpacity={isLit ? Math.min(0.35, 0.12 + brightness * 0.2) : 1}
        stroke={isLit ? '#ffd166' : isSelected ? '#4cc9f0' : '#e2e8f0'}
        strokeWidth={2.5}
      />
      <line
        x1={-14}
        y1={-14}
        x2={14}
        y2={14}
        stroke={isLit ? '#fff8d6' : '#e2e8f0'}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1={-14}
        y1={14}
        x2={14}
        y2={-14}
        stroke={isLit ? '#fff8d6' : '#e2e8f0'}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={33}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isSelected ? '#4cc9f0' : '#94a3b8'}
          fontSize={11}
          fontWeight={600}
        >
          {HU.components.bulb}
        </text>
      </g>
    </g>
  );
};
