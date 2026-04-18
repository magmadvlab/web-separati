'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Printer,
  CheckCircle,
  Clock,
  Truck,
  ArrowLeft,
  AlertCircle,
  FileText,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Farmaco {
  id?: number;
  nome: string;
  quantita: number;
  principioAttivo?: string;
  dosaggio?: string;
  disponibile?: boolean;
}

interface Ordine {
  id: number;
  numeroOrdine?: string;
  codiceOrdine?: string;
  hasPromemoriaOriginale?: boolean;
  paziente: {
    nome: string;
    cognome: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
  };
  statoPreparazione: string;
  etichettaStampata: boolean;
  numeroEtichetta?: string;
  farmaci: Farmaco[];
  priorita?: string;
}

export default function OrdineDetailPage() {
  const [ordine, setOrdine] = useState<Ordine | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [farmaciDisponibili, setFarmaciDisponibili] = useState<Record<number, boolean>>({});
  const [showEccezioneDialog, setShowEccezioneDialog] = useState(false);
  const [farmacoMancante, setFarmacoMancante] = useState<Farmaco | null>(null);
  const [motivoMancanza, setMotivoMancanza] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const ordineId = params.id as string;

  useEffect(() => {
    loadOrdine();
  }, [ordineId]);

  const loadOrdine = async () => {
    try {
      const res = await api.get('/farmacia/batch/ordini-da-preparare');
      const batches = res.data;

      for (const batch of batches) {
        const foundOrdine = batch.ordini.find((o: Ordine) => o.id === parseInt(ordineId));
        if (foundOrdine) {
          setOrdine(foundOrdine);

          // Inizializza tutti i farmaci come disponibili
          const disponibilita: Record<number, boolean> = {};
          foundOrdine.farmaci?.forEach((farmaco: Farmaco, index: number) => {
            disponibilita[index] = true;
          });
          setFarmaciDisponibili(disponibilita);
          break;
        }
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare ordine',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const segnalaFarmacoMancante = async () => {
    if (!ordine || !farmacoMancante) return;

    setProcessing(true);
    try {
      await api.post(`/farmacia/batch/ordini/${ordine.id}/segnala-farmaco-mancante`, {
        nomeFarmaco: farmacoMancante.nome,
        principioAttivo: farmacoMancante.principioAttivo,
        quantitaRichiesta: farmacoMancante.quantita,
        quantitaDisponibile: 0,
        tipoEccezione: 'farmaco_mancante',
        motivoMancanza: motivoMancanza || 'Non disponibile'
      });

      toast({
        title: 'Eccezione segnalata',
        description: 'Il farmaco mancante è stato segnalato'
      });
      setShowEccezioneDialog(false);
      setFarmacoMancante(null);
      setMotivoMancanza('');
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile segnalare eccezione',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const confermaDisponibilita = async () => {
    if (!ordine || !ordine.farmaci?.length) return;

    setProcessing(true);
    try {
      await api.post(`/farmacia/batch/ordini/${ordine.id}/conferma-disponibilita`, {
        farmaci: ordine.farmaci.map((farmaco, index) => ({
          farmacoId: farmaco.id,
          nomeFarmaco: farmaco.nome,
          principioAttivo: farmaco.principioAttivo,
          quantitaRichiesta: farmaco.quantita,
          quantitaDisponibile: farmaciDisponibili[index] ? farmaco.quantita : 0,
          disponibile: Boolean(farmaciDisponibili[index]),
        })),
      });

      toast({
        title: 'Disponibilità confermata',
        description: 'L’ordine può ora essere preparato',
      });

      await loadOrdine();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile confermare la disponibilità dei farmaci',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const confermaPreparazione = async () => {
    if (!ordine) return;

    setProcessing(true);
    try {
      // 1. Inizia preparazione
      await api.post(`/farmacia/batch/ordini/${ordine.id}/inizia-preparazione`, {});

      // 2. Completa preparazione
      await api.post(`/farmacia/batch/ordini/${ordine.id}/completa-preparazione`, {
        notePreparazione: 'Ordine preparato e incartato'
      });

      toast({
        title: 'Preparazione confermata!',
        description: 'Ora puoi stampare l\'etichetta'
      });

      loadOrdine();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile confermare preparazione',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const openPdfPreview = (
    previewTab: Window | null,
    blob: Blob,
    fallbackFilename: string,
  ) => {
    const objectUrl = URL.createObjectURL(blob);

    if (previewTab && !previewTab.closed) {
      previewTab.location.replace(objectUrl);
      previewTab.focus();
    } else {
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fallbackFilename;
      anchor.click();
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
  };

  const base64ToBlob = (base64: string, mimeType = 'application/pdf'): Blob => {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mimeType });
  };

  const stampaEtichetta = async () => {
    if (!ordine) return;

    setProcessing(true);
    const previewTab = window.open('', '_blank', 'width=1100,height=850');
    try {
      const res = await api.get(`/farmacia/batch/ordini/${ordine.id}/etichetta`);
      const { pdfBase64, filename, mimeType } = res.data;
      const blob = base64ToBlob(pdfBase64, mimeType || 'application/pdf');

      openPdfPreview(previewTab, blob, filename || `etichetta-ordine-${ordine.id}.pdf`);

      toast({
        title: 'Etichetta stampata',
        description: "Applica l'etichetta al pacco incartato"
      });

      loadOrdine();
    } catch (error) {
      if (previewTab && !previewTab.closed) {
        previewTab.close();
      }
      toast({
        title: 'Errore',
        description: 'Impossibile stampare etichetta',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const apriPromemoriaOriginale = async () => {
    if (!ordine?.hasPromemoriaOriginale) return;

    setProcessing(true);
    const previewTab = window.open('', '_blank', 'width=1100,height=850');
    try {
      const res = await api.get(`/farmacia/batch/ordini/${ordine.id}/promemoria`);
      const { pdfBase64, filename, mimeType } = res.data;
      const blob = base64ToBlob(pdfBase64, mimeType || 'application/pdf');

      openPdfPreview(previewTab, blob, filename || `promemoria-ordine-${ordine.id}.pdf`);

      toast({
        title: 'Promemoria aperto',
        description: 'Puoi consultare o stampare il PDF originale della prescrizione',
      });
    } catch (error) {
      if (previewTab && !previewTab.closed) {
        previewTab.close();
      }
      toast({
        title: 'Errore',
        description: 'Impossibile aprire il promemoria originale',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const marcaProntoRitiro = async () => {
    if (!ordine) return;

    setProcessing(true);
    try {
      await api.post(`/farmacia/batch/ordini/${ordine.id}/pronto-ritiro`, {
        etichettaApplicata: true
      });

      toast({
        title: 'Ordine completato!',
        description: 'Ordine pronto per il ritiro'
      });

      // Torna alla lista
      router.push('/farmacia/batch/preparazione');
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile marcare pronto per ritiro',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatoBadge = (stato: string) => {
    const config: Record<string, { label: string; variant: 'secondary' | 'default'; icon: any }> = {
      in_verifica: { label: 'In verifica', variant: 'secondary' as const, icon: AlertCircle },
      da_preparare: { label: 'Da preparare', variant: 'secondary' as const, icon: Clock },
      in_preparazione: { label: 'In preparazione', variant: 'default' as const, icon: Package },
      preparato: { label: 'Preparato', variant: 'default' as const, icon: CheckCircle },
      pronto_ritiro: { label: 'Pronto ritiro', variant: 'default' as const, icon: Truck },
      ritirato: { label: 'Ritirato', variant: 'default' as const, icon: CheckCircle }
    };

    const { label, variant, icon: Icon } = config[stato] || config.da_preparare;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Caricamento ordine...</p>
        </div>
      </div>
    );
  }

  if (!ordine) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600 mb-4">Ordine non trovato</p>
            <Button onClick={() => router.push('/farmacia/batch/preparazione')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tuttiDisponibili = ordine.farmaci?.every((_, index) => farmaciDisponibili[index]) ?? true;
  const codiceOrdine = ordine.numeroOrdine || ordine.codiceOrdine || `Ordine #${ordine.id}`;
  const inVerifica = ordine.statoPreparazione === 'in_verifica';
  const daPreparare = ordine.statoPreparazione === 'da_preparare';
  const puoValutareDisponibilita = inVerifica && (ordine.farmaci?.length ?? 0) > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/farmacia/batch/preparazione')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla lista
        </Button>
        <h1 className="text-3xl font-bold">Dettaglio Ordine</h1>
      </div>

      {/* Card ordine */}
      <Card className="border-2 border-blue-500 shadow-lg">
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{codiceOrdine}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {ordine.paziente.nome} {ordine.paziente.cognome}
              </p>
            </div>
            {getStatoBadge(ordine.statoPreparazione)}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Dati Paziente */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Destinatario</h3>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {ordine.paziente.nome} {ordine.paziente.cognome}
                </p>
                <p className="text-gray-700">{ordine.paziente.indirizzo}</p>
                <p className="text-gray-700">
                  {ordine.paziente.cap} {ordine.paziente.citta} (
                  {ordine.paziente.provincia})
                </p>
              </div>
            </div>

            {/* Farmaci da preparare */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Farmaci da preparare</h3>
              <div className="space-y-2">
                {ordine.farmaci && ordine.farmaci.length > 0 ? (
                  ordine.farmaci.map((farmaco, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${farmaciDisponibili[index]
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-semibold ${farmaciDisponibili[index] ? 'text-blue-900' : 'text-red-900'
                            }`}>
                            {farmaco.nome}
                          </p>
                        {farmaco.dosaggio && (
                          <p className={`text-sm ${farmaciDisponibili[index] ? 'text-blue-700' : 'text-red-700'
                              }`}>
                              {farmaco.dosaggio}
                          </p>
                        )}
                          <p className={`text-sm ${farmaciDisponibili[index] ? 'text-blue-600' : 'text-red-600'
                            }`}>
                            Quantità: {farmaco.quantita}
                          </p>
                        </div>

                        {inVerifica && (
                          <div className="flex flex-col gap-2 items-end">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={farmaciDisponibili[index]}
                                onCheckedChange={(checked) => {
                                  setFarmaciDisponibili(prev => ({
                                    ...prev,
                                    [index]: checked as boolean
                                  }));
                                }}
                              />
                              <span className="text-sm">Disponibile</span>
                            </div>

                            {!farmaciDisponibili[index] && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setFarmacoMancante(farmaco);
                                  setShowEccezioneDialog(true);
                                }}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Segnala
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-600">Nessun farmaco specificato</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {ordine.hasPromemoriaOriginale && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-amber-950">Promemoria originale</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    PDF originale inviato dal medico. Utile come riferimento tecnico per preparazione,
                    stampa e gestione fustelle.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={apriPromemoriaOriginale}
                  disabled={processing}
                  className="shrink-0"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Apri promemoria
                </Button>
              </div>
            </div>
          )}

          {/* Azioni */}
          <div className="space-y-3">
            {puoValutareDisponibilita && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        Verifica disponibilità iniziale
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Conferma quali farmaci sono presenti in farmacia. Se tutti risultano disponibili,
                        l’ordine passerà a <span className="font-semibold">Da preparare</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={confermaDisponibilita}
                  disabled={processing}
                  className="w-full text-lg py-6"
                >
                  <CheckCircle className="h-6 w-6 mr-3" />
                  {processing
                    ? 'Verifica in corso...'
                    : tuttiDisponibili
                      ? 'Conferma Disponibilità'
                      : 'Conferma Verifica e Attiva Fallback'}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Questo è il primo passaggio operativo della farmacia sul batch assegnato
                </p>
              </>
            )}

            {/* Step 1: Conferma Preparazione */}
            {daPreparare && (
              <>
                <Button
                  size="lg"
                  onClick={confermaPreparazione}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  <CheckCircle className="h-6 w-6 mr-3" />
                  {processing ? 'Conferma...' : 'Conferma Preparazione (Pacco Incartato)'}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Raccogli i farmaci → Incarta il pacco → Conferma qui
                </p>
              </>
            )}

            {/* Step 2: Stampa Etichetta */}
            {(ordine.statoPreparazione === 'in_preparazione' || ordine.statoPreparazione === 'preparato') && !ordine.etichettaStampata && (
              <>
                <Button
                  size="lg"
                  onClick={stampaEtichetta}
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
                >
                  <Printer className="h-6 w-6 mr-3" />
                  {processing ? 'Stampa...' : 'Stampa Etichetta'}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Stampa l'etichetta e applicala sul pacco incartato
                </p>
              </>
            )}

            {/* Step 3: Marca Pronto Ritiro */}
            {ordine.statoPreparazione === 'preparato' && ordine.etichettaStampata && (
              <>
                <Button
                  size="lg"
                  onClick={marcaProntoRitiro}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  <Truck className="h-6 w-6 mr-3" />
                  {processing ? 'Conferma...' : 'Pronto per Ritiro - Passa al Prossimo'}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  Etichetta applicata? Conferma e passa all'ordine successivo
                </p>
              </>
            )}

            {/* Ordine già completato */}
            {ordine.statoPreparazione === 'pronto_ritiro' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="text-lg font-semibold text-green-900">
                  Ordine pronto per il ritiro
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Questo ordine è stato completato e attende il ritiro da parte del rider
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/farmacia/batch/preparazione')}
                >
                  Torna alla lista
                </Button>
              </div>
            )}

            {ordine.statoPreparazione === 'ritirato' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Truck className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-lg font-semibold text-gray-900">
                  Ordine ritirato
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  Questo ordine è stato ritirato dal rider ed è in consegna
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/farmacia/batch/preparazione')}
                >
                  Torna alla lista
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Segnala Eccezione */}
      <Dialog open={showEccezioneDialog} onOpenChange={setShowEccezioneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Segnala Farmaco Mancante</DialogTitle>
            <DialogDescription>
              Indica il motivo per cui il farmaco non è disponibile
            </DialogDescription>
          </DialogHeader>

          {farmacoMancante && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">{farmacoMancante.nome}</p>
                {farmacoMancante.dosaggio && (
                  <p className="text-sm text-gray-600">{farmacoMancante.dosaggio}</p>
                )}
                <p className="text-sm text-gray-600">Quantità: {farmacoMancante.quantita}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Motivo mancanza
                </label>
                <Textarea
                  value={motivoMancanza}
                  onChange={(e) => setMotivoMancanza(e.target.value)}
                  placeholder="Es: Esaurito, In attesa rifornimento, Scaduto..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={segnalaFarmacoMancante}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? 'Segnalazione...' : 'Segnala Eccezione'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEccezioneDialog(false);
                    setFarmacoMancante(null);
                    setMotivoMancanza('');
                  }}
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
