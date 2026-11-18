import React from 'react';
import { HU } from '../../i18n/hu';
import type { SymbolRenderProps } from './BatterySymbol';

export const SwitchRealSymbol: React.FC<SymbolRenderProps> = ({
  component,
  isSelected,
}) => {
  const closed = Boolean(component.props.closed);
  const rot = component.rotation;
  const stateLabel = closed ? HU.components.switchOn : HU.components.switchOff;
  const stateColor = closed ? '#2ee59d' : '#ff5d73';

  return (
    <g className="cursor-pointer">
      {/* Insulator base */}
      <rect
        x={-34}
        y={-15}
        width={68}
        height={30}
        rx={6}
        fill="#182447"
        stroke={isSelected ? '#4cc9f0' : '#354887'}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      {/* Leads */}
      <line x1={-60} y1={0} x2={-24} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />
      <line x1={24} y1={0} x2={60} y2={0} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />

      {/* Contact posts */}
      <circle cx={-24} cy={0} r={5} fill="#ffb703" stroke="#0b1020" strokeWidth={1.5} />
      <circle cx={24} cy={0} r={5} fill="#ffb703" stroke="#0b1020" strokeWidth={1.5} />

      {/* Hinged knife blade */}
      <line
        x1={-24}
        y1={0}
        x2={closed ? 24 : 18}
        y2={closed ? 0 : -23}
        stroke={closed ? '#2ee59d' : '#cbd5e1'}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* Insulated handle knob */}
      <circle
        cx={closed ? 22 : 19}
        cy={closed ? -2 : -25}
        r={5.5}
        fill={stateColor}
        stroke="#0b1020"
        strokeWidth={1.5}
      />

      {/* Status label ("be" / "ki") */}
      <g transform={`rotate(${-rot})`}>
        <rect
          x={-16}
          y={19}
          width={32}
          height={18}
          rx={4}
          fill="#0b1020"
          stroke={stateColor}
          strokeWidth={1}
        />
        <text
          x={0}
          y={28}
          textAnchor="middle"
          dominantBaseline="central"
          fill={stateColor}
          fontSize={12}
          fontWeight={800}
        >
          {stateLabel}
        </text>
      </g>
    </g>
  );
};

export const SwitchSchematicSymbol: React.FC<SymbolRenderProps> = ({
  component,
  isSelected,
}) => {
  const closed = Boolean(component.props.closed);
  const rot = component.rotation;
  const stateLabel = closed ? HU.components.switchOn : HU.components.switchOff;
  const stateColor = closed ? '#2ee59d' : '#ff5d73';

  return (
    <g className="cursor-pointer">
      {/* Invisible generous click area */}
      <rect x={-36} y={-28} width={72} height={56} fill="transparent" />

      {/* Leads */}
      <line x1={-60} y1={0} x2={-22} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />
      <line x1={22} y1={0} x2={60} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />

      {/* Terminal nodes */}
      <circle
        cx={-22}
        cy={0}
        r={4}
        fill="#121a33"
        stroke={isSelected ? '#4cc9f0' : '#e2e8f0'}
        strokeWidth={2.2}
      />
      <circle
        cx={22}
        cy={0}
        r={4}
        fill="#121a33"
        stroke={isSelected ? '#4cc9f0' : '#e2e8f0'}
        strokeWidth={2.2}
      />

      {/* Switch lever */}
      <line
        x1={-22}
        y1={0}
        x2={closed ? 22 : 18}
        y2={closed ? 0 : -20}
        stroke={stateColor}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Label ("be" / "ki") */}
      <g transform={`rotate(${-rot})`}>
        <text
          x={0}
          y={26}
          textAnchor="middle"
          dominantBaseline="central"
          fill={stateColor}
          fontSize={13}
          fontWeight={800}
        >
          {stateLabel}
        </text>
      </g>
    </g>
  );
};
