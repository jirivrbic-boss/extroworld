"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";

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
	const [genUserId, setGenUserId] = useState("");
	const [genDiscount, setGenDiscount] = useState<number>(100);
	const [genCount, setGenCount] = useState<number>(1);
	const [genBusy, setGenBusy] = useState(false);
	const [genResult, setGenResult] = useState<string[] | null>(null);

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

	const generateCodes = async () => {
		setGenResult(null);
		if (!genUserId.trim()) {
			alert("Vyplň UID uživatele (najdeš v sekci Uživatelé).");
			return;
		}
		if (!Number.isFinite(genDiscount) || genDiscount <= 0 || genDiscount > 100) {
			alert("Sleva musí být v rozmezí 1–100 %.");
			return;
		}
		const count = Math.max(1, Math.min(50, Number(genCount) || 1));
		setGenBusy(true);
		try {
			const created: string[] = [];
			for (let i = 0; i < count; i++) {
				const code = `EXTRO${Math.round(genDiscount)}-${Math.random()
					.toString(36)
					.slice(2, 8)
					.toUpperCase()}`;
				await addDoc(collection(db, "loyaltyCodes"), {
					userId: genUserId.trim(),
					code,
					discount: Math.round(genDiscount),
					used: false,
					createdAt: serverTimestamp()
				});
				created.push(code);
			}
			setGenResult(created);
			await load();
		} finally {
			setGenBusy(false);
		}
	};

	const visible =
		filter === "all" ? list : list.filter((c) => (filter === "unused" ? !c.used : c.used));

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Věrnostní kódy</h1>
			<div className="mb-4 rounded border border-white/10 bg-zinc-900 p-4">
				<p className="mb-2 text-sm text-zinc-300">Vygenerovat kódy pro konkrétního uživatele (UID)</p>
				<div className="grid gap-2 sm:grid-cols-3">
					<input
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						placeholder="UID uživatele (viz Admin → Uživatelé)"
						value={genUserId}
						onChange={(e) => setGenUserId(e.target.value)}
					/>
					<input
						type="number"
						min={1}
						max={100}
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						placeholder="Sleva %"
						value={genDiscount}
						onChange={(e) => setGenDiscount(Number(e.target.value))}
					/>
					<input
						type="number"
						min={1}
						max={50}
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						placeholder="Počet kódů"
						value={genCount}
						onChange={(e) => setGenCount(Number(e.target.value))}
					/>
				</div>
				<div className="mt-2">
					<button
						onClick={generateCodes}
						disabled={genBusy}
						className="rounded bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
					>
						Vygenerovat kódy
					</button>
				</div>
				{genResult && genResult.length ? (
					<div className="mt-3 rounded border border-white/10 bg-black p-3 text-xs text-zinc-300">
						<p className="mb-2 text-white">Vytvořené kódy:</p>
						<ul className="grid gap-1">
							{genResult.map((c) => (
								<li key={c} className="flex items-center justify-between gap-2">
									<span>{c}</span>
									<button
										onClick={() => navigator.clipboard.writeText(c)}
										className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-white hover:bg-white/10"
									>
										Kopírovat
									</button>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
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


