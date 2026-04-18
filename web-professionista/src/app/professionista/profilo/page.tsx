'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, User, Phone, MapPin, Settings2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface ProfessionistaProfilo {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  categoria?: string;
  tipoProfessionista?: string;
  indirizzo?: string;
  indirizzoStudio?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  descrizione?: string;
  tariffaBase?: number;
  tariffaDomicilio?: number;
  tariffaOnline?: number;
  modalitaVisita?: string[];
  disponibile?: boolean;
  valutazioneMedia?: number;
  accettaPrenotazioniOnline?: boolean;
  contattoFallback?: string;
}

export default function ProfiloProfessionistaPage() {
  const [profilo, setProfilo] = useState<ProfessionistaProfilo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    telefono: '',
    indirizzo: '',
    indirizzoStudio: '',
    citta: '',
    cap: '',
    provincia: '',
    descrizione: '',
    tariffaBase: '',
    tariffaDomicilio: '',
    tariffaOnline: '',
    accettaPrenotazioniOnline: true,
    contattoFallback: '',
  });

  useEffect(() => {
    fetchProfilo();
  }, []);

  const fetchProfilo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/professionista/profile');
      const data = res.data;
      setProfilo(data);
      setFormData({
        telefono: data.telefono || '',
        indirizzo: data.indirizzo || '',
        indirizzoStudio: data.indirizzoStudio || '',
        citta: data.citta || '',
        cap: data.cap || '',
        provincia: data.provincia || '',
        descrizione: data.descrizione || '',
        tariffaBase: data.tariffaBase?.toString() || '',
        tariffaDomicilio: data.tariffaDomicilio?.toString() || '',
        tariffaOnline: data.tariffaOnline?.toString() || '',
        accettaPrenotazioniOnline: data.accettaPrenotazioniOnline !== false,
        contattoFallback: data.contattoFallback || '',
      });
    } catch (err) {
      setError('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: any = {
        telefono: formData.telefono || undefined,
        indirizzo: formData.indirizzo || undefined,
        indirizzoStudio: formData.indirizzoStudio || undefined,
        citta: formData.citta || undefined,
        cap: formData.cap || undefined,
        provincia: formData.provincia || undefined,
        descrizione: formData.descrizione || undefined,
        accettaPrenotazioniOnline: formData.accettaPrenotazioniOnline,
        contattoFallback: formData.contattoFallback || null,
      };

      if (formData.tariffaBase) payload.tariffaBase = parseFloat(formData.tariffaBase);
      if (formData.tariffaDomicilio) payload.tariffaDomicilio = parseFloat(formData.tariffaDomicilio);
      if (formData.tariffaOnline) payload.tariffaOnline = parseFloat(formData.tariffaOnline);

      const res = await api.patch('/professionista/profile', payload);
      setProfilo(res.data);
      setSuccess('Profilo aggiornato con successo');
    } catch (err) {
      setError('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/professionista/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Profilo Professionista</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">{success}</div>
      )}

      {profilo && (
        <>
          {/* Dati non modificabili */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informazioni Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nome</Label>
                  <p className="font-medium">{profilo.nome} {profilo.cognome}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{profilo.email}</p>
                </div>
                {profilo.categoria && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Categoria</Label>
                    <p className="font-medium">{profilo.categoria}</p>
                  </div>
                )}
                {profilo.tipoProfessionista && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Tipo</Label>
                    <p className="font-medium">{profilo.tipoProfessionista}</p>
                  </div>
                )}
                {profilo.valutazioneMedia != null && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Valutazione media</Label>
                    <p className="font-medium">⭐ {profilo.valutazioneMedia.toFixed(1)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Stato</Label>
                  <Badge variant={profilo.disponibile ? 'default' : 'secondary'}>
                    {profilo.disponibile ? 'Disponibile' : 'Non disponibile'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contatti e studio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contatti e Studio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Es. +39 02 1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="indirizzoStudio">Indirizzo studio</Label>
                  <Input
                    id="indirizzoStudio"
                    value={formData.indirizzoStudio}
                    onChange={(e) => setFormData({ ...formData, indirizzoStudio: e.target.value })}
                    placeholder="Via Roma 1"
                  />
                </div>
                <div>
                  <Label htmlFor="citta">Città</Label>
                  <Input
                    id="citta"
                    value={formData.citta}
                    onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cap">CAP</Label>
                    <Input
                      id="cap"
                      value={formData.cap}
                      onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provincia">Prov.</Label>
                    <Input
                      id="provincia"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="descrizione">Descrizione / Note</Label>
                <textarea
                  id="descrizione"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Breve descrizione del profilo professionale..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Tariffe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Tariffe (€)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tariffaBase">Tariffa base</Label>
                  <Input
                    id="tariffaBase"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tariffaBase}
                    onChange={(e) => setFormData({ ...formData, tariffaBase: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="tariffaDomicilio">Tariffa domicilio</Label>
                  <Input
                    id="tariffaDomicilio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tariffaDomicilio}
                    onChange={(e) => setFormData({ ...formData, tariffaDomicilio: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="tariffaOnline">Tariffa online</Label>
                  <Input
                    id="tariffaOnline"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tariffaOnline}
                    onChange={(e) => setFormData({ ...formData, tariffaOnline: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prenotazioni online */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Prenotazioni Online
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium">Accetta prenotazioni online</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Se disattivato, i pazienti vedranno solo i tuoi contatti diretti
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.accettaPrenotazioniOnline}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      accettaPrenotazioniOnline: !formData.accettaPrenotazioniOnline,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    formData.accettaPrenotazioniOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      formData.accettaPrenotazioniOnline ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {!formData.accettaPrenotazioniOnline && (
                <div className="space-y-2">
                  <Label htmlFor="contattoFallback">
                    Contatto diretto per i pazienti
                  </Label>
                  <Input
                    id="contattoFallback"
                    value={formData.contattoFallback}
                    onChange={(e) => setFormData({ ...formData, contattoFallback: e.target.value })}
                    placeholder="Es. +39 333 1234567 oppure studio@email.it"
                  />
                  <p className="text-xs text-muted-foreground">
                    Questo numero/email verrà mostrato ai pazienti per prenotare direttamente
                  </p>
                </div>
              )}

              <div
                className={`rounded-lg p-3 text-sm ${
                  formData.accettaPrenotazioniOnline
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {formData.accettaPrenotazioniOnline
                  ? '✅ I pazienti possono prenotare online tramite il calendario'
                  : '⚠️ I pazienti vedranno solo i contatti diretti — nessun calendario online'}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
