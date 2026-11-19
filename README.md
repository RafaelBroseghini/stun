# Stun

One hundred single-file HTML studies and a catalog to browse them.

- `index.html`: the catalog. Filter by discipline, search (`/` jumps to the search box), switch between grid and list, hover a plate for a live preview, and click to open the study in the viewer (`#no-042`), which expands out of the plate you clicked. ← / → move between studies, Esc returns to the index. On wide screens a live "Now showing" study rotates in the masthead.
- `works/NNN-name.html`: the studies. Each is a standalone file with no build step and no bitmaps; everything is drawn with CSS, SVG, Canvas or Web Audio, and every study responds to the cursor, clicks or keys. Some load a typeface from Google Fonts.
- `works/manifest.js`: titles, disciplines, descriptions and the "try this" hint for each study.
- `thumbs/NNN.jpg`: catalog thumbnails rendered from the studies.
- `social-card.jpg`: the X/Twitter and Open Graph preview image, a 2400×1257 screenshot of the catalog's first screen. The meta tags in `index.html` point at its GitHub Pages URL.

## Running locally

Open `index.html` in a browser, or serve the folder:

```sh
npm run serve          # python3 -m http.server 8000
```

## Checks

```sh
npm ci
npx playwright install chromium
npm test               # smoke test: manifest, file structure, every study, the catalog
npm run thumbs         # re-render all thumbnails (or: npm run thumbs -- 4 27)
npm run card           # re-render social-card.jpg from the catalog's first screen
```

The smoke test loads every study over HTTP in Chromium, moves, drags, clicks, double-clicks, scrolls and types on it, and fails on any script error. It also checks that each file has a doctype, `lang`, viewport and a `<title>` matching the manifest, and that the catalog renders, filters and opens the viewer.

## CI and GitHub Pages

- `.github/workflows/ci.yml` runs the smoke test on every push and pull request.
- `.github/workflows/pages.yml` runs the same test and, if it passes, publishes `index.html`, `works/` and `thumbs/` to GitHub Pages on every push to `main`.

To turn on Pages, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
