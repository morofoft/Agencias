// js/firebase/firebase.init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// CONFIG DE TU PROYECTO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyA9wJ-vgcwG-MJ6gqQz3byolJP6DwrjnVw",
    authDomain: "agencias-v2.firebaseapp.com",
    projectId: "agencias-v2",
    storageBucket: "agencias-v2.firebasestorage.app",
    messagingSenderId: "896099760213",
    appId: "1:896099760213:web:969ffa8363d51c0a8bbcdc"
  };
  

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };