// ============================================================
// Astrological Calculations Library
// ============================================================
// Planetary longitudes use truncated analytical series (Meeus-style):
// degree-level accuracy, which is enough to place a body in its sign.
// No ephemeris dependency — everything runs client-side.

export const ZODIAC_SIGNS = [
  { name: "Bélier",      symbol: "♈", emoji: "🐏", start: 0,   element: "Feu",   quality: "Cardinal", ruler: "Mars",    dates: "21 mars - 19 avril" },
  { name: "Taureau",     symbol: "♉", emoji: "🐂", start: 30,  element: "Terre", quality: "Fixe",     ruler: "Vénus",   dates: "20 avril - 20 mai" },
  { name: "Gémeaux",     symbol: "♊", emoji: "👥", start: 60,  element: "Air",   quality: "Mutable",  ruler: "Mercure", dates: "21 mai - 20 juin" },
  { name: "Cancer",      symbol: "♋", emoji: "🦀", start: 90,  element: "Eau",   quality: "Cardinal", ruler: "Lune",    dates: "21 juin - 22 juillet" },
  { name: "Lion",        symbol: "♌", emoji: "🦁", start: 120, element: "Feu",   quality: "Fixe",     ruler: "Soleil",  dates: "23 juillet - 22 août" },
  { name: "Vierge",      symbol: "♍", emoji: "👧", start: 150, element: "Terre", quality: "Mutable",  ruler: "Mercure", dates: "23 août - 22 sept." },
  { name: "Balance",     symbol: "♎", emoji: "⚖️", start: 180, element: "Air",   quality: "Cardinal", ruler: "Vénus",   dates: "23 sept. - 22 oct." },
  { name: "Scorpion",    symbol: "♏", emoji: "🦂", start: 210, element: "Eau",   quality: "Fixe",     ruler: "Pluton",  dates: "23 oct. - 21 nov." },
  { name: "Sagittaire",  symbol: "♐", emoji: "🏹", start: 240, element: "Feu",   quality: "Mutable",  ruler: "Jupiter", dates: "22 nov. - 21 déc." },
  { name: "Capricorne",  symbol: "♑", emoji: "🐐", start: 270, element: "Terre", quality: "Cardinal", ruler: "Saturne", dates: "22 déc. - 19 janv." },
  { name: "Verseau",     symbol: "♒", emoji: "🏺", start: 300, element: "Air",   quality: "Fixe",     ruler: "Uranus",  dates: "20 janv. - 18 fév." },
  { name: "Poissons",    symbol: "♓", emoji: "🐟", start: 330, element: "Eau",   quality: "Mutable",  ruler: "Neptune", dates: "19 fév. - 20 mars" },
];

export const PLANETS = [
  { name: "Soleil",  symbol: "☉", emoji: "☀️", color: "#FFD700" },
  { name: "Lune",    symbol: "☽", emoji: "🌙", color: "#C0C0C0" },
  { name: "Mercure", symbol: "☿", emoji: "⚡", color: "#B0B0B0" },
  { name: "Vénus",   symbol: "♀", emoji: "💚", color: "#90EE90" },
  { name: "Mars",    symbol: "♂", emoji: "🔴", color: "#FF4500" },
  { name: "Jupiter", symbol: "♃", emoji: "🟤", color: "#DEB887" },
  { name: "Saturne", symbol: "♄", emoji: "🪐", color: "#DAA520" },
  { name: "Uranus",  symbol: "♅", emoji: "🔵", color: "#40E0D0" },
  { name: "Neptune", symbol: "♆", emoji: "🌊", color: "#4169E1" },
];

// Single source of truth for all theme metadata
export const THEME_CONFIG: Record<string, { label: string; icon: string; desc: string; prompt: string }> = {
  global:       { label: "Vue d'ensemble",       icon: "🌟", desc: "Personnalité & destinée générale",   prompt: "prévision globale et personnalité" },
  amour:        { label: "Amour & Relations",     icon: "❤️", desc: "Vie sentimentale & compatibilité",  prompt: "amour et relations sentimentales" },
  travail:      { label: "Carrière & Succès",     icon: "💼", desc: "Vie professionnelle & ambitions",   prompt: "carrière et vie professionnelle" },
  sante:        { label: "Santé & Bien-être",     icon: "🌿", desc: "Équilibre physique & mental",       prompt: "santé et bien-être" },
  finances:     { label: "Finances & Prospérité", icon: "💰", desc: "Argent, abondance & opportunités",  prompt: "finances et prospérité" },
  spiritualite: { label: "Chemin Spirituel",      icon: "🔮", desc: "Évolution de l'âme & karma",        prompt: "chemin spirituel et évolution personnelle" },
};

// Shared element styling — single source for all components
export const ELEMENT_COLORS: Record<string, string> = {
  Feu: "#ef4444", Terre: "#22c55e", Air: "#eab308", Eau: "#3b82f6",
};

export const ELEMENT_EMOJIS: Record<string, string> = {
  Feu: "🔥", Terre: "🌍", Air: "💨", Eau: "💧",
};

export interface AstroData {
  sunSign: typeof ZODIAC_SIGNS[0];
  moonSign: typeof ZODIAC_SIGNS[0];
  ascendant: typeof ZODIAC_SIGNS[0];
  planetPositions: PlanetPosition[];
  aspects: Aspect[];
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
}

export interface PlanetPosition {
  planet: typeof PLANETS[0];
  sign: typeof ZODIAC_SIGNS[0];
  degree: number;
  retrograde: boolean;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  symbol: string;
  nature: "harmonieux" | "tendu" | "neutre";
}

function toJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const A = Math.floor((14 - m) / 12);
  const Y = y + 4800 - A;
  const M = m + 12 * A - 3;
  return d + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
}

function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function getSignFromLongitude(longitude: number): typeof ZODIAC_SIGNS[0] {
  return ZODIAC_SIGNS[Math.floor(normalize(longitude) / 30) % 12];
}

function getSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = normalize(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = (M * Math.PI) / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad);
  return normalize(L0 + C);
}

function getMoonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L  = normalize(218.3164477 + 481267.88123421 * T);
  const M  = normalize(357.5291092 + 35999.0502909  * T);
  const Mp = normalize(134.9633964 + 477198.8675055  * T);
  const D  = normalize(297.8501921 + 445267.1114034  * T);
  const F  = normalize( 93.2720950 + 483202.0175233  * T);
  return normalize(
    L
    + 6.288774 * Math.sin((Mp * Math.PI) / 180)
    + 1.274027 * Math.sin(((2 * D - Mp) * Math.PI) / 180)
    + 0.658314 * Math.sin((2 * D  * Math.PI) / 180)
    + 0.213618 * Math.sin((2 * Mp * Math.PI) / 180)
    - 0.185116 * Math.sin((M  * Math.PI) / 180)
    - 0.114332 * Math.sin((2 * F  * Math.PI) / 180)
  );
}

function getPlanetLongitude(jd: number, name: string): number {
  const T = (jd - 2451545.0) / 36525.0;
  switch (name) {
    case "Mercure": return normalize(252.2509 + 149472.6674 * T - 0.0003  * T * T);
    case "Vénus":   return normalize(181.9798 +  58517.8157 * T + 0.00031 * T * T);
    case "Mars":    return normalize(355.4330 +  19140.2993 * T + 0.00026 * T * T);
    case "Jupiter": return normalize( 34.3515 +   3034.9057 * T - 0.00008 * T * T);
    case "Saturne": return normalize( 50.0774 +   1222.1138 * T + 0.00029 * T * T);
    case "Uranus":  return normalize(314.0550 +    428.4669 * T - 0.00048 * T * T);
    case "Neptune": return normalize(304.3486 +    218.4863 * T - 0.00017 * T * T);
    default:        return 0;
  }
}

// Reuses today+tomorrow longitudes already computed in the main loop — no extra trig calls
function isRetrogradeFast(lonToday: number, lonTomorrow: number): boolean {
  return normalize(lonTomorrow - lonToday) > 180;
}

// calculateAscendant now uses the actual birth longitude for accurate LST
function calculateAscendant(
  birthDate: Date,
  birthTimeStr: string,
  latitude: number,
  longitude: number
): typeof ZODIAC_SIGNS[0] {
  const [hours, minutes] = birthTimeStr.split(":").map(Number);
  const ut = hours + (minutes || 0) / 60;

  const jd = toJulianDay(birthDate);
  const T  = (jd - 2451545.0) / 36525.0;

  const GST = normalize(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  const LST = normalize(GST + longitude + ut * 15);

  const latRad = (latitude * Math.PI) / 180;
  const lstRad = (LST      * Math.PI) / 180;
  const oblRad = (23.4397  * Math.PI) / 180;

  let asc = Math.atan2(
    Math.cos(lstRad),
    -(Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad))
  );
  asc = (asc * 180) / Math.PI;
  // atan2 folds the result into [-180, 180]; shift into the ecliptic
  // half-circle that matches the local sidereal time's hemisphere
  if (asc < 0) asc += 180;
  if (Math.sin(lstRad) > 0) asc += 180;

  return getSignFromLongitude(normalize(asc));
}

function calculateAspects(positions: PlanetPosition[]): Aspect[] {
  const ASPECT_TYPES = [
    { name: "Conjonction", angle: 0,   orb: 8, symbol: "☌", nature: "neutre"     as const },
    { name: "Opposition",  angle: 180, orb: 8, symbol: "☍", nature: "tendu"      as const },
    { name: "Carré",       angle: 90,  orb: 7, symbol: "□", nature: "tendu"      as const },
    { name: "Trigone",     angle: 120, orb: 8, symbol: "△", nature: "harmonieux" as const },
    { name: "Sextile",     angle: 60,  orb: 6, symbol: "✶", nature: "harmonieux" as const },
    { name: "Quinconce",   angle: 150, orb: 3, symbol: "⚻", nature: "tendu"      as const },
  ];

  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const lon1 = positions[i].sign.start + positions[i].degree;
      const lon2 = positions[j].sign.start + positions[j].degree;
      const diff = Math.abs(normalize(lon1 - lon2));
      const angularDiff = diff > 180 ? 360 - diff : diff;
      for (const aspect of ASPECT_TYPES) {
        const orb = Math.abs(angularDiff - aspect.angle);
        if (orb <= aspect.orb) {
          aspects.push({
            planet1: positions[i].planet.name,
            planet2: positions[j].planet.name,
            type: aspect.name,
            orb: Math.round(orb * 10) / 10,
            symbol: aspect.symbol,
            nature: aspect.nature,
          });
          break;
        }
      }
    }
  }
  return aspects;
}

export function calculateAstroData(
  birthDate: Date,
  birthTime: string,
  birthPlace: string,
  latitude: number  = 48.8566,
  longitude: number = 2.3522
): AstroData {
  const jd  = toJulianDay(birthDate);
  const jd1 = jd + 1;

  const sunLon  = getSunLongitude(jd);
  const moonLon = getMoonLongitude(jd);

  const planetPositions: PlanetPosition[] = [
    { planet: PLANETS[0], sign: getSignFromLongitude(sunLon),  degree: Math.round(sunLon  % 30), retrograde: false },
    { planet: PLANETS[1], sign: getSignFromLongitude(moonLon), degree: Math.round(moonLon % 30), retrograde: false },
  ];

  const outerPlanets = ["Mercure", "Vénus", "Mars", "Jupiter", "Saturne", "Uranus", "Neptune"];
  outerPlanets.forEach((name, idx) => {
    const lon  = getPlanetLongitude(jd,  name);
    const lon1 = getPlanetLongitude(jd1, name);
    planetPositions.push({
      planet: PLANETS[idx + 2],
      sign:   getSignFromLongitude(lon),
      degree: Math.round(lon % 30),
      retrograde: isRetrogradeFast(lon, lon1),
    });
  });

  return {
    sunSign:         getSignFromLongitude(sunLon),
    moonSign:        getSignFromLongitude(moonLon),
    ascendant:       calculateAscendant(birthDate, birthTime, latitude, longitude),
    planetPositions,
    aspects:         calculateAspects(planetPositions),
    birthDate,
    birthTime,
    birthPlace,
  };
}

export function getElementBalance(data: AstroData): Record<string, number> {
  const elements: Record<string, number> = { Feu: 0, Terre: 0, Air: 0, Eau: 0 };
  for (const p of data.planetPositions) {
    elements[p.sign.element] = (elements[p.sign.element] || 0) + 1;
  }
  return elements;
}
