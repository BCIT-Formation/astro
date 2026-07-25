# ✨ AstroVision

[![CI](https://github.com/BardinConsulting/astro/actions/workflows/ci.yml/badge.svg)](https://github.com/BardinConsulting/astro/actions/workflows/ci.yml)
[![Release](https://github.com/BardinConsulting/astro/actions/workflows/release.yml/badge.svg)](https://github.com/BardinConsulting/astro/actions/workflows/release.yml)
[![Security](https://github.com/BardinConsulting/astro/actions/workflows/security.yml/badge.svg)](https://github.com/BardinConsulting/astro/actions/workflows/security.yml)

Application web et mobile de prévisions astrologiques personnalisées, propulsée par **Claude Opus 4.6** d'Anthropic.

## Description

AstroVision calcule votre thème natal (signe solaire, lunaire, ascendant, 9 planètes) à partir de votre date, heure et lieu de naissance, puis génère une analyse astrologique détaillée via l'IA en streaming temps réel. Sans clé API (ou si Claude est indisponible), un **générateur local de prévisions** (0 dépendance) prend le relais. Interface bilingue (FR/EN), mode sombre/clair, cache local 24 h, partage par URL et export PDF (impression). Disponible comme application web (Docker + Vercel) et APK Android (Capacitor).

## Architecture

```
astro/
├── app/
│   ├── api/
│   │   ├── health/route.ts     # Health-check endpoint (Docker HEALTHCHECK)
│   │   └── predict/route.ts    # Prédictions : streaming Claude + fallback local + rate limiting
│   ├── layout.tsx              # Root layout + métadonnées SEO/PWA
│   ├── page.tsx                # Page principale (Client Component)
│   └── globals.css             # Tailwind 4 + animations personnalisées
├── components/
│   ├── AstroForm.tsx           # Formulaire de saisie (date, lieu, thème)
│   ├── PlanetGrid.tsx          # Grille positions planétaires + aspects
│   ├── PredictionDisplay.tsx   # Affichage streaming de la prédiction IA
│   ├── StarField.tsx           # Canvas fond étoilé animé (HiDPI)
│   └── ZodiacWheel.tsx         # Roue zodiacale Canvas (HiDPI)
├── contexts/
│   └── app.tsx                 # Contexte React : langue (FR/EN) + thème (sombre/clair)
├── lib/
│   ├── astrology.ts            # Calculs astronomiques + constantes centralisées
│   ├── astrology.test.ts       # Tests unitaires (node:test natif)
│   ├── predict.ts              # Générateur local de prévisions (fallback sans clé API)
│   ├── predict.test.ts         # Tests unitaires du générateur local
│   └── i18n.ts                 # Traductions de l'interface (FR/EN)
├── e2e/
│   └── main.test.ts            # Tests E2E Playwright (flux principal)
├── public/
│   └── manifest.json           # PWA manifest
├── .github/
│   ├── dependabot.yml          # Mises à jour automatiques des dépendances
│   └── workflows/
│       ├── ci.yml              # Lint + typecheck + build + tests
│       ├── release.yml         # Versioning automatique (release-please)
│       ├── pr-check.yml        # Validation Conventional Commits
│       └── security.yml        # Audit npm hebdomadaire
├── Dockerfile                  # Multi-stage build (deps → builder → runner)
├── docker-compose.yml          # App + Nginx (profil production)
├── nginx.conf                  # Reverse proxy Nginx (profil production)
├── playwright.config.ts        # Config Playwright (E2E, serveur dev auto)
├── vercel.json                 # Config Vercel (régions, timeout streaming)
└── capacitor.config.ts         # Config Android/iOS (Capacitor 8)
```

## Prérequis

- Node.js 22+
- Clé API Anthropic ([console.anthropic.com](https://console.anthropic.com)) — optionnelle (générateur local en secours)
- Docker 24+ (pour le déploiement conteneurisé)
- Android Studio (pour l'APK uniquement)

## Installation

```bash
git clone https://github.com/BardinConsulting/astro.git
cd astro
npm install
# Optionnel : prédictions via Claude (sinon générateur local)
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
# → http://localhost:3000
```

## Déploiements

### Développement local

```bash
npm run dev
```

### Docker

```bash
# Build + run manuel
docker build -t astrovision .
docker run -p 3000:3000 --env-file .env.local astrovision

# Avec docker-compose (app seule) — ANTHROPIC_API_KEY lue depuis
# l'environnement du shell (optionnelle)
docker-compose up -d

# Avec Nginx (profil production)
docker-compose --profile production up -d
```

### Vercel

```bash
vercel deploy
```

Configurer `ANTHROPIC_API_KEY` dans Project → Settings → Environment Variables.

### Android APK

```bash
# Prérequis : Android Studio installé
npm run android:build
# Android Studio s'ouvre → Build → Generate Signed Bundle/APK
```

## Variables d'environnement

| Variable            | Obligatoire | Description                                                              |
|---------------------|-------------|--------------------------------------------------------------------------|
| `ANTHROPIC_API_KEY` | Non         | Clé API Anthropic pour Claude Opus 4.6 ; sans clé, générateur local utilisé |

Créer un fichier `.env.local` à la racine (gitignoré) avec la valeur si vous souhaitez les prédictions via Claude.

## Commandes utiles

| Commande               | Description                                              |
|------------------------|----------------------------------------------------------|
| `npm run dev`          | Serveur de développement (port 3000)                     |
| `npm run build`        | Build Next.js standard (Vercel)                          |
| `npm run build:docker` | Build avec output standalone (Docker)                    |
| `npm run build:static` | Build export statique (Capacitor/Android)                |
| `npm run lint`         | ESLint                                                   |
| `npm run typecheck`    | Vérification TypeScript sans émission de fichiers        |
| `npm test`             | Tests unitaires (node:test natif Node 22, 0 dépendance)  |
| `npm run test:e2e`     | Tests E2E Playwright (lance le serveur dev automatiquement) |

## Tests

Les tests utilisent le **runner natif de Node.js 22** (`node:test`) — zéro dépendance externe.

```bash
npm test
```

Couverture :
- Invariants des constantes (`ZODIAC_SIGNS`, `PLANETS`, `ELEMENT_COLORS`)
- Calculs de `calculateAstroData` pour des dates et lieux connus
- Structure et cohérence des données retournées (planètes, aspects, degrés)
- Générateur local de prévisions (`lib/predict.test.ts` : sections, thèmes, déterminisme)

Tests E2E (Playwright, Chromium) :

```bash
npm run test:e2e
```

## CI/CD

| Workflow       | Déclencheur                       | Actions                                          |
|----------------|-----------------------------------|--------------------------------------------------|
| `ci.yml`       | Push + PR sur `main`/`develop`    | install → lint → typecheck → build → tests       |
| `release.yml`  | Push sur `main`                   | CHANGELOG + tag semver + GitHub Release          |
| `pr-check.yml` | PR ouverte/modifiée               | Vérification titre Conventional Commits          |
| `security.yml` | Hebdomadaire (lundi 09:00 UTC)    | `npm audit` + rapport                            |

### Protection de branches (à activer manuellement dans GitHub Settings → Branches)

- **`main`** : PR obligatoire, CI verte requise, no force-push, 1 approbation minimum
- **`develop`** : CI verte requise, no force-push

## Contribution

1. Créer une branche depuis `develop` : `feat/ma-fonctionnalite`
2. Les commits suivent les [Conventional Commits](https://www.conventionalcommits.org/) :
   `feat:` `fix:` `docs:` `refactor:` `test:` `ci:` `chore:`
3. Ouvrir une Pull Request vers `main`
4. La CI doit passer (lint + typecheck + build + tests)

## Feuille de route

Le backlog est suivi dans [TODO.md](TODO.md). Les items historiques (rate limiting, cache localStorage, i18n FR/EN, tests E2E Playwright, export PDF, partage par URL, générateur local) sont implémentés.

---
*Technologies : **Next.js 16** · **Claude Opus 4.6** · **Tailwind CSS 4** · **Canvas API** · **Capacitor 8** · **Docker** · **Vercel***

*À des fins de divertissement. Les astres guident, l'humain décide.*
