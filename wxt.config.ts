import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	srcDir: "src",
	manifest: {
		name: "Hexadaisical",
		description:
			"Pick any color on screen, copy it as HEX, RGB, HSL or OKLCH, save palettes, and check contrast.",
		// chrome.sidePanel.setPanelBehavior landed in Chrome 116.
		minimum_chrome_version: "116",
		// `sidePanel` is added automatically by WXT for the sidepanel entrypoint.
		// `clipboardWrite` lets the execCommand fallback copy without a fresh gesture.
		permissions: ["storage", "clipboardWrite"],
		action: { default_title: "Open Hexadaisical" },
	},
	vite: () => ({
		plugins: [tailwindcss()],
	}),
});
