import "@/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@/components/toast";
import { applyTheme, getThemePreference } from "@/lib/theme";
import { App } from "./app";

// Before the first render, so a dark-mode user never sees a white flash.
applyTheme(getThemePreference());

// #root is defined in index.html.
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ToastProvider>
			<App />
		</ToastProvider>
	</StrictMode>,
);
