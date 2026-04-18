"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, Ordine } from "@/types/api";
import {
  ArrowLeft,
  Package,
  MapPin,
  Euro,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  Navigation,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";

export default function DeliveryDettaglioOrdinePage() {
  const params = useParams();
  const ordineId = parseInt(params.id as string);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordini, isLoading, error } = useQuery<Ordine[]>({
    queryKey: ["delivery-rider-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/delivery/rider/ordini");
      return response.data.data;
    },
  });

  const ordine = ordini?.find((o) => o.id === ordineId);

  const marcaInConsegnaMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/delivery/ordini/${ordineId}/in-consegna`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rider-ordini"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-ordine", ordineId] });
      toast({
        title: "Ordine aggiornato",
        description: "L'ordine è stato marcato come in consegna",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const marcaConsegnatoMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/delivery/ordini/${ordineId}/consegnato`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rider-ordini"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-ordine", ordineId] });
      toast({
        title: "Ordine consegnato",
        description: "L'ordine è stato marcato come consegnato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !ordine) {
    return <NotFound message="Ordine non trovato" />;
  }

  const getStatusColor = (stato: string) => {
    switch (stato.toLowerCase()) {
      case "consegnato":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_consegna":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pronto":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assegnato":
      case "assegnato_rider":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (stato: string) => {
    const labels: Record<string, string> = {
      creato: "Creato",
      in_preparazione: "In Preparazione",
      pronto: "Pronto",
      assegnato: "Assegnato",
      assegnato_rider: "Assegnato al Rider",
      in_consegna: "In Consegna",
      consegnato: "Consegnato",
    };
    return labels[stato.toLowerCase()] || stato;
  };

  const farmaci = Array.isArray(ordine.farmaci) ? ordine.farmaci : [];
  const canMarkInConsegna = ordine.stato.toLowerCase() === "assegnato" || ordine.stato.toLowerCase() === "assegnato_rider" || ordine.stato.toLowerCase() === "pronto";
  const canMarkConsegnato = ordine.stato.toLowerCase() === "in_consegna";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/delivery/ordini">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna agli ordini
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Ordine</h1>
            <p className="text-gray-600 mt-1">
              Codice: {(ordine as any).codiceOrdine || `#${ordine.id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-4 py-2 text-sm font-medium border ${getStatusColor(ordine.stato)}`}>
            {getStatusLabel(ordine.stato)}
          </span>
          {canMarkInConsegna && (
            <Button
              onClick={() => marcaInConsegnaMutation.mutate()}
              disabled={marcaInConsegnaMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Marca in Consegna
            </Button>
          )}
          {canMarkConsegnato && (
            <Button
              onClick={() => marcaConsegnatoMutation.mutate()}
              disabled={marcaConsegnatoMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marca Consegnato
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonna principale */}
        <div className="md:col-span-2 space-y-6">
          {/* Informazioni Ritiro Farmacia */}
          {ordine.farmacia && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Ritiro da Farmacia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-lg">{ordine.farmacia.nome}</p>
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm">{ordine.farmacia.indirizzo}</p>
                      <p className="text-sm text-gray-600">
                        {ordine.farmacia.cap} {ordine.farmacia.citta} ({ordine.farmacia.provincia})
                      </p>
                    </div>
                  </div>
                </div>
                {ordine.farmacia.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{ordine.farmacia.telefono}</span>
                  </div>
                )}
                {ordine.farmacia.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{ordine.farmacia.email}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <Navigation className="h-4 w-4 mr-2" />
                    Apri Navigazione
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informazioni Consegna Paziente */}
          {ordine.paziente && (
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Consegna a Paziente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-lg">
                    {ordine.paziente.nome} {ordine.paziente.cognome}
                  </p>
                </div>
                {(ordine as any).indirizzoConsegna && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{ordine.indirizzoConsegna}</p>
                      {ordine.paziente.cap && ordine.paziente.citta && (
                        <p className="text-sm text-gray-600">
                          {ordine.paziente.cap} {ordine.paziente.citta} ({ordine.paziente.provincia})
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {ordine.paziente.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${ordine.paziente.telefono}`} className="text-sm text-blue-600 hover:underline">
                        {ordine.paziente.telefono}
                      </a>
                    </div>
                  )}
                  {ordine.paziente.emailPersonale && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${ordine.paziente.emailPersonale}`} className="text-sm text-blue-600 hover:underline">
                        {ordine.paziente.emailPersonale}
                      </a>
                    </div>
                  )}
                </div>
                {(ordine as any).finestraOraria && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-gray-600">Finestra Oraria</p>
                    <p className="text-sm mt-1">{(ordine as any).finestraOraria}</p>
                  </div>
                )}
                {(ordine as any).noteConsegna && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-gray-600">Note Consegna</p>
                    <p className="text-sm mt-1">{(ordine as any).noteConsegna}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <Navigation className="h-4 w-4 mr-2" />
                    Apri Navigazione
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Farmaci da Consegnare */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Farmaci da Consegnare ({farmaci.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmaci.length > 0 ? (
                <div className="space-y-3">
                  {farmaci.map((farmaco: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{farmaco.nomeFarmaco || "Farmaco"}</p>
                          {farmaco.principioAttivo && (
                            <p className="text-sm text-gray-600 mt-1">
                              {farmaco.principioAttivo}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">Quantità: {farmaco.quantita || 1}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">Nessun farmaco</p>
              )}
            </CardContent>
          </Card>

          {/* Prescrizione */}
          {(ordine as any).prescrizione && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescrizione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(ordine as any).prescrizione.numeroRicetta && (
                    <p className="font-medium">
                      Numero Ricetta: {(ordine as any).prescrizione.numeroRicetta}
                    </p>
                  )}
                  {(ordine as any).prescrizione.codiceNre && (
                    <p className="text-sm text-gray-600">
                      Codice NRE: {(ordine as any).prescrizione.codiceNre}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonna laterale */}
        <div className="space-y-6">
          {/* Riepilogo Ordine */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informazioni Ordine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Creazione</p>
                <p className="mt-1">
                  {new Date(ordine.dataCreazione).toLocaleString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {ordine.dataConsegnaPrevista && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Consegna Prevista</p>
                  <p className="mt-1">
                    {new Date(ordine.dataConsegnaPrevista).toLocaleDateString("it-IT")}
                  </p>
                </div>
              )}
              {(ordine as any).dataAssegnazioneRider && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Assegnato il</p>
                  <p className="mt-1">
                    {new Date((ordine as any).dataAssegnazioneRider).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              {(ordine as any).dataInConsegna && (
                <div>
                  <p className="text-sm font-medium text-gray-600">In Consegna dal</p>
                  <p className="mt-1">
                    {new Date((ordine as any).dataInConsegna).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              {ordine.dataConsegnaEffettiva && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Consegnato il</p>
                  <p className="mt-1">
                    {new Date(ordine.dataConsegnaEffettiva).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Riepilogo Costi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Riepilogo Costi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Totale Ordine:</span>
                <span className="font-medium">
                  €{((ordine as any).totale || ordine.importoTotale || 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          {ordine.note && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ordine.note}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}













