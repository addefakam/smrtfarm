/**
 * Firebase integration with graceful fallback to mock/local state.
 *
 * When NEXT_PUBLIC_FIREBASE_* env vars are set, this module initializes
 * a real Firebase app and writes to Firebase RTDB / Firestore.
 *
 * When env vars are NOT set (e.g. local dev, Z.ai preview without
 * credentials), this module returns null and the calling code falls
 * back to localStorage-backed mock state. This lets the dashboard
 * work end-to-end in any environment, with real Firebase only kicking
 * in when configured.
 *
 * Production setup (Render):
 *   1. Create Firebase project at https://console.firebase.google.com
 *   2. Add a web app, copy the config object
 *   3. Set these env vars in Render → Environment:
 *        NEXT_PUBLIC_FIREBASE_API_KEY
 *        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *        NEXT_PUBLIC_FIREBASE_DATABASE_URL
 *        NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *        NEXT_PUBLIC_FIREBASE_APP_ID
 *   4. Re-deploy — this module auto-detects the env vars and initializes Firebase.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True iff every required Firebase env var is set. */
export const isFirebaseConfigured = (): boolean =>
  Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId
  );

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

/**
 * Returns the Firebase Database instance, or null when not configured.
 * Callers MUST check the return value before using.
 */
export function getFirebaseDB(): Database | null {
  if (!isFirebaseConfigured()) return null;
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
    _db = getDatabase(_app);
  }
  return _db;
}

/**
 * Connection status badge text for the UI.
 * Lets the dashboard surface whether real Firebase is connected or mock fallback is active.
 */
export function firebaseStatusText(): string {
  return isFirebaseConfigured() ? "Firebase RTDB · live" : "Mock mode (configure Firebase)";
}
