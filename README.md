# Chromagnon

A Chrome side-panel color picker. Pick any pixel on your screen (even outside the browser), copy it as HEX, RGB, HSL or OKLCH, collect colors into palettes, and check WCAG contrast.

Built with [WXT](https://wxt.dev), React 19, Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com) on top of the native [`EyeDropper` API](https://developer.mozilla.org/docs/Web/API/EyeDropper).

## Features

- **Pick**: click the toolbar icon to open the side panel, then **Pick a color**. The color is copied right away in your chosen format, and shown in all four formats, each one click to copy.
- **Pick shortcut**: press **⌥ Option + ⇧ Shift + C** (**Alt + Shift + C** on Windows/Linux) on any web page to pick without opening the panel. A small toast confirms the copy. You can rebind it in Settings.
- **Recent**: the last 24 picks, shared between the panel and the shortcut.
- **Palettes**: save colors into named palettes and copy a palette as CSS variables, a Tailwind v4 `@theme` block, or JSON.
- **Contrast**: WCAG 2.2 ratio between a text and background color, with AA/AAA results for normal text, large text and UI components.

## Develop

```bash
pnpm install
pnpm dev
```

`pnpm dev` opens a fresh Chrome profile with the extension loaded and hot-reloads changes under `src/`. If Chrome doesn't launch automatically, load `.output/chrome-mv3-dev` from `chrome://extensions` (Developer mode → Load unpacked). Restart the dev server after changing `wxt.config.ts`.

| Script         | What it does                                                      |
| -------------- | ----------------------------------------------------------------- |
| `pnpm dev`     | Dev build with hot reload, launches Chrome                        |
| `pnpm build`   | Production build in `.output/chrome-mv3/`                         |
| `pnpm zip`     | Builds and zips for the Chrome Web Store                          |
| `pnpm test`    | Unit tests (Vitest) for color math, contrast, palettes, shortcuts |
| `pnpm compile` | Type-check with `tsc --noEmit`                                    |

Unit tests cover `src/lib` only. UI changes are checked by hand in `pnpm dev`. [CLAUDE.md](CLAUDE.md) has the checklist, along with the codebase's conventions and the rules that keep it working.

### Release

1. Bump `version` in `package.json`. WXT copies it into the manifest, and Settings shows it.
2. Run `pnpm test && pnpm compile && pnpm zip`.
3. Upload the zip from `.output/` to the Chrome Web Store.

## How it fits together

```text
src/entrypoints/
  background.ts           makes the toolbar icon open the side panel
  sidepanel/              the app: Pick, Palettes, Contrast and Settings tabs
  shortcut.content.ts     on-page shortcut listener: plain TS, no React (~7 KB gzipped)
src/components/           views and shared pieces (swatch, toast, menus)
src/components/ui/        shadcn/ui primitives
src/hooks/                storage subscriptions, settings, theme, eyedropper
src/lib/
  color.ts                parsing and HEX/RGB/HSL/OKLCH conversion
  contrast.ts             WCAG luminance, ratio, thresholds
  palettes.ts             palette operations and exports
  shortcut.ts             matching, recording and labeling shortcuts
  storage.ts              every storage.local item and its shape
```

Some constraints shaped the design:

- **`EyeDropper.open()` needs a user gesture.** The background worker and `chrome.commands` shortcuts don't count as one. So picking starts either from a click in the side panel or from a keydown that a content script hears on the page.
- **Side panel instead of a popup.** A popup can close when the eyedropper takes focus, which loses the pick. The side panel stays open between picks.
- **One source of truth.** The panel and the content script are separate contexts, so all data lives in `storage.local`. Each one watches it, and a pick made on a page shows up in an open panel immediately.
- **Theme in `localStorage`.** It's read synchronously before the first render, so dark mode never flashes white.

## Requirements

Chrome (or Edge, Brave, Arc…) 116+. Firefox and Safari don't support `EyeDropper`.

Permissions:

- `storage` for settings, history, palettes and the contrast pair.
- `sidePanel` for the side panel.
- `clipboardWrite` so the copy fallback works without a fresh click.
- A content script on all sites for the pick shortcut. It only listens for that one key combination.

## Support

Chromagnon is free, with no ads or accounts. If it's useful to you, you can [buy me a coffee](https://buymeacoffee.com/dylancameron) ☕
