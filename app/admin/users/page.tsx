"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";

type User = {
	id: string;
	email: string;
	loyaltyPoints: number;
	createdAt?: any;
};

export default function AdminUsersPage() {
	const [list, setList] = useState<User[]>([]);
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
			const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
			const snap = await getDocs(qUsers);
			const arr: User[] = [];
			snap.forEach((d) => {
				const data = d.data() as any;
				arr.push({
					id: d.id,
					email: data.email,
					loyaltyPoints: data.loyaltyPoints ?? 0,
					createdAt: data.createdAt
				});
			});
			setList(arr);
		} finally {
			setLoading(false);
		}
	};

	const addPoints = async (id: string, delta: number) => {
		const u = list.find((x) => x.id === id);
		if (!u) return;
		await updateDoc(doc(db, "users", id), { loyaltyPoints: Math.max(0, (u.loyaltyPoints ?? 0) + delta) });
		await load();
	};

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Uživatelé</h1>
			<div className="rounded border border-white/10 bg-zinc-900 p-4">
				{loading ? (
					<p className="text-sm text-zinc-400">Načítám…</p>
				) : list.length === 0 ? (
					<p className="text-sm text-zinc-400">Žádní uživatelé.</p>
				) : (
					<table className="w-full text-left text-sm text-zinc-300">
						<thead className="text-zinc-400">
							<tr>
								<th className="py-2">UID</th>
								<th className="py-2">E-mail</th>
								<th className="py-2">Pusinky</th>
								<th className="py-2">Akce</th>
							</tr>
						</thead>
						<tbody>
							{list.map((u) => (
								<tr key={u.id} className="border-t border-white/10">
									<td className="py-2">{u.id}</td>
									<td className="py-2">{u.email}</td>
									<td className="py-2">{u.loyaltyPoints}</td>
									<td className="py-2">
										<div className="flex gap-2">
											<button onClick={() => addPoints(u.id, 100)} className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10">
												+100
											</button>
											<button onClick={() => addPoints(u.id, -100)} className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10">
												-100
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


