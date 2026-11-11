// Runs on every page, so it stays tiny: no React, no Tailwind. It only
// listens for the pick shortcut. A keydown counts as a user gesture, which
// EyeDropper.open() requires; that's why this can't live in the background.

import { copyText } from "@/lib/clipboard";
import { formatColor } from "@/lib/color";
import { eyeDropperSupported, openEyeDropper } from "@/lib/eye-dropper";
import { addToHistory } from "@/lib/history";
import { showPageToast } from "@/lib/page-toast";
import { matchesShortcut } from "@/lib/shortcut";
import { type Settings, settingsItem, withDefaults } from "@/lib/storage";

export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_idle",

	main(ctx) {
		if (!eyeDropperSupported()) return;

		// Cached so the keydown handler can call open() synchronously,
		// while the gesture is still fresh.
		let settings: Settings = withDefaults(null);
		settingsItem.getValue().then((s) => {
			settings = withDefaults(s);
		});
		ctx.onInvalidated(
			settingsItem.watch((s) => {
				settings = withDefaults(s);
			}),
		);

		let picking = false;

		ctx.addEventListener(
			window,
			"keydown",
			async (event) => {
				if (
					picking ||
					event.repeat ||
					!settings.shortcutEnabled ||
					!matchesShortcut(event, settings.shortcut)
				)
					return;

				// Capture phase + stop, so the page doesn't also act on it.
				event.preventDefault();
				event.stopImmediatePropagation();
				picking = true;

				try {
					const hex = await openEyeDropper();
					if (!hex) return;
					await addToHistory(hex);
					const value = formatColor(hex, settings.copyFormat);
					const copied = await copyText(value);
					showPageToast(
						copied
							? { message: "Copied", value, color: hex }
							: { message: "Saved to history, couldn't copy:", value: hex, color: hex },
					);
				} catch (err) {
					console.error("[Hexadaisical]", err);
					showPageToast({ message: "Couldn't open the eyedropper here" });
				} finally {
					picking = false;
				}
			},
			{ capture: true },
		);
	},
});
