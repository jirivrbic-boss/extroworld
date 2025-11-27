"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export default function AdminStats() {
	const [ordersCount, setOrdersCount] = useState(0);
	const [revenue, setRevenue] = useState(0);
	const [usersCount, setUsersCount] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				if (!auth.currentUser) await signInAnonymously(auth);
			} catch {}
			setLoading(true);
			try {
				const oSnap = await getDocs(collection(db, "orders"));
				let rev = 0;
				oSnap.forEach((d) => {
					const data = d.data() as any;
					if (data.status === "paid") {
						rev += Number(data.priceTotal ?? 0);
					}
				});
				setOrdersCount(oSnap.size);
				setRevenue(rev);
				const uSnap = await getDocs(collection(db, "users"));
				setUsersCount(uSnap.size);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	if (loading) {
		return <p className="text-sm text-zinc-400">Načítám statistiky…</p>;
	}
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Stat title="Objednávky" value={ordersCount.toString()} />
			<Stat title="Příjmy (paid)" value={`${revenue} Kč`} />
			<Stat title="Uživatelé" value={usersCount.toString()} />
		</div>
	);
}

function Stat({ title, value }: { title: string; value: string }) {
	return (
		<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
			<p className="text-sm text-zinc-400">{title}</p>
			<p className="mt-2 text-2xl font-semibold text-white">{value}</p>
		</div>
	);
}


