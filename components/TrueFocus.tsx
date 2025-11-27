'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

type TrueFocusProps = {
	sentence?: string;
	separator?: string;
	manualMode?: boolean;
	blurAmount?: number;
	borderColor?: string;
	glowColor?: string;
	animationDuration?: number;
	pauseBetweenAnimations?: number;
};

export default function TrueFocus({
	sentence = 'True Focus',
	separator = ' ',
	manualMode = false,
	blurAmount = 5,
	borderColor = 'green',
	glowColor = 'rgba(0, 255, 0, 0.6)',
	animationDuration = 0.5,
	pauseBetweenAnimations = 1
}: TrueFocusProps) {
	const words = sentence.split(separator);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
	const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

	useEffect(() => {
		if (!manualMode) {
			const interval = setInterval(() => {
				setCurrentIndex((prev) => (prev + 1) % words.length);
			}, (animationDuration + pauseBetweenAnimations) * 1000);
			return () => clearInterval(interval);
		}
	}, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

	useEffect(() => {
		if (currentIndex === null || currentIndex === -1) return;
		if (!wordRefs.current[currentIndex] || !containerRef.current) return;
		const parentRect = containerRef.current.getBoundingClientRect();
		const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();
		setFocusRect({
			x: activeRect.left - parentRect.left,
			y: activeRect.top - parentRect.top,
			width: activeRect.width,
			height: activeRect.height
		});
	}, [currentIndex, words.length]);

	const handleMouseEnter = (index: number) => {
		if (manualMode) {
			setLastActiveIndex(index);
			setCurrentIndex(index);
		}
	};

	const handleMouseLeave = () => {
		if (manualMode) {
			setCurrentIndex(lastActiveIndex ?? 0);
		}
	};

	return (
		<div className="focus-container" ref={containerRef}>
			<style jsx global>{`
				.focus-container { position:relative; display:flex; gap:1em; justify-content:center; align-items:center; flex-wrap:wrap; }
				.focus-word { position:relative; font-size:3rem; font-weight:900; cursor:pointer; transition: filter 0.3s ease, color 0.3s ease; color: inherit; }
				.focus-word.active { filter: blur(0); }
				.focus-frame { position:absolute; top:0; left:0; pointer-events:none; box-sizing:content-box; border:none; }
				.corner { position:absolute; width:1rem; height:1rem; border:3px solid var(--border-color, #fff); filter: drop-shadow(0px 0px 4px var(--glow-color, #fff)); border-radius:3px; transition:none; }
				.top-left { top:-10px; left:-10px; border-right:none; border-bottom:none; }
				.top-right { top:-10px; right:-10px; border-left:none; border-bottom:none; }
				.bottom-left { bottom:-10px; left:-10px; border-right:none; border-top:none; }
				.bottom-right { bottom:-10px; right:-10px; border-left:none; border-top:none; }
			`}</style>
			{words.map((word, index) => {
				const isActive = index === currentIndex;
				return (
					<span
						key={index}
						ref={(el) => { wordRefs.current[index] = el; }}
						className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''}`}
						style={{
							filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
							['--border-color' as any]: borderColor,
							['--glow-color' as any]: glowColor,
							transition: `filter ${animationDuration}s ease`
						}}
						onMouseEnter={() => handleMouseEnter(index)}
						onMouseLeave={handleMouseLeave}
					>
						{word}
					</span>
				);
			})}
			<motion.div
				className="focus-frame"
				animate={{
					x: focusRect.x,
					y: focusRect.y,
					width: focusRect.width,
					height: focusRect.height,
					opacity: currentIndex >= 0 ? 1 : 0
				}}
				transition={{ duration: animationDuration }}
				style={{ ['--border-color' as any]: borderColor, ['--glow-color' as any]: glowColor }}
			>
				<span className="corner top-left"></span>
				<span className="corner top-right"></span>
				<span className="corner bottom-left"></span>
				<span className="corner bottom-right"></span>
			</motion.div>
		</div>
	);
}

