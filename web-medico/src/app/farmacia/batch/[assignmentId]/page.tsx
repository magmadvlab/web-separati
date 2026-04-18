'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function FarmaciaBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const assignmentId = parseInt(params.assignmentId as string);

  const [disponibilita, setDisponibilita] = useState<
    Record<string, boolean | undefined>
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

      {/* Lista Ordini */}
      <Card>
        <CardHeader>
          <CardTitle>
            📦 Ordini Assegnati ({dettaglio.ordini.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dettaglio.ordini.map((ordine: any) => (
              <div
                key={ordine.id}
                className="border-b py-3 hover:bg-gray-50 transition px-2 rounded"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      Ordine #{ordine.id} - {ordine.paziente.nome}{' '}
                      {ordine.paziente.cognome}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      📍 {ordine.paziente.indirizzo}, {ordine.paziente.citta}{' '}
                      {ordine.paziente.cap}
                    </div>
                    {ordine.prescrizione && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ricetta: {ordine.prescrizione.numeroRicetta} | NRE:{' '}
                        {ordine.prescrizione.codiceNre}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">
                    📞 {ordine.paziente.telefono}
                  </Badge>
                </div>
              </div>
            ))}
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
