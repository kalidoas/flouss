/**
 * Flouss Firebase Configuration & Universal Campus Wi-Fi Network Fallback
 * 
 * Strict Egress Firewall Hardening (Eduroam / UHP Settat / Fortinet / Palo Alto):
 * Campus enterprise networks block non-standard ports (3000, 8080, etc.) and drop
 * WebSocket (wss://) connections during deep packet inspection.
 * 
 * We explicitly initialize Firestore with `experimentalForceLongPolling: true`
 * to force HTTPS long-polling over standard Port 443, guaranteeing uninterrupted
 * cloud sync and instant page load on restricted networks.
 */

import { app, auth, db, googleProvider, isFirebaseConfigured, firebaseError } from '../firebase';

export { app, auth, db, googleProvider, isFirebaseConfigured, firebaseError };
export default db;
