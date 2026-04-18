"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { FileText, Plus, Calendar, Clock, CheckCircle, XCircle, Image as ImageIcon, Pill } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ApiResponse } from "@/types/api";

interface RichiestaPrescrizione {
  id: number;
  tipoRichiesta: string;
  stato: string;
  dataRichiesta: string;
  dataApprovazione?: string;
  farmaciRichiesti: Array<{
    nome: string;
    quantita: number;
    dosaggio?: string;
  }>;
  motivo: string;
  notePaziente?: string;
  noteMedico?: string;
  fotoTalloncinoUrl?: string;
  medico?: {
    nome: string;
    cognome: string;
  };
  prescrizione?: {
    id: number;
    codiceNre: string;
  };
}

export default function RichiestePrescrizionePage() {
  const { data: richieste, isLoading } = useQuery<RichiestaPrescrizione[]>({
    queryKey: ["paziente-richieste-prescrizione"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RichiestaPrescrizione[]>>("/paziente/richieste-prescrizione");
      return response.data.data || [];
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const richiesteInAttesa = richieste?.filter((r) => r.stato === "in_attesa") || [];
  const richiesteApprovate = richieste?.filter((r) => r.stato === "approvata") || [];
  const richiesteRifiutate = richieste?.filter((r) => r.stato === "rifiutata") || [];
  const richiesteCompletate = richieste?.filter((r) => r.stato === "completata") || [];

  const getStatoBadge = (stato: string) => {
    const config = {
      in_attesa: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      approvata: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rifiutata: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      completata: { variant: "outline" as const, icon: CheckCircle, color: "text-gray-600" },
    };

    const { variant, icon: Icon, color } = config[stato as keyof typeof config] || config.in_attesa;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {stato === "in_attesa" ? "In attesa" :
         stato === "approvata" ? "Approvata" :
         stato === "rifiutata" ? "Rifiutata" :
         stato === "completata" ? "Completata" : stato}
      </Badge>
    );
  };

  const getTipoLabel = (tipo: string) => {
    return tipo === "farmaci_da_banco" ? "Farmaci da Banco (OTC)" : "Farmaci con Ricetta";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Le Mie Richieste Prescrizione</h1>
          <p className="text-gray-600 mt-2">
            Gestisci le tue richieste di farmaci con ricetta e da banco
          </p>
        </div>
        <Link href="/paziente/richieste-prescrizione/nuova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Richiesta
          </Button>
        </Link>
      </div>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{richiesteInAttesa.length}</div>
              <div className="text-sm text-gray-600 mt-1">In Attesa</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{richiesteApprovate.length}</div>
              <div className="text-sm text-gray-600 mt-1">Approvate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{richiesteRifiutate.length}</div>
              <div className="text-sm text-gray-600 mt-1">Rifiutate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{richiesteCompletate.length}</div>
              <div className="text-sm text-gray-600 mt-1">Completate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista Richieste */}
      {richieste && richieste.length > 0 ? (
        <div className="space-y-4">
          {richieste.map((richiesta, index) => (
            <motion.div
              key={richiesta.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          Richiesta #{richiesta.id}
                        </CardTitle>
                        {getStatoBadge(richiesta.stato)}
                        <Badge variant="outline" className="text-xs">
                          {getTipoLabel(richiesta.tipoRichiesta)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT")}
                        </div>
                        {richiesta.medico && (
                          <div>
                            Dr. {richiesta.medico.nome} {richiesta.medico.cognome}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Farmaci Richiesti */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Pill className="h-4 w-4 text-green-600" />
                      Farmaci Richiesti
                    </h4>
                    <div className="space-y-2">
                      {richiesta.farmaciRichiesti.map((farmaco, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{farmaco.nome}</span>
                            {farmaco.dosaggio && (
                              <span className="text-sm text-gray-600 ml-2">({farmaco.dosaggio})</span>
                            )}
                          </div>
                          <Badge variant="outline">Qtà: {farmaco.quantita}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivo */}
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Motivo</h4>
                    <p className="text-sm text-gray-700">{richiesta.motivo}</p>
                  </div>

                  {/* Note Paziente */}
                  {richiesta.notePaziente && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Note Paziente</h4>
                      <p className="text-sm text-gray-700">{richiesta.notePaziente}</p>
                    </div>
                  )}

                  {/* Note Medico */}
                  {richiesta.noteMedico && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-sm mb-1 text-blue-900">Risposta Medico</h4>
                      <p className="text-sm text-blue-800">{richiesta.noteMedico}</p>
                    </div>
                  )}

                  {/* Foto Talloncino */}
                  {richiesta.fotoTalloncinoUrl && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-purple-600" />
                        Foto Talloncino
                      </h4>
                      <img
                        src={richiesta.fotoTalloncinoUrl}
                        alt="Talloncino"
                        className="w-full max-w-md h-48 object-contain rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Prescrizione Generata */}
                  {richiesta.prescrizione && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-green-900">Prescrizione Generata</h4>
                          <p className="text-sm text-green-800">
                            Codice NRE: {richiesta.prescrizione.codiceNre}
                          </p>
                        </div>
                        <Link href={`/paziente/prescrizioni/${richiesta.prescrizione.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Visualizza
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Data Approvazione */}
                  {richiesta.dataApprovazione && (
                    <div className="text-xs text-gray-500">
                      {richiesta.stato === "approvata" ? "Approvata" : "Gestita"} il{" "}
                      {new Date(richiesta.dataApprovazione).toLocaleDateString("it-IT")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center mb-4">
              Nessuna richiesta prescrizione
            </p>
            <Link href="/paziente/richieste-prescrizione/nuova">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crea Prima Richiesta
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
