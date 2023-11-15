import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9Ui4i6AUb-O7NYqJhIIETXmbhb7odmsE",
  authDomain: "spotifygenerator-c5520.firebaseapp.com",
  projectId: "spotifygenerator-c5520",
  storageBucket: "spotifygenerator-c5520.appspot.com",
  messagingSenderId: "577116984831",
  appId: "1:577116984831:web:ae0211f9c1f653dee7c3ca",
  measurementId: "G-X4RQFXYYEB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, app, analytics };
