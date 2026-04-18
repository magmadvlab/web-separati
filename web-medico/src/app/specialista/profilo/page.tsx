'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, User } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface OrarioVisita {
  giorno: 'lunedi' | 'martedi' | 'mercoledi' | 'giovedi' | 'venerdi' | 'sabato' | 'domenica';
  oraInizio: string;
  oraFine: string;
  tipoVisita: 'ambulatorio' | 'domicilio' | 'entrambi';
  note?: string;
}

interface SpecialistaProfilo {
  id: number;
  nome: string;
  cognome: string;
  specializzazione: string;
  macroArea?: string;
  email: string;
  telefono?: string;
  indirizzoStudio?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  stato: string;
  orariVisita?: OrarioVisita[];
  utente: {
    id: number;
    username: string;
    email: string;
    ruolo: string;
  };
}

export default function SpecialistaProfilo() {
  const { user, token } = useAuth();
  const [profilo, setProfilo] = useState<SpecialistaProfilo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orariVisita, setOrariVisita] = useState<OrarioVisita[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    telefono: '',
    indirizzoStudio: '',
    citta: '',
    cap: '',
    provincia: '',
  });

  useEffect(() => {
    if (user?.ruolo !== 'specialista') {
      setError('Accesso non autorizzato');
      return;
    }

    fetchProfilo();
  }, [user, token]);

  const fetchProfilo = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get('/specialista/profile');
      const data = response.data;
      
      setProfilo(data);
      setFormData({
        telefono: data?.telefono || '',
        indirizzoStudio: data?.indirizzoStudio || '',
        citta: data?.citta || '',
        cap: data?.cap || '',
        provincia: data?.provincia || '',
      });
      setOrariVisita(Array.isArray(data?.orariVisita) ? data.orariVisita : []);
    } catch (error) {
      console.error('Errore nel caricamento profilo:', error);
      setError('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await api.put('/specialista/profile', {
        ...formData,
        orariVisita,
      });
      
      const updatedProfilo = response.data;
      setProfilo(updatedProfilo);
      setOrariVisita(Array.isArray(updatedProfilo?.orariVisita) ? updatedProfilo.orariVisita : []);
      setSuccess('Profilo aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento profilo:', error);
      setError('Errore nell\'aggiornamento del profilo');
    } finally {
      setSaving(false);
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
        <div className="text-center">Caricamento profilo...</div>
      </div>
    );
  }

  const updateOrario = (index: number, field: keyof OrarioVisita, value: string) => {
    setOrariVisita((prev) =>
      prev.map((orario, idx) => (idx === index ? { ...orario, [field]: value } : orario))
    );
  };

  const addOrario = () => {
    setOrariVisita((prev) => [
      ...prev,
      { giorno: 'lunedi', oraInizio: '09:00', oraFine: '13:00', tipoVisita: 'ambulatorio', note: '' },
    ]);
  };

  const removeOrario = (index: number) => {
    setOrariVisita((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/specialista/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Profilo Specialista</h1>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card>
          <CardContent className="p-6">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      {profilo && (
        <>
          {/* Informazioni base (non modificabili) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informazioni Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nome</Label>
                  <p className="font-medium">{profilo.nome}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Cognome</Label>
                  <p className="font-medium">{profilo.cognome}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Specializzazione</Label>
                  <p className="font-medium">{profilo.specializzazione}</p>
                </div>
                {profilo.macroArea && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Macro Area</Label>
                    <p className="font-medium">{profilo.macroArea}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{profilo.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <p className="font-medium">{profilo.utente.username}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni modificabili */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni di Contatto e Studio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="Inserisci numero di telefono"
                  />
                </div>
                <div>
                  <Label htmlFor="indirizzoStudio">Indirizzo Studio</Label>
                  <Input
                    id="indirizzoStudio"
                    value={formData.indirizzoStudio}
                    onChange={(e) => handleInputChange('indirizzoStudio', e.target.value)}
                    placeholder="Inserisci indirizzo dello studio"
                  />
                </div>
                <div>
                  <Label htmlFor="citta">Città</Label>
                  <Input
                    id="citta"
                    value={formData.citta}
                    onChange={(e) => handleInputChange('citta', e.target.value)}
                    placeholder="Inserisci città"
                  />
                </div>
                <div>
                  <Label htmlFor="cap">CAP</Label>
                  <Input
                    id="cap"
                    value={formData.cap}
                    onChange={(e) => handleInputChange('cap', e.target.value)}
                    placeholder="Inserisci CAP"
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={formData.provincia}
                    onChange={(e) => handleInputChange('provincia', e.target.value)}
                    placeholder="Inserisci provincia (es. MI)"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Orari di visita</Label>
                {orariVisita.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun orario impostato</p>
                ) : (
                  <div className="space-y-3">
                    {orariVisita.map((orario, index) => (
                      <div key={`${orario.giorno}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded-lg p-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Giorno</Label>
                          <Select
                            value={orario.giorno}
                            onValueChange={(value) => updateOrario(index, 'giorno', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lunedi">Lunedì</SelectItem>
                              <SelectItem value="martedi">Martedì</SelectItem>
                              <SelectItem value="mercoledi">Mercoledì</SelectItem>
                              <SelectItem value="giovedi">Giovedì</SelectItem>
                              <SelectItem value="venerdi">Venerdì</SelectItem>
                              <SelectItem value="sabato">Sabato</SelectItem>
                              <SelectItem value="domenica">Domenica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Inizio</Label>
                          <Input
                            type="time"
                            value={orario.oraInizio}
                            onChange={(e) => updateOrario(index, 'oraInizio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Fine</Label>
                          <Input
                            type="time"
                            value={orario.oraFine}
                            onChange={(e) => updateOrario(index, 'oraFine', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo visita</Label>
                          <Select
                            value={orario.tipoVisita}
                            onValueChange={(value) => updateOrario(index, 'tipoVisita', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ambulatorio">Ambulatorio</SelectItem>
                              <SelectItem value="domicilio">Domicilio</SelectItem>
                              <SelectItem value="entrambi">Entrambi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Note</Label>
                          <Input
                            value={orario.note || ''}
                            onChange={(e) => updateOrario(index, 'note', e.target.value)}
                            placeholder="Opzionale"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button variant="outline" size="sm" onClick={() => removeOrario(index)}>
                            Rimuovi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" onClick={addOrario}>
                  Aggiungi orario
                </Button>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salva Modifiche'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
