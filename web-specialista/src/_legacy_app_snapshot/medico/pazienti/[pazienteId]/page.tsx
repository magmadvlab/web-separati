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
  Pill,
  FlaskConical,
  ClipboardList,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { InviaDocumentoMedico } from '@/components/medico/documenti';
import api from '@/lib/api';

interface SchedaPaziente {
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    dataNascita: string;
    email?: string;
    telefono?: string;
    allergie?: string[];
    patologieCroniche?: string[];
  };
  condizioniMediche: Array<{
    id: number;
    nome: string;
    dataInizio: string;
    dataFine?: string;
    stato: string;
    note?: string;
  }>;
  terapie: Array<{
    id: number;
    nomeFarmaco: string;
    dosaggio: string;
    frequenza: string;
    dataInizio: string;
    dataFine?: string;
    stato: string;
  }>;
}

interface Referto {
  id: number;
  tipoEsame: string;
  dataEsame: string;
  dataRisultato: string;
  stato: string;
  risultatiJson: any;
  refertoMedico?: string;
  laboratorio?: {
    nome: string;
    indirizzo?: string;
  };
}

export default function DashboardPazienteMedicoPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pazienteId = parseInt(params.pazienteId as string);

  const [scheda, setScheda] = useState<SchedaPaziente | null>(null);
  const [referti, setReferti] = useState<Referto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.ruolo !== 'medico') {
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

      // Scheda paziente
      const schedaRes = await api.get(`/medico/pazienti/${pazienteId}/scheda`);
      setScheda(schedaRes.data);

      // Referti
      const refertiRes = await api.get(`/medico/consulti/pazienti/${pazienteId}/referti`);
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
        <div className="text-center">Caricamento scheda paziente...</div>
      </div>
    );
  }

  if (error || !scheda) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Dati non disponibili'}</p>
            <Button onClick={() => router.push('/medico/pazienti')} className="mt-4">
              Torna alla Lista Pazienti
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const refertiRecenti = referti.filter(r => {
    const dataRisultato = new Date(r.dataRisultato);
    const setteGiorniFa = new Date();
    setteGiorniFa.setDate(setteGiorniFa.getDate() - 7);
    return dataRisultato >= setteGiorniFa;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/medico/pazienti')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              {scheda.paziente.nome} {scheda.paziente.cognome}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {calcolaEta(scheda.paziente.dataNascita)} anni • CF:{' '}
              {scheda.paziente.codiceFiscale}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Referti Recenti */}
      {refertiRecenti.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {refertiRecenti.length} nuovo/i referto/i disponibile/i negli ultimi 7 giorni
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Condizioni Mediche</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheda.condizioniMediche.filter(c => c.stato === 'attiva').length}
            </div>
            <p className="text-xs text-muted-foreground">Attive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terapie</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheda.terapie.filter(t => t.stato === 'attiva').length}
            </div>
            <p className="text-xs text-muted-foreground">In corso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referti</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referti.length}</div>
            <p className="text-xs text-muted-foreground">Totali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referti Recenti</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {refertiRecenti.length}
              {refertiRecenti.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Nuovi
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Ultimi 7 giorni</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="condizioni">Condizioni</TabsTrigger>
          <TabsTrigger value="terapie">Terapie</TabsTrigger>
          <TabsTrigger value="referti">
            Referti
            {refertiRecenti.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {refertiRecenti.length}
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
                    {scheda.paziente.nome} {scheda.paziente.cognome}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data di Nascita</p>
                  <p className="font-medium">
                    {new Date(scheda.paziente.dataNascita).toLocaleDateString('it-IT')} (
                    {calcolaEta(scheda.paziente.dataNascita)} anni)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                  <p className="font-medium">{scheda.paziente.codiceFiscale}</p>
                </div>
                {scheda.paziente.telefono && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefono</p>
                    <p className="font-medium">{scheda.paziente.telefono}</p>
                  </div>
                )}
              </div>

              {scheda.paziente.allergie && scheda.paziente.allergie.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Allergie</p>
                  <div className="flex flex-wrap gap-2">
                    {scheda.paziente.allergie.map((allergia, index) => (
                      <Badge key={index} variant="destructive">
                        {allergia}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {scheda.paziente.patologieCroniche && scheda.paziente.patologieCroniche.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Patologie Croniche</p>
                  <div className="flex flex-wrap gap-2">
                    {scheda.paziente.patologieCroniche.map((patologia, index) => (
                      <Badge key={index} variant="secondary">
                        {patologia}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="condizioni" className="space-y-4">
          {scheda.condizioniMediche.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessuna condizione medica registrata</p>
              </CardContent>
            </Card>
          ) : (
            scheda.condizioniMediche.map((condizione) => (
              <Card key={condizione.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{condizione.nome}</h3>
                          <p className="text-sm text-muted-foreground">
                            Dal {new Date(condizione.dataInizio).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>

                      {condizione.note && (
                        <div className="mt-3 p-3 bg-muted/50 rounded">
                          <p className="text-sm">{condizione.note}</p>
                        </div>
                      )}

                      <div className="mt-3">
                        <Badge
                          variant={condizione.stato === 'attiva' ? 'default' : 'secondary'}
                        >
                          {condizione.stato}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="terapie" className="space-y-4">
          {scheda.terapie.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessuna terapia in corso</p>
              </CardContent>
            </Card>
          ) : (
            scheda.terapie.map((terapia) => (
              <Card key={terapia.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Pill className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{terapia.nomeFarmaco}</h3>
                          <p className="text-sm text-muted-foreground">
                            {terapia.dosaggio} - {terapia.frequenza}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">
                        Dal {new Date(terapia.dataInizio).toLocaleDateString('it-IT')}
                        {terapia.dataFine && ` al ${new Date(terapia.dataFine).toLocaleDateString('it-IT')}`}
                      </p>

                      <div className="mt-3">
                        <Badge
                          variant={terapia.stato === 'attiva' ? 'default' : 'secondary'}
                        >
                          {terapia.stato}
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
                          <h3 className="font-semibold">{referto.tipoEsame}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(referto.dataRisultato).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {referto.laboratorio && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {referto.laboratorio.nome}
                        </p>
                      )}

                      {referto.refertoMedico && (
                        <div className="mt-3 p-3 bg-muted/50 rounded">
                          <p className="text-sm">{referto.refertoMedico}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant={referto.stato === 'completato' ? 'default' : 'secondary'}
                        >
                          {referto.stato}
                        </Badge>
                      </div>
                    </div>

                    <Link
                      href={`/medico/pazienti/${pazienteId}/referti/${referto.id}`}
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
          <InviaDocumentoMedico 
            pazienteId={pazienteId}
            pazienteName={`${scheda.paziente.nome} ${scheda.paziente.cognome}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
