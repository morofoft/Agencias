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
    
      console.log("Sincronizado:", docRef.id);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success", // success, error, warning, info
        title: "Datos sincronizadoso",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

    }

  } catch (err) {

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error", // success, error, warning, info
      title: "Error sincronizando",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
    

    console.error("Error sincronizando:",err);

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
      toast: true,
      position: "top-end",
      icon: "success", // success, error, warning, info
      title: "Datos descargados desde Firebase",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });

  }catch(err){
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error", // success, error, warning, info
      title: "Error leyendo Firebase",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });

    console.error("Error leyendo Firebase:",err);

  }

}