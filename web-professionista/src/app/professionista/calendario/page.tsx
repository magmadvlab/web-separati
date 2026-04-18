'use client';

import { CalendarioMedCal } from '@/components/calendario/CalendarioMedCal';

export default function CalendarioProfessionistaPage() {
  return (
    <CalendarioMedCal
      ruolo="professionista"
      apiBasePath="professionista/calendario"
      titolo="Calendario Appuntamenti - Professionista Sanitario"
    />
  );
}
