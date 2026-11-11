import { describe, expect, it } from "vitest";
import {
	contrastRatio,
	formatRatio,
	readableTextColor,
} from "@/lib/contrast";

describe("contrastRatio", () => {
	it("is 21 for black on white and 1 for identical colors", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
		expect(contrastRatio("#3b82f6", "#3b82f6")).toBe(1);
	});

	it("is symmetric", () => {
		expect(contrastRatio("#3b82f6", "#ffffff")).toBe(
			contrastRatio("#ffffff", "#3b82f6"),
		);
	});

	it("puts the classic grays on the right side of AA", () => {
		expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
		expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
	});
});

describe("formatRatio", () => {
	it("rounds like other checkers", () => {
		expect(formatRatio(contrastRatio("#3b82f6", "#ffffff"))).toBe("3.68");
		expect(formatRatio(21)).toBe("21.00");
	});

	it("never rounds up across a WCAG threshold", () => {
		expect(formatRatio(4.4999)).toBe("4.49");
		expect(formatRatio(2.996)).toBe("2.99");
		expect(formatRatio(6.999)).toBe("6.99");
	});
});

describe("readableTextColor", () => {
	it("picks black on light colors and white on dark ones", () => {
		expect(readableTextColor("#ffffff")).toBe("#000000");
		expect(readableTextColor("#facc15")).toBe("#000000");
		expect(readableTextColor("#1e3a8a")).toBe("#ffffff");
	});
});
