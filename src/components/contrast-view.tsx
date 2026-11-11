import { ArrowUpDown, Check, Pipette, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStorageItem } from "@/hooks/use-storage-item";
import { normalizeHex } from "@/lib/color";
import {
	CONTRAST_CHECKS,
	contrastRatio,
	contrastVerdict,
	formatRatio,
} from "@/lib/contrast";
import { type ContrastPair, contrastItem } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ContrastViewProps {
	/** Opens the eyedropper; resolves to the picked hex or null. */
	onPick: () => Promise<string | null>;
	canPick: boolean;
}

export function ContrastView({ onPick, canPick }: ContrastViewProps) {
	const [pair, setPair] = useStorageItem(contrastItem);
	const ratio = contrastRatio(pair.text, pair.background);
	const verdict = contrastVerdict(ratio);

	const setSlot = (slot: keyof ContrastPair, hex: string) =>
		setPair((p) => ({ ...p, [slot]: hex }));

	const pickInto = async (slot: keyof ContrastPair) => {
		const hex = await onPick();
		if (hex) setSlot(slot, hex);
	};

	return (
		<div className="flex flex-col gap-5">
			<section aria-labelledby="contrast-colors" className="flex flex-col gap-2">
				<div className="flex h-6 items-center justify-between">
					<h2
						id="contrast-colors"
						className="text-xs font-medium text-muted-foreground"
					>
						Colors
					</h2>
					<Button
						variant="ghost"
						size="xs"
						className="text-muted-foreground"
						onClick={() =>
							setPair((p) => ({ text: p.background, background: p.text }))
						}
					>
						<ArrowUpDown />
						Swap
					</Button>
				</div>
				<ColorField
					label="Text"
					value={pair.text}
					onChange={(hex) => setSlot("text", hex)}
					onPick={() => pickInto("text")}
					canPick={canPick}
				/>
				<ColorField
					label="Background"
					value={pair.background}
					onChange={(hex) => setSlot("background", hex)}
					onPick={() => pickInto("background")}
					canPick={canPick}
				/>
			</section>

			<section aria-label="Result" className="overflow-hidden rounded-xl border">
				<div
					className="flex flex-col gap-1.5 p-4 transition-colors duration-300 motion-reduce:transition-none"
					style={{ background: pair.background, color: pair.text }}
				>
					<p className="text-2xl leading-tight font-semibold">Large text</p>
					<p className="text-sm">
						Normal text at 14px. The quick brown fox jumps over the lazy dog.
					</p>
				</div>
				<div className="flex items-center justify-between gap-3 border-t px-4 py-3">
					<div>
						<p className="text-xs text-muted-foreground">Contrast ratio</p>
						<p className="font-mono text-2xl font-semibold tabular-nums">
							{formatRatio(ratio)}
							<span className="text-base font-normal text-muted-foreground">
								:1
							</span>
						</p>
					</div>
					<span
						className={cn(
							"rounded-full px-2.5 py-1 text-xs font-semibold",
							verdict === "Fails"
								? "bg-destructive/10 text-destructive"
								: "bg-success/12 text-success",
						)}
					>
						{verdict}
					</span>
				</div>
			</section>

			<table className="w-full text-sm">
				<caption className="sr-only">WCAG 2.2 contrast requirements</caption>
				<thead>
					<tr className="text-xs text-muted-foreground">
						<th scope="col" className="pb-2 text-left font-medium">
							Use
						</th>
						<th scope="col" className="w-20 pb-2 text-right font-medium">
							AA
						</th>
						<th scope="col" className="w-20 pb-2 text-right font-medium">
							AAA
						</th>
					</tr>
				</thead>
				<tbody className="divide-y border-t">
					{CONTRAST_CHECKS.map((check) => (
						<tr key={check.label}>
							<th scope="row" className="py-2.5 text-left font-normal">
								{check.label}
							</th>
							<td className="py-2.5 text-right">
								<Result pass={ratio >= check.aa} min={check.aa} />
							</td>
							<td className="py-2.5 text-right">
								{check.aaa ? (
									<Result pass={ratio >= check.aaa} min={check.aaa} />
								) : (
									<span className="text-muted-foreground" aria-label="Not defined">
										—
									</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function Result({ pass, min }: { pass: boolean; min: number }) {
	return (
		<span
			title={`Needs ${min}:1`}
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
				pass
					? "bg-success/12 text-success"
					: "bg-destructive/10 text-destructive",
			)}
		>
			{pass ? <Check className="size-3" /> : <X className="size-3" />}
			{pass ? "Pass" : "Fail"}
		</span>
	);
}

interface ColorFieldProps {
	label: string;
	value: string;
	onChange: (hex: string) => void;
	onPick: () => void;
	canPick: boolean;
}

function ColorField({ label, value, onChange, onPick, canPick }: ColorFieldProps) {
	const id = useId();
	return (
		<div className="flex items-center gap-2">
			<label htmlFor={id} className="w-20 shrink-0 text-sm text-muted-foreground">
				{label}
			</label>
			<input
				type="color"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-label={`${label} color`}
				className="size-9 shrink-0 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 ring-1 ring-swatch-ring [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
			/>
			<HexInput id={id} value={value} onChange={onChange} />
			<Button
				variant="outline"
				size="icon"
				onClick={onPick}
				disabled={!canPick}
				aria-label={`Pick ${label.toLowerCase()} color from screen`}
				title="Pick from screen"
			>
				<Pipette />
			</Button>
		</div>
	);
}

const FULL_HEX = /^#?[0-9a-f]{6}$/i;

/**
 * Commits live once a full 6-digit hex is typed; shorthand and rgb() commit
 * on Enter or blur. Invalid input reverts on blur.
 */
function HexInput({
	id,
	value,
	onChange,
}: {
	id: string;
	value: string;
	onChange: (hex: string) => void;
}) {
	const [draft, setDraft] = useState(value);

	// Follow outside changes (swap, eyedropper) without fighting the user's
	// own casing while they type.
	useEffect(() => {
		setDraft((d) => (normalizeHex(d) === value ? d : value));
	}, [value]);

	const commit = () => {
		const hex = normalizeHex(draft);
		if (hex) onChange(hex);
		setDraft(hex ?? value);
	};

	return (
		<Input
			id={id}
			value={draft}
			spellCheck={false}
			autoComplete="off"
			className="h-9 flex-1 font-mono text-[13px] md:text-[13px]"
			onChange={(e) => {
				setDraft(e.target.value);
				if (FULL_HEX.test(e.target.value.trim())) {
					const hex = normalizeHex(e.target.value);
					if (hex) onChange(hex);
				}
			}}
			onBlur={commit}
			onKeyDown={(e) => {
				if (e.key === "Enter") commit();
				if (e.key === "Escape") setDraft(value);
			}}
		/>
	);
}
