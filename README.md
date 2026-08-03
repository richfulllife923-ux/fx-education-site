# TUTTO Official Site

TUTTO official website for the Market Geometry Observation Framework.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Static export for Cloudflare Pages
- Lucide React icons

## Brand

- Logo text: ◉ TUTTO
- Subtitle: Market Geometry Observation Framework
- Theme: dark navy, restrained blue accent, scientific and geometric tone
- Fonts: system font stack only. No `next/font`, no external font fetching, no added local font files.

## Cloudflare Pages Compatibility

The project keeps static export settings in `next.config.mjs`:

- `output: "export"`
- `trailingSlash: true`
- `images.unoptimized: true`

Do not change Cloudflare Pages settings from this repository unless the deployment pipeline is explicitly reviewed.

## Commands

```bash
npm run typecheck
npm run build
```

`npm run lint` currently uses `next lint`. This repository does not yet include an ESLint configuration, so Next.js opens an interactive setup prompt.

## Public Content Policy

The public site explains TUTTO as a market structure observation framework. Do not publish internal Geometry values, scoring formulas, acceptance thresholds, invalidation rules, collision formulas, or source-code-level trading logic.
