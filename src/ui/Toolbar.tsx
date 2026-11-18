import React from 'react';
import {
  BatteryCharging,
  Eye,
  Gauge,
  Lightbulb,
  Plus,
  RotateCw,
  ToggleLeft,
  Trash2,
  Zap,
  ArrowRight,
  Eraser,
} from 'lucide-react';
import { HU } from '../i18n/hu';
import { PALETTE_COMPONENT_DEFS } from '../physics/components';
import type { ComponentType, Selection, ViewMode } from '../physics/types';

interface ToolbarProps {
  selection: Selection;
  viewMode: ViewMode;
  showElectrons: boolean;
  showConventional: boolean;
  hasItems: boolean;
  onAddComponent: (type: ComponentType) => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  onClearBoard: () => void;
  onToggleViewMode: () => void;
  onToggleElectrons: () => void;
  onToggleConventional: () => void;
}

function getComponentIcon(type: ComponentType) {
  switch (type) {
    case 'battery':
      return <BatteryCharging className="h-4 w-4 text-[#ffb703]" aria-hidden="true" />;
    case 'bulb':
      return <Lightbulb className="h-4 w-4 text-[#ffb703]" aria-hidden="true" />;
    case 'switch':
      return <ToggleLeft className="h-4 w-4 text-[#2ee59d]" aria-hidden="true" />;
    case 'ammeter':
      return <Gauge className="h-4 w-4 text-[#4cc9f0]" aria-hidden="true" />;
    default:
      return <Plus className="h-4 w-4" aria-hidden="true" />;
  }
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selection,
  viewMode,
  showElectrons,
  showConventional,
  hasItems,
  onAddComponent,
  onRotateSelected,
  onDeleteSelected,
  onClearBoard,
  onToggleViewMode,
  onToggleElectrons,
  onToggleConventional,
}) => {
  const canRotate = selection?.kind === 'component';
  const canDelete = selection !== null;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#2b3a6e] bg-[#121a33] p-3">
      {/* Row 1: Component Palette */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label={HU.toolbar.paletteGroupAria}
        >
          {PALETTE_COMPONENT_DEFS.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => onAddComponent(def.type)}
              aria-label={`${def.nameHu} hozzáadása a munkalapra`}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#2b3a6e] bg-[#192447] px-3.5 py-2 text-sm font-semibold text-[#f1f5ff] transition-colors hover:border-[#4cc9f0] hover:bg-[#20305e] focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="text-[#4cc9f0] font-bold">{HU.toolbar.addPrefix}</span>
              {getComponentIcon(def.type)}
              <span>{def.nameHu}</span>
            </button>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label={HU.toolbar.actionsGroupAria}
        >
          <button
            type="button"
            onClick={onRotateSelected}
            disabled={!canRotate}
            aria-label={HU.toolbar.rotateAria}
            title="Forgatás 90°-kal (R)"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#2b3a6e] bg-[#16203f] px-3 py-2 text-sm font-medium text-[#e2e8f0] transition-colors hover:border-[#4cc9f0] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            <span>{HU.toolbar.rotate}</span>
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!canDelete}
            aria-label={HU.toolbar.deleteAria}
            title="Törlés (Delete)"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#2b3a6e] bg-[#16203f] px-3 py-2 text-sm font-medium text-[#ff8fa0] transition-colors hover:border-[#ff5d73] hover:bg-[#3a1627] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>{HU.toolbar.delete}</span>
          </button>

          <button
            type="button"
            onClick={onClearBoard}
            disabled={!hasItems}
            aria-label={HU.toolbar.clearBoardAria}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#2b3a6e] bg-[#16203f] px-3 py-2 text-sm font-medium text-[#cbd5e1] transition-colors hover:border-[#4cc9f0] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            <span>{HU.toolbar.clearBoard}</span>
          </button>
        </div>
      </div>

      {/* Row 2: View & Current Direction Toggles */}
      <div
        className="flex flex-wrap items-center gap-2 border-t border-[#2b3a6e]/70 pt-2.5"
        role="group"
        aria-label={HU.toolbar.viewsGroupAria}
      >
        <button
          type="button"
          onClick={onToggleViewMode}
          aria-label={HU.toolbar.viewToggleAria}
          aria-pressed={viewMode === 'schematic'}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-[#2b3a6e] bg-[#16203f] px-3.5 py-1.5 text-sm font-medium text-[#e2e8f0] transition-colors hover:border-[#4cc9f0] focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Eye className="h-4 w-4 text-[#4cc9f0]" aria-hidden="true" />
          <span>
            {viewMode === 'real' ? HU.toolbar.viewReal : HU.toolbar.viewSchematic}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleElectrons}
          aria-label={HU.toolbar.electronsAria}
          aria-pressed={showElectrons}
          className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer ${
            showElectrons
              ? 'border-[#4cc9f0] bg-[#4cc9f0]/15 text-[#7de0ff]'
              : 'border-[#2b3a6e] bg-[#16203f] text-[#94a3b8] hover:text-white'
          }`}
        >
          <Zap className="h-4 w-4 text-[#4cc9f0]" aria-hidden="true" />
          <span>{HU.toolbar.electrons}</span>
        </button>

        <button
          type="button"
          onClick={onToggleConventional}
          aria-label={HU.toolbar.conventionalAria}
          aria-pressed={showConventional}
          className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer ${
            showConventional
              ? 'border-[#ffb703] bg-[#ffb703]/15 text-[#ffd166]'
              : 'border-[#2b3a6e] bg-[#16203f] text-[#94a3b8] hover:text-white'
          }`}
        >
          <ArrowRight className="h-4 w-4 text-[#ffb703]" aria-hidden="true" />
          <span>{HU.toolbar.conventional}</span>
        </button>
      </div>
    </div>
  );
};
