import { hexToRgb, toLinear } from "@/lib/color";

/** WCAG 2.x relative luminance of a normalized hex color. */
export function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.x contrast ratio, 1–21. Order of arguments doesn't matter. */
export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const THRESHOLDS = [3, 4.5, 7];

/**
 * Rounds to two decimals like other checkers, except it never rounds up
 * across a WCAG threshold: 4.499 shows "4.49", not a passing-looking "4.50".
 */
export function formatRatio(ratio: number): string {
	const rounded = Math.round(ratio * 100) / 100;
	const crosses = THRESHOLDS.some((t) => ratio < t && rounded >= t);
	return (crosses ? Math.floor(ratio * 100) / 100 : rounded).toFixed(2);
}

/**
 * WCAG 2.2 minimums (SC 1.4.3, 1.4.6, 1.4.11). Large text is 24px+, or
 * 18.66px+ bold. UI components have no AAA level.
 */
export const CONTRAST_CHECKS: { label: string; aa: number; aaa?: number }[] = [
	{ label: "Normal text", aa: 4.5, aaa: 7 },
	{ label: "Large text", aa: 3, aaa: 4.5 },
	{ label: "UI components", aa: 3 },
];

export function contrastVerdict(ratio: number): string {
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	if (ratio >= 3) return "AA Large";
	return "Fails";
}

/** Black or white, whichever reads better on `hex`. */
export function readableTextColor(hex: string): "#000000" | "#ffffff" {
	return contrastRatio(hex, "#000000") >= contrastRatio(hex, "#ffffff")
		? "#000000"
		: "#ffffff";
}
