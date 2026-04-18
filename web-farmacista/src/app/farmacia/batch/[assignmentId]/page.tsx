'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, KeyRound, Lock, Unlock, ShieldCheck } from 'lucide-react';
import {
  importPrivateKey,
  decryptEnvelope,
  readPemFile,
  type SensitiveOrderData,
  type EncryptedEnvelope,
} from '@/lib/pharmacy-crypto';

export default function FarmaciaBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const assignmentId = parseInt(params.assignmentId as string);

  const [disponibilita, setDisponibilita] = useState<
    Record<string, boolean | undefined>
  >({});

  // Crittografia client-side — la chiave privata NON transita mai sulla rete
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [keyTextInput, setKeyTextInput] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [decryptedOrders, setDecryptedOrders] = useState<
    Record<number, SensitiveOrderData>
  >({});

  const { data: dettaglio, isLoading } = useQuery({
    queryKey: ['farmacia-batch-detail', assignmentId],
    queryFn: async () => {
      const response = await api.get(
        `/farmacia/batch/assignments/${assignmentId}/dettaglio-completo`,
      );
      return response.data;
    },
  });

  const confermaMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post(
        `/farmacia/batch/assignments/${assignmentId}/conferma-disponibilita`,
        data,
      );
    },
    onSuccess: () => {
      toast.success('Disponibilità confermata con successo');
      queryClient.invalidateQueries({
        queryKey: ['farmacia-batch-detail', assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['farmacia-batch-assignments'],
      });
    },
    onError: () => {
      toast.error('Errore durante la conferma');
    },
  });

  const prontoRitiroMutation = useMutation({
    mutationFn: async (data: { orarioRitiroPreferito?: string; noteRitiro?: string }) => {
      await api.post(
        `/farmacia/batch/assignments/${assignmentId}/pronto-ritiro`,
        data,
      );
    },
    onSuccess: () => {
      toast.success('✅ Ordini marcati pronti per ritiro! Delivery sarà notificato.');
      queryClient.invalidateQueries({
        queryKey: ['farmacia-batch-detail', assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['farmacia-batch-assignments'],
      });
    },
    onError: () => {
      toast.error('Errore durante la segnalazione');
    },
  });

  const handleConferma = () => {
    if (!dettaglio?.farmaciConsolidati) return;

    const farmaciDisponibili = dettaglio.farmaciConsolidati
      .filter((f: any) => disponibilita[f.farmacoId] === true)
      .map((f: any) => f.farmacoId);

    const farmaciNonDisponibili = dettaglio.farmaciConsolidati
      .filter((f: any) => disponibilita[f.farmacoId] === false)
      .map((f: any) => ({
        farmacoId: f.farmacoId,
        note: 'Da ordinare',
      }));

    confermaMutation.mutate({
      farmaciDisponibili,
      farmaciNonDisponibili,
    });
  };

  const handleProntoRitiro = () => {
    const orarioRitiroPreferito = prompt(
      'Orario preferito per ritiro (es. 09:00-12:00):',
      '09:00-12:00'
    );

    const noteRitiro = prompt(
      'Note per delivery (opzionale):',
      ''
    );

    prontoRitiroMutation.mutate({
      orarioRitiroPreferito: orarioRitiroPreferito || undefined,
      noteRitiro: noteRitiro || undefined,
    });
  };

  // ─── Handlers crittografia client-side ─────────────────────────────────
  /**
   * Importa la chiave PEM e decifra tutti gli ordini del batch nel browser.
   * La chiave privata non lascia mai il browser (Web Crypto API).
   */
  const handleDecryptWithPem = async (pem: string) => {
    if (!dettaglio?.ordini?.length) return;
    setIsDecrypting(true);
    setKeyError(null);
    try {
      const key = await importPrivateKey(pem);
      setCryptoKey(key);
      const results: Record<number, SensitiveOrderData> = {};
      for (const ordine of dettaglio.ordini) {
        if (!ordine.datiCifrati) continue;
        try {
          results[ordine.id] = await decryptEnvelope(
            ordine.datiCifrati as EncryptedEnvelope,
            key,
          );
        } catch {
          // Un singolo ordine non decifrabile non blocca gli altri
        }
      }
      setDecryptedOrders(results);
      const count = Object.keys(results).length;
      toast.success(`🔓 ${count} ordini decifrati con successo`);
    } catch (e) {
      setKeyError(
        e instanceof Error ? e.message : 'Errore nella decifratura',
      );
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleKeyFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pem = await readPemFile(file);
      setKeyTextInput(pem);
      await handleDecryptWithPem(pem);
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : 'Errore lettura file');
    }
  };

  const handleClearKey = () => {
    setCryptoKey(null);
    setDecryptedOrders({});
    setKeyTextInput('');
    setKeyError(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dettaglio) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold mb-2">
              Batch non trovato
            </h3>
            <Button onClick={() => router.push('/farmacia/batch')}>
              Torna alla lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {dettaglio.assignment.batchWindow.nome}
          </h1>
          <p className="text-gray-600 mt-2">
            📍 Zona: {dettaglio.assignment.zonaGeografica} | 📅 Consegna:{' '}
            {new Date(
              dettaglio.assignment.batchWindow.dataConsegna,
            ).toLocaleDateString('it-IT')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/farmacia/batch')}>
          ← Torna alla lista
        </Button>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {dettaglio.riepilogo.totaleOrdini}
            </div>
            <div className="text-sm text-gray-600 mt-1">Ordini Totali</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {dettaglio.riepilogo.totaleFarmaci}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Confezioni Totali
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">
              {dettaglio.assignment.stato}
            </div>
            <div className="text-sm text-gray-600 mt-1">Stato</div>
          </CardContent>
        </Card>
      </div>

      {/* Farmaci Consolidati */}
      <Card>
        <CardHeader>
          <CardTitle>💊 Farmaci da Preparare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dettaglio.farmaciConsolidati.map((farmaco: any) => (
              <div
                key={farmaco.farmacoId}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">
                      {farmaco.nomeCommerciale}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Principio attivo: {farmaco.principioAttivo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confezioni richieste:{' '}
                      <span className="font-semibold">
                        {farmaco.confezioniTotali}
                      </span>{' '}
                      | Quantità totale: {farmaco.quantitaTotale}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Richiesto in {farmaco.ordiniRichiedenti.length} ordini
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant={
                        disponibilita[farmaco.farmacoId] === true
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() =>
                        setDisponibilita({
                          ...disponibilita,
                          [farmaco.farmacoId]: true,
                        })
                      }
                    >
                      ✅ Disponibile
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        disponibilita[farmaco.farmacoId] === false
                          ? 'destructive'
                          : 'outline'
                      }
                      onClick={() =>
                        setDisponibilita({
                          ...disponibilita,
                          [farmaco.farmacoId]: false,
                        })
                      }
                    >
                      ❌ Non Disponibile
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Pannello Crittografia Client-Side ─────────────────────────────── */}
      <Card
        className={`border-2 ${
          cryptoKey
            ? 'border-green-300 bg-green-50'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {cryptoKey ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-green-800">Chiave Caricata</span>
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800">Dati Sensibili Cifrati</span>
              </>
            )}
          </CardTitle>
          <p
            className={`text-sm ${
              cryptoKey ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            {cryptoKey
              ? `🔓 ${Object.keys(decryptedOrders).length} / ${
                  dettaglio.ordini.length
                } ordini decifrati. La chiave privata non ha mai lasciato il browser.`
              : 'Carica la chiave privata della farmacia per vedere i dati sensibili dei pazienti. La chiave NON viene mai inviata al server.'}
          </p>
        </CardHeader>
        <CardContent>
          {cryptoKey ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearKey}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🗑️ Rimuovi chiave dalla memoria
            </Button>
          ) : (
            <div className="space-y-3">
              {/* File upload */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <KeyRound className="h-4 w-4 mr-2" />
                    📂 Carica file .pem
                    <input
                      type="file"
                      accept=".pem,.key,.txt"
                      className="hidden"
                      onChange={handleKeyFileChange}
                    />
                  </label>
                </Button>
                <span className="text-xs text-gray-500">
                  oppure incolla il testo sotto
                </span>
              </div>

              {/* Textarea per incollare PEM */}
              <textarea
                className="w-full font-mono text-xs border rounded p-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                placeholder={`-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----`}
                value={keyTextInput}
                onChange={(e) => setKeyTextInput(e.target.value)}
              />

              {keyTextInput.includes('PRIVATE KEY') && (
                <Button
                  size="sm"
                  onClick={() => handleDecryptWithPem(keyTextInput)}
                  disabled={isDecrypting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isDecrypting
                    ? '⏳ Decifratura in corso...'
                    : '🔓 Decifra Ordini'}
                </Button>
              )}

              {keyError && (
                <p className="text-sm text-red-600">❌ {keyError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista Ordini */}
      <Card>
        <CardHeader>
          <CardTitle>
            📦 Ordini Assegnati ({dettaglio.ordini.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dettaglio.ordini.map((ordine: any) => {
              const delivery = ordine.datiDelivery as any;
              const sensitive = decryptedOrders[ordine.id];
              return (
                <Card
                  key={ordine.id}
                  className="border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/farmacia/batch/ordine/${ordine.id}`)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Header ordine */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold">
                            {ordine.ordine?.codiceOrdine ||
                              `Ordine #${ordine.ordineId}`}
                          </span>
                          <Badge
                            variant={
                              ordine.statoPreparazione === 'completato'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {ordine.statoPreparazione || 'da_preparare'}
                          </Badge>
                          {ordine.posizioneInBatch && (
                            <Badge variant="outline">
                              #{ordine.posizioneInBatch}
                            </Badge>
                          )}
                        </div>

                        {/* Dati delivery — sempre visibili (logistica) */}
                        {delivery && (
                          <>
                            <p className="font-medium text-gray-700">
                              {delivery.destinatarioNome || '—'}
                            </p>
                            <p className="text-sm text-gray-600">
                              📍 {delivery.indirizzo}, {delivery.citta}{' '}
                              {delivery.cap}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              🚚 Zona: {delivery.zona} | Priorità:{' '}
                              {delivery.priorita}
                              {delivery.finestraOraria &&
                                ` | 🕐 ${delivery.finestraOraria}`}
                            </p>
                          </>
                        )}

                        {/* Dati sensibili — visibili solo dopo decifratura */}
                        {sensitive ? (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            <p className="font-semibold text-green-800">
                              <Unlock className="h-3 w-3 inline mr-1" />
                              {sensitive.pazienteNome} {sensitive.pazienteCognome}
                              {sensitive.pazienteTelefono && (
                                <span className="text-green-600 font-normal ml-2">
                                  📞 {sensitive.pazienteTelefono}
                                </span>
                              )}
                            </p>
                            {(sensitive.farmaci?.length > 0 ||
                              (sensitive.farmaciDaBanco?.length ?? 0) > 0) && (
                              <ul className="mt-1 text-green-700 space-y-0.5">
                                {sensitive.farmaci?.map((f, i) => (
                                  <li key={i}>
                                    💊 {f.nomeCommerciale} × {f.quantita}
                                    {f.posologia && (
                                      <span className="text-green-600">
                                        {' '}— {f.posologia}
                                      </span>
                                    )}
                                  </li>
                                ))}
                                {sensitive.farmaciDaBanco?.map((f, i) => (
                                  <li key={`otc-${i}`}>
                                    🏪 {f.nomeCommerciale} × {f.quantita}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {sensitive.numeroRicetta && (
                              <p className="text-xs text-green-600 mt-1">
                                📋 Ricetta: {sensitive.numeroRicetta}
                                {sensitive.codiceNre &&
                                  ` | NRE: ${sensitive.codiceNre}`}
                              </p>
                            )}
                            {sensitive.noteMedico && (
                              <p className="text-xs text-amber-700 mt-1">
                                📝 {sensitive.noteMedico}
                              </p>
                            )}
                            {sensitive.fotoTalloncinoUrl && (
                              <a
                                href={sensitive.fotoTalloncinoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📷 Vedi foto talloncino OTC
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                            <Lock className="h-3 w-3" />
                            <span>
                              Dati sensibili cifrati — carica la chiave per
                              visualizzare
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {sensitive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-300"
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Decifrato
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-gray-400 border-gray-200"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Cifrato
                          </Badge>
                        )}
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Azioni */}
      <div className="flex gap-4">
        <Button
          onClick={handleConferma}
          disabled={confermaMutation.isPending || dettaglio.assignment.stato === 'confermato' || dettaglio.assignment.stato === 'pronto_ritiro'}
          className="bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {confermaMutation.isPending ? (
            <>⏳ Conferma in corso...</>
          ) : dettaglio.assignment.stato === 'confermato' || dettaglio.assignment.stato === 'pronto_ritiro' ? (
            <>✅ Disponibilità Confermata</>
          ) : (
            <>✅ Conferma Disponibilità</>
          )}
        </Button>

        {dettaglio.assignment.stato === 'confermato' && (
          <Button
            onClick={handleProntoRitiro}
            disabled={prontoRitiroMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {prontoRitiroMutation.isPending ? (
              <>⏳ Segnalazione in corso...</>
            ) : (
              <>🚚 Tutto Pronto per Ritiro</>
            )}
          </Button>
        )}

        {dettaglio.assignment.stato === 'pronto_ritiro' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <span className="text-2xl">✅</span>
            <span className="font-semibold">Ordini pronti! Delivery notificato.</span>
          </div>
        )}

        <Button variant="outline" size="lg">
          📞 Contatta Supporto
        </Button>
      </div>
    </div>
  );
}
