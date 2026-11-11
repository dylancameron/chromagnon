import { useCallback, useEffect, useState } from "react";
import {
	applyTheme,
	darkQuery,
	getThemePreference,
	saveThemePreference,
	type ThemePreference,
} from "@/lib/theme";

/** Mount once at the app root so "system" keeps tracking OS changes. */
export function useTheme() {
	const [preference, setPreference] = useState(getThemePreference);

	useEffect(() => {
		applyTheme(preference);
		if (preference !== "system") return;
		const query = darkQuery();
		const onChange = () => applyTheme("system");
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, [preference]);

	const update = useCallback((next: ThemePreference) => {
		saveThemePreference(next);
		setPreference(next);
	}, []);

	return [preference, update] as const;
}
