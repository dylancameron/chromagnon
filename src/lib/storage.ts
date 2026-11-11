import { storage } from "wxt/utils/storage";
import type { ColorFormat } from "@/lib/color";
import type { Palette } from "@/lib/palettes";
import { DEFAULT_SHORTCUT, type Shortcut } from "@/lib/shortcut";

// Everything lives in storage.local so the side panel and the on-page
// shortcut script (separate contexts) see the same data and watch each other.

export const HISTORY_LIMIT = 24;

export interface Settings {
	/** Format copied to the clipboard right after a pick. */
	copyFormat: ColorFormat;
	shortcutEnabled: boolean;
	shortcut: Shortcut;
}

export const DEFAULT_SETTINGS: Settings = {
	copyFormat: "hex",
	shortcutEnabled: true,
	shortcut: DEFAULT_SHORTCUT,
};

/** Stored partially so new settings pick up defaults without a migration. */
export const settingsItem = storage.defineItem<Partial<Settings>>(
	"local:settings",
	{ fallback: {} },
);

export function withDefaults(stored: Partial<Settings> | null): Settings {
	return { ...DEFAULT_SETTINGS, ...stored };
}

/** Newest first, de-duplicated. */
export const historyItem = storage.defineItem<string[]>("local:hexHistory", {
	fallback: [],
});

export const palettesItem = storage.defineItem<Palette[]>("local:palettes", {
	fallback: [],
});

export interface ContrastPair {
	text: string;
	background: string;
}

export const contrastItem = storage.defineItem<ContrastPair>(
	"local:contrast",
	{ fallback: { text: "#1f1f1f", background: "#ffffff" } },
);
