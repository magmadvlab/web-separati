'use client';

import { CalendarioMedCal } from '@/components/calendario/CalendarioMedCal';

export default function CalendarioFarmaciaPage() {
  return (
    <CalendarioMedCal
      ruolo="farmacia"
      apiBasePath="/farmacia/calendario"
      titolo="Gestione Orari Farmacia"
    />
  );
}
