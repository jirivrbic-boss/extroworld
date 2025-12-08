'use client';

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COMPANY } from "@/lib/company";

export default function OrderInvoicePage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const search = useSearchParams();

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "orders", params.id);
      const snap = await getDoc(ref);
      setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    };
    load();
  }, [params.id]);

  // Pokud je požadavek se ?print=1, po načtení faktury automaticky otevři tisk (pro stažení do PDF)
  useEffect(() => {
    if (!order) return;
    if (search?.get("print") === "1") {
      setTimeout(() => {
        try {
          window.print();
        } catch {}
      }, 100);
    }
  }, [order, search]);

  if (loading) return <div className="p-6 text-zinc-400">Generuji…</div>;
  if (!order) return <div className="p-6 text-zinc-400">Faktura nenalezena.</div>;

  const issued = order?.createdAt?.toDate ? order.createdAt.toDate() : new Date();
  const issuedDate = new Date(issued).toLocaleDateString("cs-CZ");

  return (
    <div className="mx-auto max-w-3xl p-6 print:max-w-none print:p-0 bg-white text-black">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faktura</h1>
          <div className="text-sm mt-1">Číslo: {order.invoiceNumber || order.id}</div>
          <div className="text-sm">Datum vystavení: {issuedDate}</div>
        </div>
        <button
          className="print:hidden w-full rounded border px-3 py-2 text-sm sm:w-auto"
          onClick={() => window.print()}
        >
          Stáhnout jako PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <div className="font-semibold mb-1">Dodavatel</div>
          <div>{COMPANY.brand} — {COMPANY.name}</div>
          <div>IČ: {COMPANY.ico}</div>
          <div>{COMPANY.addressLine1}</div>
          <div>{COMPANY.addressLine2}</div>
          <div>{COMPANY.email}</div>
          <div>{COMPANY.phone}</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Odběratel</div>
          <div>{order?.customer?.firstName} {order?.customer?.lastName}</div>
          <div>{order?.customer?.email}</div>
          <div>{order?.customer?.phone}</div>
          {order?.billingAddress ? (
            <div className="mt-1">
              <div>{order.billingAddress.street}</div>
              <div>{order.billingAddress.zip} {order.billingAddress.city}</div>
              <div>{order.billingAddress.country}</div>
            </div>
          ) : null}
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
        <div>Způsob úhrady: {order?.stripePaymentId ? 'Karta (Stripe)' : (order?.status === 'paid' ? '100% sleva' : '—')}</div>
        <div>Stav: {order?.status}</div>
      </div>
    </div>
  );
}


