import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localConfig from '@/firebase-applet-config.json';

/**
 * Firebase Config Sourcing Logic:
 * 1. Prioritize environment variables (VITE_ prefixed).
 * 2. Fallback to localConfig for any missing values.
 * 3. Treat placeholders as "missing".
 */

const isPlaceholder = (val: string | undefined) => 
  !val || ['undefined', 'null', '""', "''", 'PLACEHOLDER', 'REPLACE_ME'].includes(val.trim());

const getFirebaseValue = (envKey: string, configValue: string | undefined): string => {
  const envValue = import.meta.env[envKey];
  if (typeof envValue === 'string' && !isPlaceholder(envValue)) {
    return envValue.trim();
  }
  return configValue || '';
};

const firebaseConfig = {
  apiKey: getFirebaseValue('VITE_FIREBASE_API_KEY', localConfig.apiKey),
  authDomain: getFirebaseValue('VITE_FIREBASE_AUTH_DOMAIN', localConfig.authDomain),
  projectId: getFirebaseValue('VITE_FIREBASE_PROJECT_ID', localConfig.projectId),
  storageBucket: getFirebaseValue('VITE_FIREBASE_STORAGE_BUCKET', localConfig.storageBucket),
  messagingSenderId: getFirebaseValue('VITE_FIREBASE_MESSAGING_SENDER_ID', localConfig.messagingSenderId),
  appId: getFirebaseValue('VITE_FIREBASE_APP_ID', localConfig.appId),
  measurementId: getFirebaseValue('VITE_FIREBASE_MEASUREMENT_ID', localConfig.measurementId),
  firestoreDatabaseId: getFirebaseValue('VITE_FIREBASE_DATABASE_ID', localConfig.firestoreDatabaseId),
};

// Diagnostic Logging
if (process.env.NODE_ENV !== 'production') {
  console.group('Firebase Configuration');
  console.log(`Project: ${firebaseConfig.projectId}`);
  if (!isPlaceholder(firebaseConfig.apiKey)) {
    console.log(`API Key: ${firebaseConfig.apiKey.substring(0, 6)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}`);
  } else {
    console.warn('API Key is missing or placeholder!');
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
