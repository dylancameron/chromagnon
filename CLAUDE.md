# CLAUDE.md

Chromagnon is a Chrome (MV3) side-panel color picker: pick any on-screen pixel with the native `EyeDropper` API, copy it as HEX/RGB/HSL/OKLCH, collect palettes, check WCAG contrast. It's built with WXT, React 19, Tailwind CSS v4 and shadcn/ui, and managed with pnpm. `README.md` has the user-facing feature list and a short architecture overview; this file covers what you need to change the code safely.

## Commands

```bash
pnpm install    # also runs `wxt prepare`, which generates .wxt/ (types + tsconfig base)
pnpm dev        # dev build with HMR; launches a fresh Chrome profile with the extension loaded
pnpm test       # Vitest, src/lib only
pnpm compile    # tsc --noEmit
pnpm build      # production build → .output/chrome-mv3/
pnpm zip        # build + zip for the Chrome Web Store → .output/
```

Run a single test file with `pnpm vitest run src/lib/color.test.ts`. Restart `pnpm dev` after editing `wxt.config.ts`. If `tsc` can't find `browser`, `defineBackground` or `defineContentScript`, run `pnpm wxt prepare`.

There's no linter, formatter or CI. Before calling a change done, run `pnpm test && pnpm compile`, plus `pnpm build` if you touched the content script or config.

## History

- `0aea607`: initial commit (LICENSE only).
- `3aaa2ca` (2026-11-10): rebuilt from a WXT/shadcn starter, which had a settings popup and a draggable React panel injected into every page, as **Hexadaisical**, a focused side-panel color tool. That rebuild replaced a 389 KB React bundle on every page with a ~7 KB vanilla content script, fixed host-page CSS bleeding into the UI, and dropped Firefox.
- `44b2b56` (2026-11-11): renamed to **Chromagnon**, with a new rock icon, an animated logo, and a Buy Me a Coffee link. Merged as PR #1.
- `23f2e5c`: LICENSE deliberately deleted. Don't add one unless asked.

## Architecture

Three extension contexts share state only through `chrome.storage.local`:

| Context | File | Role |
| --- | --- | --- |
| Background worker | `src/entrypoints/background.ts` | One job: make the toolbar icon open the side panel. |
| Side panel | `src/entrypoints/sidepanel/` (`main.tsx` → `app.tsx`) | The React app. Tabs: Pick, Palettes, Contrast, Settings. |
| Content script | `src/entrypoints/shortcut.content.ts` | Runs on `<all_urls>`. Listens only for the pick shortcut, in plain TS. |

```text
src/components/        tab views (pick/palettes/contrast/settings-view), swatch, toast, logo, save-to-palette-menu
src/components/ui/     shadcn primitives + two custom ones (kbd, segmented)
src/hooks/             useStorageItem, useSettings, useTheme, useEyeDropper
src/lib/               React-free logic: color, contrast, palettes, shortcut, history, storage, clipboard, eye-dropper, page-toast, theme
src/types/             EyeDropper typings (not in lib.dom yet)
src/assets/icon.svg    source for public/icon/*.png
store/                 Chrome Web Store listing copy, test instructions, promo tile, screenshots
```

### How a pick flows

**From the panel:** `PickView` button → `pickAndCopy` (in `app.tsx`) → `useEyeDropper().pick()`. A ref stops two pickers opening at once. Then `openEyeDropper()` → `normalizeHex` → `addToHistory` → `copyText(formatColor(hex, settings.copyFormat))` → in-panel toast. The Contrast tab's eyedropper buttons use `pickToHistory`, which records the pick but doesn't copy it. The panel also listens for the shortcut itself while it has focus.

**From any page:** `shortcut.content.ts` keeps a cached copy of the settings, so the keydown handler can call `EyeDropper.open()` while the gesture is still fresh. On a match it calls `preventDefault` and `stopImmediatePropagation` in the capture phase. Then `openEyeDropper` → `addToHistory` → `copyText` → `showPageToast`. An open panel sees the new `history[0]` through its storage watch, and `App` makes it the current color.

`openEyeDropper` returns `null`, not an error, on `AbortError` (user pressed Esc) and `InvalidStateError` (a picker is already open).

### Storage

Every `storage.local` item is defined in `src/lib/storage.ts`, so look there first.

| Key | Store | Shape | Notes |
| --- | --- | --- | --- |
| `local:settings` | storage.local | `Partial<Settings>` | Merged with `DEFAULT_SETTINGS` by `withDefaults()`, so new settings need no migration. |
| `local:hexHistory` | storage.local | `string[]` | Newest first, de-duplicated, capped at `HISTORY_LIMIT` (24). |
| `local:palettes` | storage.local | `Palette[]` (`id`, `name`, `colors`) | Colors unique, in insertion order. |
| `local:contrast` | storage.local | `{ text, background }` | Defaults to `#1f1f1f` on `#ffffff`. |
| `chromagnon:theme` | panel `localStorage` | `"system" \| "light" \| "dark"` | Synchronous, so it's applied before the first paint. |
| `chromagnon:tab` | panel `localStorage` | tab id | Remembers the last tab. |

## Rules that keep it working

1. **`EyeDropper.open()` needs a live user gesture.** That means a click in the panel or a keydown on the page. The background worker and `chrome.commands` don't qualify, so picking can't move there. In the content script, don't add an `await` before `open()`; that's why the settings are cached.
2. **Keep the content script tiny.** It loads on every page. It may import React-free modules from `src/lib/` only: no React, no components or hooks, no CSS, no `@/lib/utils`. Today it's ~18 KB raw / ~7 KB gzipped; check `pnpm build` output after changes.
3. **Don't let host pages and the page toast affect each other.** `page-toast.ts` renders in a *closed* shadow root on a host with `all: initial !important`, uses `px` units (never `rem`, because the host page's font-size would apply), and sits at max z-index. Never inject landmarks, `aria-modal` or global styles into host pages.
4. **Shared state goes through `storage.ts`.** When the next value depends on the current one, use the function form of `useStorageItem`'s setter (`set(prev => …)`). It re-reads storage first, so it won't overwrite a write the other context just made.
5. **Don't rename storage keys or change stored shapes without a migration.** That would orphan existing users' data. WXT's `defineItem` supports `version` + `migrations`. The `hexHistory` name stays.
6. **Colors are normalized lowercase `#rrggbb` everywhere inside the app**, in storage, props and palette entries. Normalize user input at the boundary with `normalizeHex`, and format only for display or copying with `formatColor`.
7. **The UI lives in a side panel, not a popup.** A popup can close when the eyedropper takes focus, and the pick is lost.
8. **No flashes.** `main.tsx` applies the theme before `createRoot`. `App` returns `null` until settings and history have loaded, so empty states never flash.
9. **Contrast math is deliberately conservative.** Pass/fail compares the unrounded ratio, and `formatRatio` never rounds up across 3, 4.5 or 7 (4.499 shows "4.49"). OKLCH grays print `0 0` instead of floating-point noise. Tests cover both, so keep them passing.
10. **Shortcuts match on `KeyboardEvent.code`**, which works the same on any keyboard layout, and need an exact modifier set. A binding must include Alt, Ctrl or ⌘, so it can't fire while the user is typing.
11. **Chromium only (116+).** Firefox and Safari don't have `EyeDropper`, so don't add those targets.

## Conventions

- **Code style.** Tabs, double quotes, semicolons, trailing commas, `import { type X }` for types, external imports before `@/` ones. The shadcn-generated `button`, `input`, `label` and `switch` keep upstream's 2-space, no-semicolon style; leave them as they are. `@/` maps to `src/`. WXT auto-imports `browser`, `defineBackground` and `defineContentScript`, so they need no import.
- **Files and components.** File names are kebab-case. Components are named function exports. Small helper components live below the main export in the same file. Use a `FooProps` interface when props are non-trivial.
- **Logic vs. UI.** Pure logic goes in `src/lib/` with a test file next to it (`*.test.ts`). React belongs only in components, hooks and the side-panel entrypoint.
- **shadcn/ui.** `components.json` is set up as new-york, neutral, lucide, CSS variables. Add components with `pnpm dlx shadcn@latest add <name>`; they land in `src/components/ui/`. Radix comes from the unified `radix-ui` package. `kbd.tsx` and `segmented.tsx` are hand-written. `dropdown-menu.tsx` and `tabs.tsx` were trimmed and reformatted.
- **Styling.** Tailwind v4 is configured in CSS (`src/styles/globals.css`); there's no `tailwind.config`. Tokens are OKLCH variables, light in `:root` and dark in `.dark`, with class-based dark mode via `@custom-variant dark`. Two custom tokens: `success` and `swatch-ring`. **The panel itself is deliberately gray**, so the colors people pick are the only color on screen. The only hues are `destructive`, `success` and the logo, so don't add brand accents.
- **Accessibility is a requirement.** Icon-only buttons get `aria-label`, plus `title` where a tooltip helps. Toasts announce through always-mounted live regions. Animations have `motion-reduce:` variants or a `prefers-reduced-motion` check. The segmented control is built on native radios. Contrast results use real table semantics.
- **Destructive actions get an Undo toast, not a confirm dialog** (see clear history and delete palette).
- **UI copy.** Sentence case, plain words, contractions ("Couldn't copy"), a real ellipsis (…). Errors say what happened and, when it helps, what to do next.
- **Comments** explain *why*, not what.
- **Commits.** Imperative subject line, then a bulleted body with the what and why.

## Common changes

- **New setting:** add it to `Settings` and `DEFAULT_SETTINGS` in `storage.ts`. Add UI in `settings-view.tsx` using the local `Section` component. Read it with `useSettings()` in the panel, and from the cached `settings` in the content script if it needs it there.
- **New color format:** add it to `COLOR_FORMATS`, `FORMAT_LABELS` and the `formatColor` switch in `color.ts`, with tests. The Pick view's format list, the Settings control and the palette CSS/Tailwind exports all pick it up automatically. Check that the Settings segmented control still fits a narrow panel.
- **New palette export:** add it to `EXPORT_FORMATS` and the `exportPalette` switch in `palettes.ts`, with a test.
- **New tab:** add it to `TABS` in `app.tsx`, with a `TabsTrigger` and a `TabsContent`.
- **Icon change:** edit `src/assets/icon.svg` and re-export PNGs at 16, 32, 48, 96 and 128 px into `public/icon/`. There's no export script in the repo; any SVG rasterizer works, e.g. `rsvg-convert -w 128 -h 128`. Then mirror the shape in `src/components/logo.tsx` (the path, plus the `EYE` and `REST` constants), which redraws the icon with a pupil that follows the pointer.
- **Release:** bump `version` in `package.json`. WXT writes it to the manifest, and the Settings footer reads it from there. Then run `pnpm test && pnpm compile && pnpm zip` and upload the zip from `.output/`.
- **Store listing and privacy policy:** `store/README.md` holds the dashboard text (description, permission justifications, test instructions), and `PRIVACY.md` is the linked privacy policy. Update both when features, permissions or stored data change, because reviewers compare them against the code. The privacy answers depend on the extension making no network requests.

## Verifying UI changes

Unit tests cover only `src/lib` (color, contrast, palettes, history, shortcuts). `WxtVitest` provides a fake `browser` with in-memory storage, plus the `@/` alias. There are no component or end-to-end tests, and the OS-level eyedropper can't be driven automatically. Check UI changes by hand in `pnpm dev`:

- Panel pick: copies in the chosen format, shows a toast, updates the large swatch and Recent. Pressing Esc mid-pick does nothing and shows no error.
- Shortcut on a normal page: a toast appears on the page, and an open panel updates live. It should also work while the panel has focus. On `chrome://` pages it does nothing, and tabs opened before install need a reload.
- Palettes: create; rename (Enter commits, Esc reverts); add and remove colors; each export format; delete then Undo.
- Contrast: hex input commits live at 6 digits, while shorthand and `rgb()` commit on Enter or blur. Also check the native color input, the eyedropper buttons and Swap.
- Settings: rebinding rejects combos without a modifier; Reset; turning the shortcut off; theme switching with no flash when the panel reopens.
- Check both light and dark themes, and with reduced motion turned on.

## Loose ends

- `src/components/ui/label.tsx` is unused.
- There's no icon export script, CI, lint or formatter config, or LICENSE.
