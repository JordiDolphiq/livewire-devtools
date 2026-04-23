# Livewire DevTools

Chrome DevTools extension for debugging Livewire applications. Supports **Livewire 3 and Livewire 4** (Laravel 13+). Shows an Alpine.js version badge when Alpine 3.15+ is present.

## Features

- **Components tab** — hierarchical component tree, filterable, with an editable state inspector. Edit a public property in the panel and the change is pushed back via `$wire.set`.
- **Events tab** — logs every `Livewire.dispatch(...)` call. Pause / clear, drill into payloads.
- **Timeline tab** — records a row on every component commit; pick a past row and click _Travel to state_ to restore that snapshot.
- **Hover highlight** — hover a node in the tree, the matching element is highlighted on the page.
- **Right-click inspect** — right-click any Livewire element on the page and pick _Inspect Livewire component_.
- **Version badges** — header shows detected Livewire version and Alpine version.
- **Dark mode** — follows the Chrome DevTools theme.

## Install (unpacked, for development)

```bash
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

Open any Livewire page, then open DevTools and switch to the **Livewire** panel.

## Scripts

| Command             | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Vite dev server with HMR for the panel                 |
| `npm run build`     | Type-check + production build into `dist/`             |
| `npm run typecheck` | `vue-tsc --noEmit` only                                |
| `npm run zip`       | Zip `dist/` into `release/livewire-devtools-…-chrome.zip` |
| `npm run release`   | `build` + `zip`                                        |

## Project layout

```
src/
  manifest.ts            typed MV3 manifest
  background/            service worker (message router + context menu)
  content/               content scripts (hook loader, proxy)
  injected/              page-world scripts
    hook.ts              global event bus on window
    detector.ts          polls for window.Livewire
    backend.ts           main orchestrator (driven by adapter)
    backend/             highlighter + right-click selector
  adapter/               Livewire abstraction
    detect.ts            feature-probe version detection
    v3.ts                Livewire 3 impl
    v4.ts                Livewire 4 impl (uses interceptMessage)
    shared.ts            normalize + dispatch-wrap helpers
  shared/                bridge, typed message union, devalue transfer
  panel/                 Vue 3 DevTools panel (Pinia stores, tab views)
  popup/                 action popups
```

## How the pieces talk

1. `hook-loader.ts` runs at `document_start`, injects `hook.ts` into the page main world. This creates `window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__`.
2. `proxy.ts` runs at `document_idle`, injects `detector.ts`. The detector polls for `window.Livewire`; on success it posts `livewire:detected` to the service worker, which colors the toolbar icon.
3. When DevTools is opened, `panel/devtools.ts` registers the Livewire panel. The panel (`panel/main.ts`) opens a long-lived `chrome.runtime.connect` port to the service worker, keyed by tab id.
4. The panel sends `init`. The proxy content script sees it and injects `backend.ts` into the page main world (once). The backend announces itself via `ready` and begins emitting `flush`, `event:triggered`, and `timeline:mutation` messages.
5. The Livewire adapter (v3 or v4) is selected by feature probe: `interceptMessage` → v4, `.hook()` + `.all()` → v3. All version-specific logic is confined to `src/adapter/v3.ts` and `src/adapter/v4.ts`.

## License

MIT. This tool started life as a fork of [rw4lll/livewire-devtools](https://github.com/rw4lll/livewire-devtools), which in turn drew from [vuejs/vue-devtools](https://github.com/vuejs/vue-devtools).
