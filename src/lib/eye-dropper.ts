import { normalizeHex } from "@/lib/color";

export function eyeDropperSupported(): boolean {
	return typeof window !== "undefined" && "EyeDropper" in window;
}

/**
 * Opens the native eyedropper. Must be called from a user gesture (click or
 * keydown). Resolves to a normalized hex, or null if the user pressed Esc or
 * a picker was already open (e.g. started from the side panel).
 */
export async function openEyeDropper(): Promise<string | null> {
	try {
		const { sRGBHex } = await new EyeDropper().open();
		const hex = normalizeHex(sRGBHex);
		if (!hex) throw new Error(`Unexpected color from EyeDropper: ${sRGBHex}`);
		return hex;
	} catch (err) {
		if (
			err instanceof DOMException &&
			(err.name === "AbortError" || err.name === "InvalidStateError")
		)
			return null;
		throw err;
	}
}
