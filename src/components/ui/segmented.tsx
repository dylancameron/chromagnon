import { useId } from "react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
	value: T;
	options: readonly { value: T; label: React.ReactNode }[];
	onChange: (value: T) => void;
	"aria-labelledby"?: string;
	className?: string;
}

/** A segmented control built on native radios, so arrow keys just work. */
export function Segmented<T extends string>({
	value,
	options,
	onChange,
	className,
	...aria
}: SegmentedProps<T>) {
	const name = useId();
	return (
		<div
			role="radiogroup"
			{...aria}
			className={cn(
				"flex h-9 w-full rounded-lg bg-muted p-[3px] text-sm",
				className,
			)}
		>
			{options.map((option) => (
				<label key={option.value} className="flex flex-1">
					<input
						type="radio"
						name={name}
						value={option.value}
						checked={value === option.value}
						onChange={() => onChange(option.value)}
						className="peer sr-only"
					/>
					<span className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 font-medium text-muted-foreground transition-[color,box-shadow] peer-checked:bg-background peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 hover:text-foreground dark:peer-checked:border-input dark:peer-checked:bg-input/30 [&_svg]:size-4">
						{option.label}
					</span>
				</label>
			))}
		</div>
	);
}
