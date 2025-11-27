"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export default function AdminAuth() {
	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			try {
				if (!auth.currentUser && !cancelled) {
					await signInAnonymously(auth);
				}
			} catch {
				// no-op: chybu již ukazujeme na konkrétních stránkách
			}
		};
		run();
		return () => {
			cancelled = true;
		};
	}, []);
	return null;
}


