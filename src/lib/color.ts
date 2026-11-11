export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export const COLOR_FORMATS = ["hex", "rgb", "hsl", "oklch"] as const;
export type ColorFormat = (typeof COLOR_FORMATS)[number];

export const FORMAT_LABELS: Record<ColorFormat, string> = {
	hex: "HEX",
	rgb: "RGB",
	hsl: "HSL",
	oklch: "OKLCH",
};

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_RE =
	/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i;

/**
 * Normalizes `#abc`, `abc`, `#AABBCC` or `rgb(…)` to lowercase `#rrggbb`.
 * Returns null for anything else.
 */
export function normalizeHex(input: string): string | null {
	const value = input.trim();

	const digits = HEX_RE.exec(value)?.[1];
	if (digits) {
		const full =
			digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
		return `#${full.toLowerCase()}`;
	}

	const rgb = RGB_RE.exec(value);
	if (rgb) {
		const [r = 256, g = 256, b = 256] = rgb.slice(1, 4).map(Number);
		if (r <= 255 && g <= 255 && b <= 255) return rgbToHex({ r, g, b });
	}

	return null;
}

/** Expects a normalized `#rrggbb` string. */
export function hexToRgb(hex: string): Rgb {
	const n = Number.parseInt(hex.slice(1), 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
	return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** sRGB channel (0–255) → linear light (0–1). */
export function toLinear(channel: number): number {
	const v = channel / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** h in degrees, s and l in percent. */
export function rgbToHsl({ r, g, b }: Rgb) {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	const d = max - min;

	if (d === 0) return { h: 0, s: 0, l: l * 100 };

	const s = d / (1 - Math.abs(2 * l - 1));
	let h: number;
	if (max === rn) h = ((gn - bn) / d) % 6;
	else if (max === gn) h = (bn - rn) / d + 2;
	else h = (rn - gn) / d + 4;
	h *= 60;
	if (h < 0) h += 360;

	return { h, s: s * 100, l: l * 100 };
}

/**
 * l in 0–1, c unbounded (≈0–0.37 for sRGB), h in degrees.
 * Matrices from Björn Ottosson's OKLab reference implementation.
 */
export function rgbToOklch(rgb: Rgb) {
	const r = toLinear(rgb.r);
	const g = toLinear(rgb.g);
	const b = toLinear(rgb.b);

	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

	let h = (Math.atan2(B, A) * 180) / Math.PI;
	if (h < 0) h += 360;

	return { l: L, c: Math.hypot(A, B), h };
}

/** Rounds and drops trailing zeros; never returns "-0". */
function num(n: number, digits: number): string {
	const f = 10 ** digits;
	return String(Math.round(n * f) / f || 0);
}

/** Hue rounded, with 360 folded back to 0. */
function hue(h: number): string {
	return num(Number(num(h, 1)) % 360, 1);
}

/** Formats a normalized hex as modern CSS color syntax. */
export function formatColor(hex: string, format: ColorFormat): string {
	const rgb = hexToRgb(hex);

	switch (format) {
		case "hex":
			return hex;
		case "rgb":
			return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
		case "hsl": {
			const { h, s, l } = rgbToHsl(rgb);
			return `hsl(${hue(h)} ${num(s, 1)}% ${num(l, 1)}%)`;
		}
		case "oklch": {
			const { l, c, h } = rgbToOklch(rgb);
			const chroma = num(c, 3);
			// Grays have no meaningful hue; floating-point noise would print garbage.
			return `oklch(${num(l * 100, 1)}% ${chroma} ${chroma === "0" ? "0" : hue(h)})`;
		}
	}
}
