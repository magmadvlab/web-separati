"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cartellaClinicaApi } from "@/lib/api-cartella-clinica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { History, Filter, Search, Calendar, User, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AccessoCartellaClinicaAudit } from "@/types/cartella-clinica";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export function AuditLog() {
  const [filtroTipoOperazione, setFiltroTipoOperazione] = useState<string>("tutti");
  const [filtroEntitaTipo, setFiltroEntitaTipo] = useState<string>("tutti");
  const [filtroDataInizio, setFiltroDataInizio] = useState<string>("");
  const [filtroDataFine, setFiltroDataFine] = useState<string>("");

  const { data: auditLog, isLoading } = useQuery<AccessoCartellaClinicaAudit[]>({
    queryKey: [
      "cartella-clinica-audit",
      filtroTipoOperazione,
      filtroEntitaTipo,
      filtroDataInizio,
      filtroDataFine,
    ],
    queryFn: () =>
      cartellaClinicaApi.getAuditLog({
        tipoOperazione: filtroTipoOperazione !== "tutti" ? filtroTipoOperazione : undefined,
        entitaTipo: filtroEntitaTipo !== "tutti" ? filtroEntitaTipo : undefined,
        dataInizio: filtroDataInizio || undefined,
        dataFine: filtroDataFine || undefined,
        limit: 100,
      }),
  });

  const getEsitoColor = (esito: string) => {
    switch (esito) {
      case "successo":
        return "bg-green-100 text-green-800";
      case "fallito":
        return "bg-red-100 text-red-800";
      case "negato":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTipoOperazioneLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      creazione: "Creazione",
      lettura: "Lettura",
      aggiornamento: "Aggiornamento",
      eliminazione: "Eliminazione",
      condivisione: "Condivisione",
      revoca_permesso: "Revoca Permesso",
      export: "Export",
      report: "Report",
    };
    return labels[tipo] || tipo;
  };

  const getEntitaTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      diario: "Diario",
      stato_salute: "Stato Salute",
      misurazione: "Misurazione",
      documento: "Documento",
      esposizione: "Esposizione",
      permesso: "Permesso",
    };
    return labels[tipo] || tipo;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Audit Log</h2>
        <p className="text-sm text-gray-600">
          Visualizza la cronologia completa di accessi e operazioni sulla tua cartella clinica
        </p>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filtroTipoOperazione} onValueChange={setFiltroTipoOperazione}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo Operazione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutte le operazioni</SelectItem>
                <SelectItem value="creazione">Creazione</SelectItem>
                <SelectItem value="lettura">Lettura</SelectItem>
                <SelectItem value="aggiornamento">Aggiornamento</SelectItem>
                <SelectItem value="eliminazione">Eliminazione</SelectItem>
                <SelectItem value="condivisione">Condivisione</SelectItem>
                <SelectItem value="revoca_permesso">Revoca Permesso</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="report">Report</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroEntitaTipo} onValueChange={setFiltroEntitaTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo Entità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutte le entità</SelectItem>
                <SelectItem value="diario">Diario</SelectItem>
                <SelectItem value="stato_salute">Stato Salute</SelectItem>
                <SelectItem value="misurazione">Misurazione</SelectItem>
                <SelectItem value="documento">Documento</SelectItem>
                <SelectItem value="esposizione">Esposizione</SelectItem>
                <SelectItem value="permesso">Permesso</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data Inizio"
              value={filtroDataInizio}
              onChange={(e) => setFiltroDataInizio(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data Fine"
              value={filtroDataFine}
              onChange={(e) => setFiltroDataFine(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista Audit Log */}
      <div className="space-y-4">
        {auditLog && auditLog.length > 0 ? (
          auditLog.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{entry.azione}</CardTitle>
                      <Badge className={getEsitoColor(entry.esito)}>{entry.esito}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <History className="h-4 w-4" />
                        {format(new Date(entry.dataAccesso), "dd MMMM yyyy HH:mm", { locale: it })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        {getTipoOperazioneLabel(entry.tipoOperazione)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {entry.ruoloUtente} ({entry.tipoUtente})
                      </div>
                      {entry.entitaTipo && (
                        <Badge variant="outline">
                          {getEntitaTipoLabel(entry.entitaTipo)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {entry.motivo && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Motivo:</span> {entry.motivo}
                  </p>
                )}
                {entry.ipAddress && (
                  <p className="text-xs text-gray-500">
                    IP: {entry.ipAddress}
                    {entry.dispositivo && ` • Dispositivo: ${entry.dispositivo}`}
                  </p>
                )}
                {entry.entitaId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Entità ID: {entry.entitaId}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nessun log di audit trovato</p>
              <p className="text-sm text-gray-500 mt-2">
                I log di audit verranno visualizzati qui quando effettui operazioni sulla cartella clinica
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


