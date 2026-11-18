import React from 'react';
import { HU } from '../i18n/hu';
import { COMPONENT_REGISTRY, ENABLE_OHM_TOOLS } from '../physics/components';
import type { CircuitComponent, ComponentProps } from '../physics/types';

interface PropertiesPanelProps {
  selectedComponent: CircuitComponent | null;
  onUpdateProps: (id: string, patch: Partial<ComponentProps>) => void;
}

/**
 * Extensible component property editor for future Ohm's law curriculum tools.
 * Disabled in v1 via ENABLE_OHM_TOOLS = false.
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponent,
  onUpdateProps,
}) => {
  if (!ENABLE_OHM_TOOLS || !selectedComponent) {
    return null;
  }

  const def = COMPONENT_REGISTRY[selectedComponent.type];
  const editable = def.editableProps ?? [];
  if (editable.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={HU.propertiesPanel.title}
      className="rounded-xl border border-[#2b3a6e] bg-[#121a33] p-4"
    >
      <h3 className="text-sm font-bold text-[#f1f5ff] mb-3">
        {HU.propertiesPanel.title} · {def.nameHu}
      </h3>
      <div className="flex flex-col gap-3">
        {editable.map((field) => {
          const currentVal = Number(
            selectedComponent.props[field.key] ?? def.defaultProps[field.key] ?? field.min
          );
          return (
            <label key={field.key} className="flex flex-col gap-1 text-xs text-[#cbd5e1]">
              <div className="flex items-center justify-between">
                <span>{field.labelHu}</span>
                <span className="font-mono-tabular font-semibold text-[#4cc9f0]">
                  {currentVal.toFixed(1).replace('.', ',')} {field.unit}
                </span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={currentVal}
                onChange={(e) =>
                  onUpdateProps(selectedComponent.id, {
                    [field.key]: parseFloat(e.target.value),
                  })
                }
                className="accent-[#4cc9f0]"
              />
            </label>
          );
        })}
      </div>
    </section>
  );
};
