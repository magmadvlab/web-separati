"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ApiResponse, Ordine, Rider } from "@/types/api";
import { Package, Truck, MapPin, AlertCircle, Clock } from "lucide-react";

// Tipo esteso con i campi restituiti dal backend ma non nel tipo base
type OrdineDisponibile = Ordine & {
  zonaConsegna?: string | null;
  richiestaUrgente?: boolean;
  prioritaBatch?: number | null;
  dataPronto?: string;
  totale?: number;
};

export default function AdminOrdiniPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // selectedRiderPerZona: chiave zona → riderId stringa
  const [selectedRiderPerZona, setSelectedRiderPerZona] = useState<Record<string, string>>({});

  const { data: ordiniDisponibili, isLoading: ordiniLoading } = useQuery<OrdineDisponibile[]>({
    queryKey: ["admin-ordini-disponibili"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<OrdineDisponibile[]>>("/delivery/ordini/disponibili");
      return response.data.data;
    },
  });

  const { data: ridersDisponibili, isLoading: ridersLoading } = useQuery<Rider[]>({
    queryKey: ["admin-riders-disponibili"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Rider[]>>("/delivery/riders/disponibili");
      return response.data.data;
    },
  });

  // Raggruppa gli ordini per zona di consegna (prima) o città farmacia (fallback)
  const ordiniPerZona = useMemo(() => {
    if (!ordiniDisponibili) return new Map<string, OrdineDisponibile[]>();
    const map = new Map<string, OrdineDisponibile[]>();
    for (const ordine of ordiniDisponibili) {
      const zona =
        ordine.zonaConsegna?.trim() ||
        ordine.farmacia?.citta?.trim() ||
        "Zona non specificata";
      if (!map.has(zona)) map.set(zona, []);
      map.get(zona)!.push(ordine);
    }
    return map;
  }, [ordiniDisponibili]);

  // Mutation bulk: assegna N ordini a un rider in una sola chiamata
  const assegnaMultipliMutation = useMutation({
    mutationFn: async ({ ordineIds, riderId }: { ordineIds: number[]; riderId: number }) => {
      const response = await api.post("/delivery/ordini/assegna-multipli", {
        riderId,
        ordineIds,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-ordini-disponibili"] });
      queryClient.invalidateQueries({ queryKey: ["admin-riders-disponibili"] });
      const count = data?.count ?? variables.ordineIds.length;
      toast({
        title: "Ordini assegnati ✓",
        description: `${count} ordine${count !== 1 ? "/i" : ""} assegnato${count !== 1 ? "/i" : ""} con successo`,
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Errore durante l'assegnazione";
      toast({ title: "Errore assegnazione", description: msg, variant: "destructive" });
    },
  });

  const handleAssegnaTutti = (zona: string, ordini: OrdineDisponibile[]) => {
    const riderId = selectedRiderPerZona[zona];
    if (!riderId) {
      toast({
        title: "Nessun rider selezionato",
        description: "Seleziona prima un rider per questa zona",
        variant: "destructive",
      });
      return;
    }
    assegnaMultipliMutation.mutate({
      riderId: parseInt(riderId),
      ordineIds: ordini.map((o) => o.id),
    });
  };

  const handleAssegnaSingolo = (ordine: OrdineDisponibile, zona: string) => {
    const riderId = selectedRiderPerZona[zona];
    if (!riderId) {
      toast({
        title: "Nessun rider selezionato",
        description: "Seleziona prima un rider per questa zona",
        variant: "destructive",
      });
      return;
    }
    assegnaMultipliMutation.mutate({
      riderId: parseInt(riderId),
      ordineIds: [ordine.id],
    });
  };

  if (ordiniLoading || ridersLoading) {
    return <Loading />;
  }

  const totaleOrdini = ordiniDisponibili?.length ?? 0;
  const totaleRiders = ridersDisponibili?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestione Ordini Disponibili</h1>
        <p className="text-gray-600 mt-2">
          Assegna ordini pronti per la consegna ai rider — raggruppati per zona
        </p>
      </div>

      {/* Statistiche Rapide */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Disponibili</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaleOrdini}</div>
            <p className="text-xs text-muted-foreground">Pronti per consegna</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riders Disponibili</CardTitle>
            <Truck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaleRiders}</div>
            <p className="text-xs text-muted-foreground">Online e disponibili</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zone Attive</CardTitle>
            <MapPin className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordiniPerZona.size}</div>
            <p className="text-xs text-muted-foreground">Con ordini in attesa</p>
          </CardContent>
        </Card>
      </div>

      {/* Stato vuoto */}
      {totaleOrdini === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Nessun ordine disponibile per la consegna</p>
            <p className="text-sm text-gray-500 mt-2">
              Gli ordini appariranno qui quando le farmacie li marcheranno come &quot;Pronti&quot;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Avviso nessun rider */}
      {totaleOrdini > 0 && totaleRiders === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            Nessun rider disponibile al momento. Attiva almeno un rider per poter assegnare gli ordini.
          </p>
        </div>
      )}

      {/* Card per ogni zona */}
      {Array.from(ordiniPerZona.entries()).map(([zona, ordini]) => {
        const riderSelezionato = selectedRiderPerZona[zona];
        const riderInfo = ridersDisponibili?.find((r) => r.id.toString() === riderSelezionato);
        const urgenti = ordini.filter((o) => o.richiestaUrgente).length;
        const isPending = assegnaMultipliMutation.isPending;

        return (
          <Card key={zona} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                {/* Intestazione zona */}
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                  <CardTitle className="text-lg">{zona}</CardTitle>
                  <Badge variant="secondary">{ordini.length} ordini</Badge>
                  {urgenti > 0 && (
                    <Badge variant="destructive">{urgenti} urgenti</Badge>
                  )}
                </div>

                {/* Selettore rider + bottone assegna tutti */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={riderSelezionato || ""}
                    onValueChange={(val) =>
                      setSelectedRiderPerZona((prev) => ({ ...prev, [zona]: val }))
                    }
                    disabled={totaleRiders === 0}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Seleziona rider…" />
                    </SelectTrigger>
                    <SelectContent>
                      {ridersDisponibili?.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.nome} {r.cognome}
                          {r.mezzoTrasporto && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({r.mezzoTrasporto})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleAssegnaTutti(zona, ordini)}
                    disabled={!riderSelezionato || isPending || totaleRiders === 0}
                    className="whitespace-nowrap"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Assegna tutti ({ordini.length})
                  </Button>
                </div>
              </div>

              {/* Rider info pill */}
              {riderInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Rider selezionato:{" "}
                  <strong>
                    {riderInfo.nome} {riderInfo.cognome}
                  </strong>
                  {riderInfo.telefono && <> — {riderInfo.telefono}</>}
                </p>
              )}
            </CardHeader>

            {/* Righe ordine */}
            <CardContent>
              <div className="divide-y">
                {ordini.map((ordine) => (
                  <div
                    key={ordine.id}
                    className="flex items-center justify-between py-3 gap-4 flex-wrap"
                  >
                    {/* Info ordine */}
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <span className="font-medium text-sm shrink-0">
                        #{ordine.codiceOrdine || ordine.id}
                      </span>
                      {ordine.richiestaUrgente && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Urgente
                        </Badge>
                      )}
                      <span className="text-sm text-gray-600 shrink-0">
                        {ordine.paziente
                          ? `${ordine.paziente.nome} ${ordine.paziente.cognome}`
                          : "—"}
                      </span>
                      {ordine.indirizzoConsegna && (
                        <span className="text-xs text-gray-400 truncate max-w-xs hidden md:block">
                          {ordine.indirizzoConsegna}
                        </span>
                      )}
                    </div>

                    {/* Ora + importo + bottone */}
                    <div className="flex items-center gap-3 shrink-0">
                      {ordine.dataPronto && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {new Date(ordine.dataPronto).toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                      {ordine.totale != null && (
                        <span className="text-sm font-medium">
                          €{Number(ordine.totale).toFixed(2)}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssegnaSingolo(ordine, zona)}
                        disabled={!riderSelezionato || isPending}
                        title="Assegna solo questo ordine al rider selezionato"
                      >
                        Assegna
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}








