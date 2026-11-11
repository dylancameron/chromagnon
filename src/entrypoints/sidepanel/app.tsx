import { Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ContrastView } from "@/components/contrast-view";
import { Logo } from "@/components/logo";
import { PalettesView } from "@/components/palettes-view";
import { PickView } from "@/components/pick-view";
import { SettingsView } from "@/components/settings-view";
import { useToast } from "@/components/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEyeDropper } from "@/hooks/use-eye-dropper";
import { useSettings } from "@/hooks/use-settings";
import { useStorageItem } from "@/hooks/use-storage-item";
import { useTheme } from "@/hooks/use-theme";
import { copyText } from "@/lib/clipboard";
import { formatColor } from "@/lib/color";
import { addToHistory } from "@/lib/history";
import { matchesShortcut } from "@/lib/shortcut";
import { historyItem } from "@/lib/storage";

const TABS = ["pick", "palettes", "contrast", "settings"] as const;
type Tab = (typeof TABS)[number];
const TAB_KEY = "chromagnon:tab";

function readTab(): Tab {
	try {
		const saved = localStorage.getItem(TAB_KEY);
		return TABS.find((t) => t === saved) ?? "pick";
	} catch {
		return "pick";
	}
}

export function App() {
	const { settings, update: updateSettings, loaded: settingsLoaded } =
		useSettings();
	const [history, , historyLoaded] = useStorageItem(historyItem);
	const [theme, setTheme] = useTheme();
	const { supported, picking, pick } = useEyeDropper();
	const notify = useToast();
	const [tab, setTab] = useState<Tab>(readTab);
	const [current, setCurrent] = useState<string | null>(null);

	// Follow the newest pick, including ones made with the on-page shortcut.
	const newest = history[0] ?? null;
	useEffect(() => {
		if (newest) setCurrent(newest);
	}, [newest]);

	/** Opens the eyedropper and records the result. No clipboard. */
	const pickToHistory = useCallback(async () => {
		try {
			const hex = await pick();
			if (hex) {
				setCurrent(hex);
				await addToHistory(hex);
			}
			return hex;
		} catch (err) {
			console.error("EyeDropper failed", err);
			notify({ message: "Couldn't open the eyedropper", tone: "error" });
			return null;
		}
	}, [pick, notify]);

	const pickAndCopy = useCallback(async () => {
		const hex = await pickToHistory();
		if (!hex) return;
		const value = formatColor(hex, settings.copyFormat);
		const copied = await copyText(value);
		notify(
			copied
				? { message: `Copied ${value}`, color: hex }
				: { message: `Picked ${hex}, but couldn't copy it`, tone: "error" },
		);
	}, [pickToHistory, settings.copyFormat, notify]);

	// The same shortcut works while the side panel itself has focus.
	useEffect(() => {
		if (!settings.shortcutEnabled || !supported) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.repeat || !matchesShortcut(e, settings.shortcut)) return;
			e.preventDefault();
			pickAndCopy();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [settings.shortcutEnabled, settings.shortcut, supported, pickAndCopy]);

	const changeTab = (value: string) => {
		const next = TABS.find((t) => t === value) ?? "pick";
		setTab(next);
		try {
			localStorage.setItem(TAB_KEY, next);
		} catch {
			// Not worth surfacing.
		}
	};

	// Storage reads take a few ms; rendering defaults first would flash empty states.
	if (!settingsLoaded || !historyLoaded) return null;

	return (
		<div className="mx-auto flex min-h-screen max-w-md flex-col">
			<header className="flex items-center gap-2 px-4 pt-4 pb-3">
				<Logo className="-my-1 size-8" />
				<h1 className="text-base font-semibold tracking-tight">Chromagnon</h1>
			</header>

			<Tabs value={tab} onValueChange={changeTab} className="flex-1 px-4 pb-20">
				<TabsList aria-label="Sections">
					<TabsTrigger value="pick">Pick</TabsTrigger>
					<TabsTrigger value="palettes">Palettes</TabsTrigger>
					<TabsTrigger value="contrast">Contrast</TabsTrigger>
					<TabsTrigger
						value="settings"
						aria-label="Settings"
						title="Settings"
						className="flex-none px-2.5"
					>
						<SettingsIcon />
					</TabsTrigger>
				</TabsList>

				<TabsContent value="pick">
					<PickView
						current={current}
						history={history}
						settings={settings}
						supported={supported}
						picking={picking}
						onPick={pickAndCopy}
						onSelect={setCurrent}
					/>
				</TabsContent>
				<TabsContent value="palettes">
					<PalettesView current={current} copyFormat={settings.copyFormat} />
				</TabsContent>
				<TabsContent value="contrast">
					<ContrastView
						onPick={pickToHistory}
						canPick={supported && !picking}
					/>
				</TabsContent>
				<TabsContent value="settings">
					<SettingsView
						settings={settings}
						onChange={updateSettings}
						theme={theme}
						onThemeChange={setTheme}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
