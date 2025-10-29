
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

function getFirebaseAdmin() {
  if (getApps().length) {
    return {
      app: getApp(),
      database: getDatabase(),
    };
  }

  if (!serviceAccount) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT environment variable is not set. Cannot initialize Firebase Admin SDK.'
    );
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return {
    app,
    database: getDatabase(app),
  };
}

export { getFirebaseAdmin };
