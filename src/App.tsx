import { useEffect, useMemo } from 'react';
import { HU } from './i18n/hu';
import { useCircuitStore } from './state/store';
import { Board } from './ui/Board';
import { MissionPanel } from './ui/MissionPanel';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { StatusBar } from './ui/StatusBar';
import { Toolbar } from './ui/Toolbar';

export default function App() {
  const store = useCircuitStore();

  const selectedComponent = useMemo(() => {
    if (store.selection?.kind !== 'component') return null;
    return store.components.find((c) => c.id === store.selection?.id) ?? null;
  }, [store.components, store.selection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        if (store.selection?.kind === 'component') {
          e.preventDefault();
          store.rotateSelected();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selection) {
          e.preventDefault();
          store.deleteSelected();
        }
      } else if (e.key === 'Escape') {
        if (store.selection) {
          e.preventDefault();
          store.setSelection(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  return (
    <div className="min-h-screen bg-[#0b1020] text-[#f1f5ff]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 p-3 sm:p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#2b3a6e]/70 pb-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {HU.appTitle}
            </h1>
            <span className="text-sm font-medium text-[#4cc9f0]">
              {HU.appSubtitle}
            </span>
          </div>
        </header>

        <main className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Left column: Toolbar + SVG Board + StatusBar */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Toolbar
              selection={store.selection}
              viewMode={store.viewMode}
              showElectrons={store.showElectrons}
              showConventional={store.showConventional}
              hasItems={store.components.length > 0 || store.wires.length > 0}
              onAddComponent={store.addComponent}
              onRotateSelected={store.rotateSelected}
              onDeleteSelected={store.deleteSelected}
              onClearBoard={store.clearBoard}
              onToggleViewMode={() =>
                store.setViewMode((prev) => (prev === 'real' ? 'schematic' : 'real'))
              }
              onToggleElectrons={() => store.setShowElectrons((prev) => !prev)}
              onToggleConventional={() =>
                store.setShowConventional((prev) => !prev)
              }
            />

            <Board
              components={store.components}
              wires={store.wires}
              selection={store.selection}
              viewMode={store.viewMode}
              showElectrons={store.showElectrons}
              showConventional={store.showConventional}
              solution={store.solution}
              onSelect={store.setSelection}
              onMoveComponent={store.moveComponent}
              onToggleSwitch={store.toggleSwitch}
              onAddWire={store.addWire}
              onToggleWireElbow={store.toggleWireElbow}
            />

            <StatusBar status={store.status} />

            <PropertiesPanel
              selectedComponent={selectedComponent}
              onUpdateProps={store.updateComponentProps}
            />
          </div>

          {/* Right column: Missions & Legend */}
          <MissionPanel
            activeMissionId={store.activeMissionId}
            completedMissions={store.completedMissions}
            hintLevels={store.hintLevels}
            quizAnswers={store.quizAnswers}
            m5ActiveFaultId={store.m5ActiveFaultId}
            m5FixedFaults={store.m5FixedFaults}
            missionContext={store.missionContext}
            onSelectMission={store.setActiveMissionId}
            onRevealHint={store.revealNextHint}
            onSelectQuizOption={store.selectQuizOption}
            onLoadFaultPreset={store.loadFaultPreset}
            onResetProgress={store.resetMissionProgress}
          />
        </main>
      </div>
    </div>
  );
}
