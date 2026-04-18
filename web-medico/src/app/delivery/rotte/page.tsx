'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, Clock, Truck, CheckCircle, AlertCircle } from 'lucide-react';

interface DeliveryPoint {
  id: number;
  tipo: 'farmacia' | 'consegna';
  indirizzo: string;
  priorita: 'normale' | 'urgente' | 'critico';
  stato_consegna?: string;
  tempo_stimato_minuti: number;
  ordineId?: number;
}

interface OptimizedRoute {
  riderId: number;
  punti: DeliveryPoint[];
  distanza_totale_km: number;
  tempo_totale_minuti: number;
  risparmio_km: number;
  risparmio_minuti: number;
  algoritmo_usato: string;
}

export default function RotteDeliveryPage() {
  const [rotta, setRotta] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [puntoCorrente, setPuntoCorrente] = useState(0);
  const { toast } = useToast();

  // Simula caricamento rotta
  useEffect(() => {
    loadActiveRoute();
  }, []);

  const loadActiveRoute = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<OptimizedRoute | null>>(
        '/delivery/rotte/attiva',
      );
      setRotta(response.data.data ?? null);
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error?.response?.data?.message || 'Impossibile caricare la rotta',
        variant: 'destructive',
      });
      setRotta(null);
    } finally {
      setLoading(false);
    }
  };

  const ottimizzaRotta = async () => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse<OptimizedRoute>>(
        '/delivery/rotte/ottimizza',
        {
          priorita_urgenze: true,
          rispetta_finestre_consegna: true,
        },
      );
      setRotta(response.data.data);
      setPuntoCorrente(0);
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error?.response?.data?.message || 'Impossibile ottimizzare la rotta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const completaConsegna = async (puntoId: number, ordineId?: number) => {
    if (rotta) {
      if (ordineId) {
        try {
          await api.put(`/delivery/rotte/ordini/${ordineId}/stato`, {
            stato: 'completata',
          });
        } catch (_error) {
          // Non bloccare l'UI se la sync fallisce
        }
      }

      const puntiAggiornati = rotta.punti.map(punto => {
        if (punto.id === puntoId) {
          return { ...punto, stato_consegna: 'completata' };
        }
        return punto;
      });
      
      setRotta({ ...rotta, punti: puntiAggiornati });
      
      // Avanza al prossimo punto
      if (puntoCorrente < rotta.punti.length - 1) {
        setPuntoCorrente(puntoCorrente + 1);
      }
    }
  };

  const getPriorityColor = (priorita: string) => {
    switch (priorita) {
      case 'urgente': return 'bg-red-100 text-red-800';
      case 'critico': return 'bg-red-200 text-red-900';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (stato?: string) => {
    switch (stato) {
      case 'completata': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_corso': return <Truck className="h-5 w-5 text-blue-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ottimizzazione rotta in corso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rotta Ottimizzata</h1>
          <p className="text-gray-600">Percorso intelligente per le tue consegne</p>
        </div>
        <Button 
          onClick={ottimizzaRotta}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Riottimizza Rotta
        </Button>
      </div>

      {!rotta && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nessuna rotta attiva trovata.</p>
            <Button onClick={ottimizzaRotta} className="mt-4">
              Genera rotta
            </Button>
          </CardContent>
        </Card>
      )}

      {rotta && (
        <>
          {/* Statistiche Rotta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Distanza Totale</p>
                    <p className="text-xl font-bold">{rotta.distanza_totale_km} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tempo Stimato</p>
                    <p className="text-xl font-bold">{rotta.tempo_totale_minuti} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Risparmio KM</p>
                    <p className="text-xl font-bold text-green-600">-{rotta.risparmio_km} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Risparmio Tempo</p>
                    <p className="text-xl font-bold text-green-600">-{rotta.risparmio_minuti} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Algoritmo Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Algoritmo di Ottimizzazione</h3>
                  <p className="text-sm text-gray-600">
                    {rotta.algoritmo_usato} - Nearest Neighbor con ottimizzazione 2-opt
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Ottimizzata
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Lista Punti Rotta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Sequenza Consegne ({rotta.punti.length} tappe)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rotta.punti.map((punto, index) => (
                  <div 
                    key={punto.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                      index === puntoCorrente 
                        ? 'border-blue-500 bg-blue-50' 
                        : punto.stato_consegna === 'completata'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Numero Sequenza */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      punto.stato_consegna === 'completata'
                        ? 'bg-green-600 text-white'
                        : index === puntoCorrente
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Icona Tipo */}
                    <div className="flex-shrink-0">
                      {punto.tipo === 'farmacia' ? (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Dettagli Punto */}
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {punto.tipo === 'farmacia' ? 'RITIRO' : 'CONSEGNA'}
                        </h4>
                        <Badge className={getPriorityColor(punto.priorita)}>
                          {punto.priorita}
                        </Badge>
                        {punto.ordineId && (
                          <Badge variant="outline">
                            Ordine #{punto.ordineId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{punto.indirizzo}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tempo stimato: {punto.tempo_stimato_minuti} minuti
                      </p>
                    </div>

                    {/* Stato e Azioni */}
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(punto.stato_consegna)}
                      
                      {punto.tipo === 'consegna' && punto.stato_consegna !== 'completata' && index === puntoCorrente && (
                        <Button
                          size="sm"
                          onClick={() => completaConsegna(punto.id, punto.ordineId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Completa
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mappa Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Mappa Rotta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p>Mappa interattiva rotta</p>
                  <p className="text-sm">(Integrazione Google Maps in sviluppo)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
