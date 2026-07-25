# ✨ AstroVision

<!-- workflow-badges:start -->

[![CI](https://github.com/BCIT-Formation/astro/actions/workflows/ci.yml/badge.svg)](https://github.com/BCIT-Formation/astro/actions/workflows/ci.yml)
[![PR Check](https://github.com/BCIT-Formation/astro/actions/workflows/pr-check.yml/badge.svg)](https://github.com/BCIT-Formation/astro/actions/workflows/pr-check.yml)
[![Release](https://github.com/BCIT-Formation/astro/actions/workflows/release.yml/badge.svg)](https://github.com/BCIT-Formation/astro/actions/workflows/release.yml)
[![Security](https://github.com/BCIT-Formation/astro/actions/workflows/security.yml/badge.svg)](https://github.com/BCIT-Formation/astro/actions/workflows/security.yml)

<!-- workflow-badges:end -->

[![CI](https://github.com/BardinConsulting/astro/actions/workflows/ci.yml/badge.svg)](https://github.com/BardinConsulting/astro/actions/workflows/ci.yml)
[![Release](https://github.com/BardinConsulting/astro/actions/workflows/release.yml/badge.svg)](https://github.com/BardinConsulting/astro/actions/workflows/release.yml)
[![Security](https://github.com/BardinConsulting/astro/actions/workflows/security.yml/badge.svg)](https://github.com/BardinConsulting/astro/actions/workflows/security.yml)

Application web et mobile de prévisions astrologiques personnalisées, propulsée par **Claude Opus 4.6** d'Anthropic.

## Description

AstroVision calcule votre thème natal (signe solaire, lunaire, ascendant, 9 planètes) à partir de votre date, heure et lieu de naissance, puis génère une analyse astrologique détaillée via l'IA en streaming temps réel. Disponible comme application web (Docker + Vercel) et APK Android (Capacitor).

## Architecture

```
astro/
├── app/
│   ├── api/
│   │   ├── health/route.ts     # Health-check endpoint (Docker HEALTHCHECK)
│   │   └── predict/route.ts    # Streaming AI predictions via Claude Opus 4.6
│   ├── layout.tsx              # Root layout + métadonnées SEO/PWA
│   ├── page.tsx                # Page principale (Client Component)
│   └── globals.css             # Tailwind 4 + animations personnalisées
├── components/
│   ├── AstroForm.tsx           # Formulaire de saisie (date, lieu, thème)
│   ├── PlanetGrid.tsx          # Grille positions planétaires + aspects
│   ├── PredictionDisplay.tsx   # Affichage streaming de la prédiction IA
│   ├── StarField.tsx           # Canvas fond étoilé animé (HiDPI)
│   └── ZodiacWheel.tsx         # Roue zodiacale Canvas (HiDPI)
├── lib/
│   ├── astrology.ts            # Calculs astronomiques + constantes centralisées
│   └── astrology.test.ts       # Tests unitaires (node:test natif)
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
├── vercel.json                 # Config Vercel (régions, timeout streaming)
└── capacitor.config.ts         # Config Android/iOS (Capacitor 8)
```

## Prérequis

- Node.js 22+
- Clé API Anthropic ([console.anthropic.com](https://console.anthropic.com))
- Docker 24+ (pour le déploiement conteneurisé)
- Android Studio (pour l'APK uniquement)

## Installation

```bash
git clone https://github.com/BardinConsulting/astro.git
cd astro
npm install
cp .env.example .env.local
# Éditez .env.local et renseignez votre ANTHROPIC_API_KEY
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

# Avec docker-compose (app seule)
cp .env.example .env.local   # remplir ANTHROPIC_API_KEY
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

| Variable            | Obligatoire | Description                           |
|---------------------|-------------|---------------------------------------|
| `ANTHROPIC_API_KEY` | Oui         | Clé API Anthropic pour Claude Opus 4.6 |

Copier `.env.example` → `.env.local` et remplir la valeur.

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

## Tests

Les tests utilisent le **runner natif de Node.js 22** (`node:test`) — zéro dépendance externe.

```bash
npm test
```

Couverture :
- Invariants des constantes (`ZODIAC_SIGNS`, `PLANETS`, `ELEMENT_COLORS`)
- Calculs de `calculateAstroData` pour des dates et lieux connus
- Structure et cohérence des données retournées (planètes, aspects, degrés)

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

## Améliorations proposées

### 🔴 Priorité haute
- Rate limiting sur `/api/predict` pour éviter les abus de l'API
- Gestion d'erreur + retry automatique côté client sur la connexion streaming

### 🟠 Priorité moyenne
- Cache côté client pour éviter de recalculer si les paramètres n'ont pas changé
- Tests E2E avec Playwright pour les flux critiques
- Accessibilité : aria-labels sur les Canvas, navigation clavier

### 🟢 Nice to have
- Support multilingue (i18n) — actuellement en français uniquement
- Sauvegarde du profil astral en localStorage
- Export PDF du thème natal
- Partage de prédiction via URL

---
*Technologies : **Next.js 16** · **Claude Opus 4.6** · **Tailwind CSS 4** · **Canvas API** · **Capacitor 8** · **Docker** · **Vercel***

*À des fins de divertissement. Les astres guident, l'humain décide.*
