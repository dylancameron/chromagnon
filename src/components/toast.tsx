import { CircleAlert } from "lucide-react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface ToastOptions {
	message: string;
	/** Shows a swatch of this color next to the message. */
	color?: string;
	tone?: "default" | "error";
	action?: { label: string; onClick: () => void };
}

type Notify = (toast: ToastOptions) => void;

const ToastContext = createContext<Notify>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(
		null,
	);
	const timer = useRef<number | undefined>(undefined);

	const notify = useCallback<Notify>((next) => {
		window.clearTimeout(timer.current);
		setToast({ ...next, id: Date.now() });
		// Toasts with an action (Undo) stay long enough to reach.
		timer.current = window.setTimeout(
			() => setToast(null),
			next.action ? 6000 : 2200,
		);
	}, []);

	useEffect(() => () => window.clearTimeout(timer.current), []);

	return (
		<ToastContext.Provider value={notify}>
			{children}
			{/* The live region is always mounted so screen readers announce changes. */}
			<div
				role="status"
				aria-live="polite"
				className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
			>
				{toast && (
					<div
						key={toast.id}
						className={cn(
							"pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-foreground py-1.5 pr-3 pl-2 text-sm text-background shadow-lg animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
							!toast.color && toast.tone !== "error" && "pl-3",
						)}
					>
						{toast.tone === "error" ? (
							<CircleAlert className="size-4 shrink-0 text-destructive" />
						) : (
							toast.color && (
								<span
									className="size-4 shrink-0 rounded-full ring-1 ring-background/40"
									style={{ background: toast.color }}
									aria-hidden="true"
								/>
							)
						)}
						<span className="truncate">{toast.message}</span>
						{toast.action && (
							<button
								type="button"
								className="ml-1 rounded-sm font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-background/60 focus-visible:outline-none"
								onClick={() => {
									toast.action?.onClick();
									setToast(null);
								}}
							>
								{toast.action.label}
							</button>
						)}
					</div>
				)}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast(): Notify {
	return useContext(ToastContext);
}

/** Copies text and confirms with a toast. */
export function useCopy() {
	const notify = useToast();
	return useCallback(
		async (text: string, options: { color?: string; message?: string } = {}) => {
			const ok = await copyText(text);
			notify(
				ok
					? { message: options.message ?? `Copied ${text}`, color: options.color }
					: { message: "Couldn't copy to the clipboard", tone: "error" },
			);
			return ok;
		},
		[notify],
	);
}
