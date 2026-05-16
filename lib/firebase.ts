import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAMjygol3x6h8P_xT_yzKk7g58zH62-m1M",
    authDomain: "securikey-37c88.firebaseapp.com",
    projectId: "securikey-37c88",
    storageBucket: "securikey-37c88.firebasestorage.app",
    messagingSenderId: "304504111914",
    appId: "1:304504111914:web:eba11ca93e4f299a801453",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);