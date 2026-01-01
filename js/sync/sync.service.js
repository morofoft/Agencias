import db from '../db/db.js';
import { firestore } from './firebase.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function syncNow() {
  if (!navigator.onLine) return;

  const dbConn = await db;
  const queue = await dbConn.getAll('sync_queue');

  for (const item of queue) {
    const ref = doc(firestore, item.entity, item.payload.id);
    await setDoc(ref, item.payload, { merge: true });

    await dbConn.delete('sync_queue', item.id);
  }
}
