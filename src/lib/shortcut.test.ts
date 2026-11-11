import { describe, expect, it } from "vitest";
import {
	DEFAULT_SHORTCUT,
	matchesShortcut,
	shortcutFromEvent,
	shortcutKeys,
} from "@/lib/shortcut";

const key = (code: string, mods: Partial<Record<string, boolean>> = {}) => ({
	code,
	altKey: false,
	shiftKey: false,
	ctrlKey: false,
	metaKey: false,
	...mods,
});

describe("matchesShortcut", () => {
	it("requires the exact modifier set", () => {
		expect(
			matchesShortcut(key("KeyC", { altKey: true, shiftKey: true }), DEFAULT_SHORTCUT),
		).toBe(true);
		expect(matchesShortcut(key("KeyC", { altKey: true }), DEFAULT_SHORTCUT)).toBe(
			false,
		);
		expect(
			matchesShortcut(
				key("KeyC", { altKey: true, shiftKey: true, metaKey: true }),
				DEFAULT_SHORTCUT,
			),
		).toBe(false);
	});
});

describe("shortcutFromEvent", () => {
	it("ignores bare modifier presses", () => {
		expect(shortcutFromEvent(key("ShiftLeft", { shiftKey: true }))).toBeNull();
	});

	it("rejects shortcuts that could fire while typing", () => {
		expect(shortcutFromEvent(key("KeyK"))).toBeNull();
		expect(shortcutFromEvent(key("KeyK", { shiftKey: true }))).toBeNull();
	});

	it("accepts Alt, Ctrl or Meta combos", () => {
		expect(shortcutFromEvent(key("KeyK", { metaKey: true }))).toEqual(
			key("KeyK", { metaKey: true }),
		);
	});
});

describe("shortcutKeys", () => {
	it("uses symbols on Mac and words elsewhere", () => {
		expect(shortcutKeys(DEFAULT_SHORTCUT, true)).toEqual(["⌥", "⇧", "C"]);
		expect(shortcutKeys(DEFAULT_SHORTCUT, false)).toEqual(["Alt", "Shift", "C"]);
	});
});
