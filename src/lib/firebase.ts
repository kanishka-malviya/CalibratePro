import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localConfig from '@/firebase-applet-config.json';

/**
 * Firebase Config Sourcing Logic:
 * 1. Check if VITE_FIREBASE_API_KEY is present and not a placeholder.
 * 2. If present, use environment variables for EVERYTHING (to ensure consistency).
 * 3. If absent, fallback to the local firebase-applet-config.json.
 */

const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isEnvActive = typeof envKey === 'string' && envKey.trim() !== '' && !['undefined', 'null', '""', "''"].includes(envKey.trim());

const firebaseConfig = isEnvActive ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
} : localConfig;

// Diagnostic Logging
if (process.env.NODE_ENV !== 'production') {
  console.group('Firebase Configuration');
  console.log(`Source: ${isEnvActive ? 'Environment Variables' : 'local-config.json'}`);
  console.log(`Project: ${firebaseConfig.projectId}`);
  if (firebaseConfig.apiKey) {
    console.log(`Key: ${firebaseConfig.apiKey.substring(0, 6)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}`);
  } else {
    console.warn('API Key is missing!');
  }
  console.groupEnd();
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// --- Error Handling Guidelines Implementation ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified');
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
       console.log('Firestore connection active (but test path restricted)');
       return;
    }
    if(error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('api-key-not-valid'))) {
      console.error("Please check your Firebase configuration: " + error.message);
    }
  }
}

testConnection();
