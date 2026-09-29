import { useCallback, useEffect, useRef, useState } from "react";
import { AsykEngine, type SakaKind, W, H } from "@/lib/asyk/engine";
import { Sfx } from "@/lib/asyk/audio";
import { LANGS, T, type Lang } from "@/lib/asyk/i18n";

type Screen = "menu" | "playing" | "result";

const LS_BEST = "asyk_best_score";
const LS_LANG = "asyk_lang";

export default function AsykGame() {
  const [lang, setLang] = useState<Lang>("kk");
  const [screen, setScreen] = useState<Screen>("menu");
  const [saka, setSaka] = useState<SakaKind>("normal");
  const [score, setScore] = useState(0);
  const [throwsLeft, setThrowsLeft] = useState(5);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [record, setRecord] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AsykEngine | null>(null);
  const sfxRef = useRef<Sfx | null>(null);

  const t = T[lang];

  useEffect(() => {
    try {
      const b = Number(localStorage.getItem(LS_BEST) ?? "0");
      if (!Number.isNaN(b)) setBest(b);
      const l = localStorage.getItem(LS_LANG) as Lang | null;
      if (l && LANGS.some((x) => x.code === l)) setLang(l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (!sfxRef.current) sfxRef.current = new Sfx();
    sfxRef.current.enabled = soundOn;
    if (!soundOn) sfxRef.current.stopWhistle();
  }, [soundOn]);

  const handleEnd = useCallback((win: boolean, finalScore: number) => {
    setWon(win);
    setScore(finalScore);
    setBest((prev) => {
      if (finalScore > prev) {
        setRecord(true);
        try {
          localStorage.setItem(LS_BEST, String(finalScore));
        } catch {
          /* ignore */
        }
        return finalScore;
      }
      setRecord(false);
      return prev;
    });
    setScreen("result");
  }, []);

  // mount the engine while playing
  useEffect(() => {
    if (screen !== "playing" || !canvasRef.current) return;
    const sfx = sfxRef.current ?? new Sfx();
    sfxRef.current = sfx;
    sfx.enabled = soundOn;
    const engine = new AsykEngine(canvasRef.current, saka, sfx, {
      onScore: setScore,
      onThrows: setThrowsLeft,
      onEnd: handleEnd,
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, saka]);

  useEffect(() => () => sfxRef.current?.dispose(), []);

  const startGame = () => {
    sfxRef.current?.resume();
    sfxRef.current?.click();
    setScore(0);
    setThrowsLeft(5);
    setRecord(false);
    setScreen("playing");
  };

  const pickLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LS_LANG, l);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-[#08383b] px-3 py-4 text-[#f4ecd8]">
      {/* top bar */}
      <div className="flex w-full max-w-[560px] items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-full border border-[#e2b75a]/40 bg-black/25 p-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => pickLang(l.code)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                lang === l.code ? "bg-[#e2b75a] text-[#08383b]" : "text-[#f4ecd8]/80 hover:text-[#f4ecd8]"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSoundOn((s) => !s)}
          className="rounded-full border border-[#e2b75a]/40 bg-black/25 px-3 py-1.5 text-xs font-semibold"
          aria-label={t.sound}
        >
          {soundOn ? "🔊" : "🔇"} {t.sound}
        </button>
      </div>

      {/* stage */}
      <div className="relative mt-3 w-full max-w-[560px]">
        <div
          className="relative overflow-hidden rounded-3xl border-4 border-[#e2b75a]/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {screen === "playing" ? (
            <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
          ) : (
            <div className="absolute inset-0 bg-[#0d4a4e]" />
          )}

          {screen === "playing" && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <Badge label={t.score} value={score} />
              <button
                onClick={() => setScreen("menu")}
                className="pointer-events-auto rounded-full border border-[#e2b75a]/60 bg-black/45 px-3 py-1.5 text-xs font-semibold"
              >
                {t.menu}
              </button>
              <Badge label={t.throws} value={throwsLeft} />
            </div>
          )}

          {screen === "menu" && (
            <Overlay>
              <Ornament />
              <h1 className="text-center font-serif text-4xl font-bold tracking-wide text-[#ffd766] drop-shadow sm:text-5xl">
                {t.title}
              </h1>
              <p className="mt-1 text-center text-sm text-[#bff0e4]">{t.subtitle}</p>
              <p className="mt-4 text-center text-xs text-[#f4ecd8]/70">
                {t.best}: <span className="font-bold text-[#ffd766]">{best}</span>
              </p>

              <p className="mt-5 text-center text-xs font-semibold uppercase tracking-widest text-[#7fe3d0]">
                {t.chooseSaka}
              </p>
              <div className="mt-2 grid w-full gap-2">
                <SakaCard
                  active={saka === "normal"}
                  onClick={() => setSaka("normal")}
                  title={t.sakaNormal}
                  desc={t.sakaNormalDesc}
                  tone="#e8d5a8"
                />
                <SakaCard
                  active={saka === "lead"}
                  onClick={() => setSaka("lead")}
                  title={t.sakaLead}
                  desc={t.sakaLeadDesc}
                  tone="#aab3bf"
                />
              </div>

              <button
                onClick={startGame}
                className="mt-5 w-full rounded-2xl bg-gradient-to-b from-[#ffd766] to-[#e2b75a] px-6 py-3 text-lg font-bold text-[#08383b] shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t.play}
              </button>
              <button
                onClick={() => setAboutOpen(true)}
                className="mt-2 rounded-xl border border-[#7fe3d0]/50 px-4 py-2 text-xs font-semibold text-[#bff0e4]"
              >
                {t.about}
              </button>
              <p className="mt-4 max-w-[340px] text-center text-[11px] leading-relaxed text-[#f4ecd8]/60">
                <span className="font-semibold text-[#7fe3d0]">{t.howTo}: </span>
                {t.howToText}
              </p>
            </Overlay>
          )}

          {screen === "result" && (
            <Overlay>
              <Ornament />
              <h2 className="font-serif text-4xl font-bold text-[#ffd766]">{won ? t.win : t.lose}</h2>
              <p className="mt-3 text-sm text-[#bff0e4]">{t.yourScore}</p>
              <p className="font-serif text-6xl font-bold text-[#f4ecd8]">{score}</p>
              {record && <p className="mt-2 text-sm font-bold text-[#ffd766]">★ {t.newRecord}</p>}
              <p className="mt-2 text-xs text-[#f4ecd8]/70">
                {t.best}: <span className="font-bold text-[#ffd766]">{best}</span>
              </p>
              <button
                onClick={startGame}
                className="mt-6 w-full max-w-[280px] rounded-2xl bg-gradient-to-b from-[#ffd766] to-[#e2b75a] px-6 py-3 text-lg font-bold text-[#08383b] shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t.again}
              </button>
              <button
                onClick={() => setScreen("menu")}
                className="mt-2 rounded-xl border border-[#7fe3d0]/50 px-4 py-2 text-xs font-semibold text-[#bff0e4]"
              >
                {t.toMenu}
              </button>
            </Overlay>
          )}
        </div>
      </div>

      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setAboutOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-[460px] overflow-y-auto rounded-3xl border-2 border-[#e2b75a] bg-[#0d4a4e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Ornament />
            <h3 className="text-center font-serif text-2xl font-bold text-[#ffd766]">{t.aboutTitle}</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#f4ecd8]/90">{t.aboutText}</p>
            <button
              onClick={() => setAboutOpen(false)}
              className="mt-6 w-full rounded-2xl bg-[#e2b75a] px-6 py-2.5 font-bold text-[#08383b]"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e2b75a]/60 bg-black/45 px-4 py-1.5 text-center">
      <div className="text-[10px] uppercase tracking-widest text-[#7fe3d0]">{label}</div>
      <div className="font-serif text-xl font-bold text-[#ffd766]">{value}</div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-[#0d4a4e] px-6 py-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_50%_30%,rgba(127,227,208,0.35),transparent_60%)]" />
      <div className="relative flex w-full max-w-[380px] flex-col items-center">{children}</div>
    </div>
  );
}

function Ornament() {
  return (
    <svg viewBox="0 0 200 26" className="mb-3 h-5 w-40 text-[#e2b75a]" fill="none" stroke="currentColor">
      <path d="M10 20c14 0 14-14 28-14s14 14 28 14 14-14 28-14 14 14 28 14 14-14 28-14 14 14 28 14" strokeWidth="2" />
    </svg>
  );
}

function SakaCard({
  active,
  onClick,
  title,
  desc,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
        active ? "border-[#ffd766] bg-[#ffd766]/10" : "border-[#7fe3d0]/25 bg-black/20"
      }`}
    >
      <span
        className="h-7 w-9 shrink-0 rounded-[45%] border border-black/30"
        style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${tone})` }}
      />
      <span>
        <span className="block text-sm font-bold text-[#f4ecd8]">{title}</span>
        <span className="block text-[11px] text-[#f4ecd8]/60">{desc}</span>
      </span>
    </button>
  );
}
