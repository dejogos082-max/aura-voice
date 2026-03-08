import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDXoc1itS49-IWyEw3sPGvffih9a87wfZk",
  authDomain: "lost-company-7a093.firebaseapp.com",
  databaseURL: "https://lost-company-7a093-default-rtdb.firebaseio.com",
  projectId: "lost-company-7a093",
  storageBucket: "lost-company-7a093.appspot.com",
  messagingSenderId: "206928845773",
  appId: "1:206928845773:web:0f9a989aec79c2154b8284",
  measurementId: "G-XB9HNQ77J1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
