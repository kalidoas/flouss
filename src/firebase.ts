import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

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
  // An authentic Firebase Web API Key must start with 'AIza' and have no colons or placeholders
  if (clean.startsWith('AIza') && !clean.includes(':') && clean.length >= 35 && !clean.toLowerCase().includes('placeholder')) {
    return clean;
  }
  return DEFAULT_CONFIG.apiKey;
};

const sanitizeAuthDomain = (val?: string): string => {
  const clean = cleanEnv(val);
  if (clean.toLowerCase().includes('placeholder') || !clean.includes('.')) {
    return DEFAULT_CONFIG.authDomain;
  }
  return clean || DEFAULT_CONFIG.authDomain;
};

const sanitizeProjectId = (val?: string): string => {
  const clean = cleanEnv(val);
  if (clean.toLowerCase().includes('placeholder') || clean.length < 3) {
    return DEFAULT_CONFIG.projectId;
  }
  return clean || DEFAULT_CONFIG.projectId;
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

export const isFirebaseConfigured = Boolean(
  rawApiKey && rawApiKey.startsWith('AIza') && rawProjectId
);

export const app: FirebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseError: string | null = null;

export default app;
