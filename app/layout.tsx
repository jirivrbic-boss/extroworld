import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "EXTROWORLD — Streetwear",
	description:
		"Nejvíce unikátní a kontroverzní značka oblečení v Česku. Dosáhni svých snů s Extroworld.",
	icons: [
		{ rel: "icon", url: "/media/ikona webu.png" },
		{ rel: "shortcut icon", url: "/media/ikona webu.png" }
	],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
		<html lang="cs">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}>
				<Navbar />
				<main className="min-h-screen">{children}</main>
				<Footer />
      </body>
    </html>
  );
}
