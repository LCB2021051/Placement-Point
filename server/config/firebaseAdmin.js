const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const possiblePaths = [
  path.join(__dirname, "serviceAccountKey.json"),
  "/etc/secrets/serviceAccountKey.json",
];

const filePath = possiblePaths.find((p) => fs.existsSync(p));
if (!filePath) throw new Error("serviceAccountKey.json not found");
const serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "placement-point-33d88.firebasestorage.app",
});

const bucket = admin.storage().bucket();

module.exports = { bucket, admin };
