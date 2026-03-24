import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnNpnANYs5fVyM4SzuRwwjc7gxHXUwymE",
  authDomain: "ganadera-mp.firebaseapp.com",
  projectId: "ganadera-mp",
  storageBucket: "ganadera-mp.firebasestorage.app",
  messagingSenderId: "769007302942",
  appId: "1:769007302942:web:f4538e55d75524c3abf10f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
