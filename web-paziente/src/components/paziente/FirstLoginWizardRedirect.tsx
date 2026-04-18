"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

interface FirstLoginWizardRedirectProps {
  children: React.ReactNode;
}

export function FirstLoginWizardRedirect({ children }: FirstLoginWizardRedirectProps) {
  const router = useRouter();
  const hasTriggeredRedirect = useRef(false);

  // Verifica se ci sono terapie
  const { data: terapie, isLoading: terapieLoading } = useQuery({
    queryKey: ["paziente-terapie-check"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/terapie");
      return response.data.data || [];
    },
    retry: false,
  });

  // Verifica se ci sono prescrizioni
  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery({
    queryKey: ["paziente-prescrizioni-check"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/prescrizioni");
      return response.data.data || [];
    },
    retry: false,
  });

  // Verifica se ci sono richieste prescrizione (paziente ha già avviato il flusso)
  const { data: richieste, isLoading: richiesteLoading } = useQuery({
    queryKey: ["paziente-richieste-check"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/richieste");
      return response.data.data || [];
    },
    retry: false,
  });

  useEffect(() => {
    if (terapieLoading || prescrizioniLoading || richiesteLoading) return;

    const hasTerapie = (terapie?.length ?? 0) > 0;
    const hasPrescrizioni = (prescrizioni?.length ?? 0) > 0;
    const hasRichieste = (richieste?.length ?? 0) > 0;
    // Il paziente ha già avviato il percorso terapeutico se ha almeno uno tra:
    // terapie, prescrizioni o richieste al medico ancora in lavorazione
    const hasClinicalData = hasTerapie || hasPrescrizioni || hasRichieste;

    if (!hasClinicalData) {
      localStorage.removeItem("terapieWizardCompleted");
      if (hasTriggeredRedirect.current) return;
      hasTriggeredRedirect.current = true;
      setTimeout(() => {
        router.push("/paziente/terapie/wizard");
      }, 1500);
    } else {
      localStorage.setItem("terapieWizardCompleted", "true");
    }
  }, [terapie, prescrizioni, richieste, terapieLoading, prescrizioniLoading, richiesteLoading, router]);

  return <>{children}</>;
}
