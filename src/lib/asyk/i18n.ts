import type { SkinId } from "./skins";

export type Lang = "kk" | "ru" | "en";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "kk", label: "Қазақша" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

interface Dict {
  title: string;
  subtitle: string;
  play: string;
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
  modes: string;
  modeFree: string;
  modeFreeDesc: string;
  modeCampaign: string;
  modeCampaignDesc: string;
  modePvp: string;
  modePvpDesc: string;
  modeAlshy: string;
  modeAlshyDesc: string;
  level: string;
  levels: string;
  shop: string;
  album: string;
  records: string;
  coins: string;
  buy: string;
  equip: string;
  equipped: string;
  locked: string;
  unlockAt: string;
  time: string;
  player: string;
  turn: string;
  knocked: string;
  pvpWinner: string;
  next: string;
  earned: string;
  rank: string;
  yourName: string;
  noRecords: string;
  back: string;
  facesTitle: string;
  facesText: string;
  skinName: Record<SkinId, string>;
  skinDesc: Record<SkinId, string>;
  levelHints: string[];
  albumCards: { title: string; text: string }[];
}

export const T: Record<Lang, Dict> = {
  kk: {
    title: "Асық ату",
    subtitle: "Ұлттық дәстүрлі ойын",
    play: "Ойнау",
    about: "Дәстүр туралы",
    aboutTitle: "Асық ату туралы",
    aboutText:
      "Асық ату — қазақтың ежелгі балалар ойыны. Қой мен ешкінің тобық сүйегі — асық ойын құралы болған. Ойыншылар шеңбер сызып, ішіне асықтарды тізеді де, ауыр «сақа» асықпен оларды шеңберден ұрып шығаруға тырысады. Сақаны қорғасынмен толтырып ауырлату кең тараған әдіс еді.",
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
    howToText: "Сақаны басып артқа тартыңыз, доға мен түсу нүктесі шығады. Жіберіңіз — сақа асықтардың үстінен ұшып, жерге түскенде соғады.",
    modes: "Ойын түрі",
    modeFree: "Еркін ойын",
    modeFreeDesc: "5 асық, 5 атыс",
    modeCampaign: "Жорық",
    modeCampaignDesc: "12 деңгей: тастар, жел, уақыт",
    modePvp: "Досыммен",
    modePvpDesc: "Бір құрылғыда кезекпен, 5 раунд",
    modeAlshy: "Алшы",
    modeAlshyDesc: "Сақа алшы түссе ғана ұпай",
    level: "Деңгей",
    levels: "Деңгейлер",
    shop: "Дүкен",
    album: "Альбом",
    records: "Рекордтар",
    coins: "теңге",
    buy: "Сатып алу",
    equip: "Таңдау",
    equipped: "Таңдалды",
    locked: "Жабық",
    unlockAt: "Ашылады: деңгей",
    time: "Уақыт",
    player: "Ойыншы",
    turn: "Кезек",
    knocked: "асық",
    pvpWinner: "жеңді!",
    next: "Келесі деңгей",
    earned: "Табыс",
    rank: "Орын",
    yourName: "Атыңыз",
    noRecords: "Әзірге рекорд жоқ",
    back: "Артқа",
    facesTitle: "Асық жақтары",
    facesText: "Алшы — ×3 (сирек), Тәйке — ×2, Бүк пен Шік — қалыпты ұпай.",
    skinName: { wood: "Ағаш сақа", lead: "Қорғасын сақа", neon: "Алтын неон сақа", cyber: "Кибер сақа" },
    skinDesc: {
      wood: "Негізгі, теңгерімді",
      lead: "Ауыр әрі күшті, жақынға түседі",
      neon: "Жарқыраған ізі бар",
      cyber: "Жылдам, неон ізді",
    },
    levelHints: ["3 асық", "Тастар", "Жел", "30 секунд", "Қозғалатын асықтар", "Тас + жел", "Қатты жел", "Қозғалыс + тас", "Уақыт + жел", "6 асық", "Дауыл", "Бәрі бірге"],
    albumCards: [
      { title: "Асық", text: "Қойдың тобық сүйегі. Әр баланың асық салатын қалтасы болған." },
      { title: "Сақа", text: "Ең ірі әрі ауыр асық. Оны қорғасынмен толтырып, бояп әсемдеген." },
      { title: "Төрт жақ", text: "Алшы, тәйке, бүк, шік — асықтың төрт жағы, ойынның тілі." },
      { title: "Шеңбер", text: "Асықтар тізілетін сызық. Шеңберден шыққан асық — атқанның олжасы." },
      { title: "Қызыл асық", text: "Ерекше асықтарды қызылға бояп, тұмар ретінде сақтаған." },
      { title: "Хан", text: "Ойынның бір түрі: ең мерген бала «хан» атанған." },
      { title: "Мергендік", text: "Асық ату көзмөлшер мен шыдамдылықты шыңдайды." },
      { title: "Ұрпақ мұрасы", text: "Бұл ойын ғасырлар бойы атадан балаға жалғасып келеді." },
    ],
  },
  ru: {
    title: "Асық ату",
    subtitle: "Казахская народная игра",
    play: "Играть",
    about: "О традиции",
    aboutTitle: "Об игре Асық ату",
    aboutText:
      "Асық ату — древняя казахская игра. Асык — надкопытная косточка овцы или козы. Игроки чертят круг, выставляют в нём асыки и выбивают их тяжёлой битой — «сақа». Сақа часто утяжеляли свинцом, чтобы удар был сильнее.",
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
    howToText: "Зажмите сақа и оттяните назад — появится дуга и точка приземления. Отпустите: сақа летит над асыками и бьёт их при снижении.",
    modes: "Режим",
    modeFree: "Свободная игра",
    modeFreeDesc: "5 асыков, 5 бросков",
    modeCampaign: "Кампания",
    modeCampaignDesc: "12 уровней: камни, ветер, таймер",
    modePvp: "С другом",
    modePvpDesc: "По очереди на одном устройстве, 5 раундов",
    modeAlshy: "Алшы",
    modeAlshyDesc: "Очки — только если сақа встал в алшы",
    level: "Уровень",
    levels: "Уровни",
    shop: "Магазин",
    album: "Альбом",
    records: "Рекорды",
    coins: "тенге",
    buy: "Купить",
    equip: "Выбрать",
    equipped: "Выбран",
    locked: "Закрыто",
    unlockAt: "Откроется: уровень",
    time: "Время",
    player: "Игрок",
    turn: "Ход",
    knocked: "асык.",
    pvpWinner: "победил!",
    next: "Следующий уровень",
    earned: "Заработано",
    rank: "Место",
    yourName: "Ваше имя",
    noRecords: "Рекордов пока нет",
    back: "Назад",
    facesTitle: "Грани асыка",
    facesText: "Алшы — ×3 (редко), Тәйке — ×2, Бүк и Шік — обычные очки.",
    skinName: { wood: "Деревянный сақа", lead: "Свинцовый сақа", neon: "Золотой неон", cyber: "Киберпанк сақа" },
    skinDesc: {
      wood: "Базовый, сбалансированный",
      lead: "Тяжёлый и мощный, летит короче",
      neon: "Светящийся шлейф в полёте",
      cyber: "Быстрый, неоновый след",
    },
    levelHints: ["3 асыка", "Камни", "Ветер", "30 секунд", "Движущиеся асыки", "Камни + ветер", "Сильный ветер", "Движение + камни", "Время + ветер", "6 асыков", "Буря", "Всё сразу"],
    albumCards: [
      { title: "Асык", text: "Надкопытная кость овцы. У каждого мальчика был мешочек для асыков." },
      { title: "Сақа", text: "Самый крупный и тяжёлый асык. Его заливали свинцом и красили." },
      { title: "Четыре грани", text: "Алшы, тәйке, бүк, шік — четыре стороны асыка и язык игры." },
      { title: "Круг", text: "Линия, в которой выставляют асыки. Выбитый асык достаётся игроку." },
      { title: "Красный асык", text: "Особые асыки красили в красный и хранили как оберег." },
      { title: "Хан", text: "Самого меткого игрока называли «ханом»." },
      { title: "Меткость", text: "Игра развивает глазомер, точность и терпение." },
      { title: "Наследие", text: "Игра веками передаётся от отцов к детям." },
    ],
  },
  en: {
    title: "Asyk Atu",
    subtitle: "Kazakh traditional game",
    play: "Play",
    about: "About the tradition",
    aboutTitle: "About Asyk Atu",
    aboutText:
      "Asyk Atu is an ancient Kazakh game played with sheep ankle bones. Players draw a circle, line up the asyks and knock them out with a heavier striker bone called a saka, often filled with lead.",
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
    howToText: "Press the saka and drag back — an arc and a landing spot appear. Release: it flies over the asyks and hits them as it comes down.",
    modes: "Mode",
    modeFree: "Free play",
    modeFreeDesc: "5 asyks, 5 throws",
    modeCampaign: "Campaign",
    modeCampaignDesc: "12 levels: stones, wind, timer",
    modePvp: "Vs a friend",
    modePvpDesc: "Take turns on one device, 5 rounds",
    modeAlshy: "Alshy",
    modeAlshyDesc: "Score only if the saka lands alshy",
    level: "Level",
    levels: "Levels",
    shop: "Shop",
    album: "Album",
    records: "Records",
    coins: "tenge",
    buy: "Buy",
    equip: "Equip",
    equipped: "Equipped",
    locked: "Locked",
    unlockAt: "Unlocks at level",
    time: "Time",
    player: "Player",
    turn: "Turn",
    knocked: "asyks",
    pvpWinner: "wins!",
    next: "Next level",
    earned: "Earned",
    rank: "Rank",
    yourName: "Your name",
    noRecords: "No records yet",
    back: "Back",
    facesTitle: "Asyk faces",
    facesText: "Alshy — ×3 (rare), Taike — ×2, Buk and Shik — normal points.",
    skinName: { wood: "Wooden saka", lead: "Lead saka", neon: "Golden neon", cyber: "Cyberpunk saka" },
    skinDesc: {
      wood: "Basic and balanced",
      lead: "Heavy and powerful, shorter flight",
      neon: "Glowing trail in flight",
      cyber: "Fast, neon trail",
    },
    levelHints: ["3 asyks", "Stones", "Wind", "30 seconds", "Moving asyks", "Stones + wind", "Strong wind", "Moving + stones", "Timer + wind", "6 asyks", "Gale", "Everything"],
    albumCards: [
      { title: "Asyk", text: "A sheep's ankle bone. Every boy kept a pouch of asyks." },
      { title: "Saka", text: "The largest, heaviest bone — often filled with lead and painted." },
      { title: "Four faces", text: "Alshy, taike, buk, shik — the four sides and the language of the game." },
      { title: "The circle", text: "Asyks are lined up inside; any knocked out belongs to the thrower." },
      { title: "Red asyk", text: "Special asyks were dyed red and kept as charms." },
      { title: "Khan", text: "The most accurate player was called the “khan”." },
      { title: "Accuracy", text: "The game trains judgement of distance and patience." },
      { title: "Heritage", text: "Passed from fathers to children for centuries." },
    ],
  },
};
