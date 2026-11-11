// The EyeDropper API (Chromium 95+) isn't in TypeScript's lib.dom yet.
// https://developer.mozilla.org/docs/Web/API/EyeDropper

interface ColorSelectionResult {
	/** The picked color, as `#rrggbb`. */
	sRGBHex: string;
}

interface ColorSelectionOptions {
	signal?: AbortSignal;
}

declare class EyeDropper {
	constructor();
	open(options?: ColorSelectionOptions): Promise<ColorSelectionResult>;
}
