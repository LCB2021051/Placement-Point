// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API,
  authDomain: "placement-point-33d88.firebaseapp.com",
  projectId: "placement-point-33d88",
  storageBucket: "placement-point-33d88.firebasestorage.app",
  messagingSenderId: "309398785222",
  appId: "1:309398785222:web:94b0986c22a6045a341bc7",
  measurementId: "G-LVX06SK2TZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
