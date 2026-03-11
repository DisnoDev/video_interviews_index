# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DISNOVATION.ORG Video Interviews Index — a browser-based, single-page application for browsing, searching, and watching video interviews. Data is fetched live from a published Google Sheet. Videos are hosted on Vimeo with multi-language subtitles and transcripts.

## Development

**No build system.** This is a vanilla JavaScript ES modules project. To develop:
- Serve the root directory with any static file server (e.g., `npx serve`, VS Code Live Server, Python `http.server`)
- Open `index.html` in a browser — all JS loads via `<script type="module" src="app.js">`
- No npm dependencies, no package.json, no transpilation
- No test framework exists; testing is manual in-browser

## Architecture

### Module Graph

```
app.js (orchestrator)
  ├── sheets.js    → Google Sheets CSV fetch + parse
  ├── table.js     → DATA[], FILTERED[], sorting, filtering, row rendering
  ├── player-module.js → Vimeo SDK, subtitle selection, transcript word-highlighting
  ├── transcript.js    → Transcript modal UI, download (.txt/.pdf)
  ├── toolbar.js       → Column toggles, theme, audio mode, subtitle pref, collection filter
  ├── i18n.js          → UI translations (10 languages), data-i18n DOM binding
  ├── lang.js          → Language normalization (60+ codes), subtitle parsing, transcript extraction
  ├── pdf.js           → Bulk PDF export of filtered results
  ├── utils.js         → DOM selectors ($, $$), CSV parser, Vimeo URL helpers, escapeHtml
  └── config.js        → SHEET_ID, default sort settings
```

### Key Patterns

- **Inter-module communication via CustomEvent**: `row:play`, `transcript:updated`, `subtitle:pref-changed`, `audio:mode-changed`. Modules dispatch and listen on `document`.
- **Module-scoped mutable state**: `table.js` exports mutable arrays `DATA[]` and `FILTERED[]`; `app.js` populates them after fetch. Other modules maintain their own state (e.g., `currentId` in player-module).
- **Race condition guards**: Async operations (transcript updates, player loads) use sequence numbers to discard stale results.
- **localStorage persistence**: Theme, subtitle language preference, audio mode, autoplay setting.
- **Delegated event handling**: Row clicks and keyword filters use single listeners on `document`/container elements.

### Data Model (from Google Sheets)

Each row represents an interview segment. Key columns:
- `Link` (Vimeo URL, required), `Notion` (concept name), `Notion_fr/de/...` (localized concepts)
- `Interviewee name`, `Year`, `Duration (s)`, `Collection`, `Keywords`, `Title`
- `Late_4s` — video start offset in seconds
- `Transcript`, `Transcript_fr`, `Transcript_de`, ... — per-language full transcripts
- `Subtitles` — flexible format: JSON array, CSV string, or object notation

### Transcript Highlighting System (player-module.js)

The most complex subsystem. It:
1. Chunks the transcript into paragraphs, then tokenizes words with NFD-normalized canonical forms
2. On each Vimeo subtitle cue, fuzzy-matches cue text against transcript chunks
3. Highlights matching words in the DOM and auto-scrolls the active chunk into view

### Internationalization

- `i18n.js`: Static UI string translations. DOM elements use `data-i18n`, `data-i18n-placeholder`, `data-i18n-title` attributes.
- `lang.js`: Runtime language code normalization and transcript/subtitle extraction per row. Separate concern from i18n.

## Configuration

All configuration lives in `assets/js/config.js`:
- `SHEET_ID`: The Google Sheets document ID (data source)
- `GID`: Optional sheet tab ID
- `DEFAULT_SORT_KEY` / `DEFAULT_SORT_DIR`: Initial table sort

## Styling

`assets/css/styles.css` uses CSS custom properties for theming (dark default, light toggle). Animated gradient background. Responsive with `clamp()` scaling. Includes print styles for PDF export.
