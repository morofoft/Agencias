import { auth } from "./firebase/firebase.init.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔐 PROTEGER RUTA
export function requireAuth(redirect = "login.html") {

  onAuthStateChanged(auth, (user) => {

    if (!user) {
      window.location.href = redirect;
    }

  });

}

// 👑 SOLO ADMIN
export function requireAdmin(adminUser = "admin@app.com") {

  onAuthStateChanged(auth, (user) => {

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (user.email !== adminUser) {
      window.location.href = "index.html";
    }

  });

}