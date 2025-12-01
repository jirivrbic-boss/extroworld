"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import Link from "next/link";

type Order = {
	id: string;
	userId: string;
	priceTotal: number;
	status: string;
};

export default function AdminOrdersPage() {
	const [list, setList] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const boot = async () => {
			try {
				if (!auth.currentUser) await signInAnonymously(auth);
			} catch {}
			await load();
		};
		boot();
	}, []);

	const load = async () => {
		setLoading(true);
		try {
			const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
			const snap = await getDocs(qOrders);
			const arr: Order[] = [];
			snap.forEach((d) => {
				const data = d.data() as any;
				arr.push({
					id: d.id,
					userId: data.userId,
					priceTotal: data.priceTotal,
					status: data.status
				});
			});
			setList(arr);
		} finally {
			setLoading(false);
		}
	};

	const setStatus = async (id: string, status: string) => {
		await updateDoc(doc(db, "orders", id), { status });
		await load();
	};

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Objednávky</h1>
			<div className="rounded border border-white/10 bg-zinc-900 p-4">
				{loading ? (
					<p className="text-sm text-zinc-400">Načítám…</p>
				) : list.length === 0 ? (
					<p className="text-sm text-zinc-400">Žádné objednávky.</p>
				) : (
					<table className="w-full text-left text-sm text-zinc-300">
						<thead className="text-zinc-400">
							<tr>
								<th className="py-2">ID</th>
								<th className="py-2">Uživatel</th>
								<th className="py-2">Cena</th>
								<th className="py-2">Stav</th>
								<th className="py-2">Akce</th>
							</tr>
						</thead>
						<tbody>
							{list.map((o) => (
								<tr key={o.id} className="border-t border-white/10">
									<td className="py-2">{o.id}</td>
									<td className="py-2">{o.userId}</td>
									<td className="py-2">{o.priceTotal} Kč</td>
									<td className="py-2">{o.status}</td>
									<td className="py-2">
										<div className="flex gap-2">
											<Link
												href={`/order/${o.id}/invoice`}
												target="_blank"
												className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10"
											>
												Zobrazit fakturu
											</Link>
											<Link
												href={`/order/${o.id}/invoice?print=1`}
												target="_blank"
												className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10"
											>
												Stáhnout fakturu
											</Link>
											<button onClick={() => setStatus(o.id, "paid")} className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10">
												Označit jako zaplaceno
											</button>
											<button onClick={() => setStatus(o.id, "shipped")} className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10">
												Odesláno
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}


