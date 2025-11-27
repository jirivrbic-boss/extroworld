"use client";

import { useState, useRef, useEffect, type CSSProperties, type MutableRefObject } from "react";
import { gsap } from "gsap";

type HoverStyles = { bgColor?: string; textColor?: string };

export type BubbleItem = {
	label: string;
	href: string;
	ariaLabel?: string;
	rotation?: number;
	hoverStyles?: HoverStyles;
};

type Props = {
	logo?: React.ReactNode | string;
	onMenuClick?: (open: boolean) => void;
	className?: string;
	style?: CSSProperties;
	hideHeader?: boolean;
	externalToggleRef?: MutableRefObject<(() => void) | null>;
	menuAriaLabel?: string;
	menuBg?: string;
	menuContentColor?: string;
	useFixedPosition?: boolean;
	items?: BubbleItem[];
	animationEase?: string;
	animationDuration?: number;
	staggerDelay?: number;
};

const DEFAULT_ITEMS: BubbleItem[] = [
	{ label: "home", href: "/", ariaLabel: "Home", rotation: -8, hoverStyles: { bgColor: "#3b82f6", textColor: "#fff" } },
	{ label: "about", href: "/about", ariaLabel: "About", rotation: 8, hoverStyles: { bgColor: "#10b981", textColor: "#fff" } },
	{ label: "shop", href: "/products", ariaLabel: "Shop", rotation: 8, hoverStyles: { bgColor: "#f59e0b", textColor: "#fff" } },
	{ label: "contact", href: "/contact", ariaLabel: "Contact", rotation: 8, hoverStyles: { bgColor: "#ef4444", textColor: "#fff" } },
	{ label: "account", href: "/account", ariaLabel: "Account", rotation: -8, hoverStyles: { bgColor: "#8b5cf6", textColor: "#fff" } }
];

export default function BubbleMenu({
	logo,
	onMenuClick,
	className,
	style,
	hideHeader,
	externalToggleRef,
	menuAriaLabel = "Toggle navigation",
	menuBg = "#ffffff",
	menuContentColor = "#111111",
	useFixedPosition = false,
	items,
	animationEase = "back.out(1.5)",
	animationDuration = 0.5,
	staggerDelay = 0.12
}: Props) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [showOverlay, setShowOverlay] = useState(false);

	const overlayRef = useRef<HTMLDivElement | null>(null);
	const bubblesRef = useRef<HTMLAnchorElement[]>([]);
	const labelRefs = useRef<HTMLSpanElement[]>([]);

	const menuItems = items?.length ? items : DEFAULT_ITEMS;
	const containerClassName = ["bubble-menu", useFixedPosition ? "fixed" : "absolute", className].filter(Boolean).join(" ");

	const handleToggle = () => {
		const next = !isMenuOpen;
		if (next) setShowOverlay(true);
		setIsMenuOpen(next);
		onMenuClick?.(next);
	};
	// expose external toggle
	useEffect(() => {
		if (externalToggleRef) {
			externalToggleRef.current = handleToggle;
			return () => {
				externalToggleRef.current = null;
			};
		}
	}, [externalToggleRef, isMenuOpen]);

	useEffect(() => {
		const overlay = overlayRef.current;
		const bubbles = bubblesRef.current.filter(Boolean);
		const labels = labelRefs.current.filter(Boolean);
		if (!overlay || !bubbles.length) return;

		if (isMenuOpen) {
			gsap.set(overlay, { display: "flex" });
			gsap.killTweensOf([...bubbles, ...labels]);
			gsap.set(bubbles, { scale: 0, transformOrigin: "50% 50%" });
			gsap.set(labels, { y: 24, autoAlpha: 0 });

			bubbles.forEach((bubble, i) => {
				const delay = i * staggerDelay + gsap.utils.random(-0.05, 0.05);
				const tl = gsap.timeline({ delay });
				tl.to(bubble, { scale: 1, duration: animationDuration, ease: animationEase });
				if (labels[i]) {
					tl.to(labels[i], { y: 0, autoAlpha: 1, duration: animationDuration, ease: "power3.out" }, `-=${animationDuration * 0.9}`);
				}
			});
		} else if (showOverlay) {
			gsap.killTweensOf([...bubbles, ...labels]);
			gsap.to(labels, { y: 24, autoAlpha: 0, duration: 0.2, ease: "power3.in" });
			gsap.to(bubbles, {
				scale: 0,
				duration: 0.2,
				ease: "power3.in",
				onComplete: () => {
					gsap.set(overlay, { display: "none" });
					setShowOverlay(false);
				}
			});
		}
	}, [isMenuOpen, showOverlay, animationEase, animationDuration, staggerDelay]);

	useEffect(() => {
		const handleResize = () => {
			if (isMenuOpen) {
				const bubbles = bubblesRef.current.filter(Boolean);
				const isDesktop = window.innerWidth >= 900;
				bubbles.forEach((bubble, i) => {
					const item = menuItems[i];
					if (bubble && item) {
						const rotation = isDesktop ? item.rotation ?? 0 : 0;
						gsap.set(bubble, { rotation });
					}
				});
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isMenuOpen, menuItems]);

	return (
		<>
			{!hideHeader ? (
				<nav className={containerClassName} style={style} aria-label="Main navigation">
					<div className="bubble logo-bubble" aria-label="Logo" style={{ background: menuBg }}>
						<span className="logo-content">
							{typeof logo === "string" ? <img src={logo} alt="Logo" className="bubble-logo" /> : logo}
						</span>
					</div>
					<button
						type="button"
						className={`bubble toggle-bubble menu-btn ${isMenuOpen ? "open" : ""}`}
						onClick={handleToggle}
						aria-label={menuAriaLabel}
						aria-pressed={isMenuOpen}
						style={{ background: menuBg }}
					>
						<span className="menu-line" style={{ background: menuContentColor }} />
						<span className="menu-line short" style={{ background: menuContentColor }} />
					</button>
				</nav>
			) : null}
			{showOverlay && (
				<div ref={overlayRef} className={`bubble-menu-items ${useFixedPosition ? "fixed" : "absolute"}`} aria-hidden={!isMenuOpen}>
					<ul className="pill-list" role="menu" aria-label="Menu links">
						{menuItems.map((item, idx) => (
							<li key={idx} role="none" className="pill-col">
								<a
									role="menuitem"
									href={item.href}
									aria-label={item.ariaLabel || item.label}
									className="pill-link"
									style={
										{
											"--item-rot": `${item.rotation ?? 0}deg`,
											"--pill-bg": menuBg,
											"--pill-color": menuContentColor,
											"--hover-bg": item.hoverStyles?.bgColor || "#f3f4f6",
											"--hover-color": item.hoverStyles?.textColor || menuContentColor
										} as CSSProperties
									}
									ref={(el) => {
										if (el) bubblesRef.current[idx] = el;
									}}
								>
									<span
										className="pill-label"
										ref={(el) => {
											if (el) labelRefs.current[idx] = el;
										}}
									>
										{item.label}
									</span>
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
		</>
	);
}


