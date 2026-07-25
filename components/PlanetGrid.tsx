"use client";
// Planet positions list, element balance bars and major aspects summary.
import type { AstroData } from "@/lib/astrology";
import { getElementBalance, ELEMENT_COLORS, ELEMENT_EMOJIS } from "@/lib/astrology";
import { useApp } from "@/contexts/app";

interface Props {
  astroData: AstroData;
}

export default function PlanetGrid({ astroData }: Props) {
  const { t } = useApp();
  const elements = getElementBalance(astroData);
  const totalPlanets = astroData.planetPositions.length;

  return (
    <div className="space-y-6">
      {/* Trio principal */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.planets.sunLabel, sign: astroData.sunSign, sub: t.planets.personality },
          { label: t.planets.moonLabel, sign: astroData.moonSign, sub: t.planets.emotions },
          { label: t.planets.ascendantLabel, sign: astroData.ascendant, sub: t.planets.image },
        ].map((item) => (
          <div
            key={item.label}
            className="glass-card p-3 text-center animate-fade-in-up"
          >
            <div className="text-2xl mb-1">{item.sign.emoji}</div>
            <div className="text-xs text-purple-300/60 uppercase tracking-wider mb-0.5">{item.label}</div>
            <div className="text-sm font-bold text-purple-100">{item.sign.name}</div>
            <div className="text-xs text-purple-400/60">{item.sign.symbol}</div>
            <div
              className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
              style={{ background: `${ELEMENT_COLORS[item.sign.element]}20`, color: ELEMENT_COLORS[item.sign.element] }}
            >
              {ELEMENT_EMOJIS[item.sign.element]} {item.sign.element}
            </div>
          </div>
        ))}
      </div>

      {/* Positions planétaires */}
      <div>
        <h3 className="text-purple-300 text-xs uppercase tracking-widest mb-3">
          {t.planets.title}
        </h3>
        <div className="space-y-2">
          {astroData.planetPositions.map((pp, i) => (
            <div
              key={pp.planet.name}
              className="flex items-center gap-3 px-3 py-2 rounded-lg animate-fade-in-up"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-card)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <span className="text-lg w-7 text-center">{pp.planet.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-purple-100">{pp.planet.name}</span>
                  {pp.retrograde && (
                    <span className="text-xs text-orange-400 font-bold">℞</span>
                  )}
                </div>
                <div className="text-xs text-purple-400/70">
                  {pp.sign.symbol} {pp.sign.name} • {pp.degree}°
                </div>
              </div>
              <div
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${ELEMENT_COLORS[pp.sign.element]}15`, color: ELEMENT_COLORS[pp.sign.element] }}
              >
                {pp.sign.element}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aspects */}
      {astroData.aspects.length > 0 && (
        <div>
          <h3 className="text-purple-300 text-xs uppercase tracking-widest mb-3">
            {t.planets.aspects}
          </h3>
          <div className="space-y-1">
            {astroData.aspects.slice(0, 6).map((aspect, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-l-2 text-xs animate-fade-in-up aspect-${aspect.nature}`}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-faint)",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    aspect.nature === "harmonieux" ? "bg-emerald-400" :
                    aspect.nature === "tendu" ? "bg-red-400" : "bg-indigo-400"
                  }`}
                />
                <span className="text-purple-200">{aspect.planet1}</span>
                <span className="text-purple-400 font-bold">{aspect.symbol}</span>
                <span className="text-purple-200">{aspect.planet2}</span>
                <span className="text-purple-400/60 ml-auto">{aspect.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Équilibre élémentaire */}
      <div>
        <h3 className="text-purple-300 text-xs uppercase tracking-widest mb-3">
          {t.planets.balance}
        </h3>
        <div className="space-y-2">
          {Object.entries(elements).map(([el, count]) => (
            <div key={el} className="flex items-center gap-3">
              <span className="text-xs w-16 text-purple-300/70 flex items-center gap-1">
                {ELEMENT_EMOJIS[el]} {el}
              </span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--surface-4)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(count / totalPlanets) * 100}%`,
                    background: ELEMENT_COLORS[el],
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="text-xs text-purple-400/60 w-4">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
