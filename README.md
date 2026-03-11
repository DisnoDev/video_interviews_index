# DISNOVATION.ORG Video Interviews Index

A React/Vite single-page archive for browsing, filtering, and watching DISNOVATION.ORG interview footage.

The application loads interview metadata, subtitle availability, and transcripts directly from a live Google Sheets document, then renders them in a redesigned split-view interface with Vimeo playback, transcript tools, and export features.

## What The Site Does

The archive is organized around interview concepts such as degrowth, ecology, maintenance, energy, and systemic transition.

Main user-facing capabilities:
- Live data loading from Google Sheets, with retry handling when the sheet cannot be fetched
- Search across concepts, titles, people, collections, keywords, subtitles, and transcripts
- Collection filtering, including URL shortcuts like `?PGTK` and `?RES`
- Sortable interview list
- Route-based selection with URLs like `/:slug`
- Vimeo playback with preferred subtitle selection
- Audio-only mode with transcript-first reading view, auto-scroll, and speed control
- Transcript viewing and transcript export as `.txt` or printable PDF
- Filtered archive export as printable PDF
- Theme persistence, language preference persistence, audio-mode persistence, and layout persistence

## Project Status

This repo contains:
- The current production app in `src/`
- The previous working implementation in `old/`, kept as a historical reference and behavior source

The `old/` app is not the runtime app anymore. The active application is the React/Vite version rooted in `src/`.

## Tech Stack

- React 18
- React Router 7
- Vite 6
- TypeScript
- Tailwind CSS 4
- Vitest + Testing Library
- Vimeo Player SDK loaded in-browser at runtime

There is no backend server in this project. The app is a static frontend that talks directly to Google Sheets and Vimeo from the browser.

## Data Source

Interview data is loaded from a Google Sheets CSV export configured in `src/app/lib/config.ts`.

Current configuration:
- `SHEET_ID`: live spreadsheet ID
- `GID`: optional sheet tab ID
- `USE_CSV_PUBLISH`: switch between Google `gviz` CSV and a published CSV URL
- `CSV_URL`: optional published CSV endpoint

Relevant row fields include:
- `Link`
- `Notion`
- `Title`
- `Interviewee name`
- `Collection`
- `Year`
- `Duration (s)`
- `Keywords`
- `Subtitles`
- `Transcript`
- `Transcript_<lang>`
- `Late_4s`

The app normalizes those raw rows into typed frontend records before rendering.

## Application Structure

High-level structure:
- `src/main.tsx`: client entrypoint
- `src/app/App.tsx`: app root
- `src/app/routes.tsx`: browser routes
- `src/app/components/VideoCollectionWrapper.tsx`: top-level persisted UI state and data hook wiring
- `src/app/components/VideoCollection.tsx`: main screen, toolbar, list/player layout, filtering, sorting, exports
- `src/app/components/VideoList.tsx`: list rendering and hover preview
- `src/app/components/VideoPlayer.tsx`: Vimeo player, subtitles, transcript highlighting, audio mode, transcript actions
- `src/app/components/TranscriptModal.tsx`: transcript dialog
- `src/app/lib/`: parsing, normalization, filtering, export, preferences, i18n, config
- `src/app/hooks/`: app hooks for data loading and persisted state
- `src/app/test/`: shared test setup and fixtures
- `scripts/postbuild.mjs`: post-build generation of SPA fallback files for common servers

Important utility modules:
- `src/app/lib/records.ts`: fetch sheet CSV and normalize raw rows into `InterviewRecord`
- `src/app/lib/languages.ts`: subtitle parsing, transcript selection, language normalization
- `src/app/lib/filtering.ts`: search/filter/sort behavior
- `src/app/lib/prefs.ts`: local/session storage persistence
- `src/app/lib/pdf.ts`: printable PDF exports
- `src/app/lib/collections.ts`: collection alias handling and query-string syncing

## Routing

The app uses browser history routing, not hash routing.

Routes:
- `/`: archive home
- `/:slug`: selected interview

Because this is an SPA, production hosting must rewrite unknown routes back to `index.html`.

## Local Development

Requirements:
- Node.js 18+ recommended
- npm

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Default behavior:
- Vite serves the app locally
- The browser fetches the live Google Sheets data directly
- Route navigation uses browser history

## Available Scripts

```bash
npm run dev
```
Starts the Vite development server.

```bash
npm run build
```
Creates a production build in `dist/` and then generates SPA fallback files for several common hosting setups.

```bash
npm run preview
```
Serves the built `dist/` folder locally using Vite preview.

```bash
npm test
```
Runs the Vitest suite once.

```bash
npm run test:watch
```
Runs Vitest in watch mode.

## Production Build

Build the site:

```bash
npm run build
```

Output directory:
- `dist/`

Generated production artifacts include:
- `dist/index.html`
- `dist/assets/*`
- `dist/404.html`
- `dist/.htaccess`
- `dist/web.config`
- `dist/_redirects`
- `dist/vercel.json`

The additional files are produced by `scripts/postbuild.mjs` so the SPA can be served on common static hosts without manually creating rewrite files each time.

## Serving On A Normal Web Server

Upload the contents of `dist/` to your web root.

Because the app uses browser routes like `/:slug`, direct requests to those URLs must resolve to `index.html` unless the path points to a real file.

Supported/generated fallback files:
- Apache: `dist/.htaccess`
- IIS: `dist/web.config`
- Netlify-style deploys: `dist/_redirects`
- Vercel-style deploys: `dist/vercel.json`
- Generic fallback: `dist/404.html`

For Nginx, configure a fallback such as:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Recommended validation after deployment:
1. Open `/`
2. Open a direct interview route like `/<some-slug>`
3. Refresh the page on that route
4. Confirm assets, Vimeo playback, and Google Sheets loading still work

## Testing

Current test coverage includes:
- CSV row parsing and record normalization
- Subtitle parsing
- Transcript language fallback behavior
- Collection alias handling
- Vimeo URL and start-offset helpers
- Basic route-driven component behavior

Relevant test files:
- `src/app/lib/app-utils.test.ts`
- `src/app/components/VideoCollection.test.tsx`

Run all tests:

```bash
npm test
```

## Styling

Styling lives in `src/styles/` and combines:
- Tailwind utilities
- CSS variables in `theme.css`
- project-level adjustments in `index.css`

The interface supports light/dark theme persistence and split/stacked layout persistence.

## Notes For Future Maintenance

- `old/` remains useful as a reference for historical behavior and data assumptions.
- The current app depends on the live spreadsheet schema. If spreadsheet column names change, normalization code in `src/app/lib/records.ts` and `src/app/lib/languages.ts` will likely need updates.
- Direct browser access to Google Sheets and Vimeo means deployment is static, but runtime availability depends on those external services being reachable.
