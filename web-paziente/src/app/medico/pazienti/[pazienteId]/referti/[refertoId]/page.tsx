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
  tipoEsame: string;
  dataEsame: string;
  dataRisultato: string;
  stato: string;
  risultatiJson: any;
  refertoMedico?: string;
  refertoUrl?: string;
  laboratorio?: {
    nome: string;
    indirizzo?: string;
  };
  prescrizioneAnalisi?: {
    id: number;
    codiceNre: string;
    medico?: {
      nome: string;
      cognome: string;
    };
  };
}

export default function DettaglioRefertoMedicoPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pazienteId = parseInt(params.pazienteId as string);
  const refertoId = parseInt(params.refertoId as string);

  const [referto, setReferto] = useState<Referto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.ruolo !== 'medico') {
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
        `/medico/consulti/pazienti/${pazienteId}/referti/${refertoId}`
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

    // Se è un array, mostralo come lista
    if (Array.isArray(risultati)) {
      return (
        <div className="space-y-3">
          {risultati.map((item, index) => (
            <div key={index} className="p-3 rounded bg-muted/50">
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))}
        </div>
      );
    }

    // Se è un oggetto, mostra chiave-valore
    return (
      <div className="space-y-3">
        {Object.entries(risultati).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 rounded bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium capitalize">
                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}
              </span>
            </div>
            <span className="font-semibold">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
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
              onClick={() => router.push(`/medico/pazienti/${pazienteId}`)}
              className="mt-4"
            >
              Torna alla Scheda Paziente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/medico/pazienti/${pazienteId}`)}
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
              {referto.tipoEsame}
            </p>
          </div>
        </div>

        <Badge variant={referto.stato === 'completato' ? 'default' : 'secondary'}>
          {referto.stato}
        </Badge>
      </div>

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
              <p className="text-sm text-muted-foreground">Data Risultato</p>
              <p className="font-medium">
                {new Date(referto.dataRisultato).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {referto.dataEsame && (
              <div>
                <p className="text-sm text-muted-foreground">Data Esame</p>
                <p className="font-medium">
                  {new Date(referto.dataEsame).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Tipo Esame</p>
              <p className="font-medium">{referto.tipoEsame}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Stato</p>
              <Badge variant={referto.stato === 'completato' ? 'default' : 'secondary'}>
                {referto.stato}
              </Badge>
            </div>
          </div>

          {referto.prescrizioneAnalisi && (
            <div className="mt-4 p-3 bg-muted/50 rounded">
              <p className="text-sm font-medium mb-1">Prescrizione</p>
              <p className="text-sm">
                Codice NRE: {referto.prescrizioneAnalisi.codiceNre}
              </p>
              {referto.prescrizioneAnalisi.medico && (
                <p className="text-sm text-muted-foreground">
                  Prescritto da: Dr. {referto.prescrizioneAnalisi.medico.nome}{' '}
                  {referto.prescrizioneAnalisi.medico.cognome}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Laboratorio */}
      {referto.laboratorio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Laboratorio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{referto.laboratorio.nome}</p>
              {referto.laboratorio.indirizzo && (
                <p className="text-sm text-muted-foreground">
                  {referto.laboratorio.indirizzo}
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
        <CardContent>{renderRisultati(referto.risultatiJson)}</CardContent>
      </Card>

      {/* Note Medico */}
      {referto.refertoMedico && (
        <Card>
          <CardHeader>
            <CardTitle>Note Laboratorio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{referto.refertoMedico}</p>
          </CardContent>
        </Card>
      )}

      {/* PDF Download (futuro) */}
      {referto.refertoUrl && (
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
