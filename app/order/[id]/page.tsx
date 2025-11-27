'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

type Order = {
  id: string;
  userId: string;
  items: { productId: string; name: string; size?: string; quantity: number; price: number }[];
  priceTotal: number;
  status: string;
  shipping?: {
    method?: string;
    packeta?: { id?: string; name?: string; street?: string; city?: string; zip?: string } | null;
  };
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  createdAt?: any;
  stripePaymentId?: string | null;
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "orders", params.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          setOrder({ id: snap.id, ...data } as Order);
        } else {
          setOrder(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return <div className="mx-auto max-width-3xl px-4 py-10 text-zinc-400">Načítám…</div>;
  }
  if (!order) {
    return <div className="mx-auto max-width-3xl px-4 py-10 text-zinc-400">Objednávka nebyla nalezena.</div>;
  }

  const paid = (search.get('paid') === '1') || order.status === 'paid';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-white">Objednávka #{order.id}</h1>
      <p className={`mb-6 text-sm ${paid ? 'text-emerald-400' : 'text-amber-300'}`}>
        Stav: {paid ? 'Zaplaceno' : 'Čeká na platbu'}
      </p>

      <div className="mb-6 rounded border border-white/10 bg-zinc-900 p-4">
        <p className="mb-2 text-white">Položky</p>
        <ul className="space-y-2">
          {order.items?.map((i, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm text-zinc-300">
              <span>{i.name}{i.size ? ` (${i.size})` : ''} × {i.quantity}</span>
              <span>{i.price * i.quantity} Kč</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-sm text-zinc-400">Celkem</span>
          <span className="text-white font-semibold">{order.priceTotal} Kč</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border border-white/10 bg-zinc-900 p-4">
          <p className="mb-2 text-white">Zákazník</p>
          <p className="text-sm text-zinc-300">{order.customer?.firstName} {order.customer?.lastName}</p>
          <p className="text-sm text-zinc-300">{order.customer?.email}</p>
          <p className="text-sm text-zinc-300">{order.customer?.phone}</p>
        </div>
        <div className="rounded border border-white/10 bg-zinc-900 p-4">
          <p className="mb-2 text-white">Doprava</p>
          {order.shipping?.method === 'zasilkovna' ? (
            <p className="text-sm text-zinc-300">Zásilkovna — {order.shipping?.packeta?.name} {order.shipping?.packeta?.street ? `, ${order.shipping?.packeta?.street}` : ''} {order.shipping?.packeta?.city ? `, ${order.shipping?.packeta?.city}` : ''} {order.shipping?.packeta?.zip}</p>
          ) : (
            <p className="text-sm text-zinc-300">Doručení na adresu</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/order/${order.id}/invoice`} className="rounded border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10">
          Zobrazit / stáhnout fakturu
        </Link>
        <Link href="/account" className="text-sm text-zinc-300 underline hover:text-white">Zpět na účet</Link>
      </div>
    </div>
  );
}


