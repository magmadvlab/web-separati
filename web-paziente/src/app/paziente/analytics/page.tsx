"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import { StatCard } from "@/components/ui/stat-card";
import type { ApiResponse, Ordine, Prescrizione } from "@/types/api";
import {
  FileText,
  ShoppingCart,
  Pill,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  Clock,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { WellnessScore } from "@/components/paziente/WellnessScore";

interface Terapia {
  id: number;
  farmaco: any;
  stato: string;
  dataInizio: string;
  dataFine?: string;
}

interface DashboardStats {
  totalePrescrizioni: number;
  totaleOrdini: number;
  totaleTerapie: number;
  ordiniInConsegna: number;
  prescrizioniAttive: number;
}

export default function PazienteAnalytics() {
  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery<Prescrizione[]>({
    queryKey: ["paziente-prescrizioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione[]>>("/paziente/prescrizioni");
      return response.data.data;
    },
  });

  const { data: ordini, isLoading: ordiniLoading } = useQuery<Ordine[]>({
    queryKey: ["paziente-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/paziente/ordini");
      return response.data.data;
    },
  });

  const { data: terapie, isLoading: terapieLoading } = useQuery<Terapia[]>({
    queryKey: ["paziente-terapie"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia[]>>("/paziente/terapie");
      return response.data.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["paziente-dashboard-stats"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardStats>>("/paziente/dashboard-stats");
      return response.data.data;
    },
  });

  if (prescrizioniLoading || ordiniLoading || terapieLoading || statsLoading) {
    return <Loading />;
  }

  const prescrizioniAttive = prescrizioni?.filter((p) => p.stato === "attiva") || [];
  const ordiniInConsegna = ordini?.filter((o) => o.stato === "in_consegna" || o.stato === "pronto") || [];
  const ordiniCompletati = ordini?.filter((o) => o.stato === "consegnato") || [];
  const terapieAttive = terapie?.filter((t) => t.stato === "attiva") || [];

  // Calcola statistiche avanzate
  const ordiniUltimoMese = ordini?.filter(o => {
    const dataOrdine = new Date(o.createdAt || "");
    const unMeseFa = new Date();
    unMeseFa.setMonth(unMeseFa.getMonth() - 1);
    return dataOrdine >= unMeseFa;
  }).length || 0;

  const prescrizioniUltimoMese = prescrizioni?.filter(p => {
    const dataPres = new Date(p.dataEmissione);
    const unMeseFa = new Date();
    unMeseFa.setMonth(unMeseFa.getMonth() - 1);
    return dataPres >= unMeseFa;
  }).length || 0;

  const spesaTotale = ordini?.reduce((sum, o) => sum + (o.totale || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent p-6 border border-blue-200"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Analytics e Statistiche
          </h1>
          <p className="text-gray-600 mt-2">
            Panoramica completa della tua salute e utilizzo del servizio
          </p>
        </div>
        <div className="absolute inset-0 shimmer opacity-30" />
      </motion.div>

      {/* Statistiche Principali */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Riepilogo Generale
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Prescrizioni Attive"
            value={prescrizioniAttive.length}
            description={`di ${prescrizioni?.length || 0} totali`}
            icon={FileText}
            variant="gradient"
            delay={0.1}
            className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent"
          />

          <StatCard
            title="Ordini in Consegna"
            value={ordiniInConsegna.length}
            description="In corso"
            icon={ShoppingCart}
            variant="gradient"
            delay={0.2}
            className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-transparent"
          />

          <StatCard
            title="Terapie Attive"
            value={terapieAttive.length}
            description="In trattamento"
            icon={Pill}
            variant="gradient"
            delay={0.3}
            className="border-green-200 bg-gradient-to-br from-green-50/50 to-transparent"
          />

          <StatCard
            title="Ordini Completati"
            value={ordiniCompletati.length}
            description={`di ${ordini?.length || 0} totali`}
            icon={CheckCircle2}
            variant="gradient"
            delay={0.4}
            className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent"
          />
        </div>
      </div>

      {/* Statistiche Mensili */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Ultimo Mese
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Prescrizioni Ricevute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{prescrizioniUltimoMese}</div>
                <p className="text-xs text-gray-500 mt-1">Ultimi 30 giorni</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                  Ordini Effettuati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ordiniUltimoMese}</div>
                <p className="text-xs text-gray-500 mt-1">Ultimi 30 giorni</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  Spesa Totale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">€{spesaTotale.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Tutti gli ordini</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Wellness Score */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Stato di Salute
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <WellnessScore />
        </motion.div>
      </div>

      {/* Dettagli Prescrizioni */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Dettaglio Prescrizioni
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per Stato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Attive
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {prescrizioniAttive.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      Scadute/Utilizzate
                    </span>
                    <span className="text-lg font-bold text-gray-700">
                      {(prescrizioni?.length || 0) - prescrizioniAttive.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Totale
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      {prescrizioni?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per Stato Ordini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-orange-600" />
                      In Consegna
                    </span>
                    <span className="text-lg font-bold text-orange-700">
                      {ordiniInConsegna.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Completati
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {ordiniCompletati.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      Totale Ordini
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      {ordini?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Note informative */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Informazioni Analytics</p>
                <p className="text-sm text-blue-700 mt-1">
                  Le statistiche vengono aggiornate in tempo reale.
                  Utilizza questa pagina per monitorare il tuo utilizzo del servizio RicettaZero e lo stato di salute generale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
