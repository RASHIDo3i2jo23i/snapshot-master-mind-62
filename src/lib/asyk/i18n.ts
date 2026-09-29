export type Lang = "kk" | "ru" | "en";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "kk", label: "Қазақша" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

type Dict = {
  title: string;
  subtitle: string;
  play: string;
  chooseSaka: string;
  sakaNormal: string;
  sakaNormalDesc: string;
  sakaLead: string;
  sakaLeadDesc: string;
  about: string;
  aboutTitle: string;
  aboutText: string;
  close: string;
  best: string;
  score: string;
  throws: string;
  menu: string;
  sound: string;
  win: string;
  lose: string;
  yourScore: string;
  newRecord: string;
  again: string;
  toMenu: string;
  howTo: string;
  howToText: string;
  bonusThrow: string;
};

export const T: Record<Lang, Dict> = {
  kk: {
    title: "Асық ату",
    subtitle: "Ұлттық дәстүрлі ойын",
    play: "Ойнау",
    chooseSaka: "Сақаңды таңда",
    sakaNormal: "Қарапайым сақа",
    sakaNormalDesc: "Теңгерімді салмақ, алысқа ұшады",
    sakaLead: "Қорғасын сақа",
    sakaLeadDesc: "Ауыр әрі күшті, бірақ жақынға түседі",
    about: "Дәстүр туралы",
    aboutTitle: "Асық ату туралы",
    aboutText:
      "Асық ату — қазақтың ежелгі балалар ойыны. Қой мен ешкінің тобық сүйегі — асық ойын құралы болған. Ойыншылар шеңбер сызып, ішіне асықтарды тізеді де, ауыр «сақа» асықпен оларды шеңберден ұрып шығаруға тырысады. Сақаны қорғасынмен толтырып ауырлату кең тараған әдіс еді. Ойын дәлдікті, көзмөлшерді және шыдамдылықты шыңдайды, ұрпақтан ұрпаққа жалғасып келеді.",
    close: "Жабу",
    best: "Рекорд",
    score: "Ұпай",
    throws: "Атыс",
    menu: "Мәзір",
    sound: "Дыбыс",
    win: "Жеңіс!",
    lose: "Ойын аяқталды",
    yourScore: "Сіздің ұпайыңыз",
    newRecord: "Жаңа рекорд!",
    again: "Қайта ойнау",
    toMenu: "Мәзірге",
    howTo: "Қалай ойнау керек",
    howToText:
      "Сақаны басып тұрып артқа тартыңыз — бағыт пен күшті көрсететін доға пайда болады. Жіберіңіз: сақа ауада доғамен ұшады, жерге түскен соң асықтарды соғады. Шеңберден шыққан әр асық — ұпай.",
    bonusThrow: "+1 атыс",
  },
  ru: {
    title: "Асық ату",
    subtitle: "Казахская народная игра",
    play: "Играть",
    chooseSaka: "Выбери сақа",
    sakaNormal: "Обычный сақа",
    sakaNormalDesc: "Сбалансированный, летит дальше",
    sakaLead: "Қорғасын сақа",
    sakaLeadDesc: "Тяжёлый и мощный, но траектория короче",
    about: "О традиции",
    aboutTitle: "Об игре Асық ату",
    aboutText:
      "Асық ату — древняя казахская игра. Асык — это надкопытная косточка овцы или козы. Игроки чертят круг, выставляют в нём асыки и по очереди выбивают их тяжёлой битой — «сақа». Сақа часто утяжеляли свинцом, чтобы удар был сильнее. Игра развивает меткость, глазомер и терпение и передаётся из поколения в поколение.",
    close: "Закрыть",
    best: "Рекорд",
    score: "Очки",
    throws: "Броски",
    menu: "Меню",
    sound: "Звук",
    win: "Победа!",
    lose: "Игра окончена",
    yourScore: "Ваш счёт",
    newRecord: "Новый рекорд!",
    again: "Сыграть снова",
    toMenu: "В меню",
    howTo: "Как играть",
    howToText:
      "Зажмите сақа и оттяните назад — появится дуга полёта и точка приземления. Отпустите: сақа летит по воздуху над асыками и бьёт их при снижении. Каждый асык, вылетевший за круг, приносит очки.",
    bonusThrow: "+1 бросок",
  },
  en: {
    title: "Asyk Atu",
    subtitle: "Kazakh traditional game",
    play: "Play",
    chooseSaka: "Choose your saka",
    sakaNormal: "Regular saka",
    sakaNormalDesc: "Balanced weight, flies further",
    sakaLead: "Lead saka (Qorgasyn)",
    sakaLeadDesc: "Heavy and powerful, but shorter range",
    about: "About the tradition",
    aboutTitle: "About Asyk Atu",
    aboutText:
      "Asyk Atu is an ancient Kazakh game played with sheep or goat ankle bones. Players draw a circle, line up the asyks inside and take turns knocking them out with a heavier striker bone called a saka, often filled with lead for extra power. The game trains accuracy, judgement of distance and patience, and has been passed down for generations.",
    close: "Close",
    best: "Best",
    score: "Score",
    throws: "Throws",
    menu: "Menu",
    sound: "Sound",
    win: "Victory!",
    lose: "Game over",
    yourScore: "Your score",
    newRecord: "New record!",
    again: "Play again",
    toMenu: "Main menu",
    howTo: "How to play",
    howToText:
      "Press the saka and drag back — an arc and a landing spot appear. Release: the saka flies over the asyks and hits them as it comes down. Every asyk knocked out of the circle scores points.",
    bonusThrow: "+1 throw",
  },
};
