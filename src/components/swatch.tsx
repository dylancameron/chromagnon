import { cn } from "@/lib/utils";

interface SwatchProps extends React.ComponentProps<"button"> {
	hex: string;
	selected?: boolean;
}

/** A square color chip button. Pass `aria-label` to describe what it does. */
export function Swatch({ hex, selected, className, ...props }: SwatchProps) {
	return (
		<button
			type="button"
			title={hex}
			aria-pressed={selected}
			className={cn(
				"block aspect-square w-full rounded-md ring-1 ring-swatch-ring ring-inset transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:scale-100",
				// outline-none would also zero --tw-outline-style and hide the
				// selected outline, so only apply it when unselected.
				selected
					? "outline-2 outline-offset-2 outline-foreground hover:scale-100"
					: "outline-none",
				className,
			)}
			style={{ background: hex }}
			{...props}
		/>
	);
}
