'use client';

import { CalendarioMedCal } from '@/components/calendario/CalendarioMedCal';

export default function CalendarioLaboratorioPage() {
  return (
    <CalendarioMedCal
      ruolo="laboratorio"
      apiBasePath="laboratorio/calendario"
      titolo="Calendario Prenotazioni - Laboratorio"
    />
  );
}
