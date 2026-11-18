export function formatDecimalHu(value: number, decimals = 2): string {
  const safe = Math.abs(value) < 1e-9 ? 0 : value;
  return safe.toFixed(decimals).replace('.', ',');
}

export function formatCurrentHu(amperes: number, decimals = 2): string {
  return `${formatDecimalHu(Math.abs(amperes), decimals)} A`;
}

export function formatVoltageHu(volts: number, decimals = 1): string {
  return `${formatDecimalHu(volts, decimals)} V`;
}

export const HU = {
  appTitle: 'Áramkör-labor',
  appSubtitle: 'Az áram útja',
  toolbar: {
    addPrefix: '＋',
    rotate: 'Forgat',
    rotateAria: 'Kijelölt alkatrész elforgatása 90 fokkal (R)',
    delete: 'Töröl',
    deleteAria: 'Kijelölt elem törlése (Delete)',
    clearBoard: 'Új munkalap',
    clearBoardAria: 'Munkalap kiürítése és új áramkör kezdése',
    viewReal: 'Valódi nézet',
    viewSchematic: 'Kapcsolási rajz',
    viewToggleAria: 'Nézet váltása valódi nézet és kapcsolási rajz között',
    electrons: 'Elektronok',
    electronsAria: 'Elektronok mozgásának megjelenítése vagy elrejtése',
    conventional: 'Egyezményes áramirány',
    conventionalAria: 'Egyezményes áramirány nyilainak megjelenítése vagy elrejtése',
    paletteGroupAria: 'Alkatrészek hozzáadása a munkalapra',
    actionsGroupAria: 'Munkalap műveletek',
    viewsGroupAria: 'Megjelenítési beállítások',
  },
  components: {
    battery: 'Elem',
    bulb: 'Izzó',
    switch: 'Kapcsoló',
    ammeter: 'Ampermérő',
    voltmeter: 'Voltmérő',
    switchOn: 'be',
    switchOff: 'ki',
    hotWarning: 'FORRÓ!',
  },
  board: {
    ariaLabel: 'Interaktív áramköri munkalap',
    emptyHint: 'Kezdd az Elem és az Izzó hozzáadásával!',
    emptySubHint: 'Húzd össze a csatlakozópontokat vezetékekkel, és figyeld meg az elektronok útját.',
  },
  status: {
    noBattery:
      'Először tegyél a munkalapra egy elemet a palettáról, hogy legyen áramforrás az áramkörben.',
    shortCircuit: (currentText: string) =>
      `Rövidzárlat! Az elem két pólusa között szinte akadálytalanul hatalmas áram folyik (${currentText}). A vezeték és az elem a valóságban felforrósodna!`,
    closedSingleBulb: (currentText: string) =>
      `Zárt áramkör. Az áram erőssége: ${currentText}. Az izzó világít.`,
    closedMultipleBulbs: (currentText: string, count: number) =>
      `Zárt áramkör. Az áram erőssége: ${currentText}. ${count} izzó világít.`,
    closedNoBulb: (currentText: string) =>
      `Zárt áramkör. Az áram erőssége: ${currentText}.`,
    switchOpen:
      'A kapcsoló nyitva, ezért az áramkör megszakadt. Kattints a kapcsolóra a zárásához!',
    openCircuit:
      'Nyitott áramkör: az elem egyik pólusától nincs összefüggő út a másikig. Kösd össze a csatlakozókat vezetékekkel!',
  },
  missionsUi: {
    panelTitle: 'Küldetések',
    headerProgress: (done: number, total: number, coreDone: number, coreTotal: number) =>
      `Teljesítve: ${done}/${total} · CORE: ${coreDone}/${coreTotal}`,
    resetProgress: 'Haladás törlése',
    resetProgressAria: 'Összes küldetés haladásának törlése',
    hintButton: (step: number) => (step === 0 ? 'Tipp (1/2)' : step === 1 ? 'Tipp (2/2)' : 'Tippek láthatók'),
    hintButtonAria: 'Segítő tipp megjelenítése az aktuális küldetéshez',
    hintLabel: (index: number) => `${index}. tipp:`,
    completedBanner: '✔ Küldetés teljesítve! Mutasd meg a tanárnak a képernyőt.',
    nextMission: 'Következő küldetés',
    nextMissionAria: 'Ugrás a következő küldetésre',
    quizPromptTitle: 'Ellenőrző kérdés:',
    quizLockedNote: 'Először állítsd össze a fenti áramkört, utána válaszolhatsz a kérdésre.',
    faultsTitle: 'Válassz hibás áramkört a javításhoz:',
    faultFixedTag: 'Javítva',
    faultRemainingTag: 'Hibás',
  },
  legend: {
    title: 'Jelmagyarázat',
    electrons: 'Elektronok (− → +): a fém vezetékben mozgó negatív töltések',
    conventional: 'Egyezményes áramirány (+ → −): történelmi megállapodás szerinti irány',
    terminalSnap: 'Zöld karika: érvényes csatlakozási célpont vezetékhúzáskor',
    shortCircuit: 'Piros villogás: rövidzárlat, veszélyesen nagy áramerősség',
    shortcuts: 'Billentyűk: R = forgatás · Delete = törlés · Esc = kijelölés törlése',
  },
  propertiesPanel: {
    title: 'Tulajdonságok',
    disabledNote: 'Az Ohm-törvény eszköztár ebben a modulban ki van kapcsolva.',
  },
} as const;
