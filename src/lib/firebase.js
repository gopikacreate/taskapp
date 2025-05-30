// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
   apiKey: "AIzaSyClsHWKhTqIM8rpyqhiqnd0H5b_nagYh-A",
  authDomain: "taskduelapp.firebaseapp.com",
  projectId: "taskduelapp",
  storageBucket: "taskduelapp.firebasestorage.app",
//   storageBucket: "taskduelapp.appspot.com",

  messagingSenderId: "108453152851",
  appId: "1:108453152851:web:de796cbdec356ca38f9ea6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
