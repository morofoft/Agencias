// js/clean-agencies.js
// Script para limpiar agencias duplicadas y filtrar IDs inválidos

import { getAllAgencies, deleteAgency, updateAgency } from './agencies/agencies.store.js';

/**
 * Limpia agencias duplicadas y elimina IDs que no comiencen con 812
 * @param {boolean} dryRun - Si es true, solo muestra qué se eliminaría sin ejecutar
 * @returns {Promise<object>} Estadísticas de la limpieza
 */
export async function cleanAgencies(dryRun = true) {
  console.log('🧹 Iniciando limpieza de agencias...');
  console.log(`Modo: ${dryRun ? 'SIMULACIÓN (solo vista previa)' : 'EJECUCIÓN REAL'}`);
  
  const agencies = await getAllAgencies();
  console.log(`📋 Total agencias encontradas: ${agencies.length}`);
  
  const stats = {
    total: agencies.length,
    invalidFormat: [],
    duplicates: [],
    kept: [],
    toDelete: []
  };
  
  // 1. IDENTIFICAR IDs con formato inválido (no empiezan con 812)
  const invalidFormat = agencies.filter(a => {
    const idReal = String(a.idReal || '');
    // Verificar que comience con 812 y tenga al menos 7 dígitos
    return !idReal.startsWith('812') || idReal.length < 7;
  });
  
  stats.invalidFormat = invalidFormat;
  console.log(`\n⚠️ IDs con formato inválido (no empiezan con 812): ${invalidFormat.length}`);
  invalidFormat.forEach(a => {
    console.log(`   - ${a.idReal} | Zona: ${a.zona} | Dirección: ${a.direccion?.substring(0, 50)}`);
  });
  
  // 2. IDENTIFICAR DUPLICADOS (por idReal)
  const seen = new Map();
  const duplicates = [];
  
  agencies.forEach(agency => {
    const idReal = agency.idReal;
    if (seen.has(idReal)) {
      duplicates.push({
        original: seen.get(idReal),
        duplicate: agency
      });
    } else {
      seen.set(idReal, agency);
    }
  });
  
  stats.duplicates = duplicates;
  console.log(`\n🔄 Duplicados encontrados: ${duplicates.length}`);
  duplicates.forEach(({ original, duplicate }) => {
    console.log(`   - ID: ${original.idReal}`);
    console.log(`     Original: ${original.id} | Creado: ${new Date(original.created_at).toLocaleDateString()}`);
    console.log(`     Duplicado: ${duplicate.id} | Creado: ${new Date(duplicate.created_at).toLocaleDateString()}`);
  });
  
  // 3. DECIDIR QUÉ ELIMINAR
  // Para duplicados: mantener el más reciente o el que tiene coordenadas
  const toDelete = [];
  
  for (const { original, duplicate } of duplicates) {
    // Priorizar el que tiene coordenadas GPS
    const originalHasCoords = original.lat && original.lng;
    const duplicateHasCoords = duplicate.lat && duplicate.lng;
    
    let keep, remove;
    
    if (originalHasCoords && !duplicateHasCoords) {
      keep = original;
      remove = duplicate;
    } else if (!originalHasCoords && duplicateHasCoords) {
      keep = duplicate;
      remove = original;
    } else {
      // Si ambos tienen o no tienen coordenadas, mantener el más reciente
      const originalDate = original.updated_at || original.created_at || 0;
      const duplicateDate = duplicate.updated_at || duplicate.created_at || 0;
      
      if (duplicateDate > originalDate) {
        keep = duplicate;
        remove = original;
      } else {
        keep = original;
        remove = duplicate;
      }
    }
    
    toDelete.push(remove);
    console.log(`   - Conservando: ${keep.idReal} (${keep.id})`);
    console.log(`   - Eliminando: ${remove.idReal} (${remove.id})`);
  }
  
  // Agregar los de formato inválido a la lista de eliminación
  toDelete.push(...invalidFormat);
  
  stats.toDelete = toDelete;
  stats.kept = agencies.filter(a => !toDelete.includes(a));
  
  console.log(`\n📊 Resumen:`);
  console.log(`   - Conservar: ${stats.kept.length} agencias`);
  console.log(`   - Eliminar: ${stats.toDelete.length} agencias`);
  
  // 4. EJECUTAR LIMPIEZA (si no es dryRun)
  if (!dryRun) {
    console.log('\n🚀 Ejecutando limpieza...');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const agency of toDelete) {
      try {
        await deleteAgency(agency.id, false); // Hard delete
        deletedCount++;
        console.log(`   ✅ Eliminada: ${agency.idReal} (${agency.id})`);
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error eliminando ${agency.idReal}:`, error);
      }
    }
    
    console.log(`\n✅ Limpieza completada:`);
    console.log(`   - Eliminadas: ${deletedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    console.log(`   - Restantes: ${stats.kept.length}`);
    
    // Limpiar caché
    if (typeof agenciesCache !== 'undefined') {
      agenciesCache = null;
    }
    
    return { ...stats, executed: true, deletedCount, errorCount };
  } else {
    console.log('\n📝 Modo simulación - No se eliminó nada');
    console.log('Para ejecutar la limpieza, llama a cleanAgencies(false)');
    
    return { ...stats, executed: false };
  }
}

/**
 * Limpia agencias que no tienen coordenadas GPS (opcional)
 * @param {boolean} dryRun - Simulación o ejecución real
 */
export async function cleanAgenciesWithoutGPS(dryRun = true) {
  console.log('🧹 Limpiando agencias sin GPS...');
  
  const agencies = await getAllAgencies();
  const withoutGPS = agencies.filter(a => !a.lat || !a.lng);
  
  console.log(`📋 Agencias sin GPS: ${withoutGPS.length}`);
  
  if (!dryRun) {
    let deleted = 0;
    for (const agency of withoutGPS) {
      await deleteAgency(agency.id, false);
      deleted++;
    }
    console.log(`✅ Eliminadas ${deleted} agencias sin GPS`);
    return { deleted };
  } else {
    console.log(`📝 Simulación: se eliminarían ${withoutGPS.length} agencias`);
    withoutGPS.forEach(a => console.log(`   - ${a.idReal}`));
    return { wouldDelete: withoutGPS.length };
  }
}

/**
 * Corrige el formato de IDs (añade prefijo 812 si falta)
 * @param {boolean} dryRun - Simulación o ejecución real
 */
export async function fixAgencyIds(dryRun = true) {
  console.log('🔧 Corrigiendo formato de IDs...');
  
  const agencies = await getAllAgencies();
  let fixed = 0;
  
  for (const agency of agencies) {
    const idReal = String(agency.idReal || '');
    
    // Si no empieza con 812 pero es numérico, añadir prefijo
    if (!idReal.startsWith('812') && /^\d+$/.test(idReal)) {
      const newId = '812' + idReal;
      console.log(`   - Corrigiendo: ${idReal} → ${newId}`);
      
      if (!dryRun) {
        agency.idReal = newId;
        agency.id_nuevo = newId;
        agency.updated_at = Date.now();
        await updateAgency(agency);
        fixed++;
      }
    }
  }
  
  console.log(`\n📊 IDs corregidos: ${fixed}`);
  return { fixed };
}

// EXPORTAR FUNCIONES PARA USO EN CONSOLA
window.cleanAgencies = cleanAgencies;
window.cleanAgenciesWithoutGPS = cleanAgenciesWithoutGPS;
window.fixAgencyIds = fixAgencyIds;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🧹 Script de limpieza de agencias cargado                   ║
╠══════════════════════════════════════════════════════════════╣
║  Comandos disponibles:                                       ║
║                                                              ║
║  🔍 SIMULACIÓN (recomendado primero):                        ║
║     await cleanAgencies(true)                                ║
║                                                              ║
║  🚀 EJECUCIÓN REAL:                                          ║
║     await cleanAgencies(false)                               ║
║                                                              ║
║  📍 Limpiar solo agencias sin GPS:                           ║
║     await cleanAgenciesWithoutGPS(true)   // simular         ║
║     await cleanAgenciesWithoutGPS(false)  // ejecutar        ║
║                                                              ║
║  🔧 Corregir formato de IDs:                                 ║
║     await fixAgencyIds(true)   // simular                    ║
║     await fixAgencyIds(false)  // ejecutar                   ║
╚══════════════════════════════════════════════════════════════╝
`);