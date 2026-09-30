import { useCallback, useEffect, useRef, useState } from "react";
import { AsykEngine, type EndResult, type PvpState, W, H } from "@/lib/asyk/engine";
import { Sfx } from "@/lib/asyk/audio";
import { LANGS, T, type Lang } from "@/lib/asyk/i18n";
import { ALBUM_UNLOCK, ALSHY_LEVEL, FREE_LEVEL, LEVELS, PVP_LEVEL, formation, type Formation, type LevelDef, type ModeId } from "@/lib/asyk/levels";
import { SKINS, SKIN_IDS, type SkinId } from "@/lib/asyk/skins";
import { addRecord, DEFAULT_PROGRESS, loadProgress, saveProgress, unlockedLevel, type Progress } from "@/lib/asyk/progress";
import { Button } from "@/components/ui/button";

type Screen = "menu" | "levels" | "shop" | "album" | "records" | "playing" | "result";

const LS_LANG = "asyk_lang";

function levelFor(mode: ModeId, idx: number): LevelDef {
  if (mode === "campaign") return LEVELS[idx] ?? FREE_LEVEL;
  if (mode === "alshy") return ALSHY_LEVEL;
  if (mode === "pvp") return PVP_LEVEL;
  return FREE_LEVEL;
}

export default function AsykGame() {
  const [lang, setLang] = useState<Lang>("kk");
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<ModeId>("free");
  const [levelIdx, setLevelIdx] = useState(0);
  const [runId, setRunId] = useState(0);
  const [score, setScore] = useState(0);
  const [throwsLeft, setThrowsLeft] = useState(5);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pvp, setPvp] = useState<PvpState | null>(null);
  const [result, setResult] = useState<(EndResult & { stars: number; rank: number }) | null>(null);
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [soundOn, setSoundOn] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [recTab, setRecTab] = useState<ModeId>("free");
  const [albumCard, setAlbumCard] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sfxRef = useRef<Sfx | null>(null);
  const progressRef = useRef(progress);
  const freeLevelRef = useRef<LevelDef>(FREE_LEVEL);
  progressRef.current = progress;
  const t = T[lang];

  useEffect(() => {
    setProgress(loadProgress());
    try {
      const l = localStorage.getItem(LS_LANG) as Lang | null;
      if (l && LANGS.some((x) => x.code === l)) setLang(l);
    } catch {
      /* ignore */
    }
  }, []);

  const updateProgress = useCallback((p: Progress) => {
    setProgress(p);
    saveProgress(p);
  }, []);

  useEffect(() => {
    if (!sfxRef.current) sfxRef.current = new Sfx();
    sfxRef.current.enabled = soundOn;
    if (!soundOn) sfxRef.current.stopWhistle();
  }, [soundOn]);

  const handleEnd = useCallback(
    (r: EndResult) => {
      let p = { ...progressRef.current, coins: progressRef.current.coins + r.coins };
      let stars = 0;
      let rank = 0;
      if (mode === "campaign" && r.win) {
        stars = 1 + (r.throwsLeft >= 1 ? 1 : 0) + (r.throwsLeft >= 2 ? 1 : 0);
        const n = levelIdx + 1;
        p = { ...p, stars: { ...p.stars, [n]: Math.max(p.stars[n] ?? 0, stars) } };
      }
      const recordedScore = mode === "pvp" && r.pvp
        ? Math.max(...r.pvp.knocked) * 100 + Math.max(...r.pvp.points)
        : r.score;
      if (recordedScore > 0) {
        const res = addRecord(p, mode, recordedScore, T[lang].player);
        p = res.progress;
        rank = res.rank;
      }
      updateProgress(p);
      setResult({ ...r, stars, rank });
      setScreen("result");
    },
    [mode, levelIdx, lang, updateProgress],
  );

  useEffect(() => {
    if (screen !== "playing" || !canvasRef.current) return;
    const sfx = sfxRef.current ?? new Sfx();
    sfxRef.current = sfx;
    sfx.enabled = soundOn;
    const engine = new AsykEngine(
      canvasRef.current,
      { mode, level: mode === "free" ? freeLevelRef.current : levelFor(mode, levelIdx), skin: progressRef.current.skin },
      sfx,
      { onScore: setScore, onThrows: setThrowsLeft, onTime: setTimeLeft, onPvp: setPvp, onEnd: handleEnd },
    );
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, runId]);

  useEffect(() => () => sfxRef.current?.dispose(), []);

  const start = (m: ModeId, idx = 0) => {
    sfxRef.current?.resume();
    sfxRef.current?.click();
    if (m === "free") {
      const shapes: Formation[] = ["ring", "line", "arc", "diamond", "clusters", "spiral"];
      const shape = shapes[Math.floor(Math.random() * shapes.length)] ?? "ring";
      const count = 3 + Math.floor(Math.random() * 6);
      freeLevelRef.current = { asyks: formation(count, shape, true), throws: Math.max(5, count) };
    }
    setMode(m);
    setLevelIdx(idx);
    setScore(0);
    setThrowsLeft(m === "free" ? freeLevelRef.current.throws : levelFor(m, idx).throws);
    setPvp(null);
    setTimeLeft(null);
    setRunId((n) => n + 1);
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

  const go = (s: Screen) => {
    sfxRef.current?.click();
    setScreen(s);
  };

  const unlocked = unlockedLevel(progress);
  const bestFree = progress.records.free?.[0]?.score ?? 0;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center bg-[#08383b] px-2 py-2 text-[#f4ecd8] sm:px-3 sm:py-4">
      <div className="grid w-full max-w-[560px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-[#e2b75a]/40 bg-black/25 p-1">
          {LANGS.map((l) => (
            <Button
              key={l.code}
              onClick={() => pickLang(l.code)}
              className={`min-w-0 flex-1 rounded-full px-1.5 py-1 text-[10px] font-semibold transition-colors sm:px-3 sm:text-xs ${
                lang === l.code ? "bg-[#e2b75a] text-[#08383b]" : "text-[#f4ecd8]/80 hover:text-[#f4ecd8]"
              }`}
            >
              {l.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-full border border-[#e2b75a]/40 bg-black/25 px-2 py-1.5 text-xs font-bold text-[#ffd766]">
            ◈ {progress.coins}
          </span>
          <Button
            onClick={() => setSoundOn((s) => !s)}
            className="h-8 w-8 shrink-0 rounded-full border border-[#e2b75a]/40 bg-black/25 p-0 text-xs font-semibold"
            aria-label={t.sound}
          >
            {soundOn ? "🔊" : "🔇"}
          </Button>
        </div>
      </div>

      <div className="relative mt-3 w-full max-w-[560px]">
        <div
          className={`relative overflow-hidden rounded-lg border-2 border-[#e2b75a]/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)] ${screen !== "playing" ? "min-h-[calc(100dvh-76px)] sm:min-h-0" : ""}`}
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {screen === "playing" ? (
            <canvas key={runId} ref={canvasRef} className="block h-full w-full touch-none select-none" />
          ) : (
            <div className="absolute inset-0 bg-[#0d4a4e]" />
          )}

          {screen === "playing" && (
            <div className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-1 p-2 sm:gap-2 sm:p-3">
              {mode === "pvp" && pvp ? (
                <>
                   <Badge label={`${pvp.turn === 0 ? "🎯 " : ""}${t.player} 1`} value={`${pvp.knocked[0]} / ${pvp.left[0]}`} active={pvp.turn === 0} />
                   <MenuBtn onClick={() => go("menu")} label={t.menu} />
                   <Badge label={`${pvp.turn === 1 ? "🎯 " : ""}${t.player} 2`} value={`${pvp.knocked[1]} / ${pvp.left[1]}`} active={pvp.turn === 1} />
                </>
              ) : (
                <>
                  <Badge label={t.score} value={score} />
                  <div className="flex flex-col items-center gap-1">
                    <MenuBtn onClick={() => go("menu")} label={t.menu} />
                    {mode === "campaign" && (
                      <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-[#7fe3d0]">
                        {t.level} {levelIdx + 1}
                      </span>
                    )}
                    {timeLeft !== null && (
                      <span className={`rounded-full bg-black/55 px-3 py-0.5 font-serif text-lg font-bold ${timeLeft <= 5 ? "text-[#ff8a7a]" : "text-[#ffd766]"}`}>
                        ⏱ {timeLeft}
                      </span>
                    )}
                  </div>
                  <Badge label={t.throws} value={throwsLeft} />
                </>
              )}
            </div>
          )}
          {screen === "playing" && mode === "pvp" && pvp && (
            <div className="pointer-events-none absolute inset-x-0 top-[8%] flex justify-center">
              <span className="rounded bg-[#08383b]/90 px-4 py-1.5 text-sm font-black text-[#ffd766] shadow-lg sm:text-lg">
                🎯 {t.turn}: {t.player} {pvp.turn + 1}
              </span>
            </div>
          )}

          {screen === "menu" && (
            <Overlay>
              <Ornament />
              <h1 className="text-center font-serif text-4xl font-bold tracking-wide text-[#ffd766] drop-shadow sm:text-5xl">{t.title}</h1>
              <p className="mt-1 text-center text-sm text-[#bff0e4]">{t.subtitle}</p>
              <p className="mt-2 text-center text-xs text-[#f4ecd8]/70">
                {t.best}: <span className="font-bold text-[#ffd766]">{bestFree}</span> · {t.skinName[progress.skin]}
              </p>
              <div className="mt-4 grid w-full gap-2">
                 <ModeCard title={t.modeFree} desc={t.modeFreeDesc} onClick={() => start("free")} primary />
                <ModeCard title={t.modeCampaign} desc={t.modeCampaignDesc} onClick={() => go("levels")} />
                <ModeCard title={t.modePvp} desc={t.modePvpDesc} onClick={() => start("pvp")} />
                <ModeCard title={t.modeAlshy} desc={t.modeAlshyDesc} onClick={() => start("alshy")} />
              </div>
              <div className="mt-3 grid w-full grid-cols-3 gap-2">
                <SmallBtn onClick={() => go("shop")}>{t.shop}</SmallBtn>
                <SmallBtn onClick={() => go("album")}>{t.album}</SmallBtn>
                <SmallBtn onClick={() => go("records")}>{t.records}</SmallBtn>
              </div>
               <Button onClick={() => setAboutOpen(true)} className="mt-2 h-auto bg-transparent p-1 text-xs font-semibold text-[#7fe3d0] underline-offset-2 hover:underline">
                {t.about}
               </Button>
            </Overlay>
          )}

          {screen === "levels" && (
            <Overlay>
              <h2 className="font-serif text-3xl font-bold text-[#ffd766]">{t.levels}</h2>
              <div className="mt-4 grid w-full grid-cols-3 gap-2">
                {LEVELS.map((_, i) => {
                  const n = i + 1;
                  const open = n <= unlocked;
                  const st = progress.stars[n] ?? 0;
                  return (
                     <Button
                      key={n}
                      disabled={!open}
                      onClick={() => start("campaign", i)}
                       className={`h-auto min-h-19 min-w-0 flex-col gap-0 rounded border-2 px-1 py-2 text-center transition-colors ${
                        open ? "border-[#e2b75a]/70 bg-black/25 hover:bg-[#ffd766]/10" : "border-white/10 bg-black/30 opacity-45"
                      }`}
                    >
                      <div className="font-serif text-2xl font-bold text-[#ffd766]">{open ? n : "🔒"}</div>
                       <div className="w-full text-[10px] leading-tight text-[#bff0e4]">{t.levelHints[i]}</div>
                      <div className="mt-1 text-xs tracking-widest text-[#ffd766]">
                        {"★".repeat(st)}
                        <span className="text-white/25">{"★".repeat(3 - st)}</span>
                      </div>
                     </Button>
                  );
                })}
              </div>
              <BackBtn onClick={() => go("menu")} label={t.back} />
            </Overlay>
          )}

          {screen === "shop" && (
            <Overlay>
              <h2 className="font-serif text-3xl font-bold text-[#ffd766]">{t.shop}</h2>
              <p className="mt-1 text-sm text-[#ffd766]">◈ {progress.coins} {t.coins}</p>
              <div className="mt-4 grid w-full gap-2">
                {SKIN_IDS.map((id) => (
                  <SkinRow
                    key={id}
                    id={id}
                    name={t.skinName[id]}
                    desc={t.skinDesc[id]}
                    owned={progress.owned.includes(id)}
                    equipped={progress.skin === id}
                    canBuy={progress.coins >= SKINS[id].price}
                    labels={{ buy: t.buy, equip: t.equip, equipped: t.equipped, coins: t.coins }}
                    onBuy={() => {
                      sfxRef.current?.chime(true);
                      updateProgress({ ...progress, coins: progress.coins - SKINS[id].price, owned: [...progress.owned, id], skin: id });
                    }}
                    onEquip={() => updateProgress({ ...progress, skin: id })}
                  />
                ))}
              </div>
              <BackBtn onClick={() => go("menu")} label={t.back} />
            </Overlay>
          )}

          {screen === "album" && (
            <Overlay>
              <h2 className="font-serif text-3xl font-bold text-[#ffd766]">{t.album}</h2>
              <div className="mt-4 grid w-full grid-cols-2 gap-2">
                {t.albumCards.map((c, i) => {
                  const need = ALBUM_UNLOCK[i] ?? 99;
                   const open = need === 0 || (progress.stars[need] ?? 0) > 0;
                  return (
                     <Button
                      key={c.title}
                       disabled={!open}
                       onClick={() => setAlbumCard(i)}
                       className={`h-auto min-h-20 min-w-0 flex-col items-start justify-start gap-1 whitespace-normal rounded border-2 p-2 text-left ${open ? "border-[#e2b75a]/70 bg-black/25" : "border-white/10 bg-black/30 opacity-60"}`}
                    >
                       <div className="text-sm font-bold text-[#ffd766]">{open ? `📖 ${c.title}` : `🔒 ${t.unlockAt} ${need}`}</div>
                       {open && <p className="line-clamp-2 text-[11px] leading-snug text-[#f4ecd8]/80">{c.text}</p>}
                     </Button>
                  );
                })}
              </div>
              <BackBtn onClick={() => go("menu")} label={t.back} />
            </Overlay>
          )}

          {screen === "records" && (
            <Overlay>
              <h2 className="font-serif text-3xl font-bold text-[#ffd766]">{t.records}</h2>
              <label className="mt-3 flex w-full items-center gap-2 text-xs text-[#bff0e4]">
                {t.yourName}
                <input
                  value={progress.name}
                  maxLength={16}
                  placeholder={t.player}
                  onChange={(e) => updateProgress({ ...progress, name: e.target.value })}
                  className="flex-1 rounded-xl border border-[#e2b75a]/50 bg-black/30 px-3 py-1.5 text-sm text-[#f4ecd8] outline-none focus:border-[#ffd766]"
                />
              </label>
              <div className="mt-3 flex w-full gap-1">
                {(["free", "campaign", "pvp", "alshy"] as ModeId[]).map((m) => (
                   <Button
                    key={m}
                    onClick={() => setRecTab(m)}
                     className={`h-auto min-w-0 flex-1 whitespace-normal rounded px-1 py-1.5 text-[10px] leading-tight font-semibold sm:text-xs ${recTab === m ? "bg-[#e2b75a] text-[#08383b]" : "bg-black/25 text-[#f4ecd8]/80"}`}
                  >
                     {m === "free" ? t.modeFree : m === "campaign" ? t.modeCampaign : m === "pvp" ? t.modePvp : t.modeAlshy}
                   </Button>
                ))}
              </div>
              <div className="mt-3 w-full overflow-hidden rounded-2xl border border-[#e2b75a]/40">
                {(progress.records[recTab] ?? []).length === 0 ? (
                  <p className="p-4 text-center text-sm text-[#f4ecd8]/60">{t.noRecords}</p>
                ) : (
                  (progress.records[recTab] ?? []).map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 text-sm ${i % 2 ? "bg-black/15" : "bg-black/30"}`}>
                      <span className={`w-6 font-serif font-bold ${i < 3 ? "text-[#ffd766]" : "text-[#bff0e4]"}`}>{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                      <span className="flex-1 truncate">{r.name}</span>
                       <span className="hidden text-[10px] text-[#f4ecd8]/50 sm:inline">{r.date}</span>
                      <span className="w-14 text-right font-bold text-[#ffd766]">{r.score}</span>
                    </div>
                  ))
                )}
              </div>
              <BackBtn onClick={() => go("menu")} label={t.back} />
            </Overlay>
          )}

          {screen === "result" && result && (
            <Overlay>
              <Ornament />
              {mode === "pvp" && result.pvp ? (
                <>
                   <h2 className="text-center font-serif text-3xl font-bold text-[#ffd766]">
                     {result.pvp.knocked[0] === result.pvp.knocked[1] && result.pvp.points[0] === result.pvp.points[1]
                       ? (lang === "kk" ? "Тең ойын!" : lang === "ru" ? "Ничья!" : "Draw!")
                       : `${t.player} ${result.win ? 1 : 2} ${t.pvpWinner}`}
                  </h2>
                  <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
                    {[0, 1].map((i) => (
                      <div key={i} className={`rounded border bg-black/25 p-3 ${result.win === (i === 0) ? "border-[#ffd766]" : "border-[#e2b75a]/30"}`}>
                        <div className="text-xs text-[#7fe3d0]">{t.player} {i + 1}</div>
                        <div className="font-serif text-4xl font-bold">{result.pvp!.knocked[i]}</div>
                        <div className="text-[11px] text-[#f4ecd8]/60">{t.knocked} · {result.pvp!.points[i]}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-4xl font-bold text-[#ffd766]">{result.win ? t.win : t.lose}</h2>
                  {mode === "campaign" && (
                    <p className="mt-1 text-3xl tracking-widest text-[#ffd766]">
                      {"★".repeat(result.stars)}
                      <span className="text-white/25">{"★".repeat(3 - result.stars)}</span>
                    </p>
                  )}
                  <p className="mt-3 text-sm text-[#bff0e4]">{t.yourScore}</p>
                  <p className="font-serif text-6xl font-bold text-[#f4ecd8]">{result.score}</p>
                  {result.rank === 1 && <p className="mt-2 text-sm font-bold text-[#ffd766]">★ {t.newRecord}</p>}
                  {result.rank > 1 && <p className="mt-2 text-xs text-[#bff0e4]">{t.rank}: #{result.rank}</p>}
                </>
              )}
              <p className="mt-2 text-sm text-[#ffd766]">
                {t.earned}: +{result.coins} {t.coins}
              </p>
              {mode === "campaign" && result.win && levelIdx + 1 < LEVELS.length && (
                <PrimaryBtn onClick={() => start("campaign", levelIdx + 1)}>{t.next}</PrimaryBtn>
              )}
              <PrimaryBtn onClick={() => start(mode, levelIdx)} secondary={mode === "campaign" && result.win}>
                {t.again}
              </PrimaryBtn>
              <BackBtn onClick={() => go("menu")} label={t.toMenu} />
            </Overlay>
          )}
        </div>
      </div>

      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAboutOpen(false)}>
          <div
            className="max-h-[80vh] w-full max-w-[460px] overflow-y-auto rounded-3xl border-2 border-[#e2b75a] bg-[#0d4a4e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Ornament />
            <h3 className="text-center font-serif text-2xl font-bold text-[#ffd766]">{t.aboutTitle}</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#f4ecd8]/90">{t.aboutText}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#bff0e4]">{t.facesText}</p>
            <p className="mt-3 text-xs leading-relaxed text-[#f4ecd8]/70">
              <span className="font-semibold">{t.howTo}: </span>
              {t.howToText}
            </p>
              <Button onClick={() => setAboutOpen(false)} className="mt-6 w-full rounded bg-[#e2b75a] px-6 py-2.5 font-bold text-[#08383b]">
              {t.close}
              </Button>
          </div>
        </div>
      )}
      {albumCard !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAlbumCard(null)}>
          <div className="w-full max-w-[400px] rounded border border-[#e2b75a] bg-[#0d4a4e] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#ffd766]">📖 {t.albumCards[albumCard]?.title}</h3>
            <p className="mt-3 text-sm leading-relaxed">{t.albumCards[albumCard]?.text}</p>
            <Button onClick={() => setAlbumCard(null)} className="mt-5 w-full bg-[#e2b75a] text-[#08383b]">{t.close}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, value, active }: { label: string; value: number | string; active?: boolean }) {
  return (
    <div className={`min-w-0 rounded border bg-black/45 px-1 py-1 text-center sm:px-4 sm:py-1.5 ${active ? "border-[#ffd766]" : "border-[#e2b75a]/60"}`}>
      <div className="truncate text-[9px] text-[#7fe3d0] sm:text-[10px]">{label}</div>
      <div className="text-base font-bold text-[#ffd766] sm:text-xl">{value}</div>
    </div>
  );
}

function MenuBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button onClick={onClick} className="pointer-events-auto h-8 rounded-full border border-[#e2b75a]/60 bg-black/45 px-3 py-1.5 text-xs font-semibold">
      {label}
    </Button>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0d4a4e] px-3 py-3 sm:px-5 sm:py-6">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_50%_30%,rgba(127,227,208,0.35),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-[400px] flex-col items-center justify-center py-3">{children}</div>
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

function ModeCard({ title, desc, onClick, primary }: { title: string; desc: string; onClick: () => void; primary?: boolean }) {
  return (
    <Button
      onClick={onClick}
      className={`rounded border-2 px-4 py-2.5 text-left transition-transform hover:scale-[1.01] active:scale-95 ${
        primary ? "border-[#ffd766] bg-gradient-to-b from-[#ffd766] to-[#e2b75a] text-[#08383b]" : "border-[#7fe3d0]/30 bg-black/20"
      }`}
    >
      <span className={`block text-base font-bold ${primary ? "" : "text-[#f4ecd8]"}`}>{title}</span>
      <span className={`block text-[11px] ${primary ? "text-[#08383b]/75" : "text-[#f4ecd8]/60"}`}>{desc}</span>
    </Button>
  );
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button onClick={onClick} className="rounded border border-[#e2b75a]/50 bg-black/20 px-2 py-2 text-xs font-semibold text-[#ffd766]">
      {children}
    </Button>
  );
}

function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button onClick={onClick} className="mt-3 rounded border border-[#7fe3d0]/50 px-4 py-2 text-xs font-semibold text-[#bff0e4]">
      {label}
    </Button>
  );
}

function PrimaryBtn({ onClick, children, secondary }: { onClick: () => void; children: React.ReactNode; secondary?: boolean }) {
  return (
    <Button
      onClick={onClick}
      className={`mt-3 w-full max-w-[280px] rounded px-6 py-3 text-lg font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${
        secondary ? "border-2 border-[#e2b75a] text-[#ffd766]" : "bg-gradient-to-b from-[#ffd766] to-[#e2b75a] text-[#08383b]"
      }`}
    >
      {children}
    </Button>
  );
}

function SkinRow(props: {
  id: SkinId;
  name: string;
  desc: string;
  owned: boolean;
  equipped: boolean;
  canBuy: boolean;
  labels: { buy: string; equip: string; equipped: string; coins: string };
  onBuy: () => void;
  onEquip: () => void;
}) {
  const sk = SKINS[props.id];
  return (
    <div className={`flex items-center gap-3 rounded border-2 px-3 py-2.5 ${props.equipped ? "border-[#ffd766] bg-[#ffd766]/10" : "border-[#7fe3d0]/25 bg-black/20"}`}>
      <span
        className="h-8 w-11 shrink-0 rounded-[40%] border-2"
        style={{
          background: `linear-gradient(135deg, ${sk.light}, ${sk.fill} 60%, ${sk.edge})`,
          borderColor: sk.edge,
          boxShadow: sk.glow ? `0 0 14px ${sk.glow}` : undefined,
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#f4ecd8]">{props.name}</span>
        <span className="block text-[11px] text-[#f4ecd8]/60">{props.desc}</span>
      </span>
      {props.equipped ? (
        <span className="text-xs font-bold text-[#ffd766]">✓ {props.labels.equipped}</span>
      ) : props.owned ? (
        <Button onClick={props.onEquip} className="rounded border border-[#e2b75a] px-3 py-1.5 text-xs font-bold text-[#ffd766]">
          {props.labels.equip}
        </Button>
      ) : (
        <Button
          disabled={!props.canBuy}
          onClick={props.onBuy}
          className="rounded bg-[#e2b75a] px-3 py-1.5 text-xs font-bold text-[#08383b] disabled:opacity-40"
        >
          {sk.price} ◈
        </Button>
      )}
    </div>
  );
}
