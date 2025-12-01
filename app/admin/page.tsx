import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminStats from "@/components/admin/Stats";
import SeedTestOrder from "@/components/admin/SeedTestOrder";

export default async function AdminDashboardPage() {
	const isAuthed = (await cookies()).get("extro_admin")?.value === "1";
	if (!isAuthed) {
		redirect("/admin/login");
	}
	return (
		<div>
			<h1 className="mb-6 text-2xl font-semibold text-white">Admin dashboard</h1>
			<div className="mb-6">
				<AdminStats />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card title="Objednávky" href="/admin/orders" />
				<Card title="Produkty" href="/admin/products" />
				<Card title="Uživatelé" href="/admin/users" />
				<Card title="Věrnostní pusinky" href="/admin/loyalty" />
				<Card title="Newsletter e‑maily" href="/admin/newsletter" />
				<Card title="Stripe kupony" href="/admin/stripe-coupons" />
				<Card title="Faktury" href="/admin/invoices" />
			</div>
			<div className="mt-8">
				<SeedTestOrder defaultUid={process.env.ADMIN_UID} />
			</div>
			<form action="/api/admin/logout" method="POST" className="mt-8">
				<button className="rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">
					Odhlásit
				</button>
			</form>
		</div>
	);
}

function Card({ title, href }: { title: string; href: string }) {
	return (
		<Link href={href} className="rounded-lg border border-white/10 bg-zinc-900 p-6 text-white hover:bg-zinc-800">
			{title}
		</Link>
	);
}


