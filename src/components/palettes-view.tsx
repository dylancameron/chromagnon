import { Braces, Ellipsis, Palette as PaletteIcon, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Swatch } from "@/components/swatch";
import { useCopy, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStorageItem } from "@/hooks/use-storage-item";
import { type ColorFormat, formatColor } from "@/lib/color";
import {
	addColor,
	createPalette,
	EXPORT_FORMATS,
	type ExportFormat,
	exportPalette,
	nextPaletteName,
	type Palette,
	removeColor,
} from "@/lib/palettes";
import { palettesItem } from "@/lib/storage";

interface PalettesViewProps {
	current: string | null;
	copyFormat: ColorFormat;
}

export function PalettesView({ current, copyFormat }: PalettesViewProps) {
	const [palettes, setPalettes] = useStorageItem(palettesItem);
	const [createdId, setCreatedId] = useState<string | null>(null);
	const notify = useToast();

	const create = () => {
		const palette = createPalette(nextPaletteName(palettes));
		setCreatedId(palette.id);
		setPalettes((all) => [...all, palette]);
	};

	const change = (id: string, fn: (palette: Palette) => Palette) =>
		setPalettes((all) => all.map((p) => (p.id === id ? fn(p) : p)));

	const remove = (palette: Palette) => {
		const index = palettes.findIndex((p) => p.id === palette.id);
		setPalettes((all) => all.filter((p) => p.id !== palette.id));
		notify({
			message: `Deleted ${palette.name}`,
			action: {
				label: "Undo",
				onClick: () =>
					setPalettes((all) => {
						const next = [...all];
						next.splice(Math.min(index, next.length), 0, palette);
						return next;
					}),
			},
		});
	};

	if (palettes.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
				<PaletteIcon className="size-6 text-muted-foreground" aria-hidden="true" />
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium">No palettes yet</p>
					<p className="text-xs text-balance text-muted-foreground">
						Collect colors into palettes, then copy them out as CSS
						variables, a Tailwind theme, or JSON.
					</p>
				</div>
				<Button size="sm" onClick={create}>
					<Plus />
					New palette
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{palettes.map((palette) => (
				<PaletteCard
					key={palette.id}
					palette={palette}
					current={current}
					copyFormat={copyFormat}
					autoFocus={palette.id === createdId}
					onChange={(fn) => change(palette.id, fn)}
					onDelete={() => remove(palette)}
				/>
			))}
			<Button variant="outline" onClick={create}>
				<Plus />
				New palette
			</Button>
		</div>
	);
}

interface PaletteCardProps {
	palette: Palette;
	current: string | null;
	copyFormat: ColorFormat;
	autoFocus: boolean;
	onChange: (fn: (palette: Palette) => Palette) => void;
	onDelete: () => void;
}

function PaletteCard({
	palette,
	current,
	copyFormat,
	autoFocus,
	onChange,
	onDelete,
}: PaletteCardProps) {
	const copy = useCopy();
	const [name, setName] = useState(palette.name);
	useEffect(() => setName(palette.name), [palette.name]);

	const commitName = () => {
		const trimmed = name.trim();
		if (!trimmed) setName(palette.name);
		else if (trimmed !== palette.name)
			onChange((p) => ({ ...p, name: trimmed }));
	};

	const canAdd = current !== null && !palette.colors.includes(current);
	const empty = palette.colors.length === 0;

	return (
		<article
			aria-label={palette.name}
			className="flex flex-col gap-3 rounded-lg border bg-card p-3"
		>
			<div className="flex items-center gap-1">
				<input
					value={name}
					aria-label="Palette name"
					autoFocus={autoFocus}
					onFocus={(e) => autoFocus && e.currentTarget.select()}
					onChange={(e) => setName(e.target.value)}
					onBlur={commitName}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
						if (e.key === "Escape") {
							const input = e.currentTarget;
							setName(palette.name);
							// Blur after the reset renders, so commitName sees the old name.
							requestAnimationFrame(() => input.blur());
						}
					}}
					className="-ml-1.5 h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
				/>
				<span className="px-1 text-xs text-muted-foreground tabular-nums">
					{palette.colors.length}
				</span>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={`${palette.name} actions`}
						>
							<Ellipsis />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Copy as</DropdownMenuLabel>
						{(Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((format) => (
							<DropdownMenuItem
								key={format}
								disabled={empty}
								onSelect={() =>
									copy(exportPalette(palette, format, copyFormat), {
										message: `Copied ${palette.name} as ${EXPORT_FORMATS[format]}`,
									})
								}
							>
								<Braces />
								{EXPORT_FORMATS[format]}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onSelect={onDelete}>
							<Trash2 />
							Delete palette
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<ul className="grid grid-cols-8 gap-1.5">
				{palette.colors.map((hex) => {
					const value = formatColor(hex, copyFormat);
					return (
						<li key={hex} className="group/chip relative">
							<Swatch
								hex={hex}
								aria-label={`Copy ${value}`}
								onClick={() => copy(value, { color: hex })}
							/>
							<button
								type="button"
								aria-label={`Remove ${hex} from ${palette.name}`}
								onClick={() => onChange((p) => removeColor(p, hex))}
								className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity outline-none group-hover/chip:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
							>
								<X className="size-2.5" />
							</button>
						</li>
					);
				})}
				<li>
					<button
						type="button"
						disabled={!canAdd}
						onClick={() => current && onChange((p) => addColor(p, current))}
						aria-label={
							canAdd ? `Add ${current} to ${palette.name}` : "Add current color"
						}
						title={
							current === null
								? "Pick a color to add it"
								: canAdd
									? `Add ${current}`
									: `${current} is already in this palette`
						}
						className="grid aspect-square w-full place-items-center rounded-md border border-dashed border-foreground/25 text-muted-foreground transition-colors outline-none hover:border-foreground/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-border disabled:opacity-50"
					>
						<Plus className="size-4" />
					</button>
				</li>
			</ul>
			{empty && (
				<p className="-mt-1 text-xs text-muted-foreground">
					{current
						? "Add the current color with +, or save picks from the Pick tab."
						: "Pick a color, then add it here."}
				</p>
			)}
		</article>
	);
}
