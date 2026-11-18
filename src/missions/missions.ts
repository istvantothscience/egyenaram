import { BULB_LIT_THRESHOLD_A, solveCircuit } from '../physics/solver';
import type { CircuitComponent, CircuitSolution, Wire } from '../physics/types';

export type MissionTier = 'CORE' | 'CHALLENGE' | 'EXPERT';

export type FaultId = 'f1' | 'f2' | 'f3';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface MissionQuiz {
  question: string;
  options: QuizOption[];
}

export interface FaultPreset {
  id: FaultId;
  label: string;
  components: CircuitComponent[];
  wires: Wire[];
}

export interface MissionCheckContext {
  components: CircuitComponent[];
  wires: Wire[];
  solution: CircuitSolution;
  showElectrons: boolean;
  showConventional: boolean;
  m2SawOff: boolean;
  m2SawOn: boolean;
  m3CircuitVerified: boolean;
  m4CircuitVerified: boolean;
  m5FixedFaults: FaultId[];
  m6SawShortCircuit: boolean;
  quizAnswers: Record<string, string>;
}

export interface MissionDef {
  id: string;
  number: number;
  tier: MissionTier;
  title: string;
  description: string;
  hints: [string, string];
  liveStatus: (ctx: MissionCheckContext) => string;
  isCircuitReady?: (ctx: MissionCheckContext) => boolean;
  isCompleted: (ctx: MissionCheckContext) => boolean;
  quiz?: MissionQuiz;
  faultPresets?: FaultPreset[];
}

const MISSION5_BASE_BATTERY: CircuitComponent = {
  id: 'm5-bat',
  type: 'battery',
  x: 460,
  y: 420,
  rotation: 0,
  props: { voltage: 4.5, internalResistance: 1 },
};

const MISSION5_BASE_BULB: CircuitComponent = {
  id: 'm5-bulb',
  type: 'bulb',
  x: 680,
  y: 260,
  rotation: 90,
  props: { resistance: 15 },
};

const MISSION5_BASE_WIRES: Wire[] = [
  {
    id: 'm5-w1',
    from: { componentId: 'm5-bat', terminalIndex: 0 },
    to: { componentId: 'm5-sw', terminalIndex: 1 },
    elbowDir: 'hv',
  },
  {
    id: 'm5-w2',
    from: { componentId: 'm5-sw', terminalIndex: 0 },
    to: { componentId: 'm5-bulb', terminalIndex: 0 },
    elbowDir: 'hv',
  },
  {
    id: 'm5-w3',
    from: { componentId: 'm5-bulb', terminalIndex: 1 },
    to: { componentId: 'm5-bat', terminalIndex: 1 },
    elbowDir: 'vh',
  },
];

export const MISSION5_FAULTS: FaultPreset[] = [
  {
    id: 'f1',
    label: '1. hiba',
    components: [
      MISSION5_BASE_BATTERY,
      {
        id: 'm5-sw',
        type: 'switch',
        x: 240,
        y: 260,
        rotation: 90,
        props: { closed: false, resistance: 0.01 },
      },
      MISSION5_BASE_BULB,
    ],
    wires: MISSION5_BASE_WIRES,
  },
  {
    id: 'f2',
    label: '2. hiba',
    components: [
      MISSION5_BASE_BATTERY,
      {
        id: 'm5-sw',
        type: 'switch',
        x: 240,
        y: 260,
        rotation: 90,
        props: { closed: true, resistance: 0.01 },
      },
      MISSION5_BASE_BULB,
    ],
    wires: [MISSION5_BASE_WIRES[0], MISSION5_BASE_WIRES[2]],
  },
  {
    id: 'f3',
    label: '3. hiba',
    components: [
      MISSION5_BASE_BATTERY,
      {
        id: 'm5-sw',
        type: 'switch',
        x: 240,
        y: 260,
        rotation: 90,
        props: { closed: true, resistance: 0.01 },
      },
      MISSION5_BASE_BULB,
    ],
    wires: [
      ...MISSION5_BASE_WIRES,
      {
        id: 'm5-w-short',
        from: { componentId: 'm5-bat', terminalIndex: 1 },
        to: { componentId: 'm5-bat', terminalIndex: 0 },
        elbowDir: 'hv',
      },
    ],
  },
];

function hasCorrectQuizAnswer(missionId: string, quiz: MissionQuiz, answers: Record<string, string>): boolean {
  const chosenId = answers[missionId];
  if (!chosenId) return false;
  return quiz.options.some((o) => o.id === chosenId && o.isCorrect);
}

export function checkMission3Circuit(ctx: MissionCheckContext): boolean {
  if (ctx.solution.isShortCircuit || ctx.solution.litBulbIds.length === 0) {
    return false;
  }
  const activeAmmeters = ctx.components
    .filter((c) => c.type === 'ammeter')
    .map((c) => Math.abs(ctx.solution.componentCurrents[c.id] ?? 0))
    .filter((i) => i > BULB_LIT_THRESHOLD_A);

  if (activeAmmeters.length < 2) return false;
  for (let i = 0; i < activeAmmeters.length; i++) {
    for (let j = i + 1; j < activeAmmeters.length; j++) {
      if (Math.abs(activeAmmeters[i] - activeAmmeters[j]) < 0.005) {
        return true;
      }
    }
  }
  return false;
}

export function checkMission4Circuit(ctx: MissionCheckContext): boolean {
  return (
    !ctx.solution.isShortCircuit &&
    ctx.solution.litBulbIds.length > 0 &&
    ctx.showElectrons &&
    ctx.showConventional
  );
}

export function checkMission7Condition(ctx: MissionCheckContext): boolean {
  if (ctx.solution.isShortCircuit || ctx.solution.litBulbIds.length < 2) {
    return false;
  }
  const closedSwitches = ctx.components.filter(
    (c) => c.type === 'switch' && c.props.closed
  );
  if (closedSwitches.length === 0) return false;

  const currentlyLit = new Set(ctx.solution.litBulbIds);

  for (const sw of closedSwitches) {
    const hypothetical = ctx.components.map((c) =>
      c.id === sw.id ? { ...c, props: { ...c.props, closed: false } } : c
    );
    const hypSol = solveCircuit(hypothetical, ctx.wires);
    const stillLit = hypSol.litBulbIds.filter((id) => currentlyLit.has(id));
    if (stillLit.length === 0) {
      return true;
    }
  }
  return false;
}

export function checkMission8Condition(ctx: MissionCheckContext): boolean {
  if (ctx.solution.isShortCircuit || ctx.solution.litBulbIds.length < 2) {
    return false;
  }
  const closedSwitches = ctx.components.filter(
    (c) => c.type === 'switch' && c.props.closed
  );
  if (closedSwitches.length === 0) return false;

  const currentlyLit = new Set(ctx.solution.litBulbIds);

  for (const sw of closedSwitches) {
    const hypothetical = ctx.components.map((c) =>
      c.id === sw.id ? { ...c, props: { ...c.props, closed: false } } : c
    );
    const hypSol = solveCircuit(hypothetical, ctx.wires);
    const stayedLitCount = hypSol.litBulbIds.filter((id) => currentlyLit.has(id)).length;
    const wentDarkCount = currentlyLit.size - stayedLitCount;
    if (wentDarkCount === 1 && stayedLitCount >= 1) {
      return true;
    }
  }
  return false;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'm1',
    number: 1,
    tier: 'CORE',
    title: 'Fényt!',
    description:
      'Építs egyszerű áramkört egy elemből és egy izzóból vezetékek segítségével úgy, hogy az izzó világítson!',
    hints: [
      'Tegyél a munkalapra egy Elemet és egy Izzót a fenti gombokkal.',
      'Húzz egy-egy vezetéket az elem mindkét pólusától (+ és −) az izzó két csatlakozójához, hogy zárt kört alkossanak.',
    ],
    liveStatus: (ctx) => `Világító izzók: ${ctx.solution.litBulbIds.length}`,
    isCompleted: (ctx) =>
      !ctx.solution.isShortCircuit &&
      ctx.solution.litBulbIds.length >= 1 &&
      ctx.components.some((c) => c.type === 'battery'),
  },
  {
    id: 'm2',
    number: 2,
    tier: 'CORE',
    title: 'Kapcsolj!',
    description:
      'Illessz egy kapcsolót az áramkörbe, majd kapcsold ki és be is, hogy lásd, mi történik az árammal az egész körben!',
    hints: [
      'Kösd a kapcsolót sorba az elemmel és az izzóval (elem → kapcsoló → izzó → elem).',
      'Kattints a kapcsolóra (húzás nélkül), hogy nyisd („ki”) és zárd („be”) a kört!',
    ],
    liveStatus: (ctx) => {
      const offMark = ctx.m2SawOff ? '✔' : '○';
      const onMark = ctx.m2SawOn ? '✔' : '○';
      return `Világító izzók: ${ctx.solution.litBulbIds.length} · Kikapcsolva: ${offMark} · Bekapcsolva: ${onMark}`;
    },
    isCompleted: (ctx) =>
      ctx.components.some((c) => c.type === 'switch') &&
      ctx.m2SawOff &&
      ctx.m2SawOn,
  },
  {
    id: 'm3',
    number: 3,
    tier: 'CORE',
    title: 'Elfogy az áram?',
    description:
      'Tegyél egy ampermérőt az izzó elé és egyet az izzó mögé ugyanabba a zárt körbe! Hasonlítsd össze a két műszer értékét, majd válaszolj a kérdésre!',
    hints: [
      'Kösd sorba az elem +, az 1. ampermérő, az izzó, a 2. ampermérő és az elem − pólusát.',
      'Mindkét ampermérőn 0,03 A feletti, azonos értéknek kell megjelennie. Ezután válaszd ki a helyes következtetést!',
    ],
    liveStatus: (ctx) => {
      const activeCount = ctx.components.filter(
        (c) =>
          c.type === 'ammeter' &&
          Math.abs(ctx.solution.componentCurrents[c.id] ?? 0) > BULB_LIT_THRESHOLD_A
      ).length;
      return `Mérő ampermérők: ${activeCount}/2 · Világító izzók: ${ctx.solution.litBulbIds.length}`;
    },
    isCircuitReady: (ctx) => ctx.m3CircuitVerified || checkMission3Circuit(ctx),
    quiz: {
      question: 'Az izzó előtt és után is ugyanannyi az áramerősség. Mit jelent ez?',
      options: [
        {
          id: 'm3-a',
          text: 'Ugyanannyi elektron lép be az izzóba, mint amennyi kilép. Az áram nem fogy el, az elektronok körbejárnak.',
          isCorrect: true,
          feedback:
            'Pontos megfigyelés! Az áramerősség az egész zárt körben azonos, mert az elektronok nem fogynak el az izzóban.',
        },
        {
          id: 'm3-b',
          text: 'Az áram egy kicsit elfogy, a műszer pontatlan.',
          isCorrect: false,
          feedback:
            'Jó gondolat, de nézd meg még egyszer mindkét ampermérő kijelzőjét! A két érték pontosan megegyezik — nem műszerhiba, a töltések száma maradandó.',
        },
        {
          id: 'm3-c',
          text: 'Az áram megkétszereződik.',
          isCorrect: false,
          feedback:
            'Jó gondolat, de nézd meg a számokat mindkét ampermérőn! Egyik műszer sem mutat dupla értéket, a két szám teljesen egyforma.',
        },
      ],
    },
    isCompleted: (ctx) =>
      (ctx.m3CircuitVerified || checkMission3Circuit(ctx)) &&
      MISSIONS[2].quiz !== undefined &&
      hasCorrectQuizAnswer('m3', MISSIONS[2].quiz, ctx.quizAnswers),
  },
  {
    id: 'm4',
    number: 4,
    tier: 'CORE',
    title: 'Merre mennek?',
    description:
      'Építs működő áramkört, és kapcsold be a fenti eszköztáron az „Elektronok” és az „Egyezményes áramirány” nézetet is! Figyeld meg a két irányt!',
    hints: [
      'A fölső eszköztáron kapcsold be az „Elektronok” és az „Egyezményes áramirány” gombot is.',
      'Kövesd az elem mínusz (−) és plusz (+) pólusától indulva, merre haladnak a ciánkék pöttyök és merre a narancssárga nyilak!',
    ],
    liveStatus: (ctx) =>
      `Világító izzók: ${ctx.solution.litBulbIds.length} · Elektronok: ${ctx.showElectrons ? 'be' : 'ki'} · Egyezményes: ${ctx.showConventional ? 'be' : 'ki'}`,
    isCircuitReady: (ctx) => ctx.m4CircuitVerified || checkMission4Circuit(ctx),
    quiz: {
      question: 'Mit mutat a szimuláció a fémvezetékben?',
      options: [
        {
          id: 'm4-a',
          text: 'Az elektronok a − pólustól a + felé mozognak, az egyezményes áramirány a + felől a − felé mutat.',
          isCorrect: true,
          feedback:
            'Remek! A fémvezetékben a negatív töltésű elektronok a − pólustól a + felé vándorolnak, az egyezményes áramirány pedig ezzel ellentétes (+ → −).',
        },
        {
          id: 'm4-b',
          text: 'Mindkettő a + pólustól a − felé mozog.',
          isCorrect: false,
          feedback:
            'Jó gondolat, de nézd meg közelről a ciánkék pöttyöket és a narancssárga nyilakat ugyanazon a vezetéken! Egymással szemben vagy egy irányba haladnak?',
        },
        {
          id: 'm4-c',
          text: 'Az elektronok a + felől a − felé mozognak, az egyezményes irány fordítva.',
          isCorrect: false,
          feedback:
            'Jó gondolat, de nézd meg újra az elem kék (−) és piros (+) végét! A ciánkék elektronok a kék (−) pólustól indulnak kifelé.',
        },
      ],
    },
    isCompleted: (ctx) =>
      (ctx.m4CircuitVerified || checkMission4Circuit(ctx)) &&
      MISSIONS[3].quiz !== undefined &&
      hasCorrectQuizAnswer('m4', MISSIONS[3].quiz, ctx.quizAnswers),
  },
  {
    id: 'm5',
    number: 5,
    tier: 'CHALLENGE',
    title: 'Hibakereső',
    description:
      'Töltsd be egymás után mindhárom hibás áramkört, keresd meg a hibát és javítsd ki úgy, hogy az izzó rövidzárlat nélkül világítson!',
    hints: [
      'Nézd meg alul az állapotsort: mindig elárulja, hogy nyitva van-e a kapcsoló, hiányzik-e vezeték, vagy rövidzárlat történt.',
      'A felesleges rövidzárlati vezetéket kattintással jelöld ki, majd a „Töröl” gombbal vagy a Delete billentyűvel távolítsd el.',
    ],
    liveStatus: (ctx) => `Javított áramkörök: ${ctx.m5FixedFaults.length}/3`,
    faultPresets: MISSION5_FAULTS,
    isCompleted: (ctx) => ctx.m5FixedFaults.length >= 3,
  },
  {
    id: 'm6',
    number: 6,
    tier: 'CHALLENGE',
    title: 'Rövidzárlat',
    description:
      'Kösd össze egy vezetékkel közvetlenül az elem két pólusát, figyeld meg a hatását, majd válaszolj a kérdésre!',
    hints: [
      'Helyezz egy Elemet a munkalapra (ha még nincs), majd húzz vezetéket a − pólustól közvetlenül a + pólusig.',
      'Figyeld meg a piros villogást és az állapotsorban megjelenő áramerősséget, majd válaszolj a kérdésre!',
    ],
    liveStatus: (ctx) =>
      ctx.m6SawShortCircuit || ctx.solution.isShortCircuit
        ? 'Rövidzárlat észlelve! Válaszolj az alábbi kérdésre.'
        : 'Még nem történt rövidzárlat a munkalapon.',
    isCircuitReady: (ctx) => ctx.m6SawShortCircuit || ctx.solution.isShortCircuit,
    quiz: {
      question:
        'Mi történik a valóságban, ha az elem két pólusát egy vezetékkel közvetlenül összekötjük?',
      options: [
        {
          id: 'm6-a',
          text: 'Nagyon nagy áram folyik, a vezeték és az elem felmelegszik, akár tüzet is okozhat.',
          isCorrect: true,
          feedback:
            'Teljesen igaz! Izzó vagy más fogyasztó nélkül nincs ellenállás, amely fékezné az áramot, ezért a nagy hőfejlődés tűzveszélyes.',
        },
        {
          id: 'm6-b',
          text: 'Nem folyik áram, mert nincs izzó az áramkörben.',
          isCorrect: false,
          feedback:
            'Jó gondolat, de nézd meg a pirosan villogó áramkört és az állapotsort! Fogyasztó nélkül is záródik a kör, sőt sokkal nagyobb áram indul meg.',
        },
        {
          id: 'm6-c',
          text: 'Az elem feltöltődik és tovább bírja.',
          isCorrect: false,
          feedback:
            'Jó gondolat, de nézd meg a „FORRÓ!” figyelmeztetést! A hatalmas áramerősség gyorsan lemeríti és veszélyesen felmelegíti az elemet.',
        },
      ],
    },
    isCompleted: (ctx) =>
      (ctx.m6SawShortCircuit || ctx.solution.isShortCircuit) &&
      MISSIONS[5].quiz !== undefined &&
      hasCorrectQuizAnswer('m6', MISSIONS[5].quiz, ctx.quizAnswers),
  },
  {
    id: 'm7',
    number: 7,
    tier: 'EXPERT',
    title: 'Két izzó, egy kapcsoló',
    description:
      'Építs olyan áramkört, amelyben két izzó világít egyszerre, és van egy olyan kapcsoló, amelyet kinyitva mindkét izzó kialszik!',
    hints: [
      'A kapcsolót a főágba kell tenned (közvetlenül az elem egyik pólusa mellé), hogy az egész áramkört megszakítsa.',
      'Két izzót köthetsz sorban vagy párhuzamosan is, a lényeg, hogy a kapcsoló mindkettő áramát megszakítsa.',
    ],
    liveStatus: (ctx) =>
      `Világító izzók: ${ctx.solution.litBulbIds.length}/2 · Főkapcsoló kész: ${checkMission7Condition(ctx) ? 'igen' : 'még nem'}`,
    isCompleted: (ctx) => checkMission7Condition(ctx),
  },
  {
    id: 'm8',
    number: 8,
    tier: 'EXPERT',
    title: 'Külön kapcsolható',
    description:
      'Építs elágazó (párhuzamos) áramkört két izzóval úgy, hogy mindkettő világítson, de legyen egy kapcsoló, amelyet kinyitva pontosan az egyik izzó alszik ki, a másik tovább világít!',
    hints: [
      'Használj két külön ágat (párhuzamos kapcsolás): mindkét ág kapcsolódjon az elem + és − pólusához.',
      'Helyezz egy kapcsolót csak az egyik izzó saját ágába, így a másik ág zárt marad, amikor ezt kinyitod!',
    ],
    liveStatus: (ctx) =>
      `Világító izzók: ${ctx.solution.litBulbIds.length}/2 · Ágkapcsoló kész: ${checkMission8Condition(ctx) ? 'igen' : 'még nem'}`,
    isCompleted: (ctx) => checkMission8Condition(ctx),
  },
];
