import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderForMissingNetlifyEnvVar',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'floss-6799f.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'floss-6799f',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'floss-6799f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '148161989669',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:148161989669:web:f0cc8647b9f3416b3643cc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-2H34FEDTL1',
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseError: string | null = null;

export default app;
