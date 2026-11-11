import { useCallback, useEffect, useState } from "react";
import type { WxtStorageItem } from "wxt/utils/storage";

type Updater<T> = T | ((current: T) => T);

/**
 * Subscribes to a storage item, including writes from other extension
 * contexts (e.g. a pick made from the on-page shortcut).
 *
 * Function updates read the latest stored value first, so they never clobber
 * a write that happened in another context since the last render.
 */
export function useStorageItem<T>(
	// Metadata isn't used, so accept items with any metadata shape.
	item: WxtStorageItem<T, any>,
) {
	const [value, setValue] = useState<T>(item.fallback);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let active = true;
		item.getValue().then((v) => {
			if (!active) return;
			setValue(v);
			setLoaded(true);
		});
		const unwatch = item.watch((v) => setValue(v ?? item.fallback));
		return () => {
			active = false;
			unwatch();
		};
	}, [item]);

	const update = useCallback(
		async (next: Updater<T>) => {
			const resolved =
				typeof next === "function"
					? (next as (current: T) => T)(await item.getValue())
					: next;
			setValue(resolved);
			await item.setValue(resolved);
		},
		[item],
	);

	return [value, update, loaded] as const;
}
