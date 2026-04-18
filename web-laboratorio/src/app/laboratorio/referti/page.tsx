"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { FileText, Calendar, User, Eye, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Referto {
  id: number;
  tipoReferto: string;
  titolo: string;
  stato: string;
  validato: boolean;
  urgente: boolean;
  valoriCritici: boolean;
  createdAt: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
  };
  prenotazione: {
    id: number;
    codicePrenotazione: string;
    servizio: {
      nome: string;
      categoria: string;
    };
  };
}

const statiBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  bozza: { label: "Bozza", variant: "outline" },
  validato: { label: "Validato", variant: "default" },
  consegnato: { label: "Consegnato", variant: "secondary" },
  archiviato: { label: "Archiviato", variant: "secondary" },
};

export default function RefertiPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [filtroStato, setFiltroStato] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroDataInizio, setFiltroDataInizio] = useState("");
  const [filtroDataFine, setFiltroDataFine] = useState("");

  const { data: referti, isLoading } = useQuery<Referto[]>({
    queryKey: ["referti-laboratorio", filtroStato, filtroTipo, filtroDataInizio, filtroDataFine],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroStato && filtroStato !== "all") params.append("stato", filtroStato);
      if (filtroTipo && filtroTipo !== "all") params.append("tipoReferto", filtroTipo);
      if (filtroDataInizio) params.append("dataInizio", filtroDataInizio);
      if (filtroDataFine) params.append("dataFine", filtroDataFine);

      const response = await api.get<ApiResponse<Referto[]>>(
        `/laboratori/dashboard/referti?${params.toString()}`
      );
      return response.data.data || [];
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent p-6 border border-purple-500/20"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Referti
            </h1>
            <p className="text-gray-600 mt-2">Referti caricati e inviati ai pazienti</p>
          </div>
        </div>
      </motion.div>

      {/* Filtri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Filtri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="stato">Stato</Label>
                <Select value={filtroStato} onValueChange={setFiltroStato}>
                  <SelectTrigger id="stato">
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="bozza">Bozza</SelectItem>
                    <SelectItem value="validato">Validato</SelectItem>
                    <SelectItem value="consegnato">Consegnato</SelectItem>
                    <SelectItem value="archiviato">Archiviato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo Referto</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Tutti i tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="analisi">Analisi</SelectItem>
                    <SelectItem value="radiologia">Radiologia</SelectItem>
                    <SelectItem value="ecografia">Ecografia</SelectItem>
                    <SelectItem value="diagnostica">Diagnostica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInizio">Data Inizio</Label>
                <Input
                  id="dataInizio"
                  type="date"
                  value={filtroDataInizio}
                  onChange={(e) => setFiltroDataInizio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFine">Data Fine</Label>
                <Input
                  id="dataFine"
                  type="date"
                  value={filtroDataFine}
                  onChange={(e) => setFiltroDataFine(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista Referti */}
      {referti && referti.length > 0 ? (
        <div className="space-y-4">
          {referti.map((referto, index) => {
            const statoBadge = statiBadge[referto.stato] || { label: referto.stato, variant: "default" };
            const dataCreazione = new Date(referto.createdAt);

            return (
              <motion.div
                key={referto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{referto.titolo}</h3>
                          <Badge variant={statoBadge.variant}>{statoBadge.label}</Badge>
                          {referto.urgente && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Urgente
                            </Badge>
                          )}
                          {referto.valoriCritici && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Valori Critici
                            </Badge>
                          )}
                          {referto.validato && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Validato
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>
                                {referto.paziente.nome} {referto.paziente.cognome}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>CF: {referto.paziente.codiceFiscale}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Tipo: {referto.tipoReferto}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{dataCreazione.toLocaleDateString("it-IT")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Servizio: {referto.prenotazione.servizio.nome}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Prenotazione: {referto.prenotazione.codicePrenotazione}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/laboratorio/referti/${referto.id}`)}
                          className="hover-lift"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Dettagli
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-500 font-medium">Nessun referto trovato</p>
                  <p className="text-sm text-gray-400 mt-1">
                    I referti vengono inviati direttamente dalla pagina Prenotazioni
                  </p>
                </div>
                <Link href="/laboratorio/prenotazioni">
                  <Button className="hover-lift">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Vai alle Prenotazioni
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
