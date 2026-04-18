'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvioDocumento {
  id: number;
  tipoSorgente: string;
  tipoDocumento: string;
  titolo: string;
  descrizione?: string;
  dataInvio: string;
  letto: boolean;
  accettato?: boolean;
  urlDocumento?: string;
  metadatiJson?: any;
}

interface DocumentiRicevutiProps {
  pazienteId?: number;
}

export function DocumentiRicevuti({ pazienteId }: DocumentiRicevutiProps) {
  const [filtroTipoSorgente, setFiltroTipoSorgente] = useState<string>('');
  const [filtroTipoDocumento, setFiltroTipoDocumento] = useState<string>('');
  const [filtroLetto, setFiltroLetto] = useState<string>('');
  const [skip, setSkip] = useState(0);
  const take = 20;

  // Query API documenti
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documenti-ricevuti', {
      tipoSorgente: filtroTipoSorgente,
      tipoDocumento: filtroTipoDocumento,
      letto: filtroLetto === '' ? undefined : filtroLetto === 'true',
      skip,
      take,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroTipoSorgente) params.append('tipoSorgente', filtroTipoSorgente);
      if (filtroTipoDocumento) params.append('tipoDocumento', filtroTipoDocumento);
      if (filtroLetto) params.append('letto', filtroLetto);
      params.append('skip', skip.toString());
      params.append('take', take.toString());

      const res = await fetch(`/api/paziente/documenti/ricevuti?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) throw new Error('Errore caricamento documenti');
      return res.json();
    },
  });

  // Query statistiche
  const { data: stats } = useQuery({
    queryKey: ['statistiche-documenti'],
    queryFn: async () => {
      const res = await fetch(`/api/paziente/documenti/statistiche`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) throw new Error('Errore caricamento statistiche');
      return res.json();
    },
  });

  const getIconaTipoSorgente = (tipo: string) => {
    const icone: { [key: string]: string } = {
      laboratorio: '🧪',
      medico: '👨‍⚕️',
      specialista: '👩‍⚕️',
      farmacia: '💊',
    };
    return icone[tipo] || '📄';
  };

  const getColoriAccettazione = (accettato?: boolean) => {
    if (accettato === null || accettato === undefined) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        textColor: 'text-yellow-700',
        icon: Clock,
      };
    }
    if (accettato) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        textColor: 'text-green-700',
        icon: CheckCircle,
      };
    }
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-700',
      icon: XCircle,
    };
  };

  const handleMarcaLetto = async (documentoId: number) => {
    try {
      const res = await fetch(`/api/paziente/documenti/${documentoId}/marca-letto`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        refetch();
      }
    } catch (err) {
      console.error('Errore marcatura lettura:', err);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Errore caricamento documenti</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATISTICHE */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totale Documenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totaleDocumenti}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Non Letti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.nonLetti}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Sospeso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.nonAccettati}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Per Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {stats.perTipo?.map((t: any) => (
                  <div key={t.tipoSorgente} className="flex justify-between">
                    <span>{getIconaTipoSorgente(t.tipoSorgente)}</span>
                    <span className="font-semibold">{t.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FILTRI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Select value={filtroTipoSorgente} onValueChange={setFiltroTipoSorgente}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo sorgente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutti</SelectItem>
              <SelectItem value="laboratorio">Laboratorio</SelectItem>
              <SelectItem value="medico">Medico</SelectItem>
              <SelectItem value="specialista">Specialista</SelectItem>
              <SelectItem value="farmacia">Farmacia</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroTipoDocumento} onValueChange={setFiltroTipoDocumento}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo documento..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutti</SelectItem>
              <SelectItem value="referto">Referto</SelectItem>
              <SelectItem value="consulto">Consulto</SelectItem>
              <SelectItem value="ricetta">Ricetta</SelectItem>
              <SelectItem value="prescrizione">Prescrizione</SelectItem>
              <SelectItem value="consigli">Consigli</SelectItem>
              <SelectItem value="conferma-consegna">Conferma Consegna</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroLetto} onValueChange={setFiltroLetto}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Stato lettura..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutti</SelectItem>
              <SelectItem value="true">Letti</SelectItem>
              <SelectItem value="false">Non Letti</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setFiltroTipoSorgente('');
              setFiltroTipoDocumento('');
              setFiltroLetto('');
              setSkip(0);
            }}
          >
            Azzera Filtri
          </Button>
        </CardContent>
      </Card>

      {/* DOCUMENTI */}
      <Card>
        <CardHeader>
          <CardTitle>Documenti Ricevuti</CardTitle>
          <CardDescription>
            Totale: {data?.total || 0} documenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : data?.documenti?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nessun documento trovato</div>
          ) : (
            <div className="space-y-4">
              {data?.documenti?.map((doc: InvioDocumento) => {
                const colori = getColoriAccettazione(doc.accettato);
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${colori.bg} ${colori.border}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getIconaTipoSorgente(doc.tipoSorgente)}</span>
                        <div>
                          <h3 className="font-semibold">{doc.titolo}</h3>
                          {doc.descrizione && (
                            <p className="text-sm text-gray-600">{doc.descrizione}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline">{doc.tipoSorgente}</Badge>
                        <Badge variant="outline">{doc.tipoDocumento}</Badge>
                        {!doc.letto && <Badge variant="secondary">Non Letto</Badge>}
                        {doc.accettato === null && (
                          <Badge className="bg-yellow-200 text-yellow-800">Pendente</Badge>
                        )}
                        {doc.accettato === true && (
                          <Badge className="bg-green-200 text-green-800">Accettato</Badge>
                        )}
                        {doc.accettato === false && (
                          <Badge className="bg-red-200 text-red-800">Rifiutato</Badge>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(doc.dataInvio).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {doc.urlDocumento && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.urlDocumento, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {!doc.letto && (
                        <Button
                          size="sm"
                          onClick={() => handleMarcaLetto(doc.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizza
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINAZIONE */}
          {data?.hasMore && (
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setSkip(skip + take)}>
                Carica altri
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
