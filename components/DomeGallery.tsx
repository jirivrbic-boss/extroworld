"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useGesture } from "@use-gesture/react";

type ImageItem = { src: string; alt?: string };

const DEFAULTS = {
	maxVerticalRotationDeg: 5,
	dragSensitivity: 20,
	enlargeTransitionMs: 300,
	segments: 35
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
	const a = (((deg + 180) % 360) + 360) % 360;
	return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
	const attr = (el as any).dataset[name] ?? el.getAttribute(`data-${name}`);
	const n = attr == null ? NaN : parseFloat(attr);
	return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: ImageItem[], seg: number) {
	const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
	const evenYs = [-4, -2, 0, 2, 4];
	const oddYs = [-3, -1, 1, 3, 5];
	const coords = xCols.flatMap((x, c) => {
		const ys = c % 2 === 0 ? evenYs : oddYs;
		return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
	});
	const totalSlots = coords.length;
	if (pool.length === 0) return coords.map((c) => ({ ...c, src: "", alt: "" }));
	const normalized = pool.map((im) => (typeof im === "string" ? { src: im as any, alt: "" } : { src: im.src || "", alt: im.alt || "" }));
	const used = Array.from({ length: totalSlots }, (_, i) => normalized[i % normalized.length]);
	for (let i = 1; i < used.length; i++) {
		if (used[i].src === used[i - 1].src) {
			for (let j = i + 1; j < used.length; j++) {
				if (used[j].src !== used[i].src) {
					const tmp = used[i];
					used[i] = used[j];
					used[j] = tmp;
					break;
				}
			}
		}
	}
	return coords.map((c, i) => ({ ...c, src: used[i].src, alt: used[i].alt }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
	const unit = 360 / segments / 2;
	const rotateY = unit * (offsetX + (sizeX - 1) / 2);
	const rotateX = unit * (offsetY - (sizeY - 1) / 2);
	return { rotateX, rotateY };
}

export default function DomeGallery({
	images,
	fit = 0.5,
	fitBasis = "auto",
	minRadius = 600,
	maxRadius = Infinity,
	padFactor = 0.25,
	overlayBlurColor = "#060010",
	maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
	dragSensitivity = DEFAULTS.dragSensitivity,
	enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
	segments = DEFAULTS.segments,
	dragDampening = 2,
	openedImageWidth = "250px",
	openedImageHeight = "350px",
	imageBorderRadius = "30px",
	openedImageBorderRadius = "30px",
	grayscale = true
}: {
	images: ImageItem[];
	fit?: number;
	fitBasis?: "auto" | "min" | "max" | "width" | "height";
	minRadius?: number;
	maxRadius?: number;
	padFactor?: number;
	overlayBlurColor?: string;
	maxVerticalRotationDeg?: number;
	dragSensitivity?: number;
	enlargeTransitionMs?: number;
	segments?: number;
	dragDampening?: number;
	openedImageWidth?: string;
	openedImageHeight?: string;
	imageBorderRadius?: string;
	openedImageBorderRadius?: string;
	grayscale?: boolean;
}) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const mainRef = useRef<HTMLDivElement | null>(null);
	const sphereRef = useRef<HTMLDivElement | null>(null);
	const frameRef = useRef<HTMLDivElement | null>(null);
	const viewerRef = useRef<HTMLDivElement | null>(null);
	const scrimRef = useRef<HTMLDivElement | null>(null);
	const focusedElRef = useRef<HTMLElement | null>(null);
	const originalTilePositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
	const rotationRef = useRef({ x: 0, y: 0 });
	const startRotRef = useRef({ x: 0, y: 0 });
	const startPosRef = useRef<{ x: number; y: number } | null>(null);
	const draggingRef = useRef(false);
	const movedRef = useRef(false);
	const inertiaRAF = useRef<number | null>(null);
	const openingRef = useRef(false);
	const openStartedAtRef = useRef(0);
	const lastDragEndAt = useRef(0);
	const scrollLockedRef = useRef(false);

	const lockScroll = useCallback(() => {
		if (scrollLockedRef.current) return;
		scrollLockedRef.current = true;
		document.body.classList.add("dg-scroll-lock");
	}, []);
	const unlockScroll = useCallback(() => {
		if (!scrollLockedRef.current) return;
		if (rootRef.current?.getAttribute("data-enlarging") === "true") return;
		scrollLockedRef.current = false;
		document.body.classList.remove("dg-scroll-lock");
	}, []);

	const items = useMemo(() => buildItems(images, segments), [images, segments]);
	const applyTransform = (xDeg: number, yDeg: number) => {
		const el = sphereRef.current;
		if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
	};
	const lockedRadiusRef = useRef<number | null>(null);

	useEffect(() => {
		const root = rootRef.current!;
		if (!root) return;
		const ro = new ResizeObserver((entries) => {
			const cr = entries[0].contentRect;
			const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
			const minDim = Math.min(w, h), maxDim = Math.max(w, h), aspect = w / h;
			let basis: number;
			switch (fitBasis) {
				case "min": basis = minDim; break;
				case "max": basis = maxDim; break;
				case "width": basis = w; break;
				case "height": basis = h; break;
				default: basis = aspect >= 1.3 ? w : minDim;
			}
			let radius = basis * fit;
			const heightGuard = h * 1.35;
			radius = Math.min(radius, heightGuard);
			radius = clamp(radius, minRadius, maxRadius);
			lockedRadiusRef.current = Math.round(radius);
			const viewerPad = Math.max(8, Math.round(minDim * padFactor));
			root.style.setProperty("--radius", `${lockedRadiusRef.current}px`);
			root.style.setProperty("--viewer-pad", `${viewerPad}px`);
			root.style.setProperty("--overlay-blur-color", overlayBlurColor);
			root.style.setProperty("--tile-radius", imageBorderRadius);
			root.style.setProperty("--enlarge-radius", openedImageBorderRadius);
			root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none");
			applyTransform(rotationRef.current.x, rotationRef.current.y);
		});
		ro.observe(root);
		return () => ro.disconnect();
	}, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius]);

	useEffect(() => { applyTransform(rotationRef.current.x, rotationRef.current.y); }, []);
	const stopInertia = useCallback(() => { if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null; } }, []);
	const startInertia = useCallback((vx: number, vy: number) => {
		const MAX_V = 1.4;
		let vX = clamp(vx, -MAX_V, MAX_V) * 80;
		let vY = clamp(vy, -MAX_V, MAX_V) * 80;
		let frames = 0;
		const d = clamp(dragDampening ?? 0.6, 0, 1);
		const frictionMul = 0.94 + 0.055 * d;
		const stopThreshold = 0.015 - 0.01 * d;
		const maxFrames = Math.round(90 + 270 * d);
		const step = () => {
			vX *= frictionMul; vY *= frictionMul;
			if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) { inertiaRAF.current = null; return; }
			if (++frames > maxFrames) { inertiaRAF.current = null; return; }
			const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
			const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
			rotationRef.current = { x: nextX, y: nextY };
			applyTransform(nextX, nextY);
			inertiaRAF.current = requestAnimationFrame(step);
		};
		stopInertia(); inertiaRAF.current = requestAnimationFrame(step);
	}, [dragDampening, maxVerticalRotationDeg, stopInertia]);

	useGesture(
		{
			onDragStart: ({ event }) => {
				stopInertia();
				const evt = event as PointerEvent;
				startRotRef.current = { ...rotationRef.current };
				startPosRef.current = { x: evt.clientX, y: evt.clientY };
			},
			onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
				const evt = event as PointerEvent;
				const dx = evt.clientX - (startPosRef.current?.x ?? 0);
				const dy = evt.clientY - (startPosRef.current?.y ?? 0);
				const nextX = clamp(startRotRef.current.x - dy / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
				const nextY = wrapAngleSigned(startRotRef.current.y + dx / dragSensitivity);
				if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
					rotationRef.current = { x: nextX, y: nextY };
					applyTransform(nextX, nextY);
				}
				if (last) {
					let [vMagX, vMagY] = velocity; const [dirX, dirY] = direction;
					let vx = vMagX * dirX; let vy = vMagY * dirY;
					if (Array.isArray(movement)) {
						const [mx, my] = movement; vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2); vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
					}
					if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
				}
			}
		},
		{ target: mainRef, eventOptions: { passive: true } }
	);

	useEffect(() => () => { document.body.classList.remove("dg-scroll-lock"); }, []);

	return (
		<div
			ref={rootRef}
			className="sphere-root"
			style={
				{
					["--segments-x" as any]: segments,
					["--segments-y" as any]: segments,
					["--overlay-blur-color" as any]: overlayBlurColor,
					["--tile-radius" as any]: imageBorderRadius
				} as React.CSSProperties
			}
		>
			<style jsx global>{`
				.sphere-root{position:relative;width:100%;height:100%;--radius:520px;--viewer-pad:72px;--circ:calc(var(--radius)*3.14);--rot-y:calc((360deg/var(--segments-x))/2);--rot-x:calc((360deg/var(--segments-y))/2);--item-width:calc(var(--circ)/var(--segments-x));--item-height:calc(var(--circ)/var(--segments-y))}
				.sphere-root *{box-sizing:border-box}
				.sphere,.item,.item__image{transform-style:preserve-3d}
				main.sphere-main{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;background:transparent}
				.stage{width:100%;height:100%;display:grid;place-items:center;perspective:calc(var(--radius)*2);perspective-origin:50% 50%;contain:layout paint size}
				.sphere{transform:translateZ(calc(var(--radius)*-1));will-change:transform}
				.overlay,.overlay--blur{position:absolute;inset:0;margin:auto;z-index:3;pointer-events:none}
				.overlay{background-image:radial-gradient(rgba(235,235,235,0) 65%,var(--overlay-blur-color,#060010) 100%)}
				.overlay--blur{-webkit-mask-image:radial-gradient(rgba(235,235,235,0) 70%,var(--overlay-blur-color,#060010) 90%);mask-image:radial-gradient(rgba(235,235,235,0) 70%,var(--overlay-blur-color,#060010) 90%);backdrop-filter:blur(3px)}
				.item{width:calc(var(--item-width)*var(--item-size-x));height:calc(var(--item-height)*var(--item-size-y));position:absolute;top:-999px;bottom:-999px;left:-999px;right:-999px;margin:auto;transform-origin:50% 50%;backface-visibility:hidden;transition:transform 300ms;transform:rotateY(calc(var(--rot-y)*(var(--offset-x)+((var(--item-size-x)-1)/2))+var(--rot-y-delta,0deg))) rotateX(calc(var(--rot-x)*(var(--offset-y)-((var(--item-size-y)-1)/2))+var(--rot-x-delta,0deg))) translateZ(var(--radius))}
				.item__image{position:absolute;display:block;inset:10px;border-radius:var(--tile-radius,12px);background:transparent;overflow:hidden;backface-visibility:hidden;transition:transform 300ms;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;pointer-events:auto;-webkit-transform:translateZ(0);transform:translateZ(0)}
				.item__image:focus{outline:none}
				.item__image img{width:100%;height:100%;object-fit:cover;pointer-events:none;backface-visibility:hidden;filter:var(--image-filter,none)}
				.viewer{position:absolute;inset:0;z-index:20;pointer-events:none;display:flex;align-items:center;justify-content:center;padding:var(--viewer-pad)}
				.viewer .frame{height:100%;aspect-ratio:1;border-radius:var(--enlarge-radius,32px);display:flex}
				@media (max-aspect-ratio:1/1){.viewer .frame{height:auto;width:100%}}
				.viewer .scrim{position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.4);pointer-events:none;opacity:0;transition:opacity 500ms ease;backdrop-filter:blur(3px)}
				.sphere-root[data-enlarging='true'] .viewer .scrim{opacity:1;pointer-events:all}
				.viewer .enlarge{position:absolute;z-index:30;border-radius:var(--enlarge-radius,32px);overflow:hidden;transition:transform 500ms ease,opacity 500ms ease;transform-origin:top left;box-shadow:0 10px 30px rgba(0,0,0,.35)}
				.viewer .enlarge img{width:100%;height:100%;object-fit:cover;filter:var(--image-filter,none)}
				.sphere-root .enlarge-closing img{filter:var(--image-filter,none)}
				.edge-fade{position:absolute;left:0;right:0;height:120px;z-index:5;pointer-events:none;background:linear-gradient(to bottom,transparent,var(--overlay-blur-color,#060010))}
				.edge-fade--top{top:0;transform:rotate(180deg)}
				.edge-fade--bottom{bottom:0}
			`}</style>
			<main ref={mainRef} className="sphere-main">
				<div className="stage">
					<div ref={sphereRef} className="sphere">
						{items.map((it, i) => (
							<div
								key={`${it.x},${it.y},${i}`}
								className="item"
								data-src={it.src}
								data-offset-x={it.x}
								data-offset-y={it.y}
								data-size-x={it.sizeX}
								data-size-y={it.sizeY}
								style={
									{
										["--offset-x" as any]: String(it.x),
										["--offset-y" as any]: String(it.y),
										["--item-size-x" as any]: String(it.sizeX),
										["--item-size-y" as any]: String(it.sizeY)
									} as React.CSSProperties
								}
							>
								<div className="item__image">
									<img src={it.src} draggable={false} alt={it.alt} />
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="overlay" />
				<div className="overlay overlay--blur" />
				<div className="edge-fade edge-fade--top" />
				<div className="edge-fade edge-fade--bottom" />
				<div className="viewer" />
			</main>
		</div>
	);
}


