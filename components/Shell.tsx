"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterPopup from "@/components/NewsletterPopup";
import CookieBanner from "@/components/CookieBanner";

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isLock = pathname.startsWith("/lock");

  if (isLock) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <NewsletterPopup />
      <Footer />
      <CookieBanner />
    </>
  );
}


