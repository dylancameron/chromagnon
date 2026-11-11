export interface Shortcut {
	/** `KeyboardEvent.code`, so it works the same on any keyboard layout. */
	code: string;
	altKey: boolean;
	shiftKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
}

type KeyLike = Pick<
	KeyboardEvent,
	"code" | "altKey" | "shiftKey" | "ctrlKey" | "metaKey"
>;

export const DEFAULT_SHORTCUT: Shortcut = {
	code: "KeyC",
	altKey: true,
	shiftKey: true,
	ctrlKey: false,
	metaKey: false,
};

const MODIFIER_CODES = new Set([
	"AltLeft",
	"AltRight",
	"ShiftLeft",
	"ShiftRight",
	"ControlLeft",
	"ControlRight",
	"MetaLeft",
	"MetaRight",
	"CapsLock",
	"Fn",
]);

export function isModifierOnly(event: Pick<KeyboardEvent, "code">): boolean {
	return MODIFIER_CODES.has(event.code);
}

export function matchesShortcut(event: KeyLike, shortcut: Shortcut): boolean {
	return (
		event.code === shortcut.code &&
		event.altKey === shortcut.altKey &&
		event.shiftKey === shortcut.shiftKey &&
		event.ctrlKey === shortcut.ctrlKey &&
		event.metaKey === shortcut.metaKey
	);
}

export function sameShortcut(a: Shortcut, b: Shortcut): boolean {
	return matchesShortcut(a, b);
}

/**
 * Builds a shortcut from a keydown, or null if it wouldn't be safe to bind:
 * it must include Alt, Ctrl or ⌘ so it can't fire while someone is typing.
 */
export function shortcutFromEvent(event: KeyLike): Shortcut | null {
	if (MODIFIER_CODES.has(event.code)) return null;
	if (!event.altKey && !event.ctrlKey && !event.metaKey) return null;
	return {
		code: event.code,
		altKey: event.altKey,
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		metaKey: event.metaKey,
	};
}

const CODE_LABELS: Record<string, string> = {
	Space: "Space",
	Comma: ",",
	Period: ".",
	Slash: "/",
	Backslash: "\\",
	Semicolon: ";",
	Quote: "'",
	BracketLeft: "[",
	BracketRight: "]",
	Minus: "-",
	Equal: "=",
	Backquote: "`",
	Enter: "↵",
	ArrowUp: "↑",
	ArrowDown: "↓",
	ArrowLeft: "←",
	ArrowRight: "→",
};

function keyLabel(code: string): string {
	if (/^Key[A-Z]$/.test(code)) return code.slice(3);
	if (/^Digit\d$/.test(code)) return code.slice(5);
	if (/^Numpad\d$/.test(code)) return `Num ${code.slice(6)}`;
	return CODE_LABELS[code] ?? code;
}

export function isMac(): boolean {
	const nav = navigator as Navigator & {
		userAgentData?: { platform?: string };
	};
	return /mac/i.test(nav.userAgentData?.platform ?? nav.platform ?? "");
}

/** Keys in the platform's conventional order, e.g. ["⌥", "⇧", "C"]. */
export function shortcutKeys(shortcut: Shortcut, mac = isMac()): string[] {
	const keys: string[] = [];
	if (mac) {
		if (shortcut.ctrlKey) keys.push("⌃");
		if (shortcut.altKey) keys.push("⌥");
		if (shortcut.shiftKey) keys.push("⇧");
		if (shortcut.metaKey) keys.push("⌘");
	} else {
		if (shortcut.ctrlKey) keys.push("Ctrl");
		if (shortcut.altKey) keys.push("Alt");
		if (shortcut.shiftKey) keys.push("Shift");
		if (shortcut.metaKey) keys.push("Win");
	}
	keys.push(keyLabel(shortcut.code));
	return keys;
}
