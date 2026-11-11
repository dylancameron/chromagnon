export type ThemePreference = "system" | "light" | "dark";

// localStorage rather than storage.local: it's synchronous, so the side panel
// can apply the theme before React's first paint and never flashes.
const KEY = "hexadaisical:theme";

export function getThemePreference(): ThemePreference {
	try {
		const value = localStorage.getItem(KEY);
		return value === "light" || value === "dark" ? value : "system";
	} catch {
		return "system";
	}
}

export function saveThemePreference(preference: ThemePreference): void {
	try {
		localStorage.setItem(KEY, preference);
	} catch {
		// Storage unavailable — the choice still applies for this session.
	}
}

export const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function applyTheme(preference: ThemePreference): void {
	const dark =
		preference === "dark" ||
		(preference === "system" && darkQuery().matches);
	const root = document.documentElement;
	root.classList.toggle("dark", dark);
	root.style.colorScheme = dark ? "dark" : "light";
}
