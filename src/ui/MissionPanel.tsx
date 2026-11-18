import React from 'react';
import { ArrowRight, Check, HelpCircle, RotateCcw, Wrench } from 'lucide-react';
import { HU } from '../i18n/hu';
import {
  MISSIONS,
  type FaultId,
  type MissionCheckContext,
  type MissionTier,
} from '../missions/missions';
import type { CircuitComponent, Wire } from '../physics/types';

interface MissionPanelProps {
  activeMissionId: string;
  completedMissions: Record<string, boolean>;
  hintLevels: Record<string, number>;
  quizAnswers: Record<string, string>;
  m5ActiveFaultId: FaultId | null;
  m5FixedFaults: FaultId[];
  missionContext: MissionCheckContext;
  onSelectMission: (id: string) => void;
  onRevealHint: (id: string) => void;
  onSelectQuizOption: (missionId: string, optionId: string) => void;
  onLoadFaultPreset: (
    faultId: FaultId,
    components: CircuitComponent[],
    wires: Wire[]
  ) => void;
  onResetProgress: () => void;
}

const TIER_TEXT_COLOR: Record<MissionTier, string> = {
  CORE: 'text-[#4cc9f0]',
  CHALLENGE: 'text-[#ffb703]',
  EXPERT: 'text-[#ff8fa0]',
};

export const MissionPanel: React.FC<MissionPanelProps> = ({
  activeMissionId,
  completedMissions,
  hintLevels,
  quizAnswers,
  m5ActiveFaultId,
  m5FixedFaults,
  missionContext,
  onSelectMission,
  onRevealHint,
  onSelectQuizOption,
  onLoadFaultPreset,
  onResetProgress,
}) => {
  const activeIndex = Math.max(
    0,
    MISSIONS.findIndex((m) => m.id === activeMissionId)
  );
  const activeMission = MISSIONS[activeIndex];
  const nextMission =
    activeIndex + 1 < MISSIONS.length ? MISSIONS[activeIndex + 1] : null;

  const totalDone = MISSIONS.filter((m) => completedMissions[m.id]).length;
  const coreMissions = MISSIONS.filter((m) => m.tier === 'CORE');
  const coreDone = coreMissions.filter((m) => completedMissions[m.id]).length;

  const isCompleted = Boolean(completedMissions[activeMission.id]);
  const hintLevel = hintLevels[activeMission.id] ?? 0;
  const circuitReady = activeMission.isCircuitReady
    ? activeMission.isCircuitReady(missionContext)
    : true;
  const chosenQuizOptionId = quizAnswers[activeMission.id];
  const chosenQuizOption = activeMission.quiz?.options.find(
    (o) => o.id === chosenQuizOptionId
  );

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[350px]">
      {/* Mission List & Progress Header */}
      <section className="rounded-xl border border-[#2b3a6e] bg-[#121a33] p-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#2b3a6e]/70">
          <div>
            <h2 className="text-base font-bold text-[#f1f5ff]">
              {HU.missionsUi.panelTitle}
            </h2>
            <p className="text-xs font-medium text-[#94a3b8] font-mono-tabular mt-0.5">
              {HU.missionsUi.headerProgress(
                totalDone,
                MISSIONS.length,
                coreDone,
                coreMissions.length
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onResetProgress}
            aria-label={HU.missionsUi.resetProgressAria}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#2b3a6e] bg-[#16203f] px-2.5 py-1.5 text-xs font-medium text-[#cbd5e1] transition-colors hover:border-[#ff5d73] hover:text-white focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{HU.missionsUi.resetProgress}</span>
          </button>
        </div>

        <nav aria-label={HU.missionsUi.panelTitle} className="mt-3 grid grid-cols-1 gap-1.5">
          {MISSIONS.map((m) => {
            const done = Boolean(completedMissions[m.id]);
            const isActive = m.id === activeMission.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMission(m.id)}
                aria-label={`${m.number}. küldetés (${m.tier}): ${m.title}`}
                aria-current={isActive ? 'step' : undefined}
                className={`flex min-h-[38px] w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#4cc9f0] cursor-pointer ${
                  isActive
                    ? 'border-[#4cc9f0] bg-[#1b2952] text-white'
                    : 'border-transparent bg-[#0f172e] text-[#cbd5e1] hover:border-[#2b3a6e] hover:bg-[#162040]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-[#94a3b8] w-4 shrink-0">
                    {m.number}.
                  </span>
                  <span className={`text-[11px] font-bold tracking-wide shrink-0 ${TIER_TEXT_COLOR[m.tier]}`}>
                    {m.tier}
                  </span>
                  <span className="truncate font-semibold">{m.title}</span>
                </div>
                {done && (
                  <Check
                    className="h-4 w-4 shrink-0 text-[#2ee59d]"
                    aria-label="Teljesítve"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </section>

      {/* Active Mission Card */}
      <section className="rounded-xl border border-[#2b3a6e] bg-[#121a33] p-4 flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="font-mono-tabular text-[#94a3b8]">
              {activeMission.number}. küldetés
            </span>
            <span aria-hidden="true" className="text-[#475569]">·</span>
            <span className={TIER_TEXT_COLOR[activeMission.tier]}>
              {activeMission.tier}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-white">
            {activeMission.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#cbd5e1]">
            {activeMission.description}
          </p>
        </div>

        {/* Mission 5 Fault Presets */}
        {activeMission.faultPresets && (
          <div className="flex flex-col gap-2 border-t border-[#2b3a6e]/70 pt-3">
            <p className="text-xs font-semibold text-[#94a3b8]">
              {HU.missionsUi.faultsTitle}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {activeMission.faultPresets.map((preset) => {
                const isFixed = m5FixedFaults.includes(preset.id);
                const isCurrent = m5ActiveFaultId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onLoadFaultPreset(preset.id, preset.components, preset.wires)
                    }
                    aria-label={`${preset.label} áramkör betöltése`}
                    className={`flex min-h-[38px] flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#4cc9f0] cursor-pointer ${
                      isCurrent
                        ? 'border-[#4cc9f0] bg-[#1d2d59] text-white'
                        : 'border-[#2b3a6e] bg-[#16203f] text-[#cbd5e1] hover:border-[#4cc9f0]'
                    }`}
                  >
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Wrench className="h-3 w-3" aria-hidden="true" />
                      {preset.label}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        isFixed ? 'text-[#2ee59d]' : 'text-[#ffb703]'
                      }`}
                    >
                      {isFixed
                        ? HU.missionsUi.faultFixedTag
                        : HU.missionsUi.faultRemainingTag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Mission Status */}
        <div className="rounded-lg border border-[#2b3a6e]/80 bg-[#0d1428] px-3 py-2 text-xs font-medium text-[#cbd5e1] font-mono-tabular">
          {activeMission.liveStatus(missionContext)}
        </div>

        {/* 2-Step Hint Control */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onRevealHint(activeMission.id)}
            disabled={hintLevel >= 2}
            aria-label={HU.missionsUi.hintButtonAria}
            className="inline-flex min-h-[36px] items-center justify-center gap-1.5 self-start rounded-lg border border-[#2b3a6e] bg-[#16203f] px-3 py-1.5 text-xs font-semibold text-[#4cc9f0] transition-colors hover:border-[#4cc9f0] disabled:cursor-default disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[#4cc9f0] whitespace-nowrap cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            <span>{HU.missionsUi.hintButton(hintLevel)}</span>
          </button>

          {hintLevel >= 1 && (
            <div className="rounded-lg border border-[#2b3a6e] bg-[#162040] px-3 py-2 text-xs leading-relaxed text-[#e2e8f0]">
              <span className="font-bold text-[#4cc9f0]">
                {HU.missionsUi.hintLabel(1)}{' '}
              </span>
              {activeMission.hints[0]}
            </div>
          )}

          {hintLevel >= 2 && (
            <div className="rounded-lg border border-[#2b3a6e] bg-[#162040] px-3 py-2 text-xs leading-relaxed text-[#e2e8f0]">
              <span className="font-bold text-[#ffb703]">
                {HU.missionsUi.hintLabel(2)}{' '}
              </span>
              {activeMission.hints[1]}
            </div>
          )}
        </div>

        {/* Quiz Section (Missions 3, 4, 6) */}
        {activeMission.quiz && (
          <div className="flex flex-col gap-2 border-t border-[#2b3a6e]/70 pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#4cc9f0]">
              {HU.missionsUi.quizPromptTitle}
            </p>
            <p className="text-sm font-semibold text-white">
              {activeMission.quiz.question}
            </p>

            {!circuitReady ? (
              <p className="rounded-lg border border-[#2b3a6e] bg-[#0f172e] px-3 py-2 text-xs text-[#94a3b8]">
                {HU.missionsUi.quizLockedNote}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeMission.quiz.options.map((opt) => {
                  const selected = chosenQuizOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectQuizOption(activeMission.id, opt.id)}
                      aria-label={opt.text}
                      aria-pressed={selected}
                      className={`min-h-[38px] rounded-lg border px-3 py-2 text-left text-xs leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-[#4cc9f0] cursor-pointer ${
                        selected
                          ? opt.isCorrect
                            ? 'border-[#2ee59d] bg-[#0e3026] text-[#d6fff0]'
                            : 'border-[#ffb703] bg-[#2c230f] text-[#ffeab3]'
                          : 'border-[#2b3a6e] bg-[#16203f] text-[#e2e8f0] hover:border-[#4cc9f0]'
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}

                {chosenQuizOption && (
                  <p
                    className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                      chosenQuizOption.isCorrect
                        ? 'border-[#2ee59d]/60 bg-[#0d2b25] text-[#d6fff0]'
                        : 'border-[#ffb703]/60 bg-[#28200d] text-[#ffe8ad]'
                    }`}
                  >
                    {chosenQuizOption.feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Completion Banner */}
        {isCompleted && (
          <div className="flex flex-col gap-2.5 rounded-lg border border-[#2ee59d] bg-[#0e3026] p-3">
            <p className="text-sm font-bold text-[#2ee59d]">
              {HU.missionsUi.completedBanner}
            </p>
            {nextMission && (
              <button
                type="button"
                onClick={() => onSelectMission(nextMission.id)}
                aria-label={HU.missionsUi.nextMissionAria}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-[#2ee59d] px-3.5 py-2 text-sm font-bold text-[#0b1020] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-white whitespace-nowrap cursor-pointer"
              >
                <span>{HU.missionsUi.nextMission}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Legend Card */}
      <section
        aria-label={HU.legend.title}
        className="rounded-xl border border-[#2b3a6e] bg-[#121a33] p-4"
      >
        <h3 className="text-sm font-bold text-[#f1f5ff] mb-2.5">
          {HU.legend.title}
        </h3>
        <ul className="flex flex-col gap-2 text-xs text-[#cbd5e1] leading-snug">
          <li className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-full bg-[#4cc9f0]"
              aria-hidden="true"
            />
            <span>{HU.legend.electrons}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span
              className="inline-block h-0 w-0 shrink-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-[#ffb703]"
              aria-hidden="true"
            />
            <span>{HU.legend.conventional}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#2ee59d]"
              aria-hidden="true"
            />
            <span>{HU.legend.terminalSnap}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-sm bg-[#ff5d73]"
              aria-hidden="true"
            />
            <span>{HU.legend.shortCircuit}</span>
          </li>
        </ul>
        <p className="mt-3 border-t border-[#2b3a6e]/70 pt-2.5 text-[11px] text-[#94a3b8]">
          {HU.legend.shortcuts}
        </p>
      </section>
    </aside>
  );
};
