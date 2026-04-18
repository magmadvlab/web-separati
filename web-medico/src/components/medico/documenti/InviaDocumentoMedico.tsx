'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface InviaDocumentoMedicoProps {
  pazienteId: number;
  medicoId?: number;
  pazienteName?: string;
}

export function InviaDocumentoMedico({
  pazienteId,
  medicoId,
  pazienteName,
}: InviaDocumentoMedicoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    tipoDocumento: 'consulto' as const,
    titolo: '',
    descrizione: '',
    diagnosi: '',
    terapia: '',
    followup: '',
    metodoInvio: 'email' as const,
  });

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const metadati: any = {};
      if (formData.diagnosi) metadati.diagnosi = formData.diagnosi;
      if (formData.terapia) metadati.terapia = formData.terapia;
      if (formData.followup) metadati.followup = formData.followup;

      const payload = {
        pazienteId,
        tipoDocumento: formData.tipoDocumento,
        titolo: formData.titolo,
        descrizione: formData.descrizione,
        metodoInvio: formData.metodoInvio,
        metadati: Object.keys(metadati).length > 0 ? metadati : undefined,
      };

      const res = await fetch('/api/medico/documenti/invia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Errore invio documento');
      }

      setSuccess(true);
      setFormData({
        tipoDocumento: 'consulto',
        titolo: '',
        descrizione: '',
        diagnosi: '',
        terapia: '',
        followup: '',
        metodoInvio: 'email',
      });

      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invia Documento al Paziente</CardTitle>
        <CardDescription>
          {pazienteName && `Paziente: ${pazienteName}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Documento inviato con successo
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TIPO DOCUMENTO */}
          <div className="space-y-2">
            <Label htmlFor="tipoDocumento">Tipo Documento *</Label>
            <Select
              value={formData.tipoDocumento}
              onValueChange={(value) => handleInputChange('tipoDocumento', value)}
            >
              <SelectTrigger id="tipoDocumento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consulto">Consulto Medico</SelectItem>
                <SelectItem value="ricetta">Ricetta</SelectItem>
                <SelectItem value="prescrizione">Prescrizione</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TITOLO */}
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo *</Label>
            <Input
              id="titolo"
              placeholder="Es. Consulto ipertensione"
              value={formData.titolo}
              onChange={(e) => handleInputChange('titolo', e.target.value)}
              required
            />
          </div>

          {/* DESCRIZIONE */}
          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione *</Label>
            <Textarea
              id="descrizione"
              placeholder="Descrizione del documento"
              value={formData.descrizione}
              onChange={(e) => handleInputChange('descrizione', e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* DIAGNOSI (per consulto) */}
          {formData.tipoDocumento === 'consulto' && (
            <div className="space-y-2">
              <Label htmlFor="diagnosi">Diagnosi</Label>
              <Textarea
                id="diagnosi"
                placeholder="Diagnosi e osservazioni cliniche"
                value={formData.diagnosi}
                onChange={(e) => handleInputChange('diagnosi', e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* TERAPIA (per ricetta/prescrizione) */}
          {(formData.tipoDocumento === 'ricetta' ||
            formData.tipoDocumento === 'prescrizione') && (
            <div className="space-y-2">
              <Label htmlFor="terapia">Terapia / Medicamenti</Label>
              <Textarea
                id="terapia"
                placeholder="Descrizione della terapia prescritta"
                value={formData.terapia}
                onChange={(e) => handleInputChange('terapia', e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* FOLLOW-UP */}
          {formData.tipoDocumento === 'consulto' && (
            <div className="space-y-2">
              <Label htmlFor="followup">Follow-up Consigliato</Label>
              <Textarea
                id="followup"
                placeholder="Indicazioni per follow-up"
                value={formData.followup}
                onChange={(e) => handleInputChange('followup', e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* METODO INVIO */}
          <div className="space-y-2">
            <Label htmlFor="metodoInvio">Metodo Invio *</Label>
            <Select
              value={formData.metodoInvio}
              onValueChange={(value) => handleInputChange('metodoInvio', value)}
            >
              <SelectTrigger id="metodoInvio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push">Notifica Push</SelectItem>
                <SelectItem value="portale">Portale</SelectItem>
                <SelectItem value="multiplo">Multiplo (Email + SMS)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Invio in corso...' : 'Invia Documento'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  tipoDocumento: 'consulto',
                  titolo: '',
                  descrizione: '',
                  diagnosi: '',
                  terapia: '',
                  followup: '',
                  metodoInvio: 'email',
                });
              }}
            >
              Cancella
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
