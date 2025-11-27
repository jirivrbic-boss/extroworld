import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase config provided by the user (public client SDK keys)
const firebaseConfig = {
	apiKey: "AIzaSyCSu74EcShP98yuYfBhsnoMXqSH5SyxW_o",
	authDomain: "extroworld-ac96d.firebaseapp.com",
	projectId: "extroworld-ac96d",
	storageBucket: "extroworld-ac96d.appspot.com",
	messagingSenderId: "1085538458166",
	appId: "1:1085538458166:web:abc8f4276e37e466841697",
	measurementId: "G-61WWDTK3T2"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
	app = initializeApp(firebaseConfig);
} else {
	app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, auth, db, storage };


