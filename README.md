# Stun

One hundred single-file HTML studies and a catalog to browse them.

- `index.html` — the catalog. Filter by discipline, search, switch grid/list, hover a plate for a live preview, click to open the study in the viewer (`#no-042`). ← / → move between studies, Esc returns to the index.
- `works/NNN-name.html` — the studies. Each one is a standalone file with no build step and no bitmaps; everything is drawn with CSS, SVG, Canvas or Web Audio. Some load a typeface from Google Fonts.
- `works/manifest.js` — titles, disciplines and one-line descriptions used by the catalog.
- `thumbs/NNN.jpg` — catalog thumbnails rendered from the studies.

Open `index.html` in a browser, or serve the folder (`python3 -m http.server`) and visit it.
