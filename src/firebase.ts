import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const cleanEnv = (val?: string) => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const rawApiKey = cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const rawProjectId = cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: rawProjectId,
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: cleanEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
};

export const isFirebaseConfigured = Boolean(
  rawApiKey && rawApiKey.startsWith('AIza') && rawProjectId
);

export const app: FirebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        isFirebaseConfigured
          ? firebaseConfig
          : {
              apiKey: 'placeholder-api-key',
              authDomain: 'placeholder.firebaseapp.com',
              projectId: 'placeholder-project',
            }
      );

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseError: string | null = null;

export default app;
