import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API,
  authDomain: "placement-point-33d88.firebaseapp.com",
  projectId: "placement-point-33d88",
  storageBucket: "placement-point-33d88.appspot.com",
  messagingSenderId: "309398785222",
  appId: "1:309398785222:web:94b0986c22a6045a341bc7",
  measurementId: "G-LVX06SK2TZ",
};

console.log(process.env.REACT_APP_FIREBASE_API);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
