"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		const res = await fetch("/api/admin/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password })
		});
		if (res.ok) {
			router.push("/admin");
			router.refresh();
		} else {
			setError("Neplatné přihlašovací údaje.");
		}
	};

	return (
		<div className="mx-auto max-w-sm px-4 py-10">
			<h1 className="mb-4 text-2xl font-semibold text-white">Admin přihlášení</h1>
			<form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-zinc-900 p-6">
				<div className="grid gap-3">
					<input
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						placeholder="Uživatelské jméno"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
					<input
						type="password"
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						placeholder="Heslo"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				{error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
				<button type="submit" className="mt-4 w-full rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
					Přihlásit se
				</button>
			</form>
		</div>
	);
}


