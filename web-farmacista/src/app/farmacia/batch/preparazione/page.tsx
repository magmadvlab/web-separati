'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Printer,
  CheckCircle,
  Clock,
  Truck,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Farmaco {
  nome: string;
  quantita: number;
  principioAttivo?: string;
  dosaggio?: string;
}

interface Ordine {
  id: number;
  numeroOrdine: string;
  codiceOrdine?: string;
  paziente: {
    nome: string;
    cognome: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
    telefono?: string;
  };
  statoPreparazione: string;
  etichettaStampata: boolean;
  numeroEtichetta?: string;
  farmaci: Farmaco[];
  priorita?: string;
  totale?: number;
  metodoPagamento?: string;
  statoPagamento?: string;
  importoPagato?: number;
}

interface BatchWindow {
  batchWindow: {
    id: number;
    nome: string;
    dataConsegna: string;
  };
  assignment: {
    id: number;
    zonaGeografica: string;
    stato?: string;
    dataConfermaFarmacia?: string | null;
  };
  deliveryNotificato?: boolean;
  deliveryNotification?: {
    id: number;
    statoNotifica: string;
    dataNotifica: string;
  } | null;
  ordiniTotali: number;
  ordiniPreparati: number;
  ordiniPronti: number;
  ordini: Ordine[];
}

export default function BatchPreparazionePage() {
  const [batches, setBatches] = useState<BatchWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const res = await api.get('/farmacia/batch/ordini-da-preparare');
      setBatches(res.data);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare ordini batch',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toCurrency = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.round(parsed * 100) / 100;
  };

  const calcolaImportoDaIncassare = (ordine: Ordine) => {
    const metodo = String(ordine.metodoPagamento || '').toLowerCase();
    const statoPagamento = String(ordine.statoPagamento || '').toLowerCase();

    if (metodo === 'contrassegno' || statoPagamento === 'collecting' || statoPagamento === 'pending') {
      return toCurrency(ordine.totale);
    }

    return 0;
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const stampaDistintaBatch = (batch: BatchWindow) => {
    const ordiniPronti = batch.ordini.filter((ordine) => ordine.statoPreparazione === 'pronto_ritiro');
    const ordiniPerDistinta = ordiniPronti.length > 0 ? ordiniPronti : batch.ordini;

    const totaleIncasso = ordiniPerDistinta.reduce(
      (sum, ordine) => sum + calcolaImportoDaIncassare(ordine),
      0,
    );

    const righeOrdini = ordiniPerDistinta
      .map((ordine, idx) => {
        const codice = ordine.numeroOrdine || ordine.codiceOrdine || `#${ordine.id}`;
        const paziente = `${ordine.paziente.nome} ${ordine.paziente.cognome}`.trim();
        const indirizzo = `${ordine.paziente.indirizzo}, ${ordine.paziente.cap} ${ordine.paziente.citta} (${ordine.paziente.provincia})`;
        const incasso = calcolaImportoDaIncassare(ordine);
        const telefono = ordine.paziente.telefono ? escapeHtml(ordine.paziente.telefono) : '-';

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(codice)}</td>
            <td>${escapeHtml(paziente)}</td>
            <td>${escapeHtml(indirizzo)}</td>
            <td>${telefono}</td>
            <td>EUR ${incasso.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <html>
        <head>
          <title>Distinta Ritiro Batch ${escapeHtml(batch.batchWindow.nome)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px 0; font-size: 22px; }
            .meta { margin-bottom: 16px; font-size: 12px; color: #4b5563; }
            .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 16px; background: #f9fafb; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
            .totale { margin-top: 12px; font-weight: 700; font-size: 14px; }
            .note { margin-top: 12px; font-size: 12px; line-height: 1.4; }
            .firme { margin-top: 28px; display: flex; justify-content: space-between; gap: 24px; font-size: 12px; }
            .firma { flex: 1; border-top: 1px solid #9ca3af; padding-top: 6px; text-align: center; min-height: 48px; }
            .actions { margin-top: 16px; display: flex; justify-content: flex-end; }
            .print-button { border: 0; border-radius: 8px; background: #2563eb; color: white; padding: 10px 16px; font-size: 13px; cursor: pointer; }
            @media print { body { padding: 8px; } }
            @media print { .actions { display: none; } }
          </style>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () {
                try {
                  window.focus();
                  window.print();
                } catch (error) {
                  console.error('Print failed', error);
                }
              }, 400);
            });
          </script>
        </head>
        <body>
          <h1>Riepilogo Ritiro Batch</h1>
          <div class="meta">
            Generata da Farmacia · ${new Date().toLocaleString('it-IT')}
          </div>
          <div class="box">
            <div><strong>Batch:</strong> ${escapeHtml(batch.batchWindow.nome)}</div>
            <div><strong>Assignment:</strong> #${batch.assignment.id} · <strong>Zona:</strong> ${escapeHtml(batch.assignment.zonaGeografica)}</div>
            <div><strong>Consegna pianificata:</strong> ${new Date(batch.batchWindow.dataConsegna).toLocaleDateString('it-IT')}</div>
            <div><strong>Documento logistico:</strong> nessun elenco farmaci incluso</div>
            <div><strong>Stato stampa:</strong> ${ordiniPronti.length > 0 ? 'ordini pronti per ritiro inclusi' : 'riepilogo batch preliminare'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ordine</th>
                <th>Paziente</th>
                <th>Indirizzo Consegna</th>
                <th>Telefono</th>
                <th>Incasso da Effettuare</th>
              </tr>
            </thead>
            <tbody>
              ${righeOrdini}
            </tbody>
          </table>
          <div class="totale">Totale incasso previsto: EUR ${totaleIncasso.toFixed(2)}</div>
          <div class="note">
            <strong>Nota operativa:</strong> questo riepilogo serve solo al passaggio farmacia → delivery.
            Non contiene il dettaglio dei farmaci. Il rider vede solo dati logistici e di consegna.
            ${ordiniPronti.length === 0 ? '<br /><strong>Attenzione:</strong> nessun ordine del batch risulta ancora in stato pronto ritiro.' : ''}
          </div>
          <div class="firme">
            <div class="firma">Firma Farmacia</div>
            <div class="firma">Firma Rider (ritiro)</div>
          </div>
          <div class="actions">
            <button class="print-button" onclick="window.print()">Stampa di nuovo</button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('about:blank', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      toast({
        title: 'Popup bloccato',
        description: 'Abilita i popup per stampare la distinta',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const notificaDelivery = async (batch: BatchWindow) => {
    const ordiniProntiDettaglio = batch.ordini.filter(
      (o) => o.statoPreparazione === 'pronto_ritiro',
    );
    const ordiniPronti = ordiniProntiDettaglio.map((o) => o.id);

    if (ordiniPronti.length === 0) {
      toast({
        title: 'Nessun ordine pronto',
        description: 'Non ci sono ordini pronti per il ritiro',
        variant: 'destructive'
      });
      return;
    }

    try {
      const incassoPrevisto = ordiniProntiDettaglio.reduce(
        (sum, ordine) => sum + calcolaImportoDaIncassare(ordine),
        0,
      );

      const res = await api.post('/farmacia/batch/notifica-ordini-pronti', {
        batchAssignmentId: batch.assignment.id,
        ordiniPronti,
        noteRitiro: `${ordiniPronti.length} ordini pronti per ritiro | Incasso previsto EUR ${incassoPrevisto.toFixed(2)}`
      });

      await loadBatches();

      toast({
        title: res.data.alreadyNotified ? 'Delivery già notificato' : 'Delivery notificato',
        description: res.data.alreadyNotified
          ? 'Il batch era già stato consegnato alla logistica'
          : `${res.data.ordiniNotificati} ordini notificati`
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile notificare Delivery',
        variant: 'destructive'
      });
    }
  };

  const getStatoBadge = (stato: string) => {
    const config: Record<string, { label: string; variant: 'secondary' | 'default'; icon: any }> = {
      in_verifica: { label: 'In verifica', variant: 'secondary' as const, icon: Clock },
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
          <p>Caricamento ordini batch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Preparazione Ordini Batch</h1>
      </div>

      {/* LISTA BATCH */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">
              Nessun ordine batch da preparare
            </p>
          </CardContent>
        </Card>
      ) : (
        batches.map((batch) => {
          const progressPercentuale =
            (batch.ordiniPreparati / batch.ordiniTotali) * 100;

          return (
            <Card key={batch.batchWindow.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{batch.batchWindow.nome}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Zona: {batch.assignment.zonaGeografica}
                    </p>
                    <p className="text-sm text-gray-600">
                      Consegna:{' '}
                      {new Date(batch.batchWindow.dataConsegna).toLocaleDateString('it-IT')}
                    </p>
                    {batch.deliveryNotificato && batch.deliveryNotification?.dataNotifica && (
                      <p className="text-sm text-emerald-700 mt-1">
                        Delivery notificato il{' '}
                        {new Date(batch.deliveryNotification.dataNotifica).toLocaleString('it-IT')}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => notificaDelivery(batch)}
                    disabled={batch.ordiniPronti === 0 || batch.deliveryNotificato}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {batch.deliveryNotificato
                      ? 'Delivery notificato'
                      : `Notifica Delivery (${batch.ordiniPronti})`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => stampaDistintaBatch(batch)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Stampa Distinta
                  </Button>
                </div>

                {!batch.deliveryNotificato && batch.ordiniPronti === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    La notifica delivery e la distinta di ritiro si attivano quando almeno un ordine passa a <strong>Pronto ritiro</strong>.
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso preparazione</span>
                    <span>
                      {batch.ordiniPreparati} / {batch.ordiniTotali}
                    </span>
                  </div>
                  <Progress value={progressPercentuale} />
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {batch.ordini.map((ordine) => {
                    const codiceOrdine =
                      ordine.numeroOrdine || ordine.codiceOrdine || `Ordine #${ordine.id}`;
                    return (
                      <Card
                        key={ordine.id}
                        className="border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/farmacia/batch/ordine/${ordine.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-lg">
                                  {codiceOrdine}
                                </span>
                                {getStatoBadge(ordine.statoPreparazione)}
                                {ordine.etichettaStampata && (
                                  <Badge variant="outline">
                                    <Printer className="h-3 w-3 mr-1" />
                                    Etichetta stampata
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm font-medium">
                                {ordine.paziente.nome} {ordine.paziente.cognome}
                              </p>
                              <p className="text-sm text-gray-600">
                                {ordine.paziente.indirizzo}
                              </p>
                              <p className="text-sm text-gray-600">
                                {ordine.paziente.cap} {ordine.paziente.citta} (
                                {ordine.paziente.provincia})
                              </p>

                              <p className="text-sm text-gray-600 mt-2">
                                {ordine.farmaci?.length || 0} farmaci
                                {ordine.statoPreparazione === 'in_verifica' && (
                                  <span className="ml-2 text-blue-600">
                                    · verifica disponibilità richiesta
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
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
          );
        })
      )}
    </div>
  );
}
