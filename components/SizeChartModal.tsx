"use client";

import { useEffect } from "react";

export default function SizeChartModal({
	open,
	onClose
}: {
	open: boolean;
	onClose: () => void;
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
			<div className="absolute left-1/2 top-1/2 w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/15 bg-zinc-950 p-4 shadow-xl">
				<div className="mb-3 flex items-center justify-between">
					<h3 className="text-base font-semibold text-white">Velikostní tabulka</h3>
					<button
						onClick={onClose}
						className="rounded border border-white/15 px-3 py-1 text-xs text-white hover:bg-white/10"
					>
						Zavřít
					</button>
				</div>
				<div className="overflow-hidden rounded bg-black">
					<img
						src="/media/size chart.jpeg"
						alt="Size chart"
						className="h-auto w-full object-contain"
					/>
				</div>
			</div>
		</div>
	);
}


