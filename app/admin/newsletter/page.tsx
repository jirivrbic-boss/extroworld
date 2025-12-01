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
	const [selected, setSelected] = useState<Set<string>>(new Set());

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

	const selectedEmailsText = useMemo(() => {
		if (!selected.size) return "";
		const map = new Map<string, boolean>();
		for (const s of list) {
			if (selected.has(s.id) && s.email) {
				map.set(String(s.email).trim().toLowerCase(), true);
			}
		}
		return Array.from(map.keys()).join("\n");
	}, [selected, list]);

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

	const copySelected = async () => {
		if (!selectedEmailsText) return;
		try {
			await navigator.clipboard.writeText(selectedEmailsText);
			// volitelná vizuální odezva
			alert("Zkopírováno do schránky.");
		} catch {
			// fallback
			const ta = document.createElement("textarea");
			ta.value = selectedEmailsText;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			ta.remove();
			alert("Zkopírováno do schránky.");
		}
	};

	const allChecked = useMemo(() => list.length > 0 && selected.size === list.length, [list, selected]);
	const toggleAll = () => {
		if (allChecked) {
			setSelected(new Set());
		} else {
			setSelected(new Set(list.map((s) => s.id)));
		}
	};
	const toggleOne = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
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
				<button onClick={copySelected} disabled={!selected.size} className="rounded border border-white/15 px-3 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-60">
					Kopírovat vybrané
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
								<th className="py-2">
									<label className="inline-flex items-center gap-2">
										<input type="checkbox" checked={allChecked} onChange={toggleAll} />
										<span>Vybrat</span>
									</label>
								</th>
								<th className="py-2">E‑mail</th>
								<th className="py-2">Jméno</th>
								<th className="py-2">Zdroj</th>
								<th className="py-2">Segmenty</th>
							</tr>
						</thead>
						<tbody>
							{list.map((s) => (
								<tr key={s.id} className="border-t border-white/10">
									<td className="py-2">
										<input
											type="checkbox"
											checked={selected.has(s.id)}
											onChange={() => toggleOne(s.id)}
										/>
									</td>
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


