import { describe, expect, it } from "vitest";
import { pushHistory } from "@/lib/history";
import {
	addColor,
	createPalette,
	exportPalette,
	nextPaletteName,
	slugify,
} from "@/lib/palettes";
import { HISTORY_LIMIT } from "@/lib/storage";

describe("palettes", () => {
	it("doesn't add the same color twice", () => {
		const p = createPalette("Brand", ["#ff0000"]);
		expect(addColor(p, "#ff0000")).toBe(p);
		expect(addColor(p, "#00ff00").colors).toEqual(["#ff0000", "#00ff00"]);
	});

	it("names new palettes without colliding", () => {
		const existing = [createPalette("Palette 2")];
		expect(nextPaletteName(existing)).toBe("Palette 3");
		expect(nextPaletteName([])).toBe("Palette 1");
	});

	it("slugifies names for CSS variables", () => {
		expect(slugify("Brand Colors!")).toBe("brand-colors");
		expect(slugify("Café Crème")).toBe("cafe-creme");
		expect(slugify("***")).toBe("palette");
	});

	it("exports CSS variables and a Tailwind theme in the chosen format", () => {
		const p = createPalette("Brand", ["#ff0000", "#3b82f6"]);
		expect(exportPalette(p, "css", "hex")).toBe(
			":root {\n\t--brand-1: #ff0000;\n\t--brand-2: #3b82f6;\n}",
		);
		expect(exportPalette(p, "tailwind", "rgb")).toBe(
			"@theme {\n\t--color-brand-1: rgb(255 0 0);\n\t--color-brand-2: rgb(59 130 246);\n}",
		);
	});

	it("exports JSON as hex regardless of copy format", () => {
		const p = createPalette("Brand", ["#ff0000"]);
		expect(JSON.parse(exportPalette(p, "json", "oklch"))).toEqual({
			name: "Brand",
			colors: ["#ff0000"],
		});
	});
});

describe("pushHistory", () => {
	it("moves repeats to the front and caps the length", () => {
		expect(pushHistory(["#a", "#b", "#c"], "#b")).toEqual(["#b", "#a", "#c"]);
		const full = Array.from({ length: HISTORY_LIMIT }, (_, i) => `#${i}`);
		const next = pushHistory(full, "#new");
		expect(next).toHaveLength(HISTORY_LIMIT);
		expect(next[0]).toBe("#new");
	});
});
