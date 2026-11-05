declare module '@firebase/app' {
  export type FirebaseApp = any;
  export const initializeApp: any;
  export const getApps: any;
  export const getApp: any;
}

declare module '@firebase/auth' {
  export type Auth = any;
  export type User = any;
  export const getAuth: any;
  export const GoogleAuthProvider: any;
  export const onAuthStateChanged: any;
  export const signInWithPopup: any;
  export const signInWithRedirect: any;
  export const getRedirectResult: any;
  export const sendSignInLinkToEmail: any;
  export const isSignInWithEmailLink: any;
  export const signInWithEmailLink: any;
}

declare module '@firebase/firestore' {
  export type Firestore = any;
  export type Unsubscribe = () => void;
  export const initializeFirestore: any;
  export const getFirestore: any;
  export const doc: any;
  export const getDoc: any;
  export const setDoc: any;
  export const onSnapshot: any;
  export const runTransaction: any;
  export const serverTimestamp: any;
}
