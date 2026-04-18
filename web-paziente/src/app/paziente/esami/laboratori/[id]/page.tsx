"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Euro, Truck } from "lucide-react";
import Link from "next/link";
import { PrenotazioneForm } from "@/components/esami/PrenotazioneForm";

interface Laboratorio {
  id: number;
  nome: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  cap: string;
  telefono?: string;
  email?: string;
  convenzionato: boolean;
  servizi: Array<{
    id: number;
    nome: string;
    tipoServizio: string;
    tipoPagamento: string;
    prezzoBase?: number;
    prezzoConvenzionato?: number;
    consegnabile: boolean;
  }>;
}

export default function DettaglioLaboratorioPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const laboratorioId = parseInt(params.id as string);
  const tipoServizio = searchParams.get("servizio") || "";

  const { data: laboratorio, isLoading } = useQuery<Laboratorio>({
    queryKey: ["laboratorio", laboratorioId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Laboratorio[]>>(`/salute/laboratori?tipoServizio=${tipoServizio}`);
      const laboratori = response.data.data || [];
      const lab = laboratori.find((l) => l.id === laboratorioId);
      if (!lab) throw new Error("Laboratorio non trovato");
      return lab;
    },
    enabled: !!laboratorioId && !!tipoServizio,
  });

  const servizioSelezionato = laboratorio?.servizi.find((s) => s.tipoServizio === tipoServizio);

  if (isLoading) {
    return <Loading />;
  }

  if (!laboratorio) {
    return (
      <div className="space-y-6">
        <p className="text-center text-gray-500">Laboratorio non trovato</p>
        <Link href="/paziente/esami/prenota">
          <Button>Torna alla ricerca</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/paziente/esami/prenota" className="flex items-center text-sm text-gray-500 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Torna alla ricerca
        </Link>
        <h1 className="text-2xl font-bold">{laboratorio.nome}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Informazioni Laboratorio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>
              {laboratorio.indirizzo}, {laboratorio.cap} {laboratorio.citta} ({laboratorio.provincia})
            </span>
          </div>
          {laboratorio.telefono && (
            <div className="flex items-center gap-1 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{laboratorio.telefono}</span>
            </div>
          )}
          {laboratorio.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{laboratorio.email}</span>
            </div>
          )}
          {laboratorio.convenzionato && (
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              Convenzionato SSN
            </span>
          )}
        </CardContent>
      </Card>

      {servizioSelezionato && (
        <Card>
          <CardHeader>
            <CardTitle>Servizio Selezionato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{servizioSelezionato.nome}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="capitalize">{servizioSelezionato.tipoPagamento}</span>
                {servizioSelezionato.tipoPagamento === "privato" && servizioSelezionato.prezzoBase && (
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {Number(servizioSelezionato.prezzoBase).toFixed(2)}
                  </span>
                )}
                {servizioSelezionato.tipoPagamento === "misto" && servizioSelezionato.prezzoConvenzionato && (
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {Number(servizioSelezionato.prezzoConvenzionato).toFixed(2)}
                  </span>
                )}
                {servizioSelezionato.consegnabile && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Truck className="h-3 w-3" />
                    Consegna disponibile
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {servizioSelezionato && (
        <PrenotazioneForm
          laboratorioId={laboratorioId}
          servizioId={servizioSelezionato.id}
          tipoServizio={tipoServizio}
          consegnabile={servizioSelezionato.consegnabile}
        />
      )}
    </div>
  );
}


