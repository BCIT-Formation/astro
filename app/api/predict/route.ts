// Prediction endpoint: streams Claude Opus when ANTHROPIC_API_KEY is set,
// otherwise (or on Claude failure) falls back to the local generator in
// lib/predict.ts. The X-Prediction-Source header tells clients which path ran.
import { NextRequest } from "next/server";
import type { AstroData } from "@/lib/astrology";
import { THEME_CONFIG } from "@/lib/astrology";
import { generatePrediction } from "@/lib/predict";

// ─── Rate limiter ────────────────────────────────────────────────────────────
// In-memory, resets on process restart. Sufficient for Docker/VPS.
// On serverless (Vercel), each cold start gets a fresh map — acceptable.
const RATE_LIMIT    = 10;       // requests
const RATE_WINDOW   = 60_000;   // 1 minute in ms
const CLEANUP_EVERY = 300_000;  // purge stale entries every 5 min

const rateMap = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup to avoid unbounded Map growth
  if (now - lastCleanup > CLEANUP_EVERY) {
    for (const [key, entry] of rateMap) {
      if (now >= entry.resetAt) rateMap.delete(key);
    }
    lastCleanup = now;
  }

  const entry = rateMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Trop de requêtes. Les astres ont besoin d'une pause — réessayez dans une minute." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      }
    );
  }

  let astroData: AstroData;
  let theme: string;

  try {
    const body = await request.json() as { astroData: AstroData; theme: string };
    astroData = body.astroData;
    theme     = body.theme ?? "global";

    if (!astroData) {
      return new Response(JSON.stringify({ error: "Données astrologiques manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Corps de requête invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Path A: Claude API (when key is present) ──────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });

      const { sunSign, moonSign, ascendant, planetPositions, aspects } = astroData;

      const planetSummary = planetPositions
        .map((p) => `${p.planet.name} en ${p.sign.name}${p.retrograde ? " (rétrograde)" : ""} à ${p.degree}°`)
        .join(", ");

      const aspectSummary = aspects
        .slice(0, 8)
        .map((a) => `${a.planet1} ${a.symbol} ${a.planet2} (${a.type}, orbe ${a.orb}°)`)
        .join("; ");

      const themePrompt = THEME_CONFIG[theme]?.prompt ?? THEME_CONFIG.global.prompt;

      const prompt = `Tu es un astrologue expert avec une connaissance profonde de l'astrologie occidentale et védique. Génère une prévision astrologique détaillée et poétique en français.

**Thème de la prévision :** ${themePrompt}

**Données natales :**
- Signe solaire : ${sunSign.name} (${sunSign.element}, ${sunSign.quality}, gouverné par ${sunSign.ruler})
- Signe lunaire : ${moonSign.name} (${moonSign.element}, ${moonSign.quality})
- Ascendant : ${ascendant.name} (${ascendant.element}, ${ascendant.quality})

**Positions planétaires :**
${planetSummary}

**Aspects planétaires actifs :**
${aspectSummary || "Aucun aspect majeur significatif"}

**Instructions :**
1. Commence par une ouverture poétique et mystique sur le cosmos (2-3 phrases)
2. Analyse l'interaction entre le signe solaire, lunaire et l'ascendant (3-4 phrases)
3. Interprète les positions planétaires les plus significatives (4-5 phrases)
4. Analyse les aspects planétaires et leur influence (3-4 phrases)
5. Donne des conseils pratiques pour la période actuelle (3-4 conseils concrets)
6. Conclus avec une affirmation positive et encourageante

Utilise un ton à la fois mystique, poétique et concret. Inclus des métaphores cosmiques. Formate avec des sections claires en utilisant des marqueurs **Titre :** pour chaque section. La prévision doit être riche, détaillée et personnalisée (environ 400-500 mots).`;

      const stream = await client.messages.stream({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        system: "Tu es AstroVision, un astrologue de renommée mondiale qui combine la sagesse ancienne des étoiles avec les insights de l'intelligence artificielle moderne. Tes prévisions sont poétiques, précises et profondément perspicaces.",
        messages: [{ role: "user", content: prompt }],
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Content-Type-Options": "nosniff",
          "X-Prediction-Source": "claude",
        },
      });
    } catch (error) {
      console.error("Claude API error — falling back to local generator:", error);
      // Fall through to local generator
    }
  }

  // ── Path B: Local generator (no API key, or Claude unavailable) ───────────
  try {
    const text = generatePrediction(astroData, theme);
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Prediction-Source": "local",
      },
    });
  } catch (error) {
    console.error("Local prediction error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération de la prévision" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
