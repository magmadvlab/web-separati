'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Farmaco {
  farmacoId?: number;
  nomeFarmaco: string;
  principioAttivo?: string;
  quantitaRichiesta: number;
  disponibile: boolean;
  quantitaDisponibile: number;
}

interface Ordine {
  id: number;
  numeroOrdine: string;
  paziente: {
    nome: string;
    cognome: string;
    indirizzo: string;
    citta: string;
  };
  farmaci: Farmaco[];
}

interface BatchWindow {
  id: number;
  nome: string;
  dataConsegna: string;
}

interface OrdineInVerifica {
  ordine: {
    id: number;
    numeroOrdine: string;
    paziente: {
      nome: string;
      cognome: string;
      indirizzo: string;
      citta: string;
    };
  };
  batchAssignment: {
    batchWindow: BatchWindow;
  };
}

export default function VerificaDisponibilitaPage() {
  const [ordini, setOrdini] = useState<OrdineInVerifica[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Stato per tracking disponibilità farmaci per ogni ordine
  const [farmaciStato, setFarmaciStato] = useState<Record<number, Farmaco[]>>({});

  useEffect(() => {
    loadOrdiniInVerifica();
  }, []);

  const loadOrdiniInVerifica = async () => {
    try {
      const res = await fetch('/api/farmacia/batch/ordini-in-verifica', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOrdini(data.ordini || []);
        
        // Inizializza stato farmaci (mock - in produzione verrebbero dal backend)
        const iniziale: Record<number, Farmaco[]> = {};
        data.ordini?.forEach((ord: OrdineInVerifica) => {
          // Mock: genera lista farmaci per demo
          iniziale[ord.ordine.id] = [
            {
              nomeFarmaco: 'Tachipirina 1000mg',
              principioAttivo: 'Paracetamolo',
              quantitaRichiesta: 2,
              disponibile: true,
              quantitaDisponibile: 2
            },
            {
              nomeFarmaco: 'Aspirina 100mg',
              principioAttivo: 'Acido Acetilsalicilico',
              quantitaRichiesta: 1,
              disponibile: true,
              quantitaDisponibile: 1
            }
          ];
        });
        setFarmaciStato(iniziale);
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare ordini in verifica',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilita = (ordineId: number, farmacoIndex: number) => {
    setFarmaciStato(prev => {
      const farmaci = [...(prev[ordineId] || [])];
      farmaci[farmacoIndex] = {
        ...farmaci[farmacoIndex],
        disponibile: !farmaci[farmacoIndex].disponibile,
        quantitaDisponibile: !farmaci[farmacoIndex].disponibile 
          ? farmaci[farmacoIndex].quantitaRichiesta 
          : 0
      };
      return { ...prev, [ordineId]: farmaci };
    });
  };

  const updateQuantita = (ordineId: number, farmacoIndex: number, quantita: number) => {
    setFarmaciStato(prev => {
      const farmaci = [...(prev[ordineId] || [])];
      farmaci[farmacoIndex] = {
        ...farmaci[farmacoIndex],
        quantitaDisponibile: quantita,
        disponibile: quantita >= farmaci[farmacoIndex].quantitaRichiesta
      };
      return { ...prev, [ordineId]: farmaci };
    });
  };

  const confermaVerifica = async (ordineId: number) => {
    const farmaci = farmaciStato[ordineId];
    if (!farmaci) return;

    setVerificando(ordineId);

    try {
      const res = await fetch(`/api/farmacia/batch/ordini/${ordineId}/conferma-disponibilita`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ farmaci })
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.tuttiDisponibili) {
          toast({
            title: 'Verifica completata',
            description: `Tutti i farmaci disponibili. Ordine pronto per preparazione.`
          });
        } else {
          toast({
            title: 'Fallback attivato',
            description: `${data.farmaciMancanti} farmaci mancanti. Sistema fallback attivato per trovare farmacie backup.`,
            variant: 'default'
          });
        }

        // Ricarica lista
        await loadOrdiniInVerifica();
      } else {
        throw new Error('Errore conferma');
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile confermare disponibilità',
        variant: 'destructive'
      });
    } finally {
      setVerificando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Caricamento ordini in verifica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Verifica Disponibilità Farmaci</h1>
          <p className="text-gray-600 mt-1">
            Verifica la disponibilità dei farmaci prima di iniziare la preparazione
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="h-4 w-4 mr-2" />
          {ordini.length} ordini in verifica
        </Badge>
      </div>

      {ordini.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <p className="text-lg text-gray-600">
              Nessun ordine in attesa di verifica disponibilità
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordini.map((item) => {
            const farmaci = farmaciStato[item.ordine.id] || [];
            const tuttiDisponibili = farmaci.every(f => f.disponibile);
            const nessunoDisponibile = farmaci.every(f => !f.disponibile);

            return (
              <Card key={item.ordine.id} className="border-2">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {item.ordine.numeroOrdine}
                        {tuttiDisponibili && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Tutti disponibili
                          </Badge>
                        )}
                        {nessunoDisponibile && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Nessuno disponibile
                          </Badge>
                        )}
                        {!tuttiDisponibili && !nessunoDisponibile && (
                          <Badge variant="secondary">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Parzialmente disponibile
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.ordine.paziente.nome} {item.ordine.paziente.cognome}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.ordine.paziente.indirizzo}, {item.ordine.paziente.citta}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Batch: {item.batchAssignment.batchWindow.nome} - 
                        Consegna: {new Date(item.batchAssignment.batchWindow.dataConsegna).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-3">Farmaci da verificare:</h3>
                    
                    {farmaci.map((farmaco, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 border rounded-lg ${
                          farmaco.disponibile ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={farmaco.disponibile}
                            onCheckedChange={() => toggleDisponibilita(item.ordine.id, idx)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{farmaco.nomeFarmaco}</p>
                                {farmaco.principioAttivo && (
                                  <p className="text-sm text-gray-600">{farmaco.principioAttivo}</p>
                                )}
                              </div>
                              <Badge variant={farmaco.disponibile ? 'default' : 'destructive'}>
                                {farmaco.disponibile ? 'Disponibile' : 'Non disponibile'}
                              </Badge>
                            </div>

                            <div className="mt-3 flex items-center gap-4">
                              <div>
                                <Label className="text-xs text-gray-600">Quantità richiesta</Label>
                                <p className="font-semibold">{farmaco.quantitaRichiesta}</p>
                              </div>
                              
                              <div className="flex-1 max-w-xs">
                                <Label htmlFor={`qty-${item.ordine.id}-${idx}`} className="text-xs text-gray-600">
                                  Quantità disponibile
                                </Label>
                                <Input
                                  id={`qty-${item.ordine.id}-${idx}`}
                                  type="number"
                                  min="0"
                                  max={farmaco.quantitaRichiesta}
                                  value={farmaco.quantitaDisponibile}
                                  onChange={(e) => updateQuantita(item.ordine.id, idx, parseInt(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/farmacia/batch/preparazione')}
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={() => confermaVerifica(item.ordine.id)}
                        disabled={verificando === item.ordine.id}
                        className={tuttiDisponibili ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {verificando === item.ordine.id ? (
                          <>
                            <Package className="h-4 w-4 mr-2 animate-spin" />
                            Verifica in corso...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Conferma Verifica
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
