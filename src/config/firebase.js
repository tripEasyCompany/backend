// firebase.js
const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
}

try{
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}catch (err){
  throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
}

const bucket = admin.storage().bucket();

module.exports = bucket;
