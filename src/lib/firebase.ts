"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: browserLocalPersistence });
} catch {
  auth = getAuth(app);
}

export { auth };
export const googleProvider = new GoogleAuthProvider();
