import { type ColorFormat, formatColor } from "@/lib/color";

export interface Palette {
	id: string;
	name: string;
	/** Normalized `#rrggbb` values, in the order they were added. */
	colors: string[];
}

export function createPalette(name: string, colors: string[] = []): Palette {
	return { id: crypto.randomUUID(), name, colors: [...new Set(colors)] };
}

/** "Palette 1", "Palette 2", … skipping names already in use. */
export function nextPaletteName(palettes: Palette[]): string {
	const names = new Set(palettes.map((p) => p.name));
	let n = palettes.length + 1;
	while (names.has(`Palette ${n}`)) n++;
	return `Palette ${n}`;
}

export function addColor(palette: Palette, hex: string): Palette {
	if (palette.colors.includes(hex)) return palette;
	return { ...palette, colors: [...palette.colors, hex] };
}

export function removeColor(palette: Palette, hex: string): Palette {
	return { ...palette, colors: palette.colors.filter((c) => c !== hex) };
}

export function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.normalize("NFKD")
			.replace(/[̀-ͯ]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "palette"
	);
}

export const EXPORT_FORMATS = {
	css: "CSS variables",
	tailwind: "Tailwind theme",
	json: "JSON",
} as const;
export type ExportFormat = keyof typeof EXPORT_FORMATS;

/**
 * CSS and Tailwind exports use the user's copy format (so OKLCH users get
 * OKLCH); JSON always uses hex since it's meant for other tools.
 */
export function exportPalette(
	palette: Palette,
	format: ExportFormat,
	colorFormat: ColorFormat,
): string {
	const slug = slugify(palette.name);
	const values = palette.colors.map((hex) => formatColor(hex, colorFormat));

	switch (format) {
		case "css":
			return `:root {\n${values.map((v, i) => `\t--${slug}-${i + 1}: ${v};`).join("\n")}\n}`;
		case "tailwind":
			return `@theme {\n${values.map((v, i) => `\t--color-${slug}-${i + 1}: ${v};`).join("\n")}\n}`;
		case "json":
			return JSON.stringify(
				{ name: palette.name, colors: palette.colors },
				null,
				2,
			);
	}
}
