# Notum Extension Architecture and Flow

This document describes how the project is organized, how the extension is loaded by the browser, and what is executed in each part of the system.

## Overview

- Project: browser extension written in TypeScript + React, bundled with Webpack.
- Local storage: IndexedDB via Dexie.
- Build output: the `dist/` folder containing bundles and the final `manifest.json` used by the browser.

## How the extension is loaded

1. The browser reads the `manifest.json` (generated in `dist/manifest.json` or `public/manifest.json` during development).
2. The manifest registers the following main contexts:
   - Background service worker (file generated from `src/background/index.ts`).
   - Content scripts (entry at `src/content/index.ts`) — injected into pages per the manifest.
   - UI: `popup.html` and `sidepanel.html` that load React apps (entries in `src/ui/popup` and `src/ui/sidepanel`).
   - Web Workers (bundles in `dist/workers/`) used for heavy processing and translation.

## Main parts and what each one does

- Background (service worker)
  - Source file: `src/background/index.ts`.
  - Responsibilities: listens for messages from other parts (popup, content scripts, workers), manages alarms/cron tasks, creates/shows context menus, coordinates actions that must run without a UI.
  - Interactions: calls storage services, queues tasks for web workers, responds to translation and export requests.

- Content Script
  - Source file: `src/content/index.ts`.
  - Responsibilities: runs in the web page context, captures text selections, extracts page content to create resources, shows overlays (when applicable) and sends messages to the background for persistence.
  - Interactions: communicates with the `background` via `postMessage`/messaging API (see `src/lib/messaging.ts`).

- Popup UI
  - Entries: `src/ui/popup/index.tsx` and `src/ui/popup/PopupApp.tsx`.
  - Responsibilities: quick interface for user actions (capture page, view highlights, create flashcards), sends commands to the background and reads state via storage services.

- Sidepanel
  - Entries: `src/ui/sidepanel/index.tsx` and `src/ui/sidepanel/SidePanelApp.tsx`.
  - Responsibilities: richer interface to browse resources, study tracks, edit notes, and review flashcards.

- UI Components
  - Location: `src/ui/components/` (e.g., `HighlightCard.tsx`, `ResourceCard.tsx`, `StudyTrackCard.tsx`).
  - Responsibilities: reusable React components used by the popup and sidepanel.

- Storage (IndexedDB via Dexie)
  - Files: `src/storage/database.ts` and services in `src/storage/*.ts` (e.g., `HighlightService.ts`, `ResourceService.ts`, `FlashcardService.ts`, `StudyTrackService.ts`).
  - Responsibilities: define the DB schema, perform CRUD, apply business rules at the persistence level and provide an async API for upper layers.

- Web Workers
  - Files: `src/workers/processing.worker.ts`, `src/workers/translation.worker.ts`.
  - Responsibilities: run heavy tasks (text processing, extraction, local translation) off the main thread so the UI doesn't block.
  - Interactions: communicate with the background or directly with the UI via messages.

- Lib utilities
  - Location: `src/lib/` (`messaging.ts`, `export-import.ts`, `translation.ts`, `utils.ts`).
  - Responsibilities: helper functions, standardizing message exchange between contexts, and export/import logic (JSZip), translation helpers.

- Tests
  - Location: Jest tests in `src/**/__tests__` and component tests in `src/ui/components/__tests__`.
  - Execution: `npm test` runs tests, `npm test -- --coverage` produces coverage in `coverage/`.

## Typical action flow (e.g., saving a highlight)

1. User selects text on a page.
2. The `content script` detects the selection and sends a message to the `background` (via `src/lib/messaging.ts`).
3. The `background` may open a small UI or call a storage service to persist the highlight.
4. The service (`HighlightService`) writes to IndexedDB.
5. The UI (popup/sidepanel) can listen for events or request state from storage to update the view.

## Build and development

- Main scripts (in `package.json`):
  - `npm run dev`: runs Webpack in watch mode for development.
  - `npm run build`: produces production bundles in `dist/`.
  - `npm run test`: runs Jest tests.
  - `npm run type-check`: runs `tsc --noEmit` to check types.
- Bundling configuration: `webpack.config.js` and `tsconfig.webpack.json` create separate bundles for background, content, popup, sidepanel, and workers.
- During development, use `scripts/setup-dev.sh` to prepare the environment (if applicable) and load the `dist/` folder as a temporary extension in the browser.

## Where to find important items

- Runtime entries: `src/background/index.ts`, `src/content/index.ts`, `src/ui/popup/index.tsx`, `src/ui/sidepanel/index.tsx`.
- Persistence: `src/storage/database.ts` and services under `src/storage/`.
- Messaging between contexts: `src/lib/messaging.ts`.
- Heavy processing: `src/workers/*`.
- Manifests and public assets: `public/manifest.json`, `public/icons/`.
- Final bundles (to load in the browser): `dist/` after running `npm run build`.

## How to load the extension locally (summary)

1. `npm install`
2. `npm run build` (or `npm run dev` for development with watch)
3. In the browser, open "Load unpacked" / "Load Temporary Add-on" and select the `dist/` folder.
