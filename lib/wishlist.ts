import { auth, db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc } from "firebase/firestore";

const wishlistCol = (uid: string) => collection(db, "users", uid, "wishlist");

export async function addToWishlist(productId: string) {
	const u = auth.currentUser;
	if (!u) throw new Error("Nejste přihlášen.");
	const ref = doc(db, "users", u.uid, "wishlist", productId);
	await setDoc(ref, { productId, createdAt: serverTimestamp() }, { merge: true });
}

export async function removeFromWishlist(productId: string) {
	const u = auth.currentUser;
	if (!u) throw new Error("Nejste přihlášen.");
	const ref = doc(db, "users", u.uid, "wishlist", productId);
	await deleteDoc(ref);
}

export async function isInWishlist(productId: string): Promise<boolean> {
	const u = auth.currentUser;
	if (!u) return false;
	const ref = doc(db, "users", u.uid, "wishlist", productId);
	const snap = await getDoc(ref);
	return snap.exists();
}

export async function getWishlistProductIds(uid: string): Promise<string[]> {
	const snap = await getDocs(wishlistCol(uid));
	const ids: string[] = [];
	snap.forEach((d) => ids.push((d.data() as any).productId ?? d.id));
	return ids;
}


