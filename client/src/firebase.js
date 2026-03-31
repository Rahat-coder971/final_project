import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC9Uc_8RxohdjSvuqjFZFKfhsV5zWflupE",
  authDomain: "signup-47171.firebaseapp.com",
  projectId: "signup-47171",
  storageBucket: "signup-47171.firebasestorage.app",
  messagingSenderId: "661794661703",
  appId: "1:661794661703:web:15d4acb4ad7f59026f9862",
  measurementId: "G-1JR7SWE844"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
