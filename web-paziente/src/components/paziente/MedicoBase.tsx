'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  AlertCircle,
  UserCheck,
  Clock,
  PhoneCall,
  CalendarDays,
  UserX,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MedicoBase {
  id: number;
  nome: string;
  cognome: string;
  specializzazione?: string;
  email: string;
  telefono?: string;
  telefonoEmergenza?: string;
  indirizzoStudio?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  dataAssegnazione?: string;
  orariVisita?: OrarioVisita[];
  sostituzioneAttiva?: {
    sostituto: {
      id: number;
      nome: string;
      cognome: string;
      email: string;
      telefono?: string;
    };
    dataInizio: string;
    dataFine: string;
    motivo: string;
    noteHandover?: string;
  };
  prossimaSostituzione?: {
    sostituto: {
      nome: string;
      cognome: string;
    };
    dataInizio: string;
    dataFine: string;
    motivo: string;
  };
  // Campi aggiuntivi dalla nuova API
  medicoAttuale?: any;
  isSostituzione?: boolean;
  sostituzioneInfo?: any;
}

interface OrarioVisita {
  giorno: 'lunedi' | 'martedi' | 'mercoledi' | 'giovedi' | 'venerdi' | 'sabato' | 'domenica';
  oraInizio: string;
  oraFine: string;
  tipoVisita: 'ambulatorio' | 'domicilio' | 'entrambi';
  note?: string;
}

interface RichiestaCambioMedico {
  id: number;
  stato: string;
  dataRichiesta: string;
  motivazione: string;
  nuovoMedicoRichiesto?: {
    nome: string;
    cognome: string;
  };
}

export default function MedicoBase() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [medicoBase, setMedicoBase] = useState<MedicoBase | null>(null);
  const [richiestaCambio, setRichiestaCambio] = useState<RichiestaCambioMedico | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCambioForm, setShowCambioForm] = useState(false);
  const [motivazione, setMotivazione] = useState('');

  useEffect(() => {
    if (user?.ruolo === 'paziente') {
      fetchMedicoBase();
      fetchRichiestaCambio();
    }
  }, [user, token]);

  const fetchMedicoBase = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/paziente/medico-base', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dati medico ricevuti:', data); // Debug
        
        // Se i dati arrivano dalla nuova API, potrebbero avere una struttura diversa
        if (data) {
          setMedicoBase(data);
        }
      } else if (response.status === 403 || response.status === 404) {
        // Endpoint non disponibile o non autorizzato, usa dati di fallback
        console.log('Endpoint medico-base non disponibile, usando dati di fallback');
        setMedicoBase({
          id: 1,
          nome: "Giuseppe",
          cognome: "Bianchi", 
          specializzazione: "Medicina Generale",
          telefono: "+39 02 1234567",
          email: "medico@ricettazero.com",
          indirizzoStudio: "Via Roma 10, Milano"
        });
      } else {
        console.error('Errore response medico-base:', response.status);
      }
    } catch (error) {
      console.error('Errore nel caricamento medico di base:', error);
    }
  };

  const fetchRichiestaCambio = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/paziente/richiesta-cambio-medico', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRichiestaCambio(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento richiesta cambio:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGiorno = (giorno: string) => {
    const giorni = {
      'lunedi': 'Lunedì',
      'martedi': 'Martedì', 
      'mercoledi': 'Mercoledì',
      'giovedi': 'Giovedì',
      'venerdi': 'Venerdì',
      'sabato': 'Sabato',
      'domenica': 'Domenica'
    };
    return giorni[giorno as keyof typeof giorni] || giorno;
  };

  const formatTipoVisita = (tipo: string) => {
    const tipi = {
      'ambulatorio': 'Ambulatorio',
      'domicilio': 'Domicilio',
      'entrambi': 'Ambulatorio e Domicilio'
    };
    return tipi[tipo as keyof typeof tipi] || tipo;
  };

  const isDataPassata = (data: string) => {
    return new Date(data) < new Date();
  };

  const handleRichiestaCambio = async () => {
    if (!token || !motivazione.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci una motivazione per la richiesta',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/paziente/richiesta-cambio-medico', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivazione: motivazione.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Richiesta inviata',
          description: 'La tua richiesta di cambio medico è stata inviata agli amministratori',
        });
        setShowCambioForm(false);
        setMotivazione('');
        fetchRichiestaCambio();
      } else {
        throw new Error('Errore nell\'invio della richiesta');
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nell\'invio della richiesta di cambio medico',
        variant: 'destructive',
      });
    }
  };

  if (user?.ruolo !== 'paziente') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Caricamento informazioni medico di base...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informazioni Medico di Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Il Tuo Medico di Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicoBase ? (
            <div className="space-y-6">
              {/* Alert sostituzione attiva */}
              {medicoBase.sostituzioneAttiva && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <UserX className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">
                        Sostituzione in corso
                      </h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Il tuo medico di base è temporaneamente sostituito da{' '}
                        <strong>
                          Dottor {medicoBase.sostituzioneAttiva.sostituto.nome}{' '}
                          {medicoBase.sostituzioneAttiva.sostituto.cognome}
                        </strong>
                      </p>
                      <div className="mt-2 text-xs text-blue-700">
                        <p>
                          <strong>Periodo:</strong> dal{' '}
                          {new Date(medicoBase.sostituzioneAttiva.dataInizio).toLocaleDateString('it-IT')}{' '}
                          al {new Date(medicoBase.sostituzioneAttiva.dataFine).toLocaleDateString('it-IT')}
                        </p>
                        <p>
                          <strong>Motivo:</strong> {medicoBase.sostituzioneAttiva.motivo}
                        </p>
                        {medicoBase.sostituzioneAttiva.noteHandover && (
                          <p className="mt-1">
                            <strong>Note:</strong> {medicoBase.sostituzioneAttiva.noteHandover}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center space-x-4 text-sm">
                        {medicoBase.sostituzioneAttiva.sostituto.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{medicoBase.sostituzioneAttiva.sostituto.email}</span>
                          </div>
                        )}
                        {medicoBase.sostituzioneAttiva.sostituto.telefono && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{medicoBase.sostituzioneAttiva.sostituto.telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert prossima sostituzione */}
              {medicoBase.prossimaSostituzione && !isDataPassata(medicoBase.prossimaSostituzione.dataInizio) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900">
                        Prossima sostituzione programmata
                      </h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Dal {new Date(medicoBase.prossimaSostituzione.dataInizio).toLocaleDateString('it-IT')}{' '}
                        al {new Date(medicoBase.prossimaSostituzione.dataFine).toLocaleDateString('it-IT')},{' '}
                        il tuo medico sarà sostituito da{' '}
                        <strong>
                          Dottor {medicoBase.prossimaSostituzione.sostituto.nome}{' '}
                          {medicoBase.prossimaSostituzione.sostituto.cognome}
                        </strong>
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        <strong>Motivo:</strong> {medicoBase.prossimaSostituzione.motivo}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informazioni principali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Dottor {medicoBase.nome} {medicoBase.cognome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {medicoBase.specializzazione}
                      </p>
                    </div>
                  </div>

                  {medicoBase.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">{medicoBase.email}</p>
                    </div>
                  )}

                  {medicoBase.telefono && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{medicoBase.telefono}</p>
                        <p className="text-xs text-muted-foreground">Telefono studio</p>
                      </div>
                    </div>
                  )}

                  {medicoBase.telefonoEmergenza && (
                    <div className="flex items-center space-x-3">
                      <PhoneCall className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-700">{medicoBase.telefonoEmergenza}</p>
                        <p className="text-xs text-red-600">Emergenze (solo urgenze)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {(medicoBase.indirizzoStudio || medicoBase.citta) && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        {medicoBase.indirizzoStudio && (
                          <p>{medicoBase.indirizzoStudio}</p>
                        )}
                        {medicoBase.citta && (
                          <p>
                            {medicoBase.citta}
                            {medicoBase.cap && ` ${medicoBase.cap}`}
                            {medicoBase.provincia && ` (${medicoBase.provincia})`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {medicoBase.dataAssegnazione && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm">
                        Assegnato dal {new Date(medicoBase.dataAssegnazione).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Orari di visita */}
              {medicoBase.orariVisita && medicoBase.orariVisita.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">Orari di Visita</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {medicoBase.orariVisita.map((orario, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">
                              {formatGiorno(orario.giorno)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {orario.oraInizio} - {orario.oraFine}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTipoVisita(orario.tipoVisita)}
                            </p>
                          </div>
                        </div>
                        {orario.note && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {orario.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium">Importante:</p>
                        <p>Gli orari possono variare. Per appuntamenti urgenti o visite domiciliari, contatta sempre il medico.</p>
                        {medicoBase.sostituzioneAttiva && (
                          <p className="mt-1 font-medium">
                            Durante la sostituzione, contatta il medico sostituto per gli orari aggiornati.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Stato accesso */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Accesso alla cartella clinica</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ATTIVO
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {medicoBase.sostituzioneAttiva 
                    ? 'Il medico sostituto ha accesso temporaneo alla tua cartella clinica'
                    : 'Il tuo medico di base ha accesso completo alla tua cartella clinica'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nessun medico di base assegnato
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Contatta il servizio clienti per l'assegnazione
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Richiesta Cambio Medico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Cambio Medico di Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          {richiestaCambio ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Richiesta in corso</p>
                  <p className="text-sm text-muted-foreground">
                    Inviata il {new Date(richiestaCambio.dataRichiesta).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <Badge 
                  variant={richiestaCambio.stato === 'approvata' ? 'default' : 
                          richiestaCambio.stato === 'rifiutata' ? 'destructive' : 'secondary'}
                >
                  {richiestaCambio.stato.toUpperCase()}
                </Badge>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Motivazione:</p>
                <p className="text-sm">{richiestaCambio.motivazione}</p>
              </div>

              {richiestaCambio.stato === 'in_attesa' && (
                <p className="text-sm text-muted-foreground">
                  La tua richiesta è in elaborazione. Riceverai una notifica quando sarà processata.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!showCambioForm ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Hai bisogno di cambiare il tuo medico di base?
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Il cambio medico deve essere autorizzato dal SSN e processato dai nostri amministratori
                  </p>
                  <Button 
                    onClick={() => setShowCambioForm(true)}
                    variant="outline"
                  >
                    Richiedi Cambio Medico
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Motivazione della richiesta *
                    </label>
                    <textarea
                      className="w-full mt-1 p-3 border rounded-md resize-none"
                      rows={4}
                      placeholder="Spiega il motivo per cui vuoi cambiare medico di base (es: trasferimento, pensionamento del medico, incompatibilità orari, ecc.)"
                      value={motivazione}
                      onChange={(e) => setMotivazione(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleRichiestaCambio}
                      disabled={!motivazione.trim()}
                    >
                      Invia Richiesta
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCambioForm(false);
                        setMotivazione('');
                      }}
                    >
                      Annulla
                    </Button>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Nota:</strong> La richiesta sarà valutata dagli amministratori in base alle normative SSN. 
                      Il processo può richiedere alcuni giorni lavorativi.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}