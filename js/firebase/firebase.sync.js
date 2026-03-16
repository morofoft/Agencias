// js/firebase/firebase.sync.js

import { db } from "./firebase.init.js";

import {
  collection,
  addDoc,
  getDocs

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAllPendingAgencies, markAgencySynced } from "../db/agencies.db.js";

export async function syncAgencies() {

  if (!navigator.onLine) return;

  try {

    const agencias = await getAllPendingAgencies();

    for (const agencia of agencias) {

      const docRef = await addDoc(
        collection(db, "agencias"),
        agencia
      );

      await markAgencySynced(agencia.id);
      alert("Sincronizado");
      console.log("Sincronizado:", docRef.id);
      Swal.fire({
        icon: 'success',
        title: 'Sincronizacion',
        text: 'Datos sincronizados',
        timer: 3000,
        showConfirmButton: false
      });

    }

  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error sincronizando',
      text: err,
      timer: 3000,
      showConfirmButton: false
    });

  }

}

import { saveAgency } from "../db/agencies.db.js";

export async function syncFromFirebase(){

  try{

    const snapshot = await getDocs(
      collection(db,"agencias")
    );

    for(const doc of snapshot.docs){

      const agencia = doc.data();

      await saveAgency({
        ...agencia,
        synced:true
      });

    }
    Swal.fire({
      icon: 'success',
      title: 'Sincronizacion',
      text: 'Datos descargados desde Firebase',
      timer: 3000,
      showConfirmButton: false
    });

  }catch(err){

    console.error("Error leyendo Firebase:",err);

  }

}