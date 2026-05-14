// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
// Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDKzivam1EzXAM4G_sQ-1rnHb4Ek_P-dr8",
  authDomain: "meeting-app-32db7.firebaseapp.com",
  projectId: "meeting-app-32db7",
  storageBucket: "meeting-app-32db7.firebasestorage.app",
  messagingSenderId: "169696177636",
  appId: "1:169696177636:web:0a64034ba4e80e3361ebf1"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;


