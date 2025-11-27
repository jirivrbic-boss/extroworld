"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { addToWishlist, isInWishlist, removeFromWishlist } from "@/lib/wishlist";

type Props = {
  productId: string;
  /** Size of the control; affects height and icon size */
  size?: "sm" | "md";
  /** icon-only circular button (default) or full width button with label */
  variant?: "icon" | "button";
  /** Optional text for button variant; defaults to "Přidat do wishlistu" */
  label?: string;
  /** Extra classes for the button element */
  className?: string;
};

export default function WishlistButton({
  productId,
  size = "md",
  variant = "icon",
  label,
  className
}: Props) {
  const [uid, setUid] = useState<string | null>(null);
  const [inList, setInList] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const id = (user as any)?.uid ?? null;
      setUid(id);
      if (id) {
        try {
          const exists = await isInWishlist(productId);
          setInList(!!exists);
        } catch {
          setInList(false);
        }
      } else {
        setInList(false);
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [productId]);

  const toggle = async () => {
    if (!uid || busy) return;
    setBusy(true);
    try {
      if (inList) {
        await removeFromWishlist(productId);
        setInList(false);
      } else {
        await addToWishlist(productId);
        setInList(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const sizeCls = size === "sm" ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm";
  const iconSizeCls = "h-4 w-4";

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        disabled={!uid || !!busy}
        className={`inline-flex items-center gap-2 rounded border ${
          inList ? "bg-red-50 border-red-300 text-red-600" : "border-zinc-300 text-black"
        } ${sizeCls} ${className ?? ""} hover:bg-zinc-100 disabled:opacity-60`}
        title={!uid ? "Přihlas se" : inList ? "V oblíbených" : "Přidat do wishlistu"}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizeCls}
          fill={inList ? "#ef4444" : "none"}
          stroke={inList ? "#ef4444" : "currentColor"}
          strokeWidth={2}
        >
          <path d="M20 8.5c0 4.5-8 10-8 10s-8-5.5-8-10a4.5 4.5 0 0 1 8-2.9a4.5 4.5 0 0 1 8 2.9z" />
        </svg>
        <span>{inList ? "V oblíbených" : label ?? "Přidat do wishlistu"}</span>
      </button>
    );
  }

  // icon-only circular button variant (for overlays)
  const circleSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const circleClasses = inList
    ? "bg-white text-red-500 border-zinc-300"
    : "bg-white/90 text-zinc-600 border-zinc-300";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      disabled={!uid || !!busy}
      aria-label="Wishlist"
      className={`inline-flex items-center justify-center rounded-full border ${circleClasses} ${circleSize} ${
        className ?? ""
      } disabled:opacity-60`}
      title={!uid ? "Přidat do oblíbených – přihlas se" : inList ? "V oblíbených" : "Přidat do oblíbených"}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconSizeCls}
        fill={inList ? "#ef4444" : "none"}
        stroke={inList ? "#ef4444" : "currentColor"}
        strokeWidth={2}
      >
        <path d="M20 8.5c0 4.5-8 10-8 10s-8-5.5-8-10a4.5 4.5 0 0 1 8-2.9a4.5 4.5 0 0 1 8 2.9z" />
      </svg>
    </button>
  );
}


