'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';

interface Referto {
  id: number;
  dataRefertazione: string;
  stato: string;
  risultati: any;
  valoriAnomali?: any;
  noteLaboratorio?: string;
  filePdfPath?: string;
  filePdfUrl?: string;
  prenotazione?: {
    id: number;
    tipoEsame: string;
    dataEsame?: string;
    analisiRichieste: any;
    laboratorio?: {
      id: number;
      nome: string;
      indirizzo?: string;
      telefono?: string;
    };
  };
}

export default function DettaglioRefertoPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pazienteId = parseInt(params.pazienteId as string);
  const refertoId = parseInt(params.refertoId as string);

  const [referto, setReferto] = useState<Referto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.ruolo !== 'specialista') {
      setError('Accesso non autorizzato');
      setLoading(false);
      return;
    }

    fetchReferto();
  }, [user, token, pazienteId, refertoId]);

  const fetchReferto = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get(
        `/specialista/pazienti/${pazienteId}/referti-dettaglio/${refertoId}`
      );
      setReferto(response.data);
    } catch (err: any) {
      console.error('Errore nel caricamento referto:', err);
      setError(err.response?.data?.message || 'Errore nel caricamento referto');
    } finally {
      setLoading(false);
    }
  };

  const renderRisultati = (risultati: any) => {
    if (!risultati || typeof risultati !== 'object') {
      return <p className="text-sm text-muted-foreground">Nessun risultato disponibile</p>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(risultati).map(([key, value]) => {
          const isAnomalo = referto?.valoriAnomali && key in referto.valoriAnomali;

          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 rounded ${
                isAnomalo ? 'bg-red-50 border border-red-200' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isAnomalo ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className="font-medium capitalize">
                  {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isAnomalo ? 'text-red-600' : ''}`}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
                {isAnomalo && (
                  <Badge variant="destructive" className="text-xs">
                    Anomalo
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento referto...</div>
      </div>
    );
  }

  if (error || !referto) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Referto non trovato'}</p>
            <Button
              onClick={() => router.push(`/specialista/pazienti/${pazienteId}`)}
              className="mt-4"
            >
              Torna alla Cartella Paziente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasValoriAnomali =
    referto.valoriAnomali && Object.keys(referto.valoriAnomali).length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/specialista/pazienti/${pazienteId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              Dettaglio Referto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {referto.prenotazione?.tipoEsame || 'Referto Esame'}
            </p>
          </div>
        </div>

        <Badge variant={referto.stato === 'disponibile' ? 'default' : 'secondary'}>
          {referto.stato}
        </Badge>
      </div>

      {/* Alert Valori Anomali */}
      {hasValoriAnomali && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Attenzione: sono stati rilevati valori anomali in questo referto. Consultare i
            risultati per maggiori dettagli.
          </AlertDescription>
        </Alert>
      )}

      {/* Informazioni Generali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informazioni Generali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data Refertazione</p>
              <p className="font-medium">
                {new Date(referto.dataRefertazione).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {referto.prenotazione?.dataEsame && (
              <div>
                <p className="text-sm text-muted-foreground">Data Esame</p>
                <p className="font-medium">
                  {new Date(referto.prenotazione.dataEsame).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Tipo Esame</p>
              <p className="font-medium">{referto.prenotazione?.tipoEsame || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Stato</p>
              <Badge variant={referto.stato === 'disponibile' ? 'default' : 'secondary'}>
                {referto.stato}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laboratorio */}
      {referto.prenotazione?.laboratorio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Laboratorio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{referto.prenotazione.laboratorio.nome}</p>
              {referto.prenotazione.laboratorio.indirizzo && (
                <p className="text-sm text-muted-foreground">
                  {referto.prenotazione.laboratorio.indirizzo}
                </p>
              )}
              {referto.prenotazione.laboratorio.telefono && (
                <p className="text-sm text-muted-foreground">
                  Tel: {referto.prenotazione.laboratorio.telefono}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risultati */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Risultati Analisi
          </CardTitle>
        </CardHeader>
        <CardContent>{renderRisultati(referto.risultati)}</CardContent>
      </Card>

      {/* Valori Anomali */}
      {hasValoriAnomali && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Valori Anomali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(referto.valoriAnomali).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="font-medium capitalize">
                    {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="font-semibold text-red-600">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note Laboratorio */}
      {referto.noteLaboratorio && (
        <Card>
          <CardHeader>
            <CardTitle>Note Laboratorio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{referto.noteLaboratorio}</p>
          </CardContent>
        </Card>
      )}

      {/* Analisi Richieste */}
      {referto.prenotazione?.analisiRichieste && (
        <Card>
          <CardHeader>
            <CardTitle>Analisi Richieste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(referto.prenotazione.analisiRichieste) ? (
                referto.prenotazione.analisiRichieste.map((analisi: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded">
                    <p className="text-sm font-medium">
                      {typeof analisi === 'string' ? analisi : analisi.nome || 'Analisi'}
                    </p>
                    {typeof analisi === 'object' && analisi.codice && (
                      <p className="text-xs text-muted-foreground">Codice: {analisi.codice}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(referto.prenotazione.analisiRichieste)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Download (futuro) */}
      {(referto.filePdfPath || referto.filePdfUrl) && (
        <Card>
          <CardHeader>
            <CardTitle>Documenti Allegati</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Scarica PDF Referto (Disponibile a breve)
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Integrazione storage file in fase di implementazione
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
