'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  FileText,
  Activity,
  AlertCircle,
  ArrowLeft,
  Stethoscope,
  Pill,
  FlaskConical,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { InviaDocumentoSpecialista } from '@/components/specialista/documenti';
import api from '@/lib/api';

interface Dashboard {
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    dataNascita: string;
    codiceFiscale: string;
    telefono?: string;
    emailPersonale?: string;
  };
  ultimaVisita?: {
    id: number;
    dataVisita: string;
    motivo: string;
    esito?: string;
  };
  prossimaVisita?: {
    id: number;
    dataVisita: string;
    motivo: string;
  };
  statistiche: {
    totaleVisite: number;
    totalePrescrizioni: number;
    totaleEsami: number;
    refertiDaVisionare: number;
  };
  alert: Array<{
    tipo: string;
    messaggio: string;
  }>;
}

interface Visita {
  id: number;
  dataVisita: string;
  motivo: string;
  esito?: string;
  noteMedico?: string;
  stato: string;
  tipoVisita: string;
  specializzazione?: string;
}

interface Prescrizione {
  id: number;
  tipoPrescrizione: string;
  dataEmissione: string;
  dataValidita?: string;
  stato: string;
  farmaci?: any;
  analisi?: any;
  diagnosi?: string;
  motivazione?: string;
}

interface Esame {
  id: number;
  tipoEsame: string;
  dataPrenotazione: string;
  dataEsame?: string;
  stato: string;
  analisiRichieste: any;
  laboratorio?: {
    id: number;
    nome: string;
    indirizzo?: string;
  };
}

interface Referto {
  id: number;
  dataRefertazione: string;
  stato: string;
  risultati: any;
  valoriAnomali?: any;
  noteLaboratorio?: string;
  prenotazione?: {
    tipoEsame: string;
    laboratorio?: {
      id: number;
      nome: string;
    };
  };
}

export default function DashboardPazientePage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pazienteId = parseInt(params.pazienteId as string);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [visite, setVisite] = useState<Visita[]>([]);
  const [prescrizioni, setPrescrizioni] = useState<Prescrizione[]>([]);
  const [esami, setEsami] = useState<Esame[]>([]);
  const [referti, setReferti] = useState<Referto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.ruolo !== 'specialista') {
      setError('Accesso non autorizzato');
      setLoading(false);
      return;
    }

    fetchData();
  }, [user, token, pazienteId]);

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Dashboard
      const dashboardRes = await api.get(`/specialista/pazienti/${pazienteId}/dashboard`);
      setDashboard(dashboardRes.data);

      // Visite
      const visiteRes = await api.get(`/specialista/pazienti/${pazienteId}/visite`);
      setVisite(Array.isArray(visiteRes.data) ? visiteRes.data : []);

      // Prescrizioni
      const prescrizioniRes = await api.get(`/specialista/pazienti/${pazienteId}/prescrizioni`);
      setPrescrizioni(Array.isArray(prescrizioniRes.data) ? prescrizioniRes.data : []);

      // Esami
      const esamiRes = await api.get(`/specialista/pazienti/${pazienteId}/esami`);
      setEsami(Array.isArray(esamiRes.data) ? esamiRes.data : []);

      // Referti
      const refertiRes = await api.get(`/specialista/pazienti/${pazienteId}/referti-dettaglio`);
      setReferti(Array.isArray(refertiRes.data) ? refertiRes.data : []);
    } catch (err: any) {
      console.error('Errore nel caricamento dati:', err);
      setError(err.response?.data?.message || 'Errore nel caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const calcolaEta = (dataNascita: string) => {
    const oggi = new Date();
    const nascita = new Date(dataNascita);
    let eta = oggi.getFullYear() - nascita.getFullYear();
    const m = oggi.getMonth() - nascita.getMonth();
    if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
      eta--;
    }
    return eta;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento cartella paziente...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Dati non disponibili'}</p>
            <Button onClick={() => router.push('/specialista/pazienti')} className="mt-4">
              Torna alla Lista Pazienti
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
            onClick={() => router.push('/specialista/pazienti')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              {dashboard.paziente.nome} {dashboard.paziente.cognome}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {calcolaEta(dashboard.paziente.dataNascita)} anni • CF:{' '}
              {dashboard.paziente.codiceFiscale}
            </p>
          </div>
        </div>
      </div>

      {/* Alert */}
      {dashboard.alert.length > 0 && (
        <div className="space-y-2">
          {dashboard.alert.map((alert, index) => (
            <Alert key={index} variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{alert.messaggio}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visite</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.statistiche.totaleVisite}</div>
            <p className="text-xs text-muted-foreground">Totali effettuate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescrizioni</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.statistiche.totalePrescrizioni}</div>
            <p className="text-xs text-muted-foreground">Emesse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esami</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.statistiche.totaleEsami}</div>
            <p className="text-xs text-muted-foreground">Prescritti</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referti</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {dashboard.statistiche.refertiDaVisionare}
              {dashboard.statistiche.refertiDaVisionare > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Nuovi
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Da visionare</p>
          </CardContent>
        </Card>
      </div>

      {/* Ultima e Prossima Visita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboard.ultimaVisita && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ultima Visita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {new Date(dashboard.ultimaVisita.dataVisita).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">{dashboard.ultimaVisita.motivo}</p>
                {dashboard.ultimaVisita.esito && (
                  <p className="text-sm">
                    <span className="font-medium">Esito:</span> {dashboard.ultimaVisita.esito}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {dashboard.prossimaVisita && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prossima Visita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {new Date(dashboard.prossimaVisita.dataVisita).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">{dashboard.prossimaVisita.motivo}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="visite">Visite</TabsTrigger>
          <TabsTrigger value="esami">Esami</TabsTrigger>
          <TabsTrigger value="referti">
            Referti
            {dashboard.statistiche.refertiDaVisionare > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {dashboard.statistiche.refertiDaVisionare}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documenti">
            <FileText className="h-4 w-4 mr-2" />
            Documenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dati Anagrafici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">
                    {dashboard.paziente.nome} {dashboard.paziente.cognome}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data di Nascita</p>
                  <p className="font-medium">
                    {new Date(dashboard.paziente.dataNascita).toLocaleDateString('it-IT')} (
                    {calcolaEta(dashboard.paziente.dataNascita)} anni)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                  <p className="font-medium">{dashboard.paziente.codiceFiscale}</p>
                </div>
                {dashboard.paziente.telefono && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefono</p>
                    <p className="font-medium">{dashboard.paziente.telefono}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visite" className="space-y-4">
          {visite.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessuna visita registrata</p>
              </CardContent>
            </Card>
          ) : (
            visite.map((visita) => (
              <Card key={visita.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">
                            {new Date(visita.dataVisita).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </h3>
                          <p className="text-sm text-muted-foreground">{visita.motivo}</p>
                        </div>
                      </div>

                      {visita.esito && (
                        <div className="mt-3 p-3 bg-muted/50 rounded">
                          <p className="text-sm font-medium mb-1">Esito:</p>
                          <p className="text-sm">{visita.esito}</p>
                        </div>
                      )}

                      {visita.noteMedico && (
                        <div className="mt-3 p-3 bg-muted/50 rounded">
                          <p className="text-sm font-medium mb-1">Note:</p>
                          <p className="text-sm">{visita.noteMedico}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Badge>{visita.tipoVisita}</Badge>
                        {visita.specializzazione && (
                          <Badge variant="outline">{visita.specializzazione}</Badge>
                        )}
                        <Badge
                          variant={visita.stato === 'completata' ? 'default' : 'secondary'}
                        >
                          {visita.stato}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="esami" className="space-y-4">
          {esami.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessun esame prescritto</p>
              </CardContent>
            </Card>
          ) : (
            esami.map((esame) => (
              <Card key={esame.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{esame.tipoEsame}</h3>
                          <p className="text-sm text-muted-foreground">
                            Prenotato il{' '}
                            {new Date(esame.dataPrenotazione).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>

                      {esame.laboratorio && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Laboratorio: {esame.laboratorio.nome}
                        </p>
                      )}

                      {esame.dataEsame && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Data esame: {new Date(esame.dataEsame).toLocaleDateString('it-IT')}
                        </p>
                      )}

                      <div className="mt-3">
                        <Badge
                          variant={
                            esame.stato === 'refertata'
                              ? 'default'
                              : esame.stato === 'eseguita'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {esame.stato}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="referti" className="space-y-4">
          {referti.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessun referto disponibile</p>
              </CardContent>
            </Card>
          ) : (
            referti.map((referto) => (
              <Card key={referto.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">
                            {referto.prenotazione?.tipoEsame || 'Referto Esame'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(referto.dataRefertazione).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {referto.prenotazione?.laboratorio && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {referto.prenotazione.laboratorio.nome}
                        </p>
                      )}

                      {referto.valoriAnomali && Object.keys(referto.valoriAnomali).length > 0 && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Valori anomali rilevati - Consultare il dettaglio
                          </AlertDescription>
                        </Alert>
                      )}

                      {referto.noteLaboratorio && (
                        <div className="mt-3 p-3 bg-muted/50 rounded">
                          <p className="text-sm">{referto.noteLaboratorio}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant={referto.stato === 'disponibile' ? 'default' : 'secondary'}
                        >
                          {referto.stato}
                        </Badge>
                      </div>
                    </div>

                    <Link
                      href={`/specialista/pazienti/${pazienteId}/referti/${referto.id}`}
                    >
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Dettaglio
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documenti" className="space-y-4">
          <InviaDocumentoSpecialista 
            pazienteId={pazienteId}
            pazienteName={`${dashboard.paziente.nome} ${dashboard.paziente.cognome}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
