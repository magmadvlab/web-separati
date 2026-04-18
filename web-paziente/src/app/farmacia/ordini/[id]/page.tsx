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
  Truck,
  Euro,
  FileText,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  PlayCircle,
  CreditCard,
  Send,
} from "lucide-react";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import Link from "next/link";

export default function FarmaciaDettaglioOrdinePage() {
  const params = useParams();
  const ordineId = parseInt(params.id as string);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordine, isLoading, error } = useQuery<Ordine>({
    queryKey: ["farmacia-ordine", ordineId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine>>(`/farmacia/ordini/${ordineId}`);
      return response.data.data as Ordine;
    },
    enabled: !!ordineId,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ["payment-status", ordineId],
    queryFn: async () => {
      try {
        const response = await api.get(`/payments/ordine/${ordineId}`);
        return response.data;
      } catch (error: any) {
        // Se l'endpoint non è disponibile (404), ritorna null senza mostrare errore
        if (error?.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
    enabled: !!ordineId,
    retry: false, // Non riprovare se fallisce
  });

  const marcaInPreparazioneMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/farmacia/ordini/${ordineId}`, {
        stato: "in_preparazione",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordine", ordineId] });
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordini"] });
      toast({
        title: "Ordine aggiornato",
        description: "L'ordine è stato marcato come in preparazione",
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

  const marcaProntoMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/farmacia/ordini/${ordineId}/pronto`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordine", ordineId] });
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordini"] });
      toast({
        title: "Ordine pronto",
        description: "L'ordine è stato marcato come pronto per la consegna",
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

  const marcaSpeditoMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/farmacia/ordini/${ordineId}/spedito`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordine", ordineId] });
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordini"] });
      toast({
        title: "Ordine spedito",
        description: "L'ordine è stato marcato come spedito",
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
      case "in_preparazione":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "creato":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (stato: string) => {
    const labels: Record<string, string> = {
      creato: "Creato",
      in_preparazione: "In Preparazione",
      pronto: "Pronto",
      spedito: "Spedito",
      assegnato_rider: "Assegnato al Rider",
      in_consegna: "In Consegna",
      consegnato: "Consegnato",
    };
    return labels[stato.toLowerCase()] || stato;
  };

  const farmaci = Array.isArray(ordine.farmaci) ? ordine.farmaci : [];
  const canMarkInPreparazione = ordine.stato.toLowerCase() === "creato";
  const canMarkPronto = ["creato", "in_preparazione"].includes(ordine.stato.toLowerCase());
  const canMarkSpedito = 
    ordine.stato.toLowerCase() === "pronto" &&
    (paymentStatus?.statoPagamento === "paid" || paymentStatus?.metodoPagamento === "contrassegno");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/farmacia/ordini">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna agli ordini
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Ordine</h1>
            <p className="text-gray-600 mt-1">
              Codice: {ordine.codiceOrdine || `#${ordine.id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-4 py-2 text-sm font-medium border ${getStatusColor(ordine.stato)}`}>
            {getStatusLabel(ordine.stato)}
          </span>
          {canMarkInPreparazione && (
            <Button
              onClick={() => marcaInPreparazioneMutation.mutate()}
              disabled={marcaInPreparazioneMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Marca in Preparazione
            </Button>
          )}
          {canMarkPronto && (
            <Button
              onClick={() => marcaProntoMutation.mutate()}
              disabled={marcaProntoMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marca Pronto
            </Button>
          )}
          {canMarkSpedito && (
            <Button
              onClick={() => marcaSpeditoMutation.mutate()}
              disabled={marcaSpeditoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Marca Spedito
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonna principale */}
        <div className="md:col-span-2 space-y-6">
          {/* Informazioni Paziente */}
          {ordine.paziente && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informazioni Paziente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-lg">
                    {ordine.paziente.nome} {ordine.paziente.cognome}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    CF: {ordine.paziente.codiceFiscale}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {ordine.paziente.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{ordine.paziente.telefono}</span>
                    </div>
                  )}
                  {ordine.paziente.emailPersonale && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{ordine.paziente.emailPersonale}</span>
                    </div>
                  )}
                </div>
                {ordine.paziente.indirizzo && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm">{ordine.paziente.indirizzo}</p>
                      <p className="text-sm text-gray-600">
                        {ordine.paziente.cap} {ordine.paziente.citta} ({ordine.paziente.provincia})
                      </p>
                    </div>
                  </div>
                )}
                {ordine.paziente.allergie && ordine.paziente.allergie.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-red-600 mb-2">⚠️ Allergie</p>
                    <div className="flex flex-wrap gap-2">
                      {ordine.paziente.allergie.map((allergia, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {allergia}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Farmaci Ordinati */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Farmaci da Preparare ({farmaci.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmaci.length > 0 ? (
                <div className="space-y-3">
                  {farmaci.map((farmaco: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{farmaco.nomeFarmaco || "Farmaco"}</p>
                          {farmaco.principioAttivo && (
                            <p className="text-sm text-gray-600 mt-1">
                              Principio attivo: {farmaco.principioAttivo}
                            </p>
                          )}
                          {farmaco.posologia && (
                            <p className="text-sm text-gray-600 mt-1">
                              Posologia: {farmaco.posologia}
                            </p>
                          )}
                          {farmaco.note && (
                            <p className="text-sm text-orange-600 mt-1">
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              {farmaco.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-lg">Quantità: {farmaco.quantita || 1}</p>
                          {farmaco.prezzo && (
                            <p className="text-sm text-gray-600 mt-1">
                              €{Number(farmaco.prezzo * (farmaco.quantita || 1)).toFixed(2)}
                            </p>
                          )}
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

          {/* Informazioni Consegna */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Informazioni Consegna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo Consegna</p>
                <p className="mt-1">
                  {ordine.tipoConsegna === "domicilio" ? "Consegna a Domicilio" : "Ritiro in Farmacia"}
                </p>
              </div>
              {ordine.indirizzoConsegna && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Indirizzo Consegna</p>
                  <p className="mt-1">{ordine.indirizzoConsegna}</p>
                </div>
              )}
              {ordine.finestraOraria && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Finestra Oraria</p>
                  <p className="mt-1">{ordine.finestraOraria}</p>
                </div>
              )}
              {ordine.noteConsegna && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Note Consegna</p>
                  <p className="mt-1">{ordine.noteConsegna}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescrizione */}
          {ordine.prescrizione && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescrizione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ordine.prescrizione.numeroRicetta && (
                    <p className="font-medium">
                      Numero Ricetta: {ordine.prescrizione.numeroRicetta}
                    </p>
                  )}
                  {ordine.prescrizione.codiceNre && (
                    <p className="text-sm text-gray-600">
                      Codice NRE: {ordine.prescrizione.codiceNre}
                    </p>
                  )}
                  {ordine.prescrizione.dataEmissione && (
                    <p className="text-sm text-gray-600">
                      Data Emissione:{" "}
                      {new Date(ordine.prescrizione.dataEmissione).toLocaleDateString("it-IT")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonna laterale */}
        <div className="space-y-6">
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
                <span>Totale Farmaci:</span>
                <span className="font-medium">
                  €{Number(ordine.totaleFarmaci || 0).toFixed(2)}
                </span>
              </div>
              {ordine.totaleDaBanco && ordine.totaleDaBanco > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Farmaci da Banco:</span>
                  <span className="font-medium">
                    €{Number(ordine.totaleDaBanco).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Costo Consegna:</span>
                <span className="font-medium">
                  €{Number(ordine.costoConsegna || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Totale:</span>
                <span>€{Number(ordine.totale || ordine.importoTotale || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stato:</span>
                    <PaymentStatusBadge
                      statoPagamento={paymentStatus.statoPagamento}
                      metodoPagamento={paymentStatus.metodoPagamento}
                    />
                  </div>
                  {paymentStatus.metodoPagamento && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Metodo:</span>
                      <span className="text-sm font-medium capitalize">{paymentStatus.metodoPagamento}</span>
                    </div>
                  )}
                  {paymentStatus.importoPagato && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Importo Pagato:</span>
                      <span className="text-sm font-medium">€{Number(paymentStatus.importoPagato).toFixed(2)}</span>
                    </div>
                  )}
                  {paymentStatus.commissioneIncasso && paymentStatus.commissioneIncasso > 0 && (
                    <div className="flex items-center justify-between text-yellow-700">
                      <span className="text-sm">Commissione Incasso:</span>
                      <span className="text-sm font-medium">€{Number(paymentStatus.commissioneIncasso).toFixed(2)}</span>
                    </div>
                  )}
                  {paymentStatus.dataPagamento && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Data Pagamento:</span>
                      <span className="text-sm">
                        {new Date(paymentStatus.dataPagamento).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">Nessun pagamento registrato</p>
              )}
            </CardContent>
          </Card>

          {/* Informazioni Ordine */}
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
              {ordine.dataPronto && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Pronto</p>
                  <p className="mt-1">
                    {new Date(ordine.dataPronto).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              {ordine.dataSpedizione && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Spedizione</p>
                  <p className="mt-1">
                    {new Date(ordine.dataSpedizione).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              {ordine.trackingNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Numero Tracking</p>
                  <p className="mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {ordine.trackingNumber}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rider (se assegnato) */}
          {ordine.rider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Rider Assegnato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">
                  {ordine.rider.nome} {ordine.rider.cognome}
                </p>
                {ordine.rider.telefono && (
                  <p className="text-sm text-gray-600">Tel: {ordine.rider.telefono}</p>
                )}
                {ordine.rider.mezzoTrasporto && (
                  <p className="text-sm text-gray-600">Veicolo: {ordine.rider.mezzoTrasporto}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}













