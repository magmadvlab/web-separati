'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Clock, 
  Pill, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Calendar,
  Package,
  TrendingUp,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';

interface ChronicTherapy {
  id: number;
  posologia: string;
  doseGiornaliera: number;
  quantitaRimanente: number;
  giorniRimanenti: number;
  continuativa: boolean;
  tipo: string; // "cronica" | "temporanea"
  stato: string;
  prossimoRinnovo: string;
  richiestaRinnovoInCorso: boolean;
  statoReminder: 'ok' | 'warning' | 'critical';
  messaggioReminder: string | null;
  azioneRichiesta: 'ritiro' | 'rinnovo' | null;
  farmaco: {
    nomeCommerciale: string;
    principioAttivo: string;
    formaFarmaceutica: string;
  };
  medico?: {
    nome: string;
    cognome: string;
  };
  condizioneMedica?: {
    id: number;
    nome: string;
    tipo: string; // "cronica" | "temporanea"
    stato: string;
  };
}

interface ChronicTherapyStats {
  richiesteAutomaticheTotali: number;
  richiesteApprovate: number;
  richiesteRifiutate: number;
  richiesteInAttesa: number;
  terapieCronicheAttive: number;
  tempoMedioApprovazione: number;
}

export default function TerapieCronichePage() {
  const [selectedTherapy, setSelectedTherapy] = useState<number | null>(null);
  const [quantitaInput, setQuantitaInput] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'tutte' | 'croniche' | 'temporanee'>('tutte');
  const queryClient = useQueryClient();

  // Query per ottenere terapie croniche
  const { data: terapie, isLoading: loadingTerapie } = useQuery<ApiResponse<ChronicTherapy[]>>({
    queryKey: ['chronic-therapies'],
    queryFn: async () => {
      const response = await api.get('/paziente/terapie-croniche');
      return response.data;
    },
  });

  // Query per statistiche
  const { data: statistiche } = useQuery<ApiResponse<ChronicTherapyStats>>({
    queryKey: ['chronic-therapy-stats'],
    queryFn: async () => {
      const response = await api.get('/paziente/terapie-croniche/statistiche/richieste-automatiche');
      return response.data;
    },
  });

  // Mutation per forzare controllo rinnovo
  const controllaRinnovoMutation = useMutation({
    mutationFn: async (terapiaId: number) => {
      const response = await api.post(`/paziente/terapie-croniche/${terapiaId}/controlla-rinnovo`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data.richiestaGenerata) {
        toast.success('Richiesta di rinnovo generata automaticamente');
      } else {
        toast.info(data.data.motivo || 'Nessuna richiesta necessaria al momento');
      }
      queryClient.invalidateQueries({ queryKey: ['chronic-therapies'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante controllo rinnovo');
    },
  });

  // Mutation per aggiornare quantità
  const aggiornaQuantitaMutation = useMutation({
    mutationFn: async ({ terapiaId, quantita }: { terapiaId: number; quantita: number }) => {
      const response = await api.put(`/paziente/terapie-croniche/${terapiaId}/quantita`, {
        quantitaRimanente: quantita,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Quantità aggiornata con successo');
      setSelectedTherapy(null);
      setQuantitaInput('');
      queryClient.invalidateQueries({ queryKey: ['chronic-therapies'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante aggiornamento quantità');
    },
  });

  const getStatusBadge = (therapy: ChronicTherapy) => {
    if (therapy.richiestaRinnovoInCorso) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Rinnovo in corso</Badge>;
    }

    switch (therapy.statoReminder) {
      case 'critical':
        return <Badge variant="destructive">Urgente</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attenzione</Badge>;
      default:
        return <Badge variant="secondary" className="bg-green-100 text-green-800">OK</Badge>;
    }
  };

  const getTipoBadge = (therapy: ChronicTherapy) => {
    const isCronica = therapy.tipo === 'cronica' || therapy.continuativa;
    return isCronica ? (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        Cronica
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Temporanea
      </Badge>
    );
  };

  const getStatusIcon = (therapy: ChronicTherapy) => {
    if (therapy.richiestaRinnovoInCorso) {
      return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    }

    switch (therapy.statoReminder) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  if (loadingTerapie) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const terapieCroniche = terapie?.data || [];
  const stats = statistiche?.data;

  // Filtra terapie per tipo
  const terapieFiltrate = terapieCroniche.filter((therapy) => {
    if (filtroTipo === 'tutte') return true;
    if (filtroTipo === 'croniche') return therapy.tipo === 'cronica' || therapy.continuativa;
    if (filtroTipo === 'temporanee') return therapy.tipo === 'temporanea' && !therapy.continuativa;
    return true;
  });

  // Raggruppa per condizione medica
  const terapieRaggruppate = terapieFiltrate.reduce((acc, therapy) => {
    const key = therapy.condizioneMedica?.nome || 'Senza Condizione';
    if (!acc[key]) acc[key] = [];
    acc[key].push(therapy);
    return acc;
  }, {} as Record<string, ChronicTherapy[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Terapie Croniche</h1>
          <p className="text-gray-600 mt-1">
            Gestione automatica dei rinnovi per le tue terapie continuative
          </p>
        </div>
      </div>

      {/* Statistiche */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiche Richieste Automatiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.terapieCronicheAttive}</div>
                <div className="text-sm text-gray-600">Terapie Attive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.richiesteApprovate}</div>
                <div className="text-sm text-gray-600">Richieste Approvate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.richiesteInAttesa}</div>
                <div className="text-sm text-gray-600">In Attesa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.tempoMedioApprovazione}g</div>
                <div className="text-sm text-gray-600">Tempo Medio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Sistema Automatico Attivo</h3>
              <p className="text-blue-800 text-sm mt-1">
                Il sistema controlla automaticamente le tue terapie croniche e invia richieste di rinnovo 
                al tuo medico quando mancano 15 giorni alla fine del farmaco. Riceverai notifiche via email.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Filtra per tipo:</Label>
            <div className="flex gap-2">
              <Button
                variant={filtroTipo === 'tutte' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTipo('tutte')}
              >
                Tutte ({terapieCroniche.length})
              </Button>
              <Button
                variant={filtroTipo === 'croniche' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTipo('croniche')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Croniche ({terapieCroniche.filter(t => t.tipo === 'cronica' || t.continuativa).length})
              </Button>
              <Button
                variant={filtroTipo === 'temporanee' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTipo('temporanee')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Temporanee ({terapieCroniche.filter(t => t.tipo === 'temporanea' && !t.continuativa).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Terapie Croniche */}
      <div className="space-y-6">
        {terapieFiltrate.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nessuna Terapia {filtroTipo === 'croniche' ? 'Cronica' : filtroTipo === 'temporanee' ? 'Temporanea' : ''}
                </h3>
                <p className="text-gray-600">
                  {filtroTipo === 'tutte' 
                    ? 'Non hai terapie attive. Le terapie continuative verranno automaticamente gestite dal sistema di rinnovo.'
                    : `Non hai terapie ${filtroTipo === 'croniche' ? 'croniche' : 'temporanee'} attive.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(terapieRaggruppate).map(([condizione, therapies]) => (
            <div key={condizione} className="space-y-4">
              {condizione !== 'Senza Condizione' && (
                <div className="flex items-center gap-3 px-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    {condizione}
                    {therapies[0]?.condizioneMedica?.tipo === 'cronica' && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        Condizione Cronica
                      </Badge>
                    )}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              )}
              
              {therapies.map((therapy) => (
            <Card key={therapy.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(therapy)}
                      {therapy.farmaco.nomeCommerciale}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {therapy.farmaco.principioAttivo} • {therapy.farmaco.formaFarmaceutica}
                    </p>
                    {therapy.medico && (
                      <p className="text-sm text-gray-500 mt-1">
                        Dr. {therapy.medico.nome} {therapy.medico.cognome}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getTipoBadge(therapy)}
                    {getStatusBadge(therapy)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-gray-500">Posologia</Label>
                    <p className="text-sm font-medium">{therapy.posologia}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Quantità Rimanente</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {therapy.quantitaRimanente} compresse
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Giorni Rimanenti</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {therapy.giorniRimanenti} giorni
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Prossimo Controllo</Label>
                    <p className="text-sm font-medium">
                      {new Date(therapy.prossimoRinnovo).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>

                {therapy.messaggioReminder && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">{therapy.messaggioReminder}</p>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controllaRinnovoMutation.mutate(therapy.id)}
                      disabled={controllaRinnovoMutation.isPending || therapy.richiestaRinnovoInCorso}
                    >
                      {controllaRinnovoMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Controlla Rinnovo
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTherapy(therapy.id);
                        setQuantitaInput(therapy.quantitaRimanente.toString());
                      }}
                    >
                      <Package className="h-4 w-4" />
                      Aggiorna Quantità
                    </Button>
                  </div>

                  {therapy.azioneRichiesta && (
                    <Badge variant="outline" className="text-xs">
                      {therapy.azioneRichiesta === 'rinnovo' ? 'Rinnovo Richiesto' : 'Ritiro Disponibile'}
                    </Badge>
                  )}
                </div>

                {/* Form aggiornamento quantità */}
                {selectedTherapy === therapy.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <Label htmlFor="quantita" className="text-sm font-medium">
                      Nuova Quantità Rimanente (compresse)
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="quantita"
                        type="number"
                        value={quantitaInput}
                        onChange={(e) => setQuantitaInput(e.target.value)}
                        placeholder="Es: 60"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const quantita = parseInt(quantitaInput, 10);
                          if (quantita > 0) {
                            aggiornaQuantitaMutation.mutate({ terapiaId: therapy.id, quantita });
                          }
                        }}
                        disabled={aggiornaQuantitaMutation.isPending || !quantitaInput}
                      >
                        {aggiornaQuantitaMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Salva'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTherapy(null);
                          setQuantitaInput('');
                        }}
                      >
                        Annulla
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Aggiorna quando ricevi nuove confezioni del farmaco
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}