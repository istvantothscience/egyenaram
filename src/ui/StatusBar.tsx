import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ZapOff } from 'lucide-react';
import type { CircuitStatus } from '../physics/types';

interface StatusBarProps {
  status: CircuitStatus;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  const stylesByKind = {
    no_battery: {
      container: 'border-[#2b3a6e] bg-[#121a33] text-[#cbd5e1]',
      icon: <Info className="h-5 w-5 shrink-0 text-[#4cc9f0]" aria-hidden="true" />,
      badge: 'Készenlét',
    },
    short_circuit: {
      container:
        'border-[#ff5d73] bg-[#36111e] text-[#ffd6dc] animate-short-pulse',
      icon: (
        <AlertTriangle
          className="h-5 w-5 shrink-0 text-[#ff5d73]"
          aria-hidden="true"
        />
      ),
      badge: 'Veszély',
    },
    closed: {
      container: 'border-[#2ee59d]/70 bg-[#0d2b25] text-[#d3fff0]',
      icon: (
        <CheckCircle2
          className="h-5 w-5 shrink-0 text-[#2ee59d]"
          aria-hidden="true"
        />
      ),
      badge: 'Zárt kör',
    },
    switch_open: {
      container: 'border-[#ffb703]/70 bg-[#2b220d] text-[#ffeab3]',
      icon: <ZapOff className="h-5 w-5 shrink-0 text-[#ffb703]" aria-hidden="true" />,
      badge: 'Megszakítva',
    },
    open: {
      container: 'border-[#ffb703]/60 bg-[#241d0d] text-[#ffe49e]',
      icon: <Info className="h-5 w-5 shrink-0 text-[#ffb703]" aria-hidden="true" />,
      badge: 'Nyitott kör',
    },
  } as const;

  const style = stylesByKind[status.kind];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm md:text-base font-medium leading-snug transition-colors ${style.container}`}
    >
      {style.icon}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-bold whitespace-nowrap">{style.badge}:</span>
        <span className="font-mono-tabular">{status.message}</span>
      </div>
    </div>
  );
};
