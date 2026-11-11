import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { COLOR_FORMATS, FORMAT_LABELS } from "@/lib/color";
import {
	DEFAULT_SHORTCUT,
	isMac,
	isModifierOnly,
	type Shortcut,
	sameShortcut,
	shortcutFromEvent,
	shortcutKeys,
} from "@/lib/shortcut";
import type { Settings } from "@/lib/storage";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
	settings: Settings;
	onChange: (patch: Partial<Settings>) => void;
	theme: ThemePreference;
	onThemeChange: (theme: ThemePreference) => void;
}

const FORMAT_OPTIONS = COLOR_FORMATS.map((f) => ({
	value: f,
	label: FORMAT_LABELS[f],
}));

const THEME_OPTIONS = [
	{ value: "system", label: <><Monitor />System</> },
	{ value: "light", label: <><Sun />Light</> },
	{ value: "dark", label: <><Moon />Dark</> },
] as const;

export function SettingsView({
	settings,
	onChange,
	theme,
	onThemeChange,
}: SettingsViewProps) {
	return (
		<div className="flex flex-col gap-6">
			<Section
				id="setting-copy-format"
				title="Copy on pick"
				description="Picked colors go straight to your clipboard in this format. Palette CSS and Tailwind exports use it too."
			>
				<Segmented
					aria-labelledby="setting-copy-format"
					value={settings.copyFormat}
					options={FORMAT_OPTIONS}
					onChange={(copyFormat) => onChange({ copyFormat })}
				/>
			</Section>

			<Section
				id="setting-shortcut"
				title="Pick shortcut"
				description="Starts the eyedropper on any web page. It can't run on chrome:// pages or the Chrome Web Store, and tabs that were already open when you installed need a reload."
				action={
					<Switch
						checked={settings.shortcutEnabled}
						onCheckedChange={(shortcutEnabled) => onChange({ shortcutEnabled })}
						aria-labelledby="setting-shortcut"
					/>
				}
			>
				<ShortcutRecorder
					value={settings.shortcut}
					disabled={!settings.shortcutEnabled}
					onChange={(shortcut) => onChange({ shortcut })}
				/>
			</Section>

			<Section id="setting-theme" title="Theme">
				<Segmented
					aria-labelledby="setting-theme"
					value={theme}
					options={THEME_OPTIONS}
					onChange={onThemeChange}
				/>
			</Section>
		</div>
	);
}

function Section({
	id,
	title,
	description,
	action,
	children,
}: {
	id: string;
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 id={id} className="text-sm font-medium">
						{title}
					</h2>
					{description && (
						<p className="text-xs text-pretty text-muted-foreground">
							{description}
						</p>
					)}
				</div>
				{action && <div className="pt-0.5">{action}</div>}
			</div>
			{children}
		</section>
	);
}

function ShortcutRecorder({
	value,
	disabled,
	onChange,
}: {
	value: Shortcut;
	disabled: boolean;
	onChange: (shortcut: Shortcut) => void;
}) {
	const [recording, setRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const keys = shortcutKeys(value);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!recording) return;
		const plain = !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
		if (e.key === "Tab" && plain) return setRecording(false);
		// Keep the app-level pick shortcut from firing while recording.
		e.preventDefault();
		e.stopPropagation();
		if (e.key === "Escape" && plain) {
			setRecording(false);
			setError(null);
			return;
		}
		if (isModifierOnly(e.nativeEvent)) return;
		const next = shortcutFromEvent(e.nativeEvent);
		if (!next) {
			setError(
				`Include ${isMac() ? "⌥, ⌃ or ⌘" : "Alt or Ctrl"} so it can't fire while you're typing.`,
			);
			return;
		}
		onChange(next);
		setRecording(false);
		setError(null);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<button
					type="button"
					disabled={disabled}
					onClick={() => {
						setRecording((r) => !r);
						setError(null);
					}}
					onKeyDown={handleKeyDown}
					onBlur={() => setRecording(false)}
					aria-label={
						recording
							? "Recording. Press the new shortcut, or Escape to cancel."
							: `Shortcut ${keys.join(" ")}. Press to change.`
					}
					className={cn(
						"flex h-9 flex-1 items-center justify-between rounded-md border px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
						recording && "border-ring ring-[3px] ring-ring/30",
					)}
				>
					{recording ? (
						<span className="text-muted-foreground">Press new shortcut…</span>
					) : (
						<Kbd keys={keys} />
					)}
					<span className="text-xs text-muted-foreground">
						{recording ? "Esc to cancel" : "Change"}
					</span>
				</button>
				{!sameShortcut(value, DEFAULT_SHORTCUT) && (
					<Button
						variant="ghost"
						size="sm"
						disabled={disabled}
						onClick={() => onChange(DEFAULT_SHORTCUT)}
					>
						Reset
					</Button>
				)}
			</div>
			{error && (
				<p className="text-xs text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
