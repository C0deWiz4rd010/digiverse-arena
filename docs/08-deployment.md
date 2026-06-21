# 08 — Deployment, Legal & Release

## GitHub Pages via Actions

Deployment läuft bei jedem Push auf `develop`. Output des Angular-22-Builders:
`dist/digiverse-arena/browser`.

Workflow: `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [develop]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run test:ci          # Vitest: einmalig, kein Watch
      - run: npm run build -- --base-href "/digiverse-arena/"
      - name: SPA fallback (404 = index)
        run: cp dist/digiverse-arena/browser/index.html dist/digiverse-arena/browser/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/digiverse-arena/browser

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Wichtig
- `--base-href "/digiverse-arena/"` (Repo-Name!) sonst brechen Assets auf Pages.
- **SPA-Fallback:** `404.html` = Kopie von `index.html`, sonst 404 bei Deep-Links/Reload.
- Vitest im CI mit `--run` (kein Watch-Hang).
- GitHub Pages in den Repo-Settings auf **Source: GitHub Actions** stellen.

```bash
git commit -m "ci(pages): deploy production build to GitHub Pages on develop push"
git push origin develop
```

## Legal / Disclaimer

Digimon ist eine Bandai-Franchise; DAPI ist nicht offiziell von Bandai. Footer (ab Shell sichtbar):

```text
This is a fan-made project using public DAPI data. Digimon and related media are
trademarks of Bandai. This project is not affiliated with or endorsed by Bandai.
```

Zusätzlich:
- Keine kommerzielle Monetarisierung ohne Rechteklärung.
- Keine offiziellen Logos ohne Erlaubnis.
- DAPI-Attribution sichtbar, Link zur DAPI-Doku im About-Bereich.

```bash
git commit -m "docs(legal): add fan project disclaimer and DAPI attribution"
```

## Release-Polish (vor Release)

- README: Features, Tech-Stack, API-Attribution, Getting Started, Scripts, Deployment, Roadmap, Legal.
- Screenshots, GitHub-Pages-Link, Known Issues.
- Lighthouse Mobile prüfen (>85), A11y (>90).
- Mobile + Desktop testen, 404-Fallback testen, Cache-Reset-Button testen.

```bash
git commit -m "docs(readme): add project overview setup deployment and roadmap"
```
