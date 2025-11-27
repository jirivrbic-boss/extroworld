"use client";

import { motion } from "framer-motion";

export default function HeroVideo() {
	return (
		<section className="relative h-[80vh] w-full overflow-hidden bg-black">
			<video
				className="absolute inset-0 h-full w-full object-cover"
				autoPlay
				muted
				loop
				playsInline
				src="/media/video.mp4"
			/>
			<div className="absolute inset-0 bg-black/60" />
			<div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
				<div className="max-w-2xl">
					<motion.h1
						className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						EXTROWORLD
					</motion.h1>
					<motion.p
						className="mt-4 text-lg text-zinc-300"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.1 }}
					>
						Nejvíce unikátní a kontroverzní streetwear v Česku. Přidej se.
					</motion.p>
					<motion.a
						href="/products"
						className="mt-8 inline-block rounded bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						SHOP NOW
					</motion.a>
				</div>
			</div>
		</section>
	);
}


