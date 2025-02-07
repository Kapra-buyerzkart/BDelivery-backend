const admin = require("firebase-admin");

const isLocal = process.env.NODE_ENV !== "production";
const serviceAccount = isLocal
    ? require("../../serviceAccountKey-dev.json")  // Local Firestore
    : require("../../serviceAccountKey.json");     // Production Firestore

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;
