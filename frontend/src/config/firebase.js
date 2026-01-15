// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIhX2BbVgIFEVYereoDgkmakGcoYPUp4Y",
  authDomain: "yatrasathi-6d594.firebaseapp.com",
  projectId: "yatrasathi-6d594",
  storageBucket: "yatrasathi-6d594.firebasestorage.app",
  messagingSenderId: "618422906773",
  appId: "1:618422906773:web:b03c731950d04de2ec109c",
  measurementId: "G-42TVH1YY35"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, analytics };