import { BookmarkPlus, Check, Plus } from "lucide-react";
import { useToast } from "@/components/toast";
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
import { addColor, createPalette, nextPaletteName } from "@/lib/palettes";
import { palettesItem } from "@/lib/storage";

export function SaveToPaletteMenu({ hex }: { hex: string | null }) {
	const [palettes, setPalettes] = useStorageItem(palettesItem);
	const notify = useToast();

	if (!hex) {
		return (
			<Button size="icon-lg" variant="outline" disabled aria-label="Save to palette">
				<BookmarkPlus />
			</Button>
		);
	}

	const saveTo = (id: string, name: string) => {
		setPalettes((all) => all.map((p) => (p.id === id ? addColor(p, hex) : p)));
		notify({ message: `Saved to ${name}`, color: hex });
	};

	const saveToNew = () => {
		const name = nextPaletteName(palettes);
		setPalettes((all) => [...all, createPalette(name, [hex])]);
		notify({ message: `Saved to ${name}`, color: hex });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="icon-lg"
					variant="outline"
					aria-label="Save to palette"
					title="Save to palette"
				>
					<BookmarkPlus />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					Save <span className="font-mono">{hex}</span> to…
				</DropdownMenuLabel>
				{palettes.map((palette) => {
					const saved = palette.colors.includes(hex);
					return (
						<DropdownMenuItem
							key={palette.id}
							disabled={saved}
							onSelect={() => saveTo(palette.id, palette.name)}
						>
							<span className="flex shrink-0 -space-x-1" aria-hidden="true">
								{palette.colors.slice(0, 4).map((c) => (
									<span
										key={c}
										className="size-3 rounded-full ring-2 ring-popover"
										style={{ background: c }}
									/>
								))}
								{palette.colors.length === 0 && (
									<span className="size-3 rounded-full border border-dashed" />
								)}
							</span>
							<span className="truncate">{palette.name}</span>
							{saved && <Check className="ml-auto" aria-label="Already saved" />}
						</DropdownMenuItem>
					);
				})}
				{palettes.length > 0 && <DropdownMenuSeparator />}
				<DropdownMenuItem onSelect={saveToNew}>
					<Plus />
					New palette
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
