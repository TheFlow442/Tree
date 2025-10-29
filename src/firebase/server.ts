
import admin from 'firebase-admin';

// This is the correct way to get the service account in this environment.
// The FIREBASE_CONFIG environment variable is automatically populated.
const serviceAccount = process.env.FIREBASE_CONFIG
  ? JSON.parse(process.env.FIREBASE_CONFIG)
  : undefined;

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return {
      app: admin.app(),
      database: admin.database(),
    };
  }
  
  if (!serviceAccount) {
    throw new Error('FIREBASE_CONFIG environment variable not found. Cannot initialize Firebase Admin SDK.');
  }

  // Use the project ID from the automatically populated environment variables
  const projectId = serviceAccount.projectId;
  if (!projectId) {
     throw new Error('Project ID not found in FIREBASE_CONFIG.');
  }
  
  const databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;

  const app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: databaseURL,
  });

  return {
    app,
    database: admin.database(app),
  };
}

export { getFirebaseAdmin };
