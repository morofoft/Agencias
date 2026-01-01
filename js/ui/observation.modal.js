export function openObservation(agency) {
    const obs = prompt(`Observación para ${agency.name}`);
    if (!obs) return;
  
    agency.observation = obs;
  }
  