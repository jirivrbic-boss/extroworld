"use client";

import { useState } from "react";

export default function SeedTestOrder({
  defaultUid,
}: {
  defaultUid?: string;
}) {
  const [uid, setUid] = useState<string>(defaultUid || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const run = async () => {
    setMsg(null);
    setOrderId(null);
    if (!uid.trim()) {
      setMsg("Vyplň UID uživatele.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seed-test-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: uid.trim(), priceTotal: 149, name: "Test objednávka" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Chyba při vytváření.");
      }
      setOrderId(data.orderId);
      setMsg("Testovací objednávka vytvořena.");
    } catch (e: any) {
      setMsg(e?.message || "Chyba.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
      <p className="mb-2 text-white">Vložit testovací objednávku</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
          placeholder="UID uživatele (např. lnNd2J1n…)"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />
        <button
          onClick={run}
          disabled={busy}
          className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
        >
          Vložit objednávku
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-zinc-300">{msg}</p> : null}
      {orderId ? (
        <p className="mt-2 text-sm">
          ID: <a className="underline hover:text-white" href={`/order/${orderId}`} target="_blank" rel="noreferrer">{orderId}</a>
        </p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">
        Pozn.: Akce vyžaduje přihlášení do adminu (cookie extro_admin=1).
      </p>
    </div>
  );
}


