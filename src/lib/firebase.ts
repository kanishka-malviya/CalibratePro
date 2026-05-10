import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localConfig from '../../firebase-applet-config.json';

// Use environment variables if available (prefixed with VITE_ for client-side)
// Otherwise fallback to the local config file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
import { doc, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified');
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
       // This is expected if the test collection is locked
       console.log('Firestore connection active (but test path restricted)');
       return;
    }
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
