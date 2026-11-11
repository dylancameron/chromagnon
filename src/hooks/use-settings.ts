import { useCallback, useMemo } from "react";
import { useStorageItem } from "@/hooks/use-storage-item";
import { type Settings, settingsItem, withDefaults } from "@/lib/storage";

export function useSettings() {
	const [stored, setStored, loaded] = useStorageItem(settingsItem);
	const settings = useMemo(() => withDefaults(stored), [stored]);
	const update = useCallback(
		(patch: Partial<Settings>) =>
			setStored((current) => ({ ...current, ...patch })),
		[setStored],
	);
	return { settings, update, loaded };
}
