"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import AstroForm, { type FormData } from "@/components/AstroForm";
import PlanetGrid from "@/components/PlanetGrid";
import PredictionDisplay from "@/components/PredictionDisplay";
import { calculateAstroData, ZODIAC_SIGNS, type AstroData } from "@/lib/astrology";
import { useApp } from "@/contexts/app";

const StarField  = dynamic(() => import("@/components/StarField"),  { ssr: false });
const ZodiacWheel = dynamic(() => import("@/components/ZodiacWheel"), { ssr: false });

// ─── localStorage cache helpers ───────────────────────────────────────────────
const CACHE_TTL = 86_400_000; // 24 h

function cacheKey(fd: FormData): string {
  const raw = [fd.birthDate, fd.birthTime, fd.birthPlace, fd.latitude, fd.longitude, fd.theme].join("|");
  return `av-${btoa(raw).replace(/[+/=]/g, "")}`;
}

function cacheGet(fd: FormData): string | null {
  try {
    const raw = localStorage.getItem(cacheKey(fd));
    if (!raw) return null;
    const { text, ts } = JSON.parse(raw) as { text: string; ts: number };
    if (Date.now() - ts < CACHE_TTL && text?.length > 0) return text;
    localStorage.removeItem(cacheKey(fd));
  } catch { /* localStorage unavailable or corrupted */ }
  return null;
}

function cacheSet(fd: FormData, text: string): void {
  try {
    localStorage.setItem(cacheKey(fd), JSON.stringify({ text, ts: Date.now() }));
  } catch { /* storage full or unavailable */ }
}

export default function Home() {
  const { t, theme, toggleTheme, toggleLocale, locale } = useApp();

  const [astroData,    setAstroData]    = useState<AstroData | null>(null);
  const [prediction,   setPrediction]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [currentTheme, setCurrentTheme] = useState("global");
  const [shareDefaults, setShareDefaults] = useState<Partial<FormData>>({});
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [ttft,         setTtft]         = useState<number | null>(null);
  const [fromCache,    setFromCache]    = useState(false);

  // Accumulates streaming text so we can write it to cache when done
  const fullTextRef = useRef("");

  // On mount: decode ?s=… share param and pre-fill form
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (!s) return;
    try {
      const decoded = JSON.parse(atob(s)) as Partial<FormData>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time sync from URL param after mount
      setShareDefaults(decoded);
    } catch { /* malformed param — ignore */ }
  }, []);

  const handleSubmit = useCallback(async (formData: FormData) => {
    setLoading(true);
    setPrediction("");
    setTtft(null);
    setFromCache(false);
    fullTextRef.current = "";
    setCurrentTheme(formData.theme);
    setLastFormData(formData);

    const birthDate = new Date(formData.birthDate + "T12:00:00Z");
    const latitude  = parseFloat(formData.latitude)  || 48.8566;
    const longitude = parseFloat(formData.longitude) || 2.3522;

    const data = calculateAstroData(birthDate, formData.birthTime, formData.birthPlace, latitude, longitude);
    setAstroData(data);

    // 1. Check localStorage cache first
    const cached = cacheGet(formData);
    if (cached) {
      setPrediction(cached);
      setFromCache(true);
      setLoading(false);
      return;
    }

    // 2. Fetch from API with 90s AbortController timeout
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 90_000);
    const startTime  = Date.now();
    let firstToken   = true;

    try {
      const response = await fetch("/api/predict", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ astroData: data, theme: formData.theme }),
        signal:  controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Erreur ${response.status}`);
      }
      if (!response.body) throw new Error("Pas de réponse");

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (firstToken) {
          setTtft(Date.now() - startTime);
          firstToken = false;
        }
        fullTextRef.current += chunk;
        setPrediction(fullTextRef.current);
      }

      // Persist complete prediction to cache
      cacheSet(formData, fullTextRef.current);

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setPrediction(t.prediction.timeout);
      } else {
        const msg = err instanceof Error ? err.message : "";
        setPrediction(msg || t.prediction.error);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [t]);

  // Share: encode current form data into a ?s= URL and copy to clipboard
  const handleShare = useCallback(() => {
    if (!lastFormData) return;
    const payload = btoa(JSON.stringify(lastFormData));
    const url = `${window.location.origin}${window.location.pathname}?s=${payload}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard denied */ });
  }, [lastFormData]);

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <StarField />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 no-print">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ec4899, transparent)", filter: "blur(60px)" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-10 px-4">
          {/* Theme + Locale toggles */}
          <div className="absolute top-4 right-4 flex gap-2 no-print">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t.theme.light : t.theme.dark}
              className="px-3 py-1.5 rounded-lg text-sm border border-purple-500/30 text-purple-300 hover:border-purple-400 transition-all"
              style={{ background: "var(--surface-2)" }}
            >
              {theme === "dark" ? t.theme.light : t.theme.dark}
            </button>
            <button
              onClick={toggleLocale}
              aria-label="Switch language"
              className="px-3 py-1.5 rounded-lg text-sm border border-purple-500/30 text-purple-300 hover:border-purple-400 transition-all"
              style={{ background: "var(--surface-2)" }}
            >
              {locale === "fr" ? "EN" : "FR"}
            </button>
          </div>

          <div className="text-5xl mb-3 animate-float no-print">✨</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text">AstroVision</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            {t.header.tagline}
          </p>
          <div className="flex justify-center gap-3 mt-3 text-2xl no-print" style={{ color: "var(--text-very-faint)" }}>
            {ZODIAC_SIGNS.map((z, i) => (
              <span key={z.symbol} style={{ animationDelay: `${i * 0.2}s` }} className="animate-twinkle">{z.symbol}</span>
            ))}
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Form */}
            <div className="lg:col-span-1 no-print">
              <div className="glass-card p-6">
                <h2 className="text-purple-300 font-bold text-lg mb-6 flex items-center gap-2">
                  <span>🌟</span> {t.form.title}
                </h2>
                <AstroForm onSubmit={handleSubmit} loading={loading} defaultValues={shareDefaults} />
              </div>
            </div>

            {/* Center: Wheel + Planets */}
            <div className="lg:col-span-1 space-y-6">
              {astroData ? (
                <>
                  <div className="glass-card p-6">
                    <h2 className="text-purple-300 font-bold text-lg mb-4 flex items-center gap-2">
                      {t.wheel.title}
                    </h2>
                    <ZodiacWheel astroData={astroData} />
                  </div>
                  <div className="glass-card p-6">
                    <PlanetGrid astroData={astroData} />
                  </div>
                </>
              ) : (
                <div className="glass-card p-8 text-center no-print">
                  <div className="text-7xl mb-4 animate-rotate-slow inline-block">♈</div>
                  <p style={{ color: "var(--text-faint)" }}>
                    {t.wheel.emptyHint}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Prediction */}
            <div className="lg:col-span-1">
              <PredictionDisplay
                text={prediction}
                loading={loading}
                theme={currentTheme}
                ttft={ttft}
                fromCache={fromCache}
              />

              {/* Cosmic profile + Share + PDF */}
              {astroData && !loading && prediction && (
                <div className="glass-card p-4 mt-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                    {t.profile.title}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="p-2 rounded-lg" style={{ background: "var(--surface-1)" }}>
                      <div className="text-lg">{astroData.sunSign.emoji}</div>
                      <div className="text-purple-300 font-medium">{astroData.sunSign.name}</div>
                      <div style={{ color: "var(--text-faint)" }}>{astroData.sunSign.ruler}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: "var(--surface-1)" }}>
                      <div className="text-lg">🌙</div>
                      <div className="text-purple-300 font-medium">{astroData.moonSign.name}</div>
                      <div style={{ color: "var(--text-faint)" }}>{t.profile.moon}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: "var(--surface-1)" }}>
                      <div className="text-lg">{astroData.ascendant.emoji}</div>
                      <div className="text-purple-300 font-medium">{astroData.ascendant.name}</div>
                      <div style={{ color: "var(--text-faint)" }}>{t.profile.ascendant}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button
                      onClick={handleShare}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border border-purple-500/30 text-purple-300 hover:border-purple-400 hover:text-purple-100"
                      style={{ background: "var(--surface-2)" }}
                    >
                      {copied ? t.profile.copied : t.profile.share}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border border-purple-500/30 text-purple-300 hover:border-purple-400 hover:text-purple-100"
                      style={{ background: "var(--surface-2)" }}
                    >
                      {t.profile.exportPdf}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pb-8 text-sm no-print" style={{ color: "var(--text-very-faint)" }}>
          <p>✦ AstroVision ✦ Propulsé par Claude Opus 4.6 ✦</p>
          <p className="mt-1 text-xs">À des fins de divertissement. Les astres guident, l&apos;humain décide.</p>
        </footer>
      </div>
    </div>
  );
}
