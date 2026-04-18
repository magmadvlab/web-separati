/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User } from 'lucide-react';
import api from '@/lib/api';

interface Permesso {
  id: number;
  livelloAccesso: string;
  dataInizio: string;
  dataFine?: string;
  note?: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
  };
}

export default function SpecialistaConsultiPage() {
  const { user, token } = useAuth();
  const [permessi, setPermessi] = useState<Permesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.ruolo !== 'specialista') {
      setError('Accesso non autorizzato');
      setLoading(false);
      return;
    }

    fetchPermessi();
  }, [user, token]);

  const fetchPermessi = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get('/specialista/permessi');
      const data = response.data;
      setPermessi(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Errore nel caricamento dei consulti:', err);
      setError('Errore nel caricamento dei consulti');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento consulti...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consulti pazienti</h1>
        <p className="text-sm text-muted-foreground">
          Richieste attive con accesso ai dati condivisi dal paziente.
        </p>
      </div>

      {permessi.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Nessuna richiesta di consulto attiva al momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {permessi.map((permesso) => (
            <Card key={permesso.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {permesso.paziente
                      ? `${permesso.paziente.nome} ${permesso.paziente.cognome}`
                      : `Paziente #${permesso.id}`}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Attivo dal {new Date(permesso.dataInizio).toLocaleDateString('it-IT')}
                    </span>
                    {permesso.paziente?.codiceFiscale && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        CF: {permesso.paziente.codiceFiscale}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{permesso.livelloAccesso}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                {permesso.note && (
                  <p className="rounded-md bg-muted/50 p-3">{permesso.note}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link href={`/specialista/pazienti/${permesso.paziente.id}`}>
                    <Button size="sm">Apri cartella</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
