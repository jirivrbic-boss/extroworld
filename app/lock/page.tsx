'use client';

import { useEffect, useMemo, useState } from 'react';
import NewsletterForm from '@/components/NewsletterForm';

const UNLOCK_AT = Date.UTC(2025, 11, 8, 0, 0, 0); // 8. 12. 2025 00:00:00 UTC

function formatTime(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return { d, h, m, s };
}

export default function LockPage() {
  const [now, setNow] = useState<number>(Date.now());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rest = useMemo(() => {
    const diff = UNLOCK_AT - now;
    return formatTime(diff);
  }, [now]);

  const tryUnlock = async () => {
    setMsg(null);
    setUnlocking(true);
    try {
      const res = await fetch('/api/lock/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Přihlášení selhalo.');
      }
      // refresh pro načtení cookie
      window.location.href = '/';
    } catch (e: any) {
      setMsg(e?.message || 'Přihlášení selhalo.');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Schovej globální navigaci a zápatí pouze na lock stránce */}
      <style jsx global>{`
        nav, footer { display: none !important; }
      `}</style>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-10">
        <img
          src="/media/logo extroworld 3d.gif"
          alt="EXTROWORLD"
          className="mb-6 h-16 w-auto"
        />
        <h1 className="mb-4 text-center text-3xl font-extrabold tracking-wide md:text-5xl">
          VÍTÁ VÁS EXTROWORLD
        </h1>
        <div className="mb-8 grid w-full grid-cols-4 gap-3 text-center">
          <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="text-3xl font-bold">{rest.d.toString().padStart(2, '0')}</div>
            <div className="text-xs text-zinc-400">DNŮ</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="text-3xl font-bold">{rest.h.toString().padStart(2, '0')}</div>
            <div className="text-xs text-zinc-400">HODIN</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="text-3xl font-bold">{rest.m.toString().padStart(2, '0')}</div>
            <div className="text-xs text-zinc-400">MINUT</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="text-3xl font-bold">{rest.s.toString().padStart(2, '0')}</div>
            <div className="text-xs text-zinc-400">SEKUND</div>
          </div>
        </div>

        <div className="mb-8 w-full rounded-lg border border-white/10 bg-zinc-900 p-6">
          <p className="mb-3 text-center text-sm text-zinc-300">
            Přihlašte se do newsletteru a budete o všem vědět jako první
          </p>
          <NewsletterForm />
        </div>

        <div className="w-full rounded-lg border border-white/10 bg-zinc-900 p-6">
          <p className="mb-3 text-center text-sm text-zinc-300">Pro přístup zadejte admin údaje</p>
          <div className="grid gap-3">
            <input
              className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              placeholder="Admin e‑mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              placeholder="Heslo"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={tryUnlock}
              disabled={unlocking}
              className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              Odemknout web
            </button>
            {msg ? <p className="text-center text-sm text-red-400">{msg}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}


