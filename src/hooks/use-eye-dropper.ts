import { useCallback, useRef, useState } from "react";
import { eyeDropperSupported, openEyeDropper } from "@/lib/eye-dropper";

export function useEyeDropper() {
	const [picking, setPicking] = useState(false);
	// A ref too, so a double-click or held shortcut can't open two pickers.
	const pickingRef = useRef(false);

	const pick = useCallback(async () => {
		if (pickingRef.current) return null;
		pickingRef.current = true;
		setPicking(true);
		try {
			return await openEyeDropper();
		} finally {
			pickingRef.current = false;
			setPicking(false);
		}
	}, []);

	return { supported: eyeDropperSupported(), picking, pick };
}
