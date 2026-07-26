"use client";
// Birth-data form (date, time, place, coordinates, prediction theme).
// Picking a preset city fills lat/lon; "Autre" unlocks manual coordinates.
import { useState } from "react";
import { THEME_CONFIG } from "@/lib/astrology";
import { useApp } from "@/contexts/app";

export interface FormData {
  birthDate:  string;
  birthTime:  string;
  birthPlace: string;
  latitude:   string;
  longitude:  string;
  theme:      string;
}

interface Props {
  onSubmit:      (data: FormData) => void;
  loading:       boolean;
  defaultValues?: Partial<FormData>;
}

const CITIES = [
  { name: "Paris",      lat: "48.8566",  lon: "2.3522"    },
  { name: "Marseille",  lat: "43.2965",  lon: "5.3698"    },
  { name: "Lyon",       lat: "45.7640",  lon: "4.8357"    },
  { name: "Bordeaux",   lat: "44.8378",  lon: "-0.5792"   },
  { name: "Toulouse",   lat: "43.6047",  lon: "1.4442"    },
  { name: "Montréal",   lat: "45.5017",  lon: "-73.5673"  },
  { name: "Bruxelles",  lat: "50.8503",  lon: "4.3517"    },
  { name: "Genève",     lat: "46.2044",  lon: "6.1432"    },
  { name: "Casablanca", lat: "33.5731",  lon: "-7.5898"   },
  { name: "Tunis",      lat: "36.8190",  lon: "10.1658"   },
  { name: "Alger",      lat: "36.7372",  lon: "3.0865"    },
  { name: "Dakar",      lat: "14.6928",  lon: "-17.4467"  },
  { name: "Londres",    lat: "51.5074",  lon: "-0.1278"   },
  { name: "Madrid",     lat: "40.4168",  lon: "-3.7038"   },
  { name: "Rome",       lat: "41.9028",  lon: "12.4964"   },
  { name: "New York",   lat: "40.7128",  lon: "-74.0060"  },
  { name: "Tokyo",      lat: "35.6762",  lon: "139.6503"  },
  { name: "Shanghai",   lat: "31.2304",  lon: "121.4737"  },
  { name: "Autre",      lat: "",         lon: ""           },
];

const THEMES = Object.entries(THEME_CONFIG).map(([value, cfg]) => ({ value, ...cfg }));

const INPUT_CLASS = "w-full px-4 py-3 rounded-xl text-purple-100 border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all";

export default function AstroForm({ onSubmit, loading, defaultValues }: Props) {
  const { t } = useApp();

  const [formData, setFormData] = useState<FormData>({
    birthDate:  defaultValues?.birthDate  ?? "",
    birthTime:  defaultValues?.birthTime  ?? "12:00",
    birthPlace: defaultValues?.birthPlace ?? "Paris",
    latitude:   defaultValues?.latitude   ?? "48.8566",
    longitude:  defaultValues?.longitude  ?? "2.3522",
    theme:      defaultValues?.theme      ?? "global",
  });


  const handleCityChange = (city: string) => {
    const found = CITIES.find((c) => c.name === city);
    setFormData((prev) => ({
      ...prev,
      birthPlace: city,
      latitude:   found?.lat || prev.latitude,
      longitude:  found?.lon || prev.longitude,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.birthDate) return;
    onSubmit(formData);
  };

  // "Autre / Other" sentinel value (always the last city)
  const otherSentinel = CITIES[CITIES.length - 1].name;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-purple-300 text-sm font-medium tracking-wider uppercase">
          {t.form.birthDate}
        </label>
        <input
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
          required
          className={INPUT_CLASS}
          style={{ background: "var(--surface-1)" }}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-purple-300 text-sm font-medium tracking-wider uppercase">
          {t.form.birthTime}
        </label>
        <input
          type="time"
          value={formData.birthTime}
          onChange={(e) => setFormData((p) => ({ ...p, birthTime: e.target.value }))}
          className={INPUT_CLASS}
          style={{ background: "var(--surface-1)" }}
        />
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{t.form.birthTimeHint}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-purple-300 text-sm font-medium tracking-wider uppercase">
          {t.form.birthPlace}
        </label>
        <select
          value={formData.birthPlace}
          onChange={(e) => handleCityChange(e.target.value)}
          className={INPUT_CLASS}
          style={{ background: "var(--surface-1)" }}
        >
          {CITIES.map((c) => (
            <option key={c.name} value={c.name} style={{ background: "var(--background)" }}>
              {/* Translate the "Other" sentinel for English */}
              {c.name === otherSentinel ? t.form.otherCity : c.name}
            </option>
          ))}
        </select>
        {formData.birthPlace === otherSentinel && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number" step="0.0001"
              placeholder={t.form.latPlaceholder}
              value={formData.latitude}
              onChange={(e) => setFormData((p) => ({ ...p, latitude: e.target.value }))}
              className={INPUT_CLASS}
              style={{ background: "var(--surface-1)" }}
            />
            <input
              type="number" step="0.0001"
              placeholder={t.form.lonPlaceholder}
              value={formData.longitude}
              onChange={(e) => setFormData((p) => ({ ...p, longitude: e.target.value }))}
              className={INPUT_CLASS}
              style={{ background: "var(--surface-1)" }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-purple-300 text-sm font-medium tracking-wider uppercase">
          {t.form.theme}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => setFormData((p) => ({ ...p, theme: theme.value }))}
              className={`p-3 rounded-xl text-left transition-all border ${
                formData.theme === theme.value
                  ? "border-purple-400 text-purple-100"
                  : "border-purple-500/20 text-purple-300/70 hover:border-purple-500/40"
              }`}
              style={{
                background: formData.theme === theme.value
                  ? "rgba(168, 85, 247, 0.2)"
                  : "var(--surface-2)",
              }}
            >
              <div className="text-sm font-medium">{theme.icon} {theme.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{theme.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !formData.birthDate}
        className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)" }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.form.submitting}
            </>
          ) : (
            <>{t.form.submit}</>
          )}
        </span>
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
          style={{ background: "linear-gradient(135deg, #ffffff, transparent)" }}
        />
      </button>
    </form>
  );
}
