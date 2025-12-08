'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

type Invoice = {
  id: string;
  invoiceNumber?: string;
  customerName?: string;
  priceTotal: number;
  status: string;
  createdAt?: any;
};

export default function AdminInvoicesPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [qText, setQText] = useState("");

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
      const arr: Invoice[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        // Zobraz faktury vždy, pokud je zaplaceno NEBO je 100% sleva NEBO máme vygenerované číslo faktury
        const show =
          (data.status === "paid") ||
          (Number(data.discountPercent) === 100) ||
          Boolean(data.invoiceNumber);
        if (!show) return;
        arr.push({
          id: d.id,
          invoiceNumber: data.invoiceNumber,
          customerName: data.customerName || `${data?.customer?.firstName ?? ""} ${data?.customer?.lastName ?? ""}`.trim(),
          priceTotal: data.priceTotal,
          status: data.status,
          createdAt: data.createdAt
        });
      });
      setList(arr);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return list;
    return list.filter((i) => {
      const num = (i.invoiceNumber || i.id || "").toLowerCase();
      const name = (i.customerName || "").toLowerCase();
      return num.includes(t) || name.includes(t);
    });
  }, [list, qText]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-white">Faktury</h1>
      <div className="mb-4 flex items-center gap-3">
        <input
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          placeholder="Hledat podle čísla faktury nebo jména"
          className="w-full max-w-sm rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
        <button onClick={load} className="rounded border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10">
          Obnovit
        </button>
      </div>
      <div className="rounded border border-white/10 bg-zinc-900 p-4 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-zinc-400">Načítám…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-400">Žádné faktury.</p>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-zinc-400">
              <tr>
                <th className="py-2">Číslo faktury</th>
                <th className="py-2">Zákazník</th>
                <th className="py-2">Celkem</th>
                <th className="py-2">Datum</th>
                <th className="py-2">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="py-2">{o.invoiceNumber || o.id}</td>
                  <td className="py-2">{o.customerName || "—"}</td>
                  <td className="py-2">{o.priceTotal} Kč</td>
                  <td className="py-2">
                    {o.createdAt?.toDate ? new Date(o.createdAt.toDate()).toLocaleString("cs-CZ") : "—"}
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/order/${o.id}/invoice`}
                      className="rounded border border-white/15 px-2 py-1 text-xs text-white hover:bg-white/10"
                    >
                      Zobrazit / stáhnout
                    </Link>
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


