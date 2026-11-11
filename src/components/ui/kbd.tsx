import { cn } from "@/lib/utils";

export function Kbd({ keys, className }: { keys: string[]; className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-0.5", className)}>
			{keys.map((key) => (
				<kbd
					key={key}
					className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[11px] leading-none font-medium text-muted-foreground"
				>
					{key}
				</kbd>
			))}
		</span>
	);
}
