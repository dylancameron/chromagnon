import { Check, Copy, Pipette, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SaveToPaletteMenu } from "@/components/save-to-palette-menu";
import { Swatch } from "@/components/swatch";
import { useCopy, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
	COLOR_FORMATS,
	type ColorFormat,
	FORMAT_LABELS,
	formatColor,
} from "@/lib/color";
import { readableTextColor } from "@/lib/contrast";
import { shortcutKeys } from "@/lib/shortcut";
import type { Settings } from "@/lib/storage";
import { historyItem } from "@/lib/storage";

interface PickViewProps {
	current: string | null;
	history: string[];
	settings: Settings;
	supported: boolean;
	picking: boolean;
	onPick: () => void;
	onSelect: (hex: string) => void;
}

export function PickView({
	current,
	history,
	settings,
	supported,
	picking,
	onPick,
	onSelect,
}: PickViewProps) {
	const notify = useToast();

	const clearHistory = async () => {
		const previous = history;
		await historyItem.setValue([]);
		notify({
			message: "Cleared recent colors",
			action: { label: "Undo", onClick: () => historyItem.setValue(previous) },
		});
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3">
				<ColorHero hex={current} />
				<div className="flex gap-2">
					<Button
						size="lg"
						className="flex-1"
						onClick={onPick}
						disabled={!supported || picking}
					>
						<Pipette />
						{picking ? "Picking… Esc to cancel" : "Pick a color"}
					</Button>
					<SaveToPaletteMenu hex={current} />
				</div>
				{!supported ? (
					<p className="text-xs text-destructive">
						This browser doesn't support the EyeDropper API. Use Chrome,
						Edge, or another Chromium browser.
					</p>
				) : (
					settings.shortcutEnabled && (
						<p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
							Or press <Kbd keys={shortcutKeys(settings.shortcut)} /> on
							any page
						</p>
					)
				)}
			</div>

			{current && (
				<FormatList hex={current} autoFormat={settings.copyFormat} />
			)}

			<section aria-labelledby="recent-heading" className="flex flex-col gap-2">
				<div className="flex h-6 items-center justify-between">
					<h2
						id="recent-heading"
						className="text-xs font-medium text-muted-foreground"
					>
						Recent
					</h2>
					{history.length > 0 && (
						<Button
							variant="ghost"
							size="xs"
							className="text-muted-foreground"
							onClick={clearHistory}
						>
							<Trash2 />
							Clear
						</Button>
					)}
				</div>
				{history.length === 0 ? (
					<p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
						Colors you pick will show up here.
					</p>
				) : (
					<ul className="grid grid-cols-8 gap-1.5">
						{history.map((hex) => (
							<li key={hex}>
								<Swatch
									hex={hex}
									selected={hex === current}
									aria-label={`Show ${hex}`}
									onClick={() => onSelect(hex)}
								/>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function ColorHero({ hex }: { hex: string | null }) {
	if (!hex) {
		return (
			<div className="flex h-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-6 text-center">
				<p className="text-sm font-medium">No color yet</p>
				<p className="text-xs text-balance text-muted-foreground">
					Pick any pixel on your screen, even outside the browser.
				</p>
			</div>
		);
	}

	return (
		<div
			className="flex h-32 items-end rounded-xl p-4 ring-1 ring-swatch-ring ring-inset transition-colors duration-300 motion-reduce:transition-none"
			style={{ background: hex, color: readableTextColor(hex) }}
		>
			<span className="font-mono text-2xl font-semibold tracking-tight select-all">
				{hex}
			</span>
		</div>
	);
}

function FormatList({
	hex,
	autoFormat,
}: {
	hex: string;
	autoFormat: ColorFormat;
}) {
	const copy = useCopy();
	const [copied, setCopied] = useState<ColorFormat | null>(null);
	const timer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timer.current), []);

	const handleCopy = async (format: ColorFormat, value: string) => {
		if (!(await copy(value, { color: hex }))) return;
		setCopied(format);
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setCopied(null), 1500);
	};

	return (
		<section aria-label="Color formats">
			<ul className="divide-y overflow-hidden rounded-lg border">
				{COLOR_FORMATS.map((format) => {
					const value = formatColor(hex, format);
					const isCopied = copied === format;
					return (
						<li key={format}>
							<button
								type="button"
								onClick={() => handleCopy(format, value)}
								aria-label={`Copy ${FORMAT_LABELS[format]} ${value}`}
								className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
							>
								<span className="w-11 shrink-0 text-[11px] font-semibold tracking-wide text-muted-foreground">
									{FORMAT_LABELS[format]}
								</span>
								<span className="min-w-0 flex-1 truncate font-mono text-[13px]">
									{value}
								</span>
								{format === autoFormat && (
									<span
										className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
										title="Copied automatically when you pick. Change it in Settings."
									>
										Auto
									</span>
								)}
								{isCopied ? (
									<Check className="size-4 shrink-0 text-success" />
								) : (
									<Copy className="size-4 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
