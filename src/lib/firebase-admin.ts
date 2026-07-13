import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App | null = null;
let authInstance: Auth | null = null;

function getApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error(
          "Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.local"
        );
      }

      // Normalize the private key: handle \n literals, extra quotes, whitespace
      const normalizedKey = privateKey
        .replace(/^"|"$/g, "")          // strip wrapping quotes
        .replace(/\\n/g, "\n")          // convert literal \n to real newlines
        .replace(/\r/g, "")             // strip any \r
        .trim();

      // Validate PEM format
      if (!normalizedKey.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error(
          "FIREBASE_PRIVATE_KEY does not appear to be a valid PEM private key. " +
          "Ensure it starts with -----BEGIN PRIVATE KEY-----"
        );
      }

      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizedKey,
        }),
      });
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getAdminAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getApp());
  }
  return authInstance;
}
