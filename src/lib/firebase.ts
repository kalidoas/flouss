import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCROkZwNbMzvgr1TZZcnfA1bpN3PUFAFug",
  authDomain: "floss-6799f.firebaseapp.com",
  projectId: "floss-6799f",
  storageBucket: "floss-6799f.firebasestorage.app",
  messagingSenderId: "148161989669",
  appId: "1:148161989669:web:f0cc8647b9f3416b3643cc",
  measurementId: "G-2H34FEDTL1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
