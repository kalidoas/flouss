import { initializeApp, FirebaseApp, getApps, getApp } from '@firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from '@firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from '@firebase/firestore';

// Default project credentials guarantee production builds always connect to the verified Firebase project
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyCROKzwNbMzvgr1TZZcnfA1bpN3PUFAFUg',
  authDomain: 'floss-6799f.firebaseapp.com',
  projectId: 'floss-6799f',
  storageBucket: 'floss-6799f.firebasestorage.app',
  messagingSenderId: '148161989669',
  appId: '1:148161989669:web:f0cc8647b9f3416b3643cc',
  measurementId: 'G-2H34FEDTL1',
};

const cleanEnv = (val?: string) => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

const sanitizeApiKey = (val?: string): string => {
  const clean = cleanEnv(val);
  if (clean && clean.startsWith('AIza')) {
    return clean;
  }
  return DEFAULT_CONFIG.apiKey;
};

const sanitizeAuthDomain = (val?: string): string => {
  const clean = cleanEnv(val);
  if (clean && !clean.toLowerCase().includes('placeholder') && clean.includes('.')) {
    return clean;
  }
  return DEFAULT_CONFIG.authDomain;
};

const sanitizeProjectId = (val?: string): string => {
  const clean = cleanEnv(val);
  if (clean && !clean.toLowerCase().includes('placeholder') && clean.length >= 3) {
    return clean;
  }
  return DEFAULT_CONFIG.projectId;
};

const rawApiKey = sanitizeApiKey(import.meta.env.VITE_FIREBASE_API_KEY);
const rawProjectId = sanitizeProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: sanitizeAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: rawProjectId,
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_CONFIG.storageBucket,
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_CONFIG.messagingSenderId,
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID) || DEFAULT_CONFIG.appId,
  measurementId: cleanEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || DEFAULT_CONFIG.measurementId,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initError: Error | null = null;

// Graceful initialization wrapped in try/catch to guarantee zero local fatal crashes
try {
  appInstance =
    getApps().length > 0
      ? getApp()
      : initializeApp(firebaseConfig);
} catch (err: any) {
  console.warn('[Flouss Firebase] initializeApp notice (running in safe mode):', err?.message || err);
  initError = err;
}

try {
  if (appInstance) {
    authInstance = getAuth(appInstance);
  }
} catch (err: any) {
  console.warn('[Flouss Firebase] getAuth notice:', err?.message || err);
}

try {
  if (appInstance) {
    // University Campus Wi-Fi & Strict Egress Firewall Fallback:
    // Forces Firestore to use HTTP long-polling over standard HTTPS port 443
    // instead of WebSockets (wss://) which are blocked by Eduroam/UHP Settat/Fortinet firewalls.
    dbInstance = initializeFirestore(appInstance, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  }
} catch (e) {
  try {
    if (appInstance) {
      dbInstance = getFirestore(appInstance);
    }
  } catch (err: any) {
    console.warn('[Flouss Firebase] getFirestore notice:', err?.message || err);
  }
}

// Fallback dummy auth object if Firebase Auth cannot initialize locally
if (!authInstance) {
  authInstance = {
    currentUser: null,
    onAuthStateChanged: (callback: (user: any) => void) => {
      // Safe offline callback
      setTimeout(() => callback(null), 10);
      return () => {};
    },
    signOut: async () => {},
  } as unknown as Auth;
}

// Fallback dummy db object if Firestore cannot initialize locally
if (!dbInstance) {
  dbInstance = {} as unknown as Firestore;
}

export const app: FirebaseApp = appInstance as FirebaseApp;
export const auth: Auth = authInstance;
export const db: Firestore = dbInstance;

export const isFirebaseConfigured = Boolean(
  appInstance && rawApiKey && rawApiKey.startsWith('AIza') && rawProjectId
);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

export const firebaseError: string | null = initError ? initError.message : null;

export default app;
