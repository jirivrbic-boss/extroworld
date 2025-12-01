import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import AdminAuth from "@/components/AdminAuth";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

export const metadata: Metadata = {
	title: "Admin — EXTROWORLD"
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const cookieStore = await cookies();
	const token = cookieStore.get("extro_admin")?.value || "";
	const signature = cookieStore.get("extro_admin_sig")?.value || "";
	const secret = process.env.ADMIN_SIGNING_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
	const expected = secret ? createHmac("sha256", secret).update(token).digest("hex") : "";
	const isAuthed = Boolean(token) && Boolean(secret) && signature === expected;
	if (!isAuthed) {
		redirect("/admin/login");
	}
	return (
		<div className="mx-auto max-w-7xl px-4 py-8">
			{/* Zajistí přihlášení k Firebase (anonymně) dřív, než proběhnou jakékoliv dotazy na Firestore */}
			<AdminAuth />
			{isAuthed ? (
				<nav className="mb-6 flex flex-wrap items-center gap-3">
					<Link
						href="/admin"
						className="rounded-full border border-white/10 bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-xs font-semibold text-black hover:from-fuchsia-400 hover:to-pink-400 shadow"
					>
						Přehled
					</Link>
					<Link
						href="/admin/products"
						className="rounded-full border border-white/10 bg-gradient-to-r from-emerald-500 to-lime-500 px-3 py-1 text-xs font-semibold text-black hover:from-emerald-400 hover:to-lime-400 shadow"
					>
						Produkty
					</Link>
					<Link
						href="/admin/orders"
						className="rounded-full border border-white/10 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-xs font-semibold text-black hover:from-amber-400 hover:to-orange-500 shadow"
					>
						Objednávky
					</Link>
					<Link
						href="/admin/users"
						className="rounded-full border border-white/10 bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-1 text-xs font-semibold text-black hover:from-sky-400 hover:to-cyan-400 shadow"
					>
						Uživatelé
					</Link>
					<Link
						href="/admin/loyalty"
						className="rounded-full border border-white/10 bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-xs font-semibold text-black hover:from-violet-400 hover:to-purple-500 shadow"
					>
						Věrnost
					</Link>
					<Link
						href="/admin/stripe-sync"
						className="rounded-full border border-white/10 bg-gradient-to-r from-rose-500 to-red-600 px-3 py-1 text-xs font-semibold text-black hover:from-rose-400 hover:to-red-500 shadow"
					>
						Stripe Sync
					</Link>
				</nav>
			) : null}
			{children}
		</div>
	);
}


