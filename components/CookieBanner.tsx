"use client";

import { useEffect, useState } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    if (typeof document !== "undefined") {
      const maxAge = 60 * 60 * 24 * 365; // 1 rok
      document.cookie = `cookie_consent=1; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-5xl p-3">
      <div className="rounded-lg border border-white/10 bg-zinc-900/95 p-4 text-sm text-zinc-200 shadow-lg backdrop-blur">
        <p className="mb-3">
          Tento web používá soubory cookies pro analýzu a zlepšení služeb. Pokračováním souhlasíte
          s jejich použitím. Více najdete v&nbsp;
          <a href="/legal/privacy" className="underline hover:text-white">
            Zásadách ochrany soukromí
          </a>
          .
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={accept}
            className="rounded bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200"
          >
            Souhlasím
          </button>
        </div>
      </div>
    </div>
  );
}


