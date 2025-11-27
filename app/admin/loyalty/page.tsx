"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";

type Code = {
	id: string;
	userId: string;
	code: string;
	discount: number;
	used: boolean;
};

export default function AdminLoyaltyPage() {
	const [list, setList] = useState<Code[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"all" | "unused" | "used">("all");

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
			let qCodes = query(collection(db, "loyaltyCodes"), orderBy("createdAt", "desc"));
			const snap = await getDocs(qCodes);
			const arr: Code[] = [];
			snap.forEach((d) => {
				const data = d.data() as any;
				arr.push({
					id: d.id,
					userId: data.userId,
					code: data.code,
					discount: data.discount,
					used: data.used
				});
			});
			setList(arr);
		} finally {
			setLoading(false);
		}
	};

	const markUsed = async (id: string, used: boolean) => {
		await updateDoc(doc(db, "loyaltyCodes", id), { used });
		await load();
	};

	const visible =
		filter === "all" ? list : list.filter((c) => (filter === "unused" ? !c.used : c.used));

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Věrnostní kódy</h1>
			<div className="mb-4 flex gap-2">
				<button onClick={() => setFilter("all")} className={`rounded border px-3 py-1 text-sm ${filter === "all" ? "border-white bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}`}>Vše</button>
				<button onClick={() => setFilter("unused")} className={`rounded border px-3 py-1 text-sm ${filter === "unused" ? "border-white bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}`}>Neužité</button>
				<button onClick={() => setFilter("used")} className={`rounded border px-3 py-1 text-sm ${filter === "used" ? "border-white bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}`}>Užité</button>
			</div>
			<div className="rounded border border-white/10 bg-zinc-900 p-4">
				{loading ? (
					<p className="text-sm text-zinc-400">Načítám…</p>
				) : visible.length === 0 ? (
					<p className="text-sm text-zinc-400">Žádné kódy.</p>
				) : (
					<table className="w-full text-left text-sm text-zinc-300">
						<thead className="text-zinc-400">
							<tr>
								<th className="py-2">Kód</th>
								<th className="py-2">Uživatel</th>
								<th className="py-2">Sleva</th>
								<th className="py-2">Stav</th>
								<th className="py-2">Akce</th>
							</tr>
						</thead>
						<tbody>
							{visible.map((c) => (
								<tr key={c.id} className="border-t border-white/10">
									<td className="py-2">{c.code}</td>
									<td className="py-2">{c.userId}</td>
									<td className="py-2">{c.discount}%</td>
									<td className="py-2">{c.used ? "Užitý" : "Neužitý"}</td>
									<td className="py-2">
										<button onClick={() => markUsed(c.id, !c.used)} className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10">
											{c.used ? "Označit jako neužité" : "Označit jako užité"}
										</button>
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


