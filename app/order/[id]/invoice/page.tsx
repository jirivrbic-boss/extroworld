'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function OrderInvoicePage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "orders", params.id);
      const snap = await getDoc(ref);
      setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) return <div className="p-6 text-zinc-400">Generuji…</div>;
  if (!order) return <div className="p-6 text-zinc-400">Faktura nenalezena.</div>;

  const today = new Date().toLocaleDateString("cs-CZ");

  return (
    <div className="mx-auto max-w-3xl p-6 print:max-w-none print:p-0 bg-white text-black">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faktura</h1>
          <div className="text-sm mt-1">Číslo: {order.id}</div>
          <div className="text-sm">Datum: {today}</div>
        </div>
        <button
          className="print:hidden rounded border px-3 py-2 text-sm"
          onClick={() => window.print()}
        >
          Stáhnout jako PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <div className="font-semibold mb-1">Dodavatel</div>
          <div>EXTROWORLD</div>
          <div>IČ: —</div>
          <div>Adresa: —</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Odběratel</div>
          <div>{order?.customer?.firstName} {order?.customer?.lastName}</div>
          <div>{order?.customer?.email}</div>
          <div>{order?.customer?.phone}</div>
        </div>
      </div>

      <table className="w-full mt-6 border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Položka</th>
            <th className="border p-2 text-right">Množství</th>
            <th className="border p-2 text-right">Cena</th>
          </tr>
        </thead>
        <tbody>
          {order?.items?.map((i: any, idx: number) => (
            <tr key={idx}>
              <td className="border p-2">{i.name}{i.size ? ` (${i.size})` : ''}</td>
              <td className="border p-2 text-right">{i.quantity}</td>
              <td className="border p-2 text-right">{i.price * i.quantity} Kč</td>
            </tr>
          ))}
          <tr>
            <td className="border p-2 text-right font-semibold" colSpan={2}>Celkem</td>
            <td className="border p-2 text-right font-semibold">{order?.priceTotal} Kč</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-sm">
        <div>Způsob úhrady: {order?.stripePaymentId ? 'Karta (Stripe)' : 'Nebylo placeno'}</div>
        <div>Stav: {order?.status}</div>
      </div>
    </div>
  );
}


