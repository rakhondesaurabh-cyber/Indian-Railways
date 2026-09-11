import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

// Production Firebase Configuration for Indian Railways RailOpt AI
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAI8NFHDbgIvbI6xQiEXy6eJ_TmFdCe4uo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rail-ai-bcbeb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rail-ai-bcbeb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rail-ai-bcbeb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "175591054433",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:175591054433:web:7b7cc45f5fd3252b67de20",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TZ5WX0B7CF"
};

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize Analytics conditionally if supported in environment
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch((err) => {
      console.warn("Firebase analytics not supported in this environment:", err);
    });
  }
} catch (error) {
  console.warn("Firebase initialization warning (falling back to hybrid local state):", error);
  app = getApps().length > 0 ? getApp() : ({} as FirebaseApp);
}

export { app, auth, db, analytics };
