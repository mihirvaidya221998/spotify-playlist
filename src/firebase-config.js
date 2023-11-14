import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKgBGymKESw8HLzxMJzDvq5qB3qpHb8Qc",
  authDomain: "spotify-7bf86.firebaseapp.com",
  projectId: "spotify-7bf86",
  storageBucket: "spotify-7bf86.appspot.com",
  messagingSenderId: "638875676979",
  appId: "1:638875676979:web:b2e362850950b4436bce46",
  measurementId: "G-JWSV7MY08B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, app, analytics };
