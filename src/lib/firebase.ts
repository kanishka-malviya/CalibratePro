import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localConfig from '../../firebase-applet-config.json';

// Helper to safely get environment variables or fallback
const getEnv = (key: string, fallback: string) => {
  const value = import.meta.env[key];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '' && trimmed !== '""' && trimmed !== "''" && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', localConfig.apiKey),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', localConfig.authDomain),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', localConfig.projectId),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', localConfig.storageBucket),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', localConfig.messagingSenderId),
  appId: getEnv('VITE_FIREBASE_APP_ID', localConfig.appId),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', localConfig.measurementId),
  firestoreDatabaseId: getEnv('VITE_FIREBASE_DATABASE_ID', localConfig.firestoreDatabaseId),
};

// Debug log (Safe: only shows first/last 4 chars of API key to verify source)
console.log(`Firebase Initializing... [Project: ${firebaseConfig.projectId}]`);
if (firebaseConfig.apiKey) {
  const keyMatch = firebaseConfig.apiKey === localConfig.apiKey ? 'local' : 'env';
  console.log(`Using ${keyMatch} API Key: ${firebaseConfig.apiKey.substring(0, 4)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}`);
} else {
  console.error("FATAL: Firebase API Key is missing!");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
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
