"use client";

import { useEffect, useState } from "react";

type Item = {
  src: string;
  href: string;
  alt?: string;
  label?: string;
};

function Card({
  item,
  className,
  style,
  z = 1
}: {
  item: Item;
  className?: string;
  style?: React.CSSProperties;
  z?: number;
}) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl ${className ?? ""}`}
      style={{ zIndex: z, ...style }}
      aria-label="Otevřít příspěvek na Instagramu"
    >
      <div className="w-full h-full">
        <img
          src={item.src}
          alt={item.alt ?? "Instagram post"}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white/95 px-4 py-1 text-xs font-semibold text-black shadow">
        {item.label ?? "@extroworld_"}
      </div>
    </a>
  );
}

export default function InstagramShowcase({ items }: { items: Item[] }) {
  // jednoduchá rotace bez „morphingu“ – plynulé přes CSS transitions
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = items.length;
  const get = (offset: number) => {
    if (n === 0) return undefined;
    const i = ((index + offset) % n + n) % n;
    return items[i];
  };
  const center = get(0);
  const left1 = get(-1);
  const right1 = get(1);
  const left2 = get(-2);
  const right2 = get(2);

  useEffect(() => {
    if (n === 0) return;
    if (paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, 3500);
    return () => window.clearInterval(t);
  }, [n, paused]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <h2 className="mb-6 text-xl font-semibold text-white text-center">Sleduj nás</h2>
      <div className="relative h-[70vh] w-full">
        {/* druhá vrstva (nejzadnější) */}
        {left2 ? (
          <Card
            item={left2}
            z={5}
            className="aspect-[3/4]"
            style={{
              width: 260,
              left: "calc(50% - 520px)",
              top: "12%",
              transform: "translateX(-50%) scale(0.9)",
              opacity: 0.6,
              transition: "transform 600ms cubic-bezier(0.2,0.8,0.2,1), opacity 600ms"
            }}
          />
        ) : null}
        {right2 ? (
          <Card
            item={right2}
            z={5}
            className="aspect-[3/4]"
            style={{
              width: 260,
              left: "calc(50% + 520px)",
              top: "12%",
              transform: "translateX(-50%) scale(0.9)",
              opacity: 0.6,
              transition: "transform 600ms cubic-bezier(0.2,0.8,0.2,1), opacity 600ms"
            }}
          />
        ) : null}

        {/* první zadní vrstva */}
        {left1 ? (
          <Card
            item={left1}
            z={10}
            className="aspect-[3/4]"
            style={{
              width: 320,
              left: "calc(50% - 360px)",
              top: "6%",
              transform: "translateX(-50%) scale(0.95)",
              opacity: 0.8,
              transition: "transform 600ms cubic-bezier(0.2,0.8,0.2,1), opacity 600ms"
            }}
          />
        ) : null}
        {right1 ? (
          <Card
            item={right1}
            z={10}
            className="aspect-[3/4]"
            style={{
              width: 320,
              left: "calc(50% + 360px)",
              top: "6%",
              transform: "translateX(-50%) scale(0.95)",
              opacity: 0.8,
              transition: "transform 600ms cubic-bezier(0.2,0.8,0.2,1), opacity 600ms"
            }}
          />
        ) : null}

        {/* hlavní karta v popředí – přesně doprostřed */}
        {center ? (
          <Card
            item={center}
            z={20}
            className="aspect-[3/4]"
            style={{
              width: 420,
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.6), 0 10px 20px rgba(0,0,0,0.3)",
              transition: "transform 600ms cubic-bezier(0.2,0.8,0.2,1), opacity 600ms"
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

