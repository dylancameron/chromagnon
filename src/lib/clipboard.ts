/**
 * Copies text, falling back to execCommand when the async Clipboard API is
 * refused (e.g. the document lost focus, or a site's Permissions-Policy
 * blocks clipboard-write). Resolves to whether the copy succeeded.
 */
export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Fall through to the legacy path.
	}

	const previousFocus = document.activeElement as HTMLElement | null;
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "");
	textarea.style.cssText =
		"position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
	document.documentElement.append(textarea);
	textarea.select();

	try {
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		textarea.remove();
		previousFocus?.focus?.({ preventScroll: true });
	}
}
