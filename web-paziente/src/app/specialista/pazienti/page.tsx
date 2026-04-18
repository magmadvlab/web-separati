'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
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

export default function SpecialistaPazientiPage() {
  const { user, token } = useAuth();
  const [permessi, setPermessi] = useState<Permesso[]>([]);
  const [filteredPermessi, setFilteredPermessi] = useState<Permesso[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPermessi(permessi);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = permessi.filter(
        (p) =>
          p.paziente.nome.toLowerCase().includes(term) ||
          p.paziente.cognome.toLowerCase().includes(term) ||
          p.paziente.codiceFiscale.toLowerCase().includes(term)
      );
      setFilteredPermessi(filtered);
    }
  }, [searchTerm, permessi]);

  const fetchPermessi = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get('/specialista/permessi');
      const data = response.data;
      const permessiArray = Array.isArray(data) ? data : [];
      setPermessi(permessiArray);
      setFilteredPermessi(permessiArray);
    } catch (err) {
      console.error('Errore nel caricamento dei pazienti:', err);
      setError('Errore nel caricamento dei pazienti');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento pazienti...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            I Miei Pazienti
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Pazienti che hanno concesso l'accesso alla loro cartella clinica
          </p>
        </div>
      </div>

      {/* Statistiche rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pazienti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permessi.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accesso Lettura/Scrittura</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permessi.filter((p) => p.livelloAccesso === 'lettura_scrittura').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solo Lettura</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {permessi.filter((p) => p.livelloAccesso === 'solo_lettura').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra di ricerca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, cognome o codice fiscale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista pazienti */}
      {filteredPermessi.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? 'Nessun paziente trovato con i criteri di ricerca'
                : 'Nessun paziente ha ancora concesso l\'accesso alla cartella clinica'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPermessi.map((permesso) => (
            <Card key={permesso.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {permesso.paziente.nome} {permesso.paziente.cognome}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          CF: {permesso.paziente.codiceFiscale}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Badge
                        variant={
                          permesso.livelloAccesso === 'lettura_scrittura'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {permesso.livelloAccesso === 'lettura_scrittura'
                          ? 'Lettura e Scrittura'
                          : 'Solo Lettura'}
                      </Badge>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Accesso dal{' '}
                        {new Date(permesso.dataInizio).toLocaleDateString('it-IT')}
                      </div>

                      {permesso.dataFine && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Fino al{' '}
                          {new Date(permesso.dataFine).toLocaleDateString('it-IT')}
                        </div>
                      )}
                    </div>

                    {permesso.note && (
                      <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded">
                        {permesso.note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/specialista/pazienti/${permesso.paziente.id}`}>
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Apri Cartella
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
