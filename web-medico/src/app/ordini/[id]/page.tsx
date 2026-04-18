"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { TentataConsegna } from "@/components/ordini/TentataConsegna";
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
  Pill,
  CreditCard,
  Download,
} from "lucide-react";
import Link from "next/link";

export default function DettaglioOrdinePage() {
  const params = useParams();
  const ordineId = parseInt(params.id as string);

  const { data: ordine, isLoading, error } = useQuery<Ordine>({
    queryKey: ["paziente-ordine", ordineId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine>>(`/paziente/ordini/${ordineId}`);
      return response.data.data;
    },
    enabled: !!ordineId,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ["payment-status", ordineId],
    queryFn: async () => {
      try {
        const response = await api.get(`/payments/ordine/${ordineId}`);
        return response.data;
      } catch (error) {
        // Se l'endpoint non è disponibile o l'ordine non ha pagamento, ritorna null
        return null;
      }
    },
    enabled: !!ordineId,
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
      case "in consegna":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assegnato_rider":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pronto":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_preparazione":
      case "in preparazione":
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
      assegnato_rider: "Assegnato al Rider",
      in_consegna: "In Consegna",
      consegnato: "Consegnato",
    };
    return labels[stato.toLowerCase()] || stato;
  };

  // ✅ Task 4.2.3: Timeline ordine
  const timeline = [
    {
      label: "Ordine Creato",
      date: ordine.dataCreazione,
      icon: CheckCircle2,
      completed: true,
    },
    {
      label: "Invio a Farmacia",
      date: (ordine as any).dataInvioFarmacia,
      icon: Package,
      completed: !!(ordine as any).dataInvioFarmacia,
    },
    {
      label: "In Preparazione",
      date: (ordine as any).dataInvioFarmacia,
      icon: Clock,
      completed: ["in_preparazione", "pronto", "assegnato_rider", "in_consegna", "consegnato"].includes(
        ordine.stato.toLowerCase()
      ),
    },
    {
      label: "Pronto",
      date: (ordine as any).dataPronto,
      icon: CheckCircle2,
      completed: ["pronto", "assegnato_rider", "in_consegna", "consegnato"].includes(
        ordine.stato.toLowerCase()
      ),
    },
    {
      label: "Assegnato al Rider",
      date: (ordine as any).dataAssegnazioneRider,
      icon: User,
      completed: ["assegnato_rider", "in_consegna", "consegnato"].includes(ordine.stato.toLowerCase()),
    },
    {
      label: "In Consegna",
      date: (ordine as any).dataInConsegna,
      icon: Truck,
      completed: ["in_consegna", "consegnato"].includes(ordine.stato.toLowerCase()),
    },
    {
      label: "Consegnato",
      date: (ordine as any).dataConsegna,
      icon: CheckCircle2,
      completed: ordine.stato.toLowerCase() === "consegnato",
    },
  ];

  const farmaci = Array.isArray(ordine.farmaci) ? ordine.farmaci : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ordini">
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
        <span className={`rounded-full px-4 py-2 text-sm font-medium border ${getStatusColor(ordine.stato)}`}>
          {getStatusLabel(ordine.stato)}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonna principale */}
        <div className="md:col-span-2 space-y-6">
          {/* ✅ Task 4.2.3: Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Stato Ordine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.completed;
                  const isLast = index === timeline.length - 1;

                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            isActive
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-gray-100 border-gray-300 text-gray-400"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-16 mt-2 ${
                              isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className={`font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(step.date).toLocaleString("it-IT", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Farmaci Ordinati */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <Package className="h-5 w-5" />
                Farmaci Ordinati ({farmaci.length})
                {ordine.prescrizioneId && (
                  <span className="text-xs font-normal text-red-600 bg-red-100 px-2 py-1 rounded ml-2">
                    <FileText className="h-3 w-3 inline mr-1" />
                    Con Prescrizione
                  </span>
                )}
                {!ordine.prescrizioneId && (
                  <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded ml-2">
                    <Pill className="h-3 w-3 inline mr-1" />
                    Ordine Diretto (OTC)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmaci.length > 0 ? (
                <div className="space-y-3">
                  {farmaci.map((farmaco: any, index: number) => {
                    // Determina se il farmaco richiede ricetta
                    // Se è un ordine con prescrizione, tutti i farmaci richiedono ricetta
                    // Se è un ordine diretto, tutti i farmaci sono OTC
                    const richiedeRicetta = ordine.prescrizioneId 
                      ? true 
                      : farmaco.ricettaRichiesta !== undefined 
                        ? farmaco.ricettaRichiesta 
                        : false;

                    return (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          richiedeRicetta 
                            ? 'border-red-200 bg-red-50' 
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium">{farmaco.nomeFarmaco || "Farmaco"}</p>
                              {richiedeRicetta ? (
                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Richiede Ricetta
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                  <Pill className="h-3 w-3" />
                                  Da Banco (OTC)
                                </span>
                              )}
                            </div>
                            {farmaco.principioAttivo && (
                              <p className="text-sm text-gray-600 mt-1">{farmaco.principioAttivo}</p>
                            )}
                            {farmaco.posologia && (
                              <p className="text-xs text-gray-500 mt-1">
                                Posologia: {farmaco.posologia}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Quantità: {farmaco.quantita || 1}</p>
                            {farmaco.prezzo && (
                              <p className="text-sm text-gray-600">
                                €{(farmaco.prezzo * (farmaco.quantita || 1)).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">Nessun farmaco</p>
              )}
            </CardContent>
          </Card>

          {/* Farmaci da Banco (se presenti in ordini con prescrizione) */}
          {(ordine as any).farmaciDaBanco && Array.isArray((ordine as any).farmaciDaBanco) && (ordine as any).farmaciDaBanco.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-green-600" />
                  Farmaci da Banco ({(ordine as any).farmaciDaBanco.length})
                  <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded ml-2">
                    OTC
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(ordine as any).farmaciDaBanco.map((farmaco: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border border-green-200 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{farmaco.nomeFarmaco || "Farmaco"}</p>
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <Pill className="h-3 w-3" />
                              Da Banco (OTC)
                            </span>
                          </div>
                          {farmaco.principioAttivo && (
                            <p className="text-sm text-gray-600 mt-1">{farmaco.principioAttivo}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Quantità: {farmaco.quantita || 1}</p>
                          {farmaco.prezzo && (
                            <p className="text-sm text-gray-600">
                              €{(farmaco.prezzo * (farmaco.quantita || 1)).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tentata Consegna */}
          {(ordine as any).tentativeConsegna &&
            Array.isArray((ordine as any).tentativeConsegna) &&
            (ordine as any).tentativeConsegna.length > 0 && (
              <TentataConsegna
                ordineId={ordineId}
                tentativaConsegna={(ordine as any).tentativeConsegna[(ordine as any).tentativeConsegna.length - 1]}
              />
            )}

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
                  {(ordine as any).tipoConsegna === "domicilio" ? "Consegna a Domicilio" : "Ritiro in Farmacia"}
                </p>
              </div>
              {(ordine as any).indirizzoConsegna && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Indirizzo</p>
                  <p className="mt-1">{ordine.indirizzoConsegna}</p>
                </div>
              )}
              {(ordine as any).finestraOraria && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Finestra Oraria</p>
                  <p className="mt-1">{(ordine as any).finestraOraria}</p>
                </div>
              )}
              {(ordine as any).noteConsegna && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Note</p>
                  <p className="mt-1">{(ordine as any).noteConsegna}</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                  €{((ordine as any).totaleFarmaci || 0).toFixed(2)}
                </span>
              </div>
              {(ordine as any).totaleDaBanco > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Farmaci da Banco:</span>
                  <span className="font-medium">
                    €{((ordine as any).totaleDaBanco || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Costo Consegna:</span>
                <span className="font-medium">
                  €{((ordine as any).costoConsegna || 0).toFixed(2)}
                </span>
              </div>
              {paymentStatus?.commissioneIncasso && paymentStatus.commissioneIncasso > 0 && (
                <div className="flex justify-between text-sm text-yellow-700">
                  <span>Commissione Incasso:</span>
                  <span className="font-medium">
                    +€{paymentStatus.commissioneIncasso.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Totale:</span>
                <span>€{((ordine as any).totale || ordine.importoTotale || 0).toFixed(2)}</span>
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
                      <span className="text-sm font-medium">€{paymentStatus.importoPagato.toFixed(2)}</span>
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
                  {paymentStatus.statoPagamento === "pending" && (
                    <Link href={`/ordini/${ordineId}/pagamento`}>
                      <Button className="w-full mt-3">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Paga Ora
                      </Button>
                    </Link>
                  )}
                  {paymentStatus.statoPagamento === "paid" && (ordine as any).ricevutaUrl && (
                    <a
                      href={(ordine as any).ricevutaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full mt-3">
                        <Download className="mr-2 h-4 w-4" />
                        Scarica Ricevuta
                      </Button>
                    </a>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">Nessun pagamento registrato</p>
                  <Link href={`/ordini/${ordineId}/pagamento`}>
                    <Button className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Procedi al Pagamento
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Farmacia */}
          {ordine.farmacia && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Farmacia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{ordine.farmacia.nome}</p>
                <p className="text-sm text-gray-600">
                  {ordine.farmacia.indirizzo}
                  {ordine.farmacia.citta && `, ${ordine.farmacia.citta}`}
                </p>
                {ordine.farmacia.telefono && (
                  <p className="text-sm text-gray-600">Tel: {ordine.farmacia.telefono}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rider */}
          {ordine.rider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Rider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">
                  {ordine.rider.nome} {ordine.rider.cognome}
                </p>
                {ordine.rider.telefono && (
                  <p className="text-sm text-gray-600">Tel: {ordine.rider.telefono}</p>
                )}
                {(ordine.rider as any).tipoVeicolo && (
                  <p className="text-sm text-gray-600">Veicolo: {(ordine.rider as any).tipoVeicolo}</p>
                )}
              </CardContent>
            </Card>
          )}

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
                <Link
                  href={`/prescrizioni/${(ordine as any).prescrizione.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {(ordine as any).prescrizione.numeroRicetta
                    ? `Ricetta N. ${(ordine as any).prescrizione.numeroRicetta}`
                    : `Prescrizione #${(ordine as any).prescrizione.id}`}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

