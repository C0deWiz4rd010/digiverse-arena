# 03 — Designsystem

Stil: **Digital Monster Cyber UI** — neon, holographic, glassmorphism, cyber grid, scanlines,
data particles, dark UI, high-contrast cards, premium browsergame. Dark ist Default.

## Design-Tokens (CSS Custom Properties)

```css
:root {
  /* Backgrounds */
  --color-bg-950: #05070d;
  --color-bg-900: #08111f;
  --color-bg-800: #0d1b2e;

  /* Surfaces */
  --color-surface-900: rgba(12, 22, 38, 0.88);
  --color-surface-800: rgba(19, 35, 58, 0.76);
  --color-surface-glass: rgba(255, 255, 255, 0.08);

  /* Brand */
  --color-primary-500: #00e5ff;
  --color-primary-400: #37f3ff;
  --color-secondary-500: #8b5cf6;
  --color-accent-500: #ffb703;
  --color-danger-500: #ff3b6b;
  --color-success-500: #35ff9e;

  /* Attribute-Farben */
  --color-virus: #ff3b6b;
  --color-vaccine: #37f3ff;
  --color-data: #35ff9e;
  --color-free: #ffb703;
  --color-unknown: #aab4c4;

  /* Text */
  --text-main: #f4f8ff;
  --text-muted: #9fb0c7;
  --text-soft: #6d7d96;

  /* Lines & Glow */
  --border-soft: rgba(255, 255, 255, 0.12);
  --shadow-neon-primary: 0 0 24px rgba(0, 229, 255, 0.35);
  --shadow-neon-purple: 0 0 28px rgba(139, 92, 246, 0.35);

  /* Typografie */
  --font-display: "Orbitron", "Rajdhani", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Spacing */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem; --space-10: 2.5rem; --space-12: 3rem;

  /* Radius */
  --radius-sm: 0.5rem; --radius-md: 0.9rem; --radius-lg: 1.25rem;
  --radius-xl: 1.75rem; --radius-pill: 999px;
}
```

### Breakpoints (mobile first)
```scss
$bp-sm: 480px; $bp-md: 768px; $bp-lg: 1024px; $bp-xl: 1280px; $bp-2xl: 1536px;
```

## Typografie
- Headings: `Orbitron` / `Rajdhani` / `Oxanium`
- Body: `Inter` / `Roboto` / `Noto Sans`
- Mono/Data: `JetBrains Mono`
- `font-display: swap`, System-Fallbacks definieren, Self-Hosting bevorzugen.

## Core-Komponenten (zuerst bauen)

Standalone-Komponenten, Signal-Inputs (`input()`), prefix `digi-`:

`DigiButton`, `DigiCard`, `DigiChip`, `DigiBadge`, `DigiInput`, `DigiSelect`, `DigiModal`,
`DigiTabs`, `DigiBottomNav`, `DigiTopBar`, `DigiSkeleton`, `DigiEmptyState`, `DigiErrorState`,
`DigiStatBar`, `DigiTypeBadge`, `DigiAttributeBadge`, `DigiHoloFrame`, `DigiLoadingPortal`.

### Komponenten-Richtlinien
- Inputs via `input()` / `input.required()`, Outputs via `output()`.
- Keine Logik im Template, die nicht `computed()` ist.
- Touch-Targets ≥ 44px.
- Jede interaktive Komponente: Fokus-Stil, ARIA-Label, Keyboard-Support.
- Reduced-Motion respektieren (`prefers-reduced-motion` + Settings-Flag).

## Attribut-Glow-Mapping
| Attribut | Token |
| --- | --- |
| Vaccine | `--color-vaccine` |
| Virus | `--color-virus` |
| Data | `--color-data` |
| Free | `--color-free` |
| Unknown/Variable | `--color-unknown` |

## Commit
```bash
git commit -m "feat(design-system): add cyber mobile-first design tokens and core UI components"
git push origin develop
```
