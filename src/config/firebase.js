// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA0BBrvVfbg13i5BDyFgS4_IapoHYhbEks",
  authDomain: "cableworktracker.firebaseapp.com",
  projectId: "cableworktracker",
  storageBucket: "cableworktracker.appspot.com",
  messagingSenderId: "363803214900",
  appId: "1:363803214900:web:d65d39ec958a31e7533661"
};

// Admin UID constant
export const ADMIN_UID = "6suqqzr9j8gCUqEAHk4jEA1x1AA2";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
