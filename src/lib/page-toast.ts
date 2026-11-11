// A tiny, dependency-free toast for the on-page shortcut. Lives in a closed
// shadow root with px units so host-page CSS can't restyle or resize it.

const STYLE = `
.toast {
	display: flex;
	align-items: center;
	gap: 8px;
	max-width: min(420px, calc(100vw - 32px));
	padding: 7px 14px 7px 8px;
	border-radius: 999px;
	background: #1c1c1c;
	color: #fafafa;
	font: 500 13px/1.3 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
	box-shadow: 0 8px 24px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(255 255 255 / 0.08);
	opacity: 0;
	transform: translateY(6px);
	transition: opacity 160ms ease, transform 160ms ease;
}
.toast.visible { opacity: 1; transform: none; }
.toast:has(.swatch[hidden]) { padding-left: 14px; }
.swatch {
	flex: none;
	width: 16px;
	height: 16px;
	border-radius: 999px;
	box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.3);
}
.swatch[hidden] { display: none; }
.text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
@media (prefers-reduced-motion: reduce) {
	.toast { transition: none; transform: none; }
}
`;

let elements: {
	host: HTMLElement;
	toast: HTMLElement;
	swatch: HTMLElement;
	text: HTMLElement;
} | null = null;
let hideTimer: number | undefined;

function mount() {
	if (elements?.host.isConnected) return elements;

	const host = document.createElement("chromagnon-toast");
	host.style.cssText =
		"all: initial !important; position: fixed !important; z-index: 2147483647 !important; left: 50% !important; bottom: 24px !important; transform: translateX(-50%) !important; pointer-events: none !important;";

	const shadow = host.attachShadow({ mode: "closed" });
	const style = document.createElement("style");
	style.textContent = STYLE;
	const toast = document.createElement("div");
	toast.className = "toast";
	toast.setAttribute("role", "status");
	toast.setAttribute("aria-live", "polite");
	const swatch = document.createElement("span");
	swatch.className = "swatch";
	const text = document.createElement("span");
	text.className = "text";
	toast.append(swatch, text);
	shadow.append(style, toast);
	document.documentElement.append(host);

	elements = { host, toast, swatch, text };
	return elements;
}

export function showPageToast({
	message,
	value,
	color,
}: {
	message: string;
	/** Rendered in monospace after the message, e.g. the copied color. */
	value?: string;
	color?: string;
}) {
	const { host, toast, swatch, text } = mount();

	swatch.hidden = !color;
	if (color) swatch.style.background = color;

	text.replaceChildren(message);
	if (value) {
		const code = document.createElement("span");
		code.className = "mono";
		code.textContent = ` ${value}`;
		text.append(code);
	}

	// Restart the enter transition on repeat picks.
	toast.classList.remove("visible");
	void toast.offsetWidth;
	toast.classList.add("visible");

	window.clearTimeout(hideTimer);
	hideTimer = window.setTimeout(() => {
		toast.classList.remove("visible");
		hideTimer = window.setTimeout(() => host.remove(), 200);
	}, 2000);
}
