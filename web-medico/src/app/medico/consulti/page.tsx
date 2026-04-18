"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cartellaClinicaApi } from "@/lib/api-cartella-clinica";
import type { PermessoCondivisione } from "@/types/cartella-clinica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { Calendar, FileText, User } from "lucide-react";

export default function MedicoConsultiPage() {
  const { data: pazienti, isLoading, error } = useQuery<any[]>({
    queryKey: ["medico-consulti-permessi"],
    queryFn: () => cartellaClinicaApi.getPermessiMedico(),
    retry: false, // Don't retry on 404
  });

  const consulti = useMemo(() => {
    if (!pazienti || error) return [];
    
    // Transform patient data to consultation format
    return pazienti.map((paziente) => ({
      id: paziente.id,
      pazienteId: paziente.id,
      paziente: {
        id: paziente.id,
        nome: paziente.nome,
        cognome: paziente.cognome,
        codiceFiscale: paziente.codiceFiscale,
      },
      dataInizio: paziente.createdAt,
      note: `Consulto per paziente ${paziente.nome} ${paziente.cognome}`,
      livelloAccesso: 'lettura',
    }));
  }, [pazienti, error]);

  if (isLoading) {
    return <Loading />;
  }

  // Handle API error gracefully
  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Consulti pazienti</h1>
          <p className="text-sm text-gray-600">
            Richieste attive con accesso in sola lettura alla documentazione.
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600">
                Il servizio consulti non è al momento disponibile.
              </div>
              <div className="text-xs text-gray-500">
                Errore: Endpoint non trovato. Contattare l'amministratore di sistema.
              </div>
              <Link href="/medico/pazienti">
                <Button size="sm" variant="outline">
                  Vai alla lista pazienti
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Consulti pazienti</h1>
        <p className="text-sm text-gray-600">
          Richieste attive con accesso in sola lettura alla documentazione.
        </p>
      </div>

      {consulti.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
            Nessuna richiesta di consulto attiva al momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consulti.map((consulto) => (
            <Card key={consulto.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {consulto.paziente
                      ? `${consulto.paziente.nome} ${consulto.paziente.cognome}`
                      : `Paziente #${consulto.pazienteId}`}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Paziente dal{" "}
                      {format(new Date(consulto.dataInizio), "dd MMM yyyy", { locale: it })}
                    </span>
                    {consulto.paziente?.codiceFiscale && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        CF: {consulto.paziente.codiceFiscale}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline">Paziente</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm text-gray-600">
                {consulto.note && (
                  <p className="rounded-md bg-gray-50 p-3">{consulto.note}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link href={`/medico/consulti/${consulto.pazienteId}`}>
                    <Button size="sm">Apri cartella</Button>
                  </Link>
                  <Link href="/medico/pazienti">
                    <Button size="sm" variant="ghost">
                      Vai a pazienti
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
