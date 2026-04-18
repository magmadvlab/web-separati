'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Paziente {
  id: number;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  email: string;
  dataInizio: string;
  note?: string;
}

interface Permesso {
  id: number;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
  };
  livelloAccesso: string;
  dataInizio: string;
  dataFine?: string;
}

export default function SpecialistaDashboard() {
  const { user, token } = useAuth();
  const [pazienti, setPazienti] = useState<Paziente[]>([]);
  const [permessi, setPermessi] = useState<Permesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.ruolo !== 'specialista') {
      setError('Accesso non autorizzato');
      return;
    }

    fetchData();
  }, [user, token]);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // Fetch pazienti assegnati
      const pazientiResponse = await api.get('/specialista/pazienti');
      setPazienti(pazientiResponse.data);

      // Fetch permessi di accesso
      const permessiResponse = await api.get('/specialista/permessi');
      setPermessi(permessiResponse.data);

    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  if (user?.ruolo !== 'specialista') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Accesso non autorizzato. Solo gli specialisti possono accedere a questa sezione.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Specialista</h1>
        <Link href="/specialista/profilo">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Profilo
          </Button>
        </Link>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistiche rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pazienti Assegnati</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pazienti.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permessi Attivi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permessi.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessi Oggi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Funzionalità in sviluppo</p>
          </CardContent>
        </Card>
      </div>

      {/* Pazienti con accesso autorizzato */}
      <Card>
        <CardHeader>
          <CardTitle>Pazienti con Accesso Autorizzato</CardTitle>
        </CardHeader>
        <CardContent>
          {permessi.length === 0 ? (
            <p className="text-muted-foreground">Nessun permesso di accesso attivo</p>
          ) : (
            <div className="space-y-4">
              {permessi.map((permesso) => (
                <div key={permesso.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">
                      {permesso.paziente.nome} {permesso.paziente.cognome}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      CF: {permesso.paziente.codiceFiscale}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Accesso dal: {new Date(permesso.dataInizio).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{permesso.livelloAccesso}</Badge>
                    <Link href={`/specialista/pazienti/${permesso.paziente.id}`}>
                      <Button size="sm">
                        Visualizza Cartella
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pazienti assegnati */}
      {pazienti.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pazienti Assegnati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pazienti.map((paziente) => (
                <div key={paziente.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">
                      {paziente.nome} {paziente.cognome}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      CF: {paziente.codiceFiscale}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nato il: {new Date(paziente.dataNascita).toLocaleDateString('it-IT')}
                    </p>
                    {paziente.note && (
                      <p className="text-sm text-muted-foreground">
                        Note: {paziente.note}
                      </p>
                    )}
                  </div>
                  <div>
                    <Badge variant="outline">Assegnato</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
