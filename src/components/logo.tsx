import { useEffect, useRef } from "react";

// Mirrors src/assets/icon.svg (the toolbar icon), with a live pupil.
const EYE = { x: 70, y: 60 };
const REST = { x: 63.5, y: 65.5 };
/** How far the pupil can travel from the eye's center, in viewBox units. */
const REACH = 8;
/** Pointer distance (px) at which the pupil is fully deflected. */
const FULL_AT = 160;

/** The Chromagnon rock. Its eye follows the pointer around the panel. */
export function Logo({ className }: { className?: string }) {
	const svgRef = useRef<SVGSVGElement>(null);
	const pupilRef = useRef<SVGCircleElement>(null);

	useEffect(() => {
		const svg = svgRef.current;
		const pupil = pupilRef.current;
		if (!svg || !pupil) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		let frame = 0;
		const look = (e: PointerEvent) => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const box = svg.getBoundingClientRect();
				const dx = e.clientX - (box.left + (EYE.x / 128) * box.width);
				const dy = e.clientY - (box.top + (EYE.y / 128) * box.height);
				const dist = Math.hypot(dx, dy) || 1;
				const reach = REACH * Math.min(1, dist / FULL_AT);
				// CSS px on an SVG element are viewBox units.
				const x = EYE.x + (dx / dist) * reach - REST.x;
				const y = EYE.y + (dy / dist) * reach - REST.y;
				pupil.style.transform = `translate(${x}px, ${y}px)`;
			});
		};
		const rest = () => {
			cancelAnimationFrame(frame);
			pupil.style.transform = "";
		};

		window.addEventListener("pointermove", look);
		document.documentElement.addEventListener("pointerleave", rest);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("pointermove", look);
			document.documentElement.removeEventListener("pointerleave", rest);
		};
	}, []);

	return (
		<svg
			ref={svgRef}
			viewBox="0 0 128 128"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M18 74C12 46 38 22 68 22s48 22 44 50-26 36-52 34-38-10-42-32Z"
				fill="#e5512f"
			/>
			<circle cx={EYE.x} cy={EYE.y} r="20" fill="#fff8ec" />
			<circle
				ref={pupilRef}
				cx={REST.x}
				cy={REST.y}
				r="10"
				fill="#17131f"
				className="transition-transform duration-150 ease-out"
			/>
		</svg>
	);
}
