"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Calendar, TrendingUp, DollarSign, FileText, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Statistiche {
  prenotazioniOggi: number;
  prenotazioniSettimana: number;
  prenotazioniMese: number;
  serviziRichiesti: Array<{
    servizioId: number;
    nome: string;
    count: number;
  }>;
  fatturatoMese: number;
}

export default function LaboratorioDashboard() {
  const { toast } = useToast();

  const { data: statistiche, isLoading, error } = useQuery<Statistiche>({
    queryKey: ["laboratorio-statistiche"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Statistiche>>(
        "/laboratori/dashboard/statistiche"
      );
      return response.data.data;
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Errore",
        description: (error as any)?.response?.data?.error || "Errore nel caricamento delle statistiche",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const { data: prenotazioni, isLoading: prenotazioniLoading } = useQuery<any[]>({
    queryKey: ["prenotazioni-laboratorio-recenti"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(
        "/laboratori/dashboard/prenotazioni?stato=prenotata"
      );
      return response.data.data || [];
    },
  });

  if (isLoading || prenotazioniLoading) {
    return <Loading />;
  }

  const statsCards = [
    {
      title: "Prenotazioni Oggi",
      value: statistiche?.prenotazioniOggi || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/laboratorio/prenotazioni",
    },
    {
      title: "Questa Settimana",
      value: statistiche?.prenotazioniSettimana || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/laboratorio/prenotazioni",
    },
    {
      title: "Questo Mese",
      value: statistiche?.prenotazioniMese || 0,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/laboratorio/statistiche",
    },
    {
      title: "Fatturato Mese",
      value: `€${(statistiche?.fatturatoMese || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/laboratorio/statistiche",
    },
  ];

  const statiBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    prenotata: { label: "Prenotata", variant: "default" },
    confermata: { label: "Confermata", variant: "secondary" },
    completata: { label: "Completata", variant: "secondary" },
    risultato_disponibile: { label: "Risultato Disponibile", variant: "default" },
    cancellata: { label: "Cancellata", variant: "destructive" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden border-b bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent rounded-lg p-6"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Dashboard Laboratorio
          </h1>
          <p className="text-gray-600 mt-2">
            Panoramica delle attività e statistiche del laboratorio
          </p>
        </div>
      </motion.div>

      {/* Statistiche principali */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={stat.link}>
                <Card className="hover-lift cursor-pointer transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Servizi più richiesti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Servizi più Richiesti (Questo Mese)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statistiche?.serviziRichiesti && statistiche.serviziRichiesti.length > 0 ? (
              <div className="space-y-3">
                {statistiche.serviziRichiesti.map((servizio, index) => (
                  <div
                    key={servizio.servizioId}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{servizio.nome}</span>
                    </div>
                    <Badge variant="secondary">{servizio.count} prenotazioni</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                Nessun servizio richiesto questo mese
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prenotazioni recenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prenotazioni in Attesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prenotazioni && prenotazioni.length > 0 ? (
              <div className="space-y-3">
                {prenotazioni.slice(0, 5).map((prenotazione) => {
                  const statoInfo = statiBadge[prenotazione.stato] || {
                    label: prenotazione.stato,
                    variant: "outline" as const,
                  };
                  return (
                    <Link
                      key={prenotazione.id}
                      href={`/laboratorio/prenotazioni/${prenotazione.id}`}
                    >
                      <div className="p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {prenotazione.paziente?.nome} {prenotazione.paziente?.cognome}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {prenotazione.servizio?.nome}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(prenotazione.dataOraAppuntamento).toLocaleString("it-IT")}
                            </p>
                          </div>
                          <Badge variant={statoInfo.variant}>{statoInfo.label}</Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {prenotazioni.length > 5 && (
                  <Link href="/laboratorio/prenotazioni">
                    <Button variant="outline" className="w-full mt-2">
                      Vedi tutte le prenotazioni ({prenotazioni.length})
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Nessuna prenotazione in attesa
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/laboratorio/calendario">
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Apri Calendario
              </Button>
            </Link>
            <Link href="/laboratorio/prenotazioni">
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Gestisci Prenotazioni
              </Button>
            </Link>
            <Link href="/laboratorio/servizi">
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Gestisci Servizi
              </Button>
            </Link>
            <Link href="/laboratorio/statistiche">
              <Button className="w-full" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Visualizza Statistiche
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
