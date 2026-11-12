# Chrome Web Store listing

Everything the Chrome Web Store dashboard asks for, so the listing can be rebuilt or updated without starting over. When features or permissions change, update this file, [PRIVACY.md](../PRIVACY.md) and the main [README](../README.md) together.

| File | What it is |
| --- | --- |
| `promo-small.png` | Small promo tile, 440×280. Rendered from `promo-small.svg` (see below). |
| `screenshots/` | Listing screenshots, 1280×800. |
| `demo.html` | A colorful page to pick from in screenshots. It's our own artwork, so the listing doesn't show anyone else's site. |

The store icon is `public/icon/128.png`. The dashboard needs it uploaded separately even though it's in the zip.

## Store listing tab

Name and summary come from the manifest (`wxt.config.ts`). The summary limit is 132 characters.

**Description**

```text
Chromagnon is a color picker that lives in Chrome's side panel. Pick any pixel on your screen, copy it as HEX, RGB, HSL or OKLCH, save colors into palettes, and check WCAG contrast.

PICK
• Click the toolbar icon to open the side panel, then click Pick a color. You can pick from anywhere on your screen, even outside the browser.
• The color is copied right away in the format you choose, and shown in all four formats, each one click to copy.
• Recent keeps your last 24 picks.
• The side panel stays open between picks, so you can pick color after color.

PICK FROM ANY PAGE
• Press Alt+Shift+C (Option+Shift+C on a Mac) on any web page to pick without opening the panel. A small message on the page confirms the copy.
• Change the shortcut or turn it off in Settings.

PALETTES
• Save colors into named palettes.
• Copy a palette as CSS custom properties, a Tailwind CSS v4 @theme block, or JSON.

CONTRAST
• See the WCAG 2.2 contrast ratio between a text color and a background color, with AA and AAA results for normal text, large text and UI components.
• Pick either color with the eyedropper, type it in, or swap them.

PRIVATE
• No accounts, ads, analytics or tracking.
• Chromagnon makes no network requests. Your colors, palettes and settings stay on your device.

WHY IT RUNS ON EVERY SITE
Chrome only opens the eyedropper in response to a click or key press. To make the shortcut work on any page, Chromagnon runs a small script there that waits for that one key combination. It doesn't read the page, and it doesn't record or send your keystrokes.

Light and dark themes. Requires Chrome 116 or later.
Source code: https://github.com/dylancameron/chromagnon
```

The repo has no license, so the description doesn't call it open source.

| Field | Value |
| --- | --- |
| Category | Developer Tools |
| Language | English |
| Homepage URL | `https://github.com/dylancameron/chromagnon` |
| Support URL | `https://github.com/dylancameron/chromagnon/issues` |
| Official URL | Blank. It only lists sites verified in Google Search Console. |
| Mature content | Off |

## Privacy practices tab

**Single purpose**

```text
Chromagnon is a color picker. It lets users pick a color from anywhere on screen with Chrome's built-in eyedropper, then use that color: copy it as HEX, RGB, HSL or OKLCH, save it to a palette, or check its contrast against another color.
```

**sidePanel**

```text
Chromagnon's entire interface is a side panel, opened by clicking the toolbar icon. A side panel is used instead of a popup because a popup can close when the eyedropper takes focus, which would lose the user's pick.
```

**storage**

```text
Saves the user's settings (copy format and keyboard shortcut), their last 24 picked colors, their palettes, and the two colors in the contrast checker, using chrome.storage.local. The side panel and the content script share this data, so a color picked with the on-page shortcut appears in the open panel. Nothing is synced or sent off the device.
```

**clipboardWrite**

```text
Picking a color copies it to the clipboard in the user's chosen format. When the pick is made with the on-page shortcut, the page can lose focus while the eyedropper is open, and navigator.clipboard.writeText may then be refused. clipboardWrite lets the document.execCommand("copy") fallback succeed in that case. The extension never reads the clipboard.
```

**Host permission** (the content script on `<all_urls>`)

```text
The content script provides the optional keyboard shortcut (Alt+Shift+C by default) that picks a color on any page without opening the side panel. Chrome's EyeDropper API only opens in direct response to a user gesture, and chrome.commands shortcuts handled in the background service worker don't count as one, so the key press must be heard by a script in the page itself. The script only compares key presses with the user's shortcut. It doesn't read page content, doesn't record or transmit keystrokes, and makes no network requests. On a match it opens the eyedropper, copies the color, and shows a small confirmation in a closed shadow root so the page isn't affected. Users can turn the shortcut off in Settings.
```

**Remote code:** "No, I am not using remote code." All JavaScript ships in the zip.

**Data usage:** tick none of the data types, and tick all three certifications.
- Not "User activity": the content script sees key presses but never stores or sends them.
- Not "Website content": a picked color is a single pixel value that stays on the device.

**Privacy policy URL:** `https://github.com/dylancameron/chromagnon/blob/main/PRIVACY.md`

Broad host access usually triggers an in-depth review, so expect the first review to take longer.

## Test instructions tab

Leave username and password blank. There's no account or login.

**Additional instructions**

```text
No account, login or setup is needed, and the extension makes no network requests.

1. Pick from the side panel
- Click the Chromagnon toolbar icon (pin it from the Extensions menu if it's hidden). The side panel opens on the Pick tab.
- Click "Pick a color", then click any pixel on screen. The color is copied to the clipboard as HEX, a "Copied #rrggbb" message appears, and the color fills the large swatch and appears under Recent.
- Click HEX, RGB, HSL or OKLCH to copy that format instead.
- Press Esc during a pick to cancel. Nothing happens and no error appears.

2. Pick on a web page with the shortcut
- Open any regular https:// page. Tabs that were open before the extension was installed need a reload.
- Press Alt+Shift+C (Option+Shift+C on macOS) and click a pixel. A "Copied #rrggbb" message appears at the bottom of the page, and the color appears under Recent in the side panel.
- Chrome doesn't run extension scripts on chrome:// pages or the Chrome Web Store, so the shortcut does nothing there. That's expected.

3. Palettes tab
- Click "New palette" and type a name (Enter saves, Esc reverts).
- Click + to add the current color, or use "Save to palette" on the Pick tab.
- In the palette's … menu, "Copy as" offers CSS variables, Tailwind theme and JSON. "Delete palette" shows an Undo message.

4. Contrast tab
- Set a text and a background color by typing a hex value, using the color box, or using the eyedropper button. The ratio and AA/AAA results update. Swap switches the two colors.

5. Settings (gear icon)
- "Copy on pick" changes which format the next pick copies.
- Click the shortcut to record a new one. Combinations without Alt, Ctrl or ⌘ are rejected. Reset restores the default.
- Turn the shortcut off, and Alt+Shift+C stops working on pages.
- Theme switches between System, Light and Dark.
```

## Distribution tab

Free, public, all regions.

## Retaking screenshots

The store wants 1280×800 (up to five), full bleed, showing the real extension.

1. Build with `pnpm build`, then load `.output/chrome-mv3` in your everyday Chrome (`chrome://extensions` → Developer mode → Load unpacked). Avoid the `pnpm dev` window, which can show an automation banner.
2. Serve the demo page over http, because the shortcut's content script doesn't run on `file://` by default:

   ```bash
   python3 -m http.server 8765 --bind 127.0.0.1 --directory store
   ```

   Then open <http://127.0.0.1:8765/demo.html>.
3. Optionally fill the panel with matching sample data. Right-click inside the side panel, choose **Inspect**, and run this in the console:

   ```js
   chrome.storage.local.set({
     hexHistory: ["#e5512f", "#2742d6", "#f2b134", "#1f8a8a", "#f28cb1", "#9cc5a1", "#17131f", "#f4ecdc"],
     palettes: [
       { id: crypto.randomUUID(), name: "Color study", colors: ["#e5512f", "#f2b134", "#1f8a8a", "#2742d6", "#f28cb1", "#9cc5a1"] },
       { id: crypto.randomUUID(), name: "Warm", colors: ["#e5512f", "#f2b134", "#f28cb1", "#f4ecdc"] },
     ],
     contrast: { text: "#fff8ec", background: "#e5512f" },
   });
   ```

   That replaces your own history and palettes in this profile, so use a profile you don't mind resetting. Cream on tomato is 3.58:1, which passes large text and UI components but fails normal text, so the Contrast tab shows both outcomes.
4. Size the window to exactly 1280×800:

   ```bash
   osascript -e 'tell application "Google Chrome" to set bounds of front window to {0, 40, 1280, 840}'
   ```

5. Press ⌘⇧4, then Space, then ⌥-click the window to capture it without a shadow. Retina captures come out at 2560×1600, so scale them down: `sips -Z 1280 file.png`.

Suggested set: Pick tab just after a pick; the on-page "Copied" message from the shortcut; Palettes; Contrast; one tab in dark theme.

## Regenerating the promo tile

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=440,280 \
  --screenshot="$PWD/store/promo-small.png" "file://$PWD/store/promo-small.svg"
```
