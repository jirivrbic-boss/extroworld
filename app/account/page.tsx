"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";

type Order = {
	id: string;
	priceTotal: number;
	status: string;
	createdAt?: any;
};

export default function AccountPage() {
	const [user, setUser] = useState<null | { uid: string; email: string | null }>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [orders, setOrders] = useState<Order[]>([]);
	const [loyalty, setLoyalty] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (u) => {
			setLoading(true);
			try {
				if (u) {
					setUser({ uid: u.uid, email: u.email });
					const userRef = doc(db, "users", u.uid);
					const userSnap = await getDoc(userRef);
					if (!userSnap.exists()) {
						await setDoc(userRef, {
							email: u.email,
							createdAt: Date.now(),
							loyaltyPoints: 0,
							orders: []
						});
						setLoyalty(0);
					} else {
						setLoyalty((userSnap.data() as any).loyaltyPoints ?? 0);
					}
					const qOrders = query(
						collection(db, "orders"),
						where("userId", "==", u.uid),
						orderBy("createdAt", "desc")
					);
					const oSnap = await getDocs(qOrders);
					const list: Order[] = [];
					oSnap.forEach((d) => {
						const data = d.data() as any;
						list.push({
							id: d.id,
							priceTotal: data.priceTotal,
							status: data.status,
							createdAt: data.createdAt
						});
					});
					setOrders(list);
				} else {
					setUser(null);
					setOrders([]);
					setLoyalty(0);
				}
			} finally {
				setLoading(false);
			}
		});
		return () => unsub();
	}, []);

	const signIn = async () => {
		setError(null);
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (e: any) {
			setError(e.message ?? "Chyba při přihlášení");
		}
	};
	const signUp = async () => {
		setError(null);
		try {
			await createUserWithEmailAndPassword(auth, email, password);
		} catch (e: any) {
			setError(e.message ?? "Chyba při registraci");
		}
	};

	return (
		<div className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-white">Můj účet</h1>
			{loading ? (
				<div className="text-zinc-400">Načítám…</div>
			) : !user ? (
				<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
					<div className="mb-4 grid gap-3">
						<input
							className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
							placeholder="E-mail"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<input
							className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
							placeholder="Heslo"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					{error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
					<div className="flex items-center gap-3">
						<button onClick={signIn} className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
							Přihlásit se
						</button>
						<button onClick={signUp} className="rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">
							Vytvořit účet
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-8">
					<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
						<p className="mb-1 text-sm text-zinc-400">Přihlášen:</p>
						<p className="text-white">{user.email}</p>
						<div className="mt-4">
							<button
								onClick={() => signOut(auth)}
								className="rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
							>
								Odlásit
							</button>
						</div>
					</div>
					<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
						<p className="mb-2 text-sm text-zinc-400">Věrnostní pusinky</p>
						<p className="text-2xl font-semibold text-white">{loyalty} pusinek</p>
						<p className="mt-2 text-sm text-zinc-400">
							1 pusinka = 1 Kč utracené. Po dosažení 5000 pusinek posíláme 100% slevový kód na e‑mail.
						</p>
					</div>
					<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
						<p className="mb-4 text-white">Historie objednávek</p>
						{orders.length === 0 ? (
							<p className="text-sm text-zinc-400">Zatím žádné objednávky.</p>
						) : (
							<ul className="space-y-3">
								{orders.map((o) => (
									<li key={o.id} className="flex items-center justify-between border-b border-white/10 pb-2">
										<Link href={`/order/${o.id}`} className="block">
											<div>
												<p className="text-sm text-white">Objednávka #{o.id}</p>
												<p className="text-xs text-zinc-400">Stav: {o.status}</p>
											</div>
										</Link>
										<div className="text-sm text-white">{o.priceTotal} Kč</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</div>
	);
}


