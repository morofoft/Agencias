// js/clean-firebase.js
// Script para limpiar agencias en Firebase que no comienzan con 812

import { db } from "./firebase/firebase.init.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAllAgencies } from './agencies/agencies.store.js';

/**
 * Elimina de Firebase las agencias cuyo idReal no comienza con 812
 * @param {boolean} dryRun - Si es true, solo muestra qué se eliminaría
 */
export async function cleanFirebaseInvalidAgencies(dryRun = true) {
  console.log('🧹 Iniciando limpieza de Firebase...');
  console.log(`Modo: ${dryRun ? 'SIMULACIÓN' : 'EJECUCIÓN REAL'}`);
  
  try {
    // Obtener todas las agencias de Firebase
    const agenciesRef = collection(db, "agencias");
    const snapshot = await getDocs(agenciesRef);
    
    const invalidAgencies = [];
    const validAgencies = [];
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const idReal = data.idReal || data.id_nuevo || '';
      
      if (!idReal.toString().startsWith('812')) {
        invalidAgencies.push({
          id: docSnap.id,
          idReal: idReal,
          data: data
        });
      } else {
        validAgencies.push({
          id: docSnap.id,
          idReal: idReal
        });
      }
    });
    
    console.log(`\n📊 Estadísticas Firebase:`);
    console.log(`   - Total agencias: ${snapshot.size}`);
    console.log(`   - Válidas (812*): ${validAgencies.length}`);
    console.log(`   - Inválidas: ${invalidAgencies.length}`);
    
    if (invalidAgencies.length > 0) {
      console.log(`\n⚠️ Agencias a eliminar:`);
      invalidAgencies.forEach(agency => {
        console.log(`   - ID: ${agency.idReal || 'sin ID'} | FirebaseID: ${agency.id}`);
      });
    }
    
    if (!dryRun && invalidAgencies.length > 0) {
      console.log(`\n🚀 Eliminando ${invalidAgencies.length} agencias...`);
      let deleted = 0;
      let errors = 0;
      
      for (const agency of invalidAgencies) {
        try {
          await deleteDoc(doc(db, "agencias", agency.id));
          deleted++;
          console.log(`   ✅ Eliminada: ${agency.idReal || 'sin ID'}`);
        } catch (err) {
          errors++;
          console.error(`   ❌ Error eliminando ${agency.idReal}:`, err);
        }
      }
      
      console.log(`\n✅ Eliminación completada:`);
      console.log(`   - Eliminadas: ${deleted}`);
      console.log(`   - Errores: ${errors}`);
      
      // También limpiar caché local
      if (typeof agenciesCache !== 'undefined') {
        agenciesCache = null;
      }
    } else if (dryRun) {
      console.log(`\n📝 Modo simulación - No se eliminó nada`);
      console.log(`   Para ejecutar: cleanFirebaseInvalidAgencies(false)`);
    }
    
    return { valid: validAgencies.length, invalid: invalidAgencies.length, invalidList: invalidAgencies };
    
  } catch (err) {
    console.error('❌ Error en limpieza:', err);
    throw err;
  }
}

// Exponer función global para usar en consola
window.cleanFirebaseInvalidAgencies = cleanFirebaseInvalidAgencies;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🔥 Script de limpieza de Firebase cargado                   ║
╠══════════════════════════════════════════════════════════════╣
║  Comandos:                                                   ║
║  🔍 SIMULACIÓN: await cleanFirebaseInvalidAgencies(true)    ║
║  🚀 EJECUTAR:   await cleanFirebaseInvalidAgencies(false)   ║
╚══════════════════════════════════════════════════════════════╝
`);