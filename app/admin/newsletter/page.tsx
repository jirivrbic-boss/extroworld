"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

type Sub = {
	id: string;
	email: string;
	name?: string | null;
	source?: string | null;
	segments?: string[] | null;
	createdAt?: any;
};

export default function AdminNewsletterPage() {
	const [list, setList] = useState<Sub[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const boot = async () => {
			try {
				if (!auth.currentUser) await signInAnonymously(auth);
			} catch {}
			await load();
		};
		void boot();
	}, []);

	const load = async () => {
		setLoading(true);
		setError(null);
		try {
			const qSubs = query(collection(db, "newsletter"), orderBy("createdAt", "desc"));
			const snap = await getDocs(qSubs);
			const arr: Sub[] = [];
			snap.forEach((d) => {
				const data = d.data() as any;
				arr.push({
					id: d.id,
					email: data.email,
					name: data.name ?? null,
					source: data.source ?? null,
					segments: data.segments ?? null,
					createdAt: data.createdAt
				});
			});
			setList(arr);
		} catch (e: any) {
			setError(e?.message ?? "Chyba při načítání.");
		} finally {
			setLoading(false);
		}
	};

	const csv = useMemo(() => {
		const rows = [["email", "name", "source", "segments"].join(",")];
		for (const s of list) {
			const line = [
				s.email ?? "",
				s.name ?? "",
				s.source ?? "",
				(s.segments ?? []).join("|")
			]
				.map((v) => `"${String(v).replace(/"/g, '""')}"`)
				.join(",");
			rows.push(line);
		}
		return rows.join("\n");
	}, [list]);

	const download = () => {
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "newsletter.csv";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Newsletter — přihlášení</h1>
			<div className="mb-4 flex items-center gap-2">
				<button onClick={load} className="rounded border border-white/15 px-3 py-1 text-xs text-white hover:bg-white/10">
					Obnovit
				</button>
				<button onClick={download} disabled={!list.length} className="rounded border border-white/15 px-3 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-60">
					Export CSV
				</button>
			</div>
			<div className="rounded border border-white/10 bg-zinc-900 p-4">
				{loading ? (
					<p className="text-sm text-zinc-400">Načítám…</p>
				) : error ? (
					<p className="text-sm text-red-400">{error}</p>
				) : list.length === 0 ? (
					<p className="text-sm text-zinc-400">Žádné záznamy.</p>
				) : (
					<table className="w-full text-left text-sm text-zinc-300">
						<thead className="text-zinc-400">
							<tr>
								<th className="py-2">E‑mail</th>
								<th className="py-2">Jméno</th>
								<th className="py-2">Zdroj</th>
								<th className="py-2">Segmenty</th>
							</tr>
						</thead>
						<tbody>
							{list.map((s) => (
								<tr key={s.id} className="border-t border-white/10">
									<td className="py-2">{s.email}</td>
									<td className="py-2">{s.name || "-"}</td>
									<td className="py-2">{s.source || "-"}</td>
									<td className="py-2">{(s.segments ?? []).join(", ")}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}


