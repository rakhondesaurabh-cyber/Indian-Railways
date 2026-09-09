import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Default Firebase configuration using Vite environment variables with graceful fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForIndianRailwaysDevMode01",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "indian-railways-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "indian-railways-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "indian-railways-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100200300400",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100200300400:web:abcdef123456"
};

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization warning (falling back to hybrid local auth):", error);
  app = getApps().length > 0 ? getApp() : ({} as FirebaseApp);
}

export { app, auth, db };
