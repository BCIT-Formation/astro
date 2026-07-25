"use client";
// Renders the streamed prediction: skeleton while waiting, incremental text
// with a typing cursor, then a footer showing TTFT or the cache indicator.
import { useEffect, useRef, useMemo } from "react";
import { THEME_CONFIG, ZODIAC_SIGNS } from "@/lib/astrology";
import { useApp } from "@/contexts/app";

interface Props {
  text:       string;
  loading:    boolean;
  theme:      string;
  ttft?:      number | null;  // time-to-first-token in ms
  fromCache?: boolean;        // true when served from localStorage cache
}

// Convert markdown to safe HTML. HTML-escapes first, then applies known-safe tags.
function formatPrediction(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,     "<em>$1</em>")
    .replace(/^#{1,2} (.+)$/gm,  "<h3>$1</h3>")
    .replace(/\n\n+/g,           "</p><p>");
}

export default function PredictionDisplay({ text, loading, theme, ttft, fromCache }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useApp();
  const cfg   = THEME_CONFIG[theme] ?? THEME_CONFIG.global;

  const formattedHtml = useMemo(
    () => (text ? `<p>${formatPrediction(text)}</p>` : ""),
    [text]
  );

  // Keep the newest streamed text in view as chunks arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  if (!text && !loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-6xl mb-4 animate-float">🔮</div>
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          {t.prediction.emptyHint}
        </p>
        <div className="mt-4 flex justify-center gap-4 text-2xl">
          {ZODIAC_SIGNS.slice(0, 6).map((s, i) => (
            <span
              key={s.symbol}
              className="animate-twinkle"
              style={{ color: "var(--text-faint)", animationDelay: `${i * 0.3}s` }}
            >
              {s.symbol}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))" }}
      >
        <span className="text-2xl">{cfg.icon}</span>
        <div>
          <h2 className="font-bold text-white text-lg">{t.prediction.title}</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{cfg.label}</p>
        </div>
        {loading && (
          <div className="ml-auto flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="inline-block w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            {t.prediction.consulting}
          </div>
        )}
      </div>

      {/* Scrollable prediction body (print-full removes max-height for printing) */}
      <div ref={containerRef} className="p-6 max-h-96 overflow-y-auto print-full">
        {loading && !text && (
          <div className="space-y-3">
            {[100, 90, 95, 80, 88, 70].map((w, i) => (
              <div
                key={i}
                className="h-4 rounded-full animate-pulse"
                style={{ background: "rgba(168,85,247,0.1)", width: `${w}%`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {formattedHtml && (
          <div
            className="prediction-text leading-relaxed"
            style={{ color: "var(--text-primary)" }}
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
          />
        )}

        {loading && text && (
          <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-0.5 rounded-sm" />
        )}
      </div>

      {/* Footer: attribution + TTFT / cache indicator */}
      {!loading && text && (
        <div className="px-6 py-3 text-center border-t border-purple-500/10">
          <div className="text-xs tracking-widest" style={{ color: "var(--text-very-faint)" }}>
            {t.prediction.footer}
          </div>
          {(ttft != null || fromCache) && (
            <div className="text-xs mt-1" style={{ color: "var(--text-very-faint)" }}>
              {fromCache ? t.cached : `${t.ttft}: ${ttft}ms`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
