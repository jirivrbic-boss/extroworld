'use client';

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/store/cart";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export default function CheckoutPage() {
	const { items, total, shippingMethod, clear, discount, applyDiscount } = useCartStore();
	const setShipping = useCartStore((s) => s.setShipping);
	const [uid, setUid] = useState<string | null>(null);
	const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
	const [cust, setCust] = useState({ firstName: "", lastName: "", email: "", phone: "" });
	const [billing, setBilling] = useState({ street: "", city: "", zip: "", country: "Česko" });
	const [ship, setShip] = useState({ street: "", city: "", zip: "", country: "Česko", sameAsBilling: true });
	const [packeta, setPacketa] = useState<null | { id: string; name: string; street?: string; city?: string; zip?: string }>(null);
	const [packetaReady, setPacketaReady] = useState(false);
	const [packetaMsg, setPacketaMsg] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [code, setCode] = useState("");
	const [codeMsg, setCodeMsg] = useState<string | null>(null);
	const router = useRouter();
	const [clientSecret, setClientSecret] = useState<string | null>(null);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
		return () => unsub();
	}, []);

	const stripePromise = useMemo(
		() => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""),
		[]
	);

	// Load Packeta (Zásilkovna) widget script
	useEffect(() => {
		// only once in browser
		if (typeof window === "undefined") return;
		if ((window as any).Packeta?.Widget) {
			setPacketaReady(true);
			return;
		}
		const tryLoad = (url: string, onFail?: () => void) => {
			const s = document.createElement("script");
			s.src = url;
			s.async = true;
			s.crossOrigin = "anonymous";
			s.onload = () => {
				setTimeout(() => {
					if ((window as any).Packeta?.Widget) {
						setPacketaReady(true);
					} else {
						onFail?.();
					}
				}, 50);
			};
			s.onerror = () => {
				onFail?.();
			};
			document.body.appendChild(s);
			return s;
		};
		// 1) primární URL (proxy přes náš backend — méně blokátorů)
		let scriptEl: HTMLScriptElement | null = null;
		scriptEl = tryLoad("/api/packeta/widget", () => {
			// 2) fallback – přímo na CDN (v6/v7)
			tryLoad("https://widget.packeta.com/v6/www/js/packetaWidget.js", () => {
				tryLoad("https://widget.packeta.com/v7/www/js/packetaWidget.js", () => {
					setPacketaMsg("Nepodařilo se načíst widget Zásilkovny. Zkus vypnout blokátory a obnovit stránku.");
				});
			});
		});
		return () => {
			// necháme script v DOM, neodstraňujeme
		};
	}, []);

	// Pojistka – pokud se script načte později, aktivuj tlačítko
	useEffect(() => {
		const id = setInterval(() => {
			if ((window as any).Packeta?.Widget) {
				setPacketaReady(true);
				clearInterval(id);
			}
		}, 200);
		const kill = setTimeout(() => {
			clearInterval(id);
			if (!(window as any).Packeta?.Widget) {
				setPacketaMsg("Nepodařilo se načíst widget Zásilkovny. Zkus vypnout blokátory a obnovit stránku.");
			}
		}, 6000);
		return () => {
			clearInterval(id);
			clearTimeout(kill);
		};
	}, []);

	const openPacketa = () => {
		const w = (window as any);
		if (!w.Packeta?.Widget) {
			setPacketaMsg("Widget ještě není připravený. Počkej chvíli a zkus to znovu.");
			return;
		}
		const apiKey = process.env.NEXT_PUBLIC_PACKETA_WIDGET_API_KEY || ""; // nastav v .env.local
		if (!apiKey) {
			setPacketaMsg("Chybí NEXT_PUBLIC_PACKETA_WIDGET_API_KEY. Doplň klíč do .env.local.");
			return;
		}
		try {
			w.Packeta.Widget.pick(apiKey, (point: any) => {
				if (!point) return;
				setPacketa({
					id: point.id || point.pickupPoint?.id || point.branchId || "",
					name: point.name || point.place || point.pickupPoint?.name || "",
					street: point.street || point.pickupPoint?.street,
					city: point.city || point.pickupPoint?.city,
					zip: point.zip || point.pickupPoint?.zip
				});
			}, { country: "cz" });
		} catch (e) {
			console.error("Packeta widget error:", e);
		}
	};

	// Prepare PaymentIntent for non-100% payments – až na kroku 4 a po vyplnění údajů
	useEffect(() => {
		const initPI = async () => {
			if (!uid) return;
			if (!items.length) return;
			// klientská prevence proti min. částce Stripe (10 Kč)
			if (total() < 10) return;
			if (discount?.percent === 100) return;
			if (step !== 4) return;
			try {
				const res = await fetch("/api/stripe/create-intent", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: uid,
						customer: cust,
						items: items
							.filter((i) => i.priceId)
							.map((i) => ({
								priceId: i.priceId,
								quantity: i.quantity
							})),
						discountPercent: discount?.percent ?? 0,
						shippingMethod,
						packeta: packeta,
						billingAddress: billing,
						shippingAddress:
							shippingMethod === "address"
								? ship.sameAsBilling
									? { street: billing.street, city: billing.city, zip: billing.zip, country: billing.country }
									: { street: ship.street, city: ship.city, zip: ship.zip, country: ship.country }
								: null
					})
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data?.error || "Nelze vytvořit platbu.");
				setClientSecret(data.clientSecret);
			} catch (e: any) {
				console.error(e);
			}
		};
		void initPI();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uid, JSON.stringify(items), discount?.percent, shippingMethod, packeta?.id, step, billing.street, ship.street]);

	const applyCode = async () => {
		setCodeMsg(null);
		if (!uid) {
			setCodeMsg("Přihlas se do účtu.");
			return;
		}
		const qC = query(collection(db, "loyaltyCodes"), where("userId", "==", uid), where("code", "==", code.toUpperCase()), where("used", "==", false));
		const cSnap = await getDocs(qC);
		if (cSnap.empty) {
			setCodeMsg("Kód není platný.");
			return;
		}
		applyDiscount({ code: code.toUpperCase(), percent: 100 });
		setCodeMsg("Kód použit. Sleva 100% aplikována.");
	};

	const placeOrder = async (opts?: { stripePaymentId?: string }) => {
		if (!uid) return;
		setSubmitting(true);
		try {
			// Create order
			const orderRef = await addDoc(collection(db, "orders"), {
				userId: uid,
				items,
				shippingMethod,
				shipping: {
					method: shippingMethod,
					packeta
				},
				priceTotal: total(),
				stripePaymentId: opts?.stripePaymentId ?? null,
				status: discount?.percent === 100 || opts?.stripePaymentId ? "paid" : "pending",
				createdAt: serverTimestamp()
			});

			// Update user loyalty points
			const userRef = doc(db, "users", uid);
			const userSnap = await getDoc(userRef);
			const current = (userSnap.data() as any)?.loyaltyPoints ?? 0;
			const added = discount?.percent === 100 ? 0 : total(); // když 100% sleva, nepřičítáme
			const newTotal = current + added;
			await setDoc(
				userRef,
				{
					loyaltyPoints: newTotal,
					updatedAt: serverTimestamp()
				},
				{ merge: true }
			);

			// Mark loyalty code as used if applied
			if (discount?.percent === 100 && discount.code) {
				const qUsed = query(collection(db, "loyaltyCodes"), where("userId", "==", uid), where("code", "==", discount.code));
				const usedSnap = await getDocs(qUsed);
				usedSnap.forEach(async (d) => {
					await updateDoc(doc(db, "loyaltyCodes", d.id), { used: true, usedAt: serverTimestamp() });
				});
			}

			// Generate 100% code at 5000 threshold if not existing and not just used
			if (newTotal >= 5000 && !discount?.percent) {
				// check existing unused
				const qCodes = query(collection(db, "loyaltyCodes"), where("userId", "==", uid), where("used", "==", false));
				const sCodes = await getDocs(qCodes);
				if (sCodes.empty) {
					const code = `EXTRO100-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
					await addDoc(collection(db, "loyaltyCodes"), {
						userId: uid,
						code,
						discount: 100,
						used: false,
						createdAt: serverTimestamp()
					});
				}
			}

			clear();
			router.push(`/order/${orderRef.id}${opts?.stripePaymentId ? "?paid=1" : ""}`);
		} finally {
			setSubmitting(false);
		}
	};

	function StripeForm({ onPaid, canPay }: { onPaid: (pi: string) => Promise<void>; canPay: boolean }) {
	const stripe = useStripe();
	const elements = useElements();
	const [paying, setPaying] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handlePay = async () => {
		if (!stripe || !elements) return;
		setPaying(true);
		setErrorMsg(null);
		try {
			const { origin } = window.location;
			const { error, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: `${origin}/account?payment=return`
				},
				redirect: "if_required"
			});
			if (error) {
				setErrorMsg(error.message || "Platbu se nepodařilo dokončit.");
				return;
			}
			if (paymentIntent && paymentIntent.status === "succeeded") {
				await onPaid(paymentIntent.id);
			} else {
				// Fallback – pokud je vyžadována 3DS, Stripe provede redirect díky redirect: 'if_required'
			}
		} finally {
			setPaying(false);
		}
	};

	return (
		<div className="mt-4">
			<div className="rounded border border-white/15 bg-black p-3">
				<PaymentElement options={{ layout: "tabs" }} />
			</div>
			{errorMsg ? <p className="mt-2 text-sm text-red-400">{errorMsg}</p> : null}
			{!canPay ? (
				<p className="mt-2 text-sm text-amber-300">
					Vyber prosím výdejní místo Zásilkovny.
				</p>
			) : null}
			<button
				onClick={handlePay}
				disabled={!stripe || !elements || paying || !canPay}
				className="mt-4 w-full rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
			>
				Zaplatit {total()} Kč
			</button>
		</div>
	);
}

	if (items.length === 0) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-10">
				<p className="text-zinc-300">Košík je prázdný.</p>
				<Link href="/products" className="mt-4 inline-block text-sm text-zinc-300 underline hover:text-white">
					Zpět do obchodu
				</Link>
			</div>
		);
	}
	if (!uid) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-10">
				<p className="text-zinc-300">Pro dokončení objednávky se prosím přihlas do svého účtu.</p>
				<Link href="/account" className="mt-4 inline-block text-sm text-zinc-300 underline hover:text-white">
					Přejít na účet
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-white">Checkout</h1>
			{/* Step 1: Souhrn */}
			{step === 1 && (
			<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
				<p className="mb-4 text-white">Souhrn</p>
				<div className="mb-4">
					<label className="mb-2 block text-sm text-zinc-300">Slevový kód (věrnost 100%)</label>
					<div className="flex items-center gap-2">
						<input
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="EXTRO100-XXXXXX"
							className="flex-1 rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						/>
						<button
							type="button"
							onClick={applyCode}
							className="rounded border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
						>
							Použít
						</button>
					</div>
					{codeMsg ? <p className="mt-2 text-xs text-zinc-400">{codeMsg}</p> : null}
				</div>
				<ul className="space-y-2">
					{items.map((i) => (
						<li key={`${i.productId}-${i.size ?? "nosize"}`} className="flex items-center justify-between gap-3 text-sm text-zinc-300">
							<div className="flex items-center gap-3">
								<div className="h-12 w-12 overflow-hidden rounded bg-black">
									<img
										src={i.image ?? "/media/komunita/IMG_1082-scaled.jpg"}
										alt={i.name}
										className="h-full w-full object-cover"
									/>
								</div>
								<div>
									<div className="text-white">
										{i.name} {i.size ? `(${i.size})` : ""}
									</div>
									<div className="text-xs text-zinc-400">× {i.quantity}</div>
								</div>
							</div>
							<span className="text-white">{i.price * i.quantity} Kč</span>
						</li>
					))}
				</ul>
				<div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
					<span className="text-sm text-zinc-300">Celkem</span>
					<span className="text-lg font-semibold text-white">{total()} Kč</span>
				</div>
				<div className="mt-4 flex items-center justify-end">
					<button onClick={() => setStep(2)} className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
						Pokračovat
					</button>
				</div>
			</div>
			)}
			{/* Step 2: Údaje */}
			{step === 2 && (
			<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
				<p className="mb-4 text-white">Údaje o zákazníkovi</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Jméno" value={cust.firstName} onChange={(e) => setCust((c) => ({ ...c, firstName: e.target.value }))} />
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Příjmení" value={cust.lastName} onChange={(e) => setCust((c) => ({ ...c, lastName: e.target.value }))} />
					<input type="email" className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="E‑mail" value={cust.email} onChange={(e) => setCust((c) => ({ ...c, email: e.target.value }))} />
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Telefon" value={cust.phone} onChange={(e) => setCust((c) => ({ ...c, phone: e.target.value }))} />
				</div>
				<p className="mt-4 mb-2 text-sm text-zinc-300">Fakturační adresa</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Ulice a č.p." value={billing.street} onChange={(e) => setBilling((a) => ({ ...a, street: e.target.value }))} />
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Město" value={billing.city} onChange={(e) => setBilling((a) => ({ ...a, city: e.target.value }))} />
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="PSČ" value={billing.zip} onChange={(e) => setBilling((a) => ({ ...a, zip: e.target.value }))} />
					<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Země" value={billing.country} onChange={(e) => setBilling((a) => ({ ...a, country: e.target.value }))} />
				</div>
				<div className="mt-4 flex items-center justify-between">
					<button onClick={() => setStep(1)} className="rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Zpět</button>
					<button onClick={() => setStep(3)} className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Pokračovat</button>
				</div>
			</div>
			)}
			{/* Step 3: Doprava */}
			{step === 3 && (
			<div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
				<p className="mb-4 text-white">Doprava</p>
				<div className="mb-3 flex gap-4 text-sm text-zinc-300">
					<label className="flex items-center gap-2">
						<input type="radio" checked={shippingMethod === "zasilkovna"} onChange={() => setShipping("zasilkovna")} />
						Zásilkovna (výdejní místo)
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" checked={shippingMethod === "address"} onChange={() => setShipping("address")} />
						Doručení na adresu
					</label>
				</div>
				{shippingMethod === "zasilkovna" ? (
					<>
						<div className="text-sm text-zinc-300">
							<button type="button" onClick={openPacketa} disabled={!packetaReady} className={`rounded border border-white/15 px-2 py-1 text-xs text-white ${packetaReady ? "hover:bg-white/10" : "opacity-60"}`}>
								{packetaReady ? "Vybrat výdejní místo" : "Načítám widget…"}
							</button>
						</div>
						{packetaMsg ? <p className="mt-2 text-xs text-amber-300">{packetaMsg}</p> : null}
						{packeta ? (
							<div className="mt-2 rounded border border-white/10 bg-black p-2 text-xs text-zinc-300">
								<b className="text-white">{packeta.name}</b>
								{packeta.street ? <> — {packeta.street}</> : null}
								{packeta.city ? <> , {packeta.city}</> : null}
								{packeta.zip ? <> {packeta.zip}</> : null}
							</div>
						) : null}
					</>
				) : (
					<>
						<label className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
							<input type="checkbox" checked={ship.sameAsBilling} onChange={(e) => {
								const v = e.target.checked;
								setShip((s) => ({ ...s, sameAsBilling: v, ...(v ? { street: billing.street, city: billing.city, zip: billing.zip, country: billing.country } : {}) }));
							}} />
							Stejná jako fakturační
						</label>
						<div className="grid gap-3 sm:grid-cols-2">
							<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Ulice a č.p." value={ship.sameAsBilling ? billing.street : ship.street} onChange={(e) => setShip((s) => ({ ...s, street: e.target.value }))} disabled={ship.sameAsBilling} />
							<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Město" value={ship.sameAsBilling ? billing.city : ship.city} onChange={(e) => setShip((s) => ({ ...s, city: e.target.value }))} disabled={ship.sameAsBilling} />
							<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="PSČ" value={ship.sameAsBilling ? billing.zip : ship.zip} onChange={(e) => setShip((s) => ({ ...s, zip: e.target.value }))} disabled={ship.sameAsBilling} />
							<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Země" value={ship.sameAsBilling ? billing.country : ship.country} onChange={(e) => setShip((s) => ({ ...s, country: e.target.value }))} disabled={ship.sameAsBilling} />
						</div>
					</>
				)}
				<div className="mt-4 flex items-center justify-between">
					<button onClick={() => setStep(2)} className="rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Zpět</button>
					<button onClick={() => setStep(4)} className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Pokračovat</button>
				</div>
			</div>
			)}
			{/* Step 4: Platba */}
			{step === 4 && (
			<div className="mt-6 rounded-lg border border-white/10 bg-zinc-900 p-6">
				<p className="mb-4 text-white">Platba</p>
				{total() < 10 ? (
					<p className="mb-4 text-sm text-amber-300">
						Minimální částka pro online platbu je 10 Kč. Přidej položky do košíku, nebo použij 100% slevový kód.
					</p>
				) : null}
				{discount?.percent === 100 ? (
					<button disabled={submitting} onClick={() => placeOrder()} className="mt-4 w-full rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70">
						Dokončit (100% sleva)
					</button>
				) : (
					clientSecret && stripePromise && (
						<Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
							<StripeForm
								onPaid={async (pi) => placeOrder({ stripePaymentId: pi })}
								canPay={
									!!cust.email &&
									!!cust.firstName &&
									!!cust.lastName &&
									!!cust.phone &&
									(shippingMethod !== "zasilkovna" || !!packeta) &&
									total() >= 10
								}
							/>
						</Elements>
					)
				)}
				<div className="mt-4 flex items-center justify-between">
					<button onClick={() => setStep(3)} className="rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Zpět</button>
				</div>
			</div>
			)}
		</div>
	);
}


