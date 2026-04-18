'use client';

import { CalendarioMedCal } from '@/components/calendario/CalendarioMedCal';

export default function CalendarioFornitorePage() {
  return (
    <CalendarioMedCal
      ruolo="fornitore"
      apiBasePath="fornitore/calendario"
      titolo="Calendario Consegne - Fornitore"
    />
  );
}
