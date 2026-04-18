"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse, Terapia } from "@/types/api";
import { Plus, Pill, FileText, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TerapiePage() {
  const router = useRouter();

  const { data: terapie, isLoading } = useQuery<Terapia[]>({
    queryKey: ["paziente-terapie-reminder"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia[]>>("/paziente/terapie/reminder");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Le Mie Terapie</h1>
            <p className="text-gray-600 mt-1">
              Gestisci le tue terapie e i farmaci in corso
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/paziente/terapie/wizard">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Wizard guidato
            </Button>
          </Link>
          <Link href="/paziente/terapie/nuova">
            <Button variant="outline">Inserimento manuale</Button>
          </Link>
        </div>
      </div>

      {terapie && terapie.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terapie.map((terapia) => {
            // Calcola progressi
            const quantitaTotale = terapia.quantitaTotale || 0;
            const quantitaRimanente = terapia.quantitaRimanente || 0;
            const compresseAssunte = Math.max(0, quantitaTotale - quantitaRimanente);
            const percentualeCompletamento = quantitaTotale > 0 
              ? Math.round((compresseAssunte / quantitaTotale) * 100) 
              : 0;
            const percentualeRimanente = 100 - percentualeCompletamento;
            
            // Determina se terapia è vicina alla fine
            const isVicinaAllaFine = percentualeRimanente <= 20 && quantitaTotale > 0;
            
            // Determina colore card in base allo stato
            const getCardBorderColor = () => {
              if (isVicinaAllaFine && percentualeRimanente <= 10) return "border-red-300";
              if (isVicinaAllaFine) return "border-orange-300";
              return "";
            };

            return (
              <Card
                key={terapia.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${getCardBorderColor()} ${
                  isVicinaAllaFine ? "bg-orange-50/50" : ""
                }`}
                onClick={() => router.push(`/paziente/terapie/${terapia.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">
                        {terapia.farmaco?.nomeCommerciale || "Terapia"}
                      </CardTitle>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {terapia.farmaco?.ricettaRichiesta ? (
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                          <FileText className="h-3 w-3 inline mr-1" />
                          Ricetta
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          OTC
                        </span>
                      )}
                      {quantitaTotale > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            isVicinaAllaFine && percentualeRimanente <= 10
                              ? "bg-red-50 text-red-800 border-red-200"
                              : isVicinaAllaFine
                              ? "bg-orange-50 text-orange-800 border-orange-200"
                              : "bg-green-50 text-green-800 border-green-200"
                          }`}
                        >
                          {percentualeCompletamento}% completata
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {terapia.posologia && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Posologia:</span> {terapia.posologia}
                      </p>
                    )}
                    
                    {/* Barra di progresso */}
                    {quantitaTotale > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>
                            {compresseAssunte} / {quantitaTotale} compresse
                          </span>
                          <span className="font-medium">{percentualeCompletamento}%</span>
                        </div>
                        <Progress 
                          value={percentualeCompletamento} 
                          className={`h-2 ${
                            isVicinaAllaFine && percentualeRimanente <= 10
                              ? "[&>div]:bg-red-500"
                              : isVicinaAllaFine
                              ? "[&>div]:bg-orange-500"
                              : "[&>div]:bg-blue-500"
                          }`}
                        />
                      </div>
                    )}
                    
                    {terapia.giorniRimanenti !== undefined && (
                      <p className={`text-sm font-bold ${
                        terapia.statoReminder === 'critical' ? 'text-red-600' :
                        terapia.statoReminder === 'warning' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {terapia.giorniRimanenti > 0 
                          ? `${terapia.giorniRimanenti} giorni rimanenti`
                          : 'Scaduta'
                        }
                      </p>
                    )}
                    
                    {isVicinaAllaFine && (
                      <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                        <AlertCircle className="h-3 w-3" />
                        <span>
                          {percentualeRimanente <= 10 
                            ? "Terapia quasi finita" 
                            : "Terapia in esaurimento"
                          }
                        </span>
                      </div>
                    )}
                    
                    {terapia.messaggioReminder && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {terapia.messaggioReminder}
                      </p>
                    )}
                    {terapia.richiestaRinnovoInCorso && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-medium text-blue-800">
                          ✓ Richiesta rinnovo inviata al medico
                        </p>
                      </div>
                    )}
                    {terapia.azioneRichiesta === 'rinnovo' && !terapia.richiestaRinnovoInCorso && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/paziente/terapie/${terapia.id}`);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Richiedi Rinnovo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Nessuna terapia attiva</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/paziente/terapie/wizard">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Wizard guidato (consigliato)
                </Button>
              </Link>
              <Link href="/paziente/terapie/nuova">
                <Button variant="outline">Inserimento manuale</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
