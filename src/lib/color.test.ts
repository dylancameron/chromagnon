import { describe, expect, it } from "vitest";
import { formatColor, normalizeHex, rgbToHex } from "@/lib/color";

describe("normalizeHex", () => {
	it.each([
		["#3B82F6", "#3b82f6"],
		["3b82f6", "#3b82f6"],
		["#abc", "#aabbcc"],
		["  fff ", "#ffffff"],
		["rgb(59, 130, 246)", "#3b82f6"],
		["rgb(59 130 246 / 50%)", "#3b82f6"],
	])("%s → %s", (input, expected) => {
		expect(normalizeHex(input)).toBe(expected);
	});

	it.each(["", "#12", "#12345", "#ggg", "rgb(300 0 0)", "red"])(
		"rejects %j",
		(input) => {
			expect(normalizeHex(input)).toBeNull();
		},
	);
});

describe("formatColor", () => {
	it("formats every format for a typical color", () => {
		expect(formatColor("#3b82f6", "hex")).toBe("#3b82f6");
		expect(formatColor("#3b82f6", "rgb")).toBe("rgb(59 130 246)");
		expect(formatColor("#3b82f6", "hsl")).toBe("hsl(217.2 91.2% 59.8%)");
		expect(formatColor("#3b82f6", "oklch")).toBe("oklch(62.3% 0.188 259.8)");
	});

	it("matches the CSS spec's OKLCH for pure red", () => {
		// CSS Color 4: red is oklch(62.8% 0.2577 29.23)
		expect(formatColor("#ff0000", "oklch")).toBe("oklch(62.8% 0.258 29.2)");
	});

	it("prints grays with zero chroma and hue instead of float noise", () => {
		expect(formatColor("#ffffff", "oklch")).toBe("oklch(100% 0 0)");
		expect(formatColor("#000000", "oklch")).toBe("oklch(0% 0 0)");
		expect(formatColor("#808080", "oklch")).toMatch(/^oklch\([\d.]+% 0 0\)$/);
		expect(formatColor("#808080", "hsl")).toBe("hsl(0 0% 50.2%)");
	});

	it("produces well-formed output across the color cube", () => {
		const hue360 = / 360\)$/;
		for (let r = 0; r < 256; r += 5) {
			for (let g = 0; g < 256; g += 5) {
				for (let b = 0; b < 256; b += 5) {
					const hex = rgbToHex({ r, g, b });
					for (const format of ["hsl", "oklch"] as const) {
						const out = formatColor(hex, format);
						expect(out).not.toMatch(/NaN|-0\b|e-/);
						expect(out).not.toMatch(hue360);
					}
				}
			}
		}
	});
});
