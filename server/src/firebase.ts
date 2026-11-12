import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Request } from 'express';

export function getFirebaseAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saEnv) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT runtime environment variable is not configured');
  }

  let serviceAccount: any;
  try {
    if (saEnv.trim().startsWith('{')) {
      serviceAccount = JSON.parse(saEnv);
    } else {
      const decoded = Buffer.from(saEnv, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
  } catch (err: any) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${err?.message}`);
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export async function verifyAuthHeader(req: Request): Promise<{ uid: string; email: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    const error: any = new Error('Missing or invalid Authorization header');
    error.status = 401;
    throw error;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    const error: any = new Error('Missing bearer token');
    error.status = 401;
    throw error;
  }

  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email || '',
  };
}
