'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

interface PendingFallbackItem {
  fallbackId: number;
  ordineId: number;
  codiceOrdine: string;
  paziente: string;
  indirizzoConsegna: string;
  farmaciaOriginale: string;
  distanzaDalPazienteKm: number;
  farmaciRichiesti: Array<{ nome?: string; quantita?: number; principioAttivo?: string }>;
  batchNome: string;
  dataConsegna: string;
  dataProposta: string;
}

interface BatchAssignmentItem {
  id: number;
  zonaGeografica: string;
  batchWindow: {
    nome: string;
    dataConsegna: string;
  };
}

interface FallbackStatoBatch {
  riepilogo?: {
    totaleOrdiniConFallback: number;
    totaleFallbackProposti: number;
    totaleFallbackAccettati: number;
    totaleFallbackRifiutati: number;
    totaleFallbackCompletati: number;
  };
  fallbacks?: Array<{
    id: number;
    codiceOrdine: string;
    farmaciaOriginale: string;
    farmaciaBackup: string;
    livelloFallback: number;
    stato: string;
    dataProposta: string;
  }>;
}

type AssignmentFallbackView = {
  assignmentId: number;
  zonaGeografica: string;
  batchNome: string;
  dataConsegna: string;
  riepilogo: NonNullable<FallbackStatoBatch['riepilogo']>;
  fallbacks: NonNullable<FallbackStatoBatch['fallbacks']>;
};

const emptyRiepilogo = {
  totaleOrdiniConFallback: 0,
  totaleFallbackProposti: 0,
  totaleFallbackAccettati: 0,
  totaleFallbackRifiutati: 0,
  totaleFallbackCompletati: 0,
};

export default function FarmaciaBatchFallbackPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingFallbackId, setSavingFallbackId] = useState<number | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingFallbackItem[]>([]);
  const [assignmentFallbacks, setAssignmentFallbacks] = useState<AssignmentFallbackView[]>([]);
  const [noteByFallbackId, setNoteByFallbackId] = useState<Record<number, string>>({});
  const [filterText, setFilterText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);

      const [pendingResponse, assignmentsResponse] = await Promise.all([
        api.get<PendingFallbackItem[]>('/delivery/batch/fallback/farmacia/pendenti'),
        api.get<BatchAssignmentItem[]>('/farmacia/batch/assignments'),
      ]);

      const pending = Array.isArray(pendingResponse.data) ? pendingResponse.data : [];
      const assignments = Array.isArray(assignmentsResponse.data)
        ? assignmentsResponse.data
        : [];

      setPendingItems(pending);

      const assignmentFallbackResults = await Promise.all(
        assignments.map(async (assignment) => {
          try {
            const statoResponse = await api.get<FallbackStatoBatch>(
              `/delivery/batch/fallback/assignment/${assignment.id}/stato`,
            );
            const stato = statoResponse.data || {};
            const riepilogo = stato.riepilogo || emptyRiepilogo;
            const fallbacks = stato.fallbacks || [];

            if ((riepilogo.totaleOrdiniConFallback || 0) === 0 && fallbacks.length === 0) {
              return null;
            }

            return {
              assignmentId: assignment.id,
              zonaGeografica: assignment.zonaGeografica,
              batchNome: assignment.batchWindow?.nome || `Batch #${assignment.id}`,
              dataConsegna: assignment.batchWindow?.dataConsegna,
              riepilogo,
              fallbacks,
            } as AssignmentFallbackView;
          } catch (error) {
            console.warn(
              `Impossibile caricare fallback per assignment farmacia ${assignment.id}`,
              error,
            );
            return null;
          }
        }),
      );

      setAssignmentFallbacks(
        assignmentFallbackResults
          .filter((item): item is AssignmentFallbackView => item !== null)
          .sort(
            (a, b) =>
              new Date(b.dataConsegna || 0).getTime() - new Date(a.dataConsegna || 0).getTime(),
          ),
      );
    } catch (error: any) {
      toast({
        title: 'Errore caricamento',
        description:
          error?.response?.data?.message ||
          'Impossibile caricare stato fallback batch',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPending = useMemo(() => {
    const key = filterText.trim().toLowerCase();
    if (!key) {
      return pendingItems;
    }

    return pendingItems.filter((item) => {
      return (
        item.codiceOrdine?.toLowerCase().includes(key)
        || item.batchNome?.toLowerCase().includes(key)
        || item.farmaciaOriginale?.toLowerCase().includes(key)
        || item.paziente?.toLowerCase().includes(key)
      );
    });
  }, [pendingItems, filterText]);

  const riepilogoTotale = useMemo(() => {
    return assignmentFallbacks.reduce(
      (acc, item) => {
        acc.totaleOrdiniConFallback += item.riepilogo.totaleOrdiniConFallback || 0;
        acc.totaleFallbackProposti += item.riepilogo.totaleFallbackProposti || 0;
        acc.totaleFallbackAccettati += item.riepilogo.totaleFallbackAccettati || 0;
        acc.totaleFallbackRifiutati += item.riepilogo.totaleFallbackRifiutati || 0;
        acc.totaleFallbackCompletati += item.riepilogo.totaleFallbackCompletati || 0;
        return acc;
      },
      { ...emptyRiepilogo },
    );
  }, [assignmentFallbacks]);

  const submitDecision = async (fallbackId: number, accettato: boolean) => {
    try {
      setSavingFallbackId(fallbackId);
      await api.post(`/delivery/batch/fallback/${fallbackId}/rispondi`, {
        accettato,
        note: noteByFallbackId[fallbackId] || undefined,
      });

      toast({
        title: accettato ? 'Fallback accettato' : 'Fallback rifiutato',
        description: accettato
          ? 'Ordine riassegnato correttamente alla tua farmacia'
          : 'Il sistema ha provato automaticamente la prossima farmacia disponibile',
      });

      setNoteByFallbackId((prev) => {
        const next = { ...prev };
        delete next[fallbackId];
        return next;
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: 'Errore operazione',
        description:
          error?.response?.data?.message ||
          'Impossibile aggiornare lo stato fallback',
        variant: 'destructive',
      });
    } finally {
      setSavingFallbackId(null);
    }
  };

  const getStatoBadgeClass = (stato: string) => {
    const key = (stato || '').toLowerCase();
    if (key === 'accettato' || key === 'completato') {
      return 'bg-green-100 text-green-800';
    }
    if (key === 'rifiutato' || key === 'annullato') {
      return 'bg-red-100 text-red-800';
    }
    if (key === 'proposto') {
      return 'bg-amber-100 text-amber-800';
    }
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Fallback Batch Multi-Farmacia</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci ordini mancanti riassegnati per prossimita del paziente
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={savingFallbackId !== null}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ordini con fallback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riepilogoTotale.totaleOrdiniConFallback}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Accettati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{riepilogoTotale.totaleFallbackAccettati}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rifiutati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riepilogoTotale.totaleFallbackRifiutati}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{riepilogoTotale.totaleFallbackCompletati}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fallback da valutare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filtra per ordine, batch, farmacia o paziente"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
          />

          {filteredPending.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nessun fallback pendente per la tua farmacia.
            </p>
          )}

          {filteredPending.map((item) => (
            <div key={item.fallbackId} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {item.codiceOrdine} · {item.batchNome}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Da: {item.farmaciaOriginale} · Distanza paziente: {Number(item.distanzaDalPazienteKm || 0).toFixed(1)} km
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-800">Proposto</Badge>
              </div>

              <div className="text-sm">
                <p><span className="font-medium">Paziente:</span> {item.paziente}</p>
                <p><span className="font-medium">Consegna:</span> {item.indirizzoConsegna}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Farmaci mancanti richiesti:</p>
                <div className="flex flex-wrap gap-2">
                  {(item.farmaciRichiesti || []).map((farmaco, index) => (
                    <span
                      key={`${item.fallbackId}-${index}`}
                      className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-800"
                    >
                      {(farmaco?.nome || 'Farmaco')} x{Number(farmaco?.quantita || 1)}
                    </span>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Nota opzionale (motivo accettazione/rifiuto)"
                value={noteByFallbackId[item.fallbackId] || ''}
                onChange={(event) =>
                  setNoteByFallbackId((prev) => ({
                    ...prev,
                    [item.fallbackId]: event.target.value,
                  }))
                }
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void submitDecision(item.fallbackId, true)}
                  disabled={savingFallbackId === item.fallbackId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingFallbackId === item.fallbackId ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Accetta fallback
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void submitDecision(item.fallbackId, false)}
                  disabled={savingFallbackId === item.fallbackId}
                >
                  {savingFallbackId === item.fallbackId ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rifiuta fallback
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Stato riassegnazioni sui batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignmentFallbacks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nessuna riassegnazione fallback presente sui tuoi batch.
            </p>
          )}

          {assignmentFallbacks.map((item) => (
            <div key={item.assignmentId} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {item.batchNome} · Assignment #{item.assignmentId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Zona: {item.zonaGeografica} · Consegna:{' '}
                    {item.dataConsegna
                      ? new Date(item.dataConsegna).toLocaleDateString('it-IT')
                      : '-'}
                  </p>
                </div>
                <Badge variant="outline">
                  Ordini con fallback: {item.riepilogo.totaleOrdiniConFallback}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="px-2 py-1 rounded bg-amber-100 text-amber-800">
                  Proposti: {item.riepilogo.totaleFallbackProposti}
                </div>
                <div className="px-2 py-1 rounded bg-green-100 text-green-800">
                  Accettati: {item.riepilogo.totaleFallbackAccettati}
                </div>
                <div className="px-2 py-1 rounded bg-red-100 text-red-800">
                  Rifiutati: {item.riepilogo.totaleFallbackRifiutati}
                </div>
                <div className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                  Completati: {item.riepilogo.totaleFallbackCompletati}
                </div>
              </div>

              <div className="space-y-2">
                {item.fallbacks.slice(0, 8).map((fallback) => (
                  <div
                    key={fallback.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs"
                  >
                    <div>
                      <span className="font-medium">{fallback.codiceOrdine}</span>
                      {' '}· {fallback.farmaciaOriginale} → {fallback.farmaciaBackup}
                      {' '}· L{fallback.livelloFallback}
                    </div>
                    <span className={`px-2 py-0.5 rounded ${getStatoBadgeClass(fallback.stato)}`}>
                      {fallback.stato}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
