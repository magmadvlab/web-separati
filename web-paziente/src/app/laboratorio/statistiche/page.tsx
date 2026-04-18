"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import { StatCard } from "@/components/ui/stat-card";
import type { ApiResponse } from "@/types/api";
import { Calendar, TrendingUp, Euro, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

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

export default function StatistichePage() {
  const { data: statistiche, isLoading } = useQuery<Statistiche>({
    queryKey: ["statistiche-laboratorio"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Statistiche>>("/laboratori/dashboard/statistiche");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!statistiche) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent p-6 border border-blue-500/20"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Statistiche
          </h1>
          <p className="text-gray-600 mt-2">Panoramica delle prestazioni del laboratorio</p>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Prenotazioni Oggi"
          value={statistiche.prenotazioniOggi}
          description="Prenotazioni di oggi"
          icon={Calendar}
          variant="gradient"
          delay={0.1}
          className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent"
        />
        <StatCard
          title="Prenotazioni Settimana"
          value={statistiche.prenotazioniSettimana}
          description="Ultimi 7 giorni"
          icon={TrendingUp}
          variant="gradient"
          delay={0.2}
          className="border-green-200 bg-gradient-to-br from-green-50/50 to-transparent"
        />
        <StatCard
          title="Prenotazioni Mese"
          value={statistiche.prenotazioniMese}
          description="Questo mese"
          icon={BarChart3}
          variant="gradient"
          delay={0.3}
          className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent"
        />
        <StatCard
          title="Fatturato Mese"
          value={`€${Number(statistiche.fatturatoMese).toFixed(2)}`}
          description="Fatturato questo mese"
          icon={Euro}
          variant="gradient"
          delay={0.4}
          className="border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-transparent"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Servizi Più Richiesti</CardTitle>
          </CardHeader>
          <CardContent>
            {statistiche.serviziRichiesti.length > 0 ? (
              <div className="space-y-2">
                {statistiche.serviziRichiesti.map((servizio, index) => {
                  const maxCount = Math.max(...statistiche.serviziRichiesti.map(s => s.count));
                  return (
                    <motion.div
                      key={servizio.servizioId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors hover-lift"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium">{servizio.nome}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${(servizio.count / maxCount) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 font-medium min-w-[100px] text-right">
                          {servizio.count} prenotazioni
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

