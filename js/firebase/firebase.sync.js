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

    }

  } catch (err) {

    console.error("Error sincronizando:", err);

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

    console.log("Datos descargados desde Firebase");

  }catch(err){

    console.error("Error leyendo Firebase:",err);

  }

}