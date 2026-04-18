"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, RichiestaPrescrizione } from "@/types/api";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Pill,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function MedicoDettaglioRichiestaPrescrizionePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const richiestaId = parseInt(params.id as string);

  const [showApprovaDialog, setShowApprovaDialog] = useState(false);
  const [showRifiutaDialog, setShowRifiutaDialog] = useState(false);
  const [motivoRifiuto, setMotivoRifiuto] = useState("");
  const [quantitaModificate, setQuantitaModificate] = useState<Record<string, number>>({});
  const [isModifying, setIsModifying] = useState(false);

  const { data: richiesta, isLoading, error } = useQuery<RichiestaPrescrizione>({
    queryKey: ["medico-richiesta-prescrizione", richiestaId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RichiestaPrescrizione>>(
        `/medico/richieste-prescrizione/${richiestaId}`
      );
      return response.data.data;
    },
    enabled: !!richiestaId,
  });

  const approvaMutation = useMutation({
    mutationFn: async (data: {
      farmaci?: any[];
      tipo?: string;
      ripetibile?: boolean;
      numeroRipetizioni?: number;
      maxConfezioniPerRitiro?: number;
      tipoRicetta?: string;
      note?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/richieste-prescrizione/${richiestaId}/approva`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta approvata",
        description: "La richiesta è stata approvata. Ricorda di generare la prescrizione nel tuo software medico.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-prescrizione"] });
      router.push("/medico/richieste-prescrizione");
    },
    onError: (error: any) => {
      console.error('Errore approvazione richiesta:', error);
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.message
        || "Errore durante l'approvazione";
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const rifiutaMutation = useMutation({
    mutationFn: async (motivo: string) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/richieste-prescrizione/${richiestaId}/rifiuta`,
        { motivo }
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-prescrizione"] });
      router.push("/medico/richieste-prescrizione");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.error?.message || "Errore durante il rifiuto",
        variant: "destructive",
      });
    },
  });

  const modificaQuantitaMutation = useMutation({
    mutationFn: async (farmaci: Array<{ nomeFarmaco: string; numeroScatole: number }>) => {
      const response = await api.put<ApiResponse<any>>(
        `/medico/richieste-prescrizione/${richiestaId}/modifica-quantita`,
        { farmaci }
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Quantità modificata",
        description: "La quantità è stata aggiornata. Il paziente è stato notificato.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richiesta-prescrizione", richiestaId] });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-prescrizione"] });
      setQuantitaModificate({});
      setIsModifying(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.error?.message || "Errore durante la modifica",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !richiesta) {
    return <NotFound message="Richiesta non trovata" />;
  }

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case "in_attesa":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            In Attesa
          </Badge>
        );
      case "approvata":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approvata
          </Badge>
        );
      case "rifiutata":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rifiutata
          </Badge>
        );
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  // Gestisce il caso in cui farmaciRichiesti sia una stringa JSON
  let farmaciRichiesti: any[] = [];
  if (richiesta.farmaciRichiesti) {
    if (typeof richiesta.farmaciRichiesti === 'string') {
      try {
        farmaciRichiesti = JSON.parse(richiesta.farmaciRichiesti);
      } catch (e) {
        console.error('Errore parsing farmaciRichiesti:', e);
        farmaciRichiesti = [];
      }
    } else if (Array.isArray(richiesta.farmaciRichiesti)) {
      farmaciRichiesti = richiesta.farmaciRichiesti;
    }
  }

  const handleApprova = () => {
    // Trasforma i farmaci richiesti nel formato atteso dal backend
    const farmaciFormattati = farmaciRichiesti.map((farmaco) => ({
      farmacoId: farmaco.farmacoId || null,
      nomeFarmaco: farmaco.nomeFarmaco || "",
      numeroScatole: farmaco.numeroScatole || 1,
      compressePerScatola: farmaco.compressePerScatola || 30,
      posologia: farmaco.posologia || "",
      doseGiornaliera: farmaco.doseGiornaliera || 1,
      principioAttivo: farmaco.principioAttivo || "",
      motivo: farmaco.motivo || "",
    }));

    approvaMutation.mutate({
      farmaci: farmaciFormattati,
      tipo: "ordinaria",
      ripetibile: false,
      numeroRipetizioni: 1,
      note: richiesta.notePaziente || undefined,
    });
  };

  const handleRifiuta = () => {
    if (!motivoRifiuto.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un motivo per il rifiuto",
        variant: "destructive",
      });
      return;
    }
    rifiutaMutation.mutate(motivoRifiuto);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/medico/richieste-prescrizione">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle richieste
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Richiesta Prescrizione</h1>
            <p className="text-gray-600 mt-1">Richiesta #{richiesta.id}</p>
          </div>
        </div>
        {getStatusBadge(richiesta.stato)}
      </div>

      {/* Informazioni Principali */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dettagli Paziente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paziente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Nome Completo</p>
              <p className="text-lg font-semibold">
                {richiesta.paziente?.nome} {richiesta.paziente?.cognome}
              </p>
            </div>
            {richiesta.paziente?.codiceFiscale && (
              <div>
                <p className="text-sm font-medium text-gray-600">Codice Fiscale</p>
                <p className="text-sm font-mono">{richiesta.paziente.codiceFiscale}</p>
              </div>
            )}
            {richiesta.paziente?.telefono && (
              <div>
                <p className="text-sm font-medium text-gray-600">Telefono</p>
                <p className="text-sm">{richiesta.paziente.telefono}</p>
              </div>
            )}
            {richiesta.paziente?.emailPersonale && (
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm">{richiesta.paziente.emailPersonale}</p>
              </div>
            )}
            {richiesta.paziente && (
              <Link href={`/medico/pazienti/${richiesta.paziente.id}/prescrizioni`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Vedi Report Prescrizioni
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Informazioni Richiesta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informazioni Richiesta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Richiesta</p>
              <p className="text-sm">
                {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {richiesta.motivo && (
              <div>
                <p className="text-sm font-medium text-gray-600">Motivo</p>
                <p className="text-sm">{richiesta.motivo}</p>
              </div>
            )}
            {richiesta.notePaziente && (
              <div>
                <p className="text-sm font-medium text-gray-600">Note Paziente</p>
                <p className="text-sm whitespace-pre-wrap">{richiesta.notePaziente}</p>
              </div>
            )}
            {richiesta.noteMedico && (
              <div>
                <p className="text-sm font-medium text-gray-600">Note Medico</p>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                  {richiesta.noteMedico}
                </p>
              </div>
            )}
            {richiesta.prescrizione && (
              <div>
                <p className="text-sm font-medium text-gray-600">Prescrizione Creata</p>
                <Link href={`/medico/prescrizioni/${richiesta.prescrizione.id}`}>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Vedi Prescrizione #{richiesta.prescrizione.id}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Farmaci Richiesti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Farmaci Richiesti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {farmaciRichiesti.length > 0 ? (
            <div className="space-y-4">
              {farmaciRichiesti.map((farmaco, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{farmaco.nomeFarmaco}</h4>
                        {farmaco.codiceAic && (
                          <Badge variant="outline" className="text-xs">
                            AIC: {farmaco.codiceAic}
                          </Badge>
                        )}
                      </div>
                      {farmaco.principioAttivo && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Principio attivo:</span> {farmaco.principioAttivo}
                        </p>
                      )}
                      {farmaco.formaFarmaceutica && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Forma:</span> {farmaco.formaFarmaceutica}
                        </p>
                      )}
                      <div className="mt-3 space-y-1">
                        {farmaco.numeroScatole && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm">
                              <span className="font-medium">Scatole richieste:</span>{" "}
                              {richiesta.stato === "in_attesa" && isModifying ? (
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  defaultValue={farmaco.numeroScatole}
                                  className="inline-block w-20 h-7 ml-2"
                                  onChange={(e) => {
                                    setQuantitaModificate({
                                      ...quantitaModificate,
                                      [farmaco.nomeFarmaco]: parseInt(e.target.value) || farmaco.numeroScatole,
                                    });
                                  }}
                                />
                              ) : (
                                <span className="text-blue-600 font-semibold">{farmaco.numeroScatole}</span>
                              )}
                            </p>
                            {richiesta.stato === "in_attesa" && !isModifying && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsModifying(true)}
                                className="h-6 text-xs"
                              >
                                Modifica
                              </Button>
                            )}
                          </div>
                        )}
                        {farmaco.compressePerScatola && (
                          <p className="text-sm">
                            <span className="font-medium">Compresse per scatola:</span>{" "}
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 ml-1">
                              {farmaco.compressePerScatola} (dal catalogo)
                            </Badge>
                          </p>
                        )}
                        {farmaco.posologia && (
                          <p className="text-sm">
                            <span className="font-medium">Posologia:</span> {farmaco.posologia}
                          </p>
                        )}
                        {farmaco.posologiaRiferimento && !farmaco.posologia && (
                          <p className="text-sm">
                            <span className="font-medium">Riferimento posologia:</span>{" "}
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 ml-1">
                              {farmaco.posologiaRiferimento.substring(0, 100)}...
                            </Badge>
                          </p>
                        )}
                        {farmaco.doseGiornaliera && (
                          <p className="text-sm">
                            <span className="font-medium">Dose giornaliera:</span>{" "}
                            {farmaco.doseGiornaliera}
                          </p>
                        )}
                        {farmaco.motivo && (
                          <p className="text-sm">
                            <span className="font-medium">Motivo:</span> {farmaco.motivo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">Nessun farmaco specificato</p>
          )}
        </CardContent>
      </Card>

      {/* Azioni Modifica Quantità */}
      {richiesta.stato === "in_attesa" && isModifying && (
        <Card>
          <CardHeader>
            <CardTitle>Modifica Quantità</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => {
                const farmaciModificati = Object.entries(quantitaModificate).map(([nomeFarmaco, numeroScatole]) => ({
                  nomeFarmaco,
                  numeroScatole,
                }));
                if (farmaciModificati.length > 0) {
                  modificaQuantitaMutation.mutate(farmaciModificati);
                } else {
                  setIsModifying(false);
                }
              }}
              disabled={modificaQuantitaMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {modificaQuantitaMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
            <Button
              onClick={() => {
                setIsModifying(false);
                setQuantitaModificate({});
              }}
              variant="outline"
              className="flex-1"
            >
              Annulla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Azioni */}
      {richiesta.stato === "in_attesa" && !isModifying && (
        <Card>
          <CardHeader>
            <CardTitle>Azioni</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => setShowApprovaDialog(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approva Richiesta
            </Button>
            <Button
              onClick={() => setShowRifiutaDialog(true)}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rifiuta Richiesta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Approva */}
      <Dialog open={showApprovaDialog} onOpenChange={setShowApprovaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approva Richiesta Prescrizione</DialogTitle>
            <DialogDescription>
              Approva la richiesta. Dovrai generare la prescrizione nel tuo software medico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2">
              La richiesta verrà approvata come comunicazione. Il paziente sarà notificato.
            </p>
            <p className="text-sm font-medium text-orange-600">
              ⚠️ Ricorda: Dovrai generare la prescrizione nel tuo software medico (es. Millewin) e inviarla via email all&apos;indirizzo RicettaZero.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovaDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleApprova}
              disabled={approvaMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approvaMutation.isPending ? "Approvazione..." : "Conferma Approvazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rifiuta */}
      <Dialog open={showRifiutaDialog} onOpenChange={setShowRifiutaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Richiesta Prescrizione</DialogTitle>
            <DialogDescription>
              Inserisci il motivo del rifiuto. Il paziente riceverà una notifica.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="motivo">Motivo del rifiuto *</Label>
            <Textarea
              id="motivo"
              value={motivoRifiuto}
              onChange={(e) => setMotivoRifiuto(e.target.value)}
              placeholder="Es: Necessario consulto in presenza per valutazione clinica..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRifiutaDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleRifiuta}
              disabled={rifiutaMutation.isPending || !motivoRifiuto.trim()}
              variant="destructive"
            >
              {rifiutaMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

