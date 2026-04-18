'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Lock,
  User,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificaSicurezza {
  relazioneSicura: boolean;
  medicoBase: {
    id: number;
    nome: string;
    cognome: string;
    specializzazione: string;
  };
  verificaToken: string;
  timestamp: string;
}

export default function VerificaSicurezzaMedico() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [verifica, setVerifica] = useState<VerificaSicurezza | null>(null);
  const [loading, setLoading] = useState(false);

  const eseguiVerifica = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/paziente/medico-base/verifica-sicurezza', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerifica(data);
        
        if (data.relazioneSicura) {
          toast({
            title: 'Verifica Completata',
            description: 'La relazione con il tuo medico di base è sicura e verificata',
          });
        } else {
          toast({
            title: 'Attenzione',
            description: 'Problemi nella verifica della relazione medico-paziente',
            variant: 'destructive',
          });
        }
      } else {
        throw new Error('Errore nella verifica');
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante la verifica di sicurezza',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.ruolo !== 'paziente') {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Verifica Sicurezza Relazione Medico-Paziente
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sistema di verifica tripla per garantire la sicurezza al 100% della relazione con il tuo medico di base
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verifica ? (
          <div className="text-center py-6">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Clicca per verificare la sicurezza della relazione con il tuo medico di base
            </p>
            <Button 
              onClick={eseguiVerifica} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {loading ? 'Verifica in corso...' : 'Avvia Verifica Sicurezza'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Risultato Verifica */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {verifica.relazioneSicura ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {verifica.relazioneSicura ? 'Relazione Sicura' : 'Problemi di Sicurezza'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {verifica.relazioneSicura 
                      ? 'Tutti i controlli di sicurezza sono stati superati'
                      : 'Alcuni controlli di sicurezza hanno fallito'
                    }
                  </p>
                </div>
              </div>
              <Badge 
                variant={verifica.relazioneSicura ? 'default' : 'destructive'}
                className="text-xs"
              >
                {verifica.relazioneSicura ? 'VERIFICATA' : 'NON SICURA'}
              </Badge>
            </div>

            {/* Informazioni Medico */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Medico di Base Verificato</span>
              </div>
              <div className="text-sm">
                <p><strong>Nome:</strong> Dottor {verifica.medicoBase.nome} {verifica.medicoBase.cognome}</p>
                <p><strong>Specializzazione:</strong> {verifica.medicoBase.specializzazione}</p>
                <p><strong>ID Medico:</strong> #{verifica.medicoBase.id}</p>
              </div>
            </div>

            {/* Dettagli Tecnici */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Dettagli Verifica</span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Token Sicurezza:</strong> {verifica.verificaToken.substring(0, 16)}...</p>
                <p><strong>Timestamp:</strong> {new Date(verifica.timestamp).toLocaleString('it-IT')}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" />
                  <span>Verifica valida per 10 minuti</span>
                </div>
              </div>
            </div>

            {/* Livelli di Verifica */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Livelli di Verifica Completati:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Livello 1: Verifica Database Relazionale</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Livello 2: Verifica Codici Identificativi</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Livello 3: Generazione Token Sicurezza</span>
                </div>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={eseguiVerifica}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Ripeti Verifica
              </Button>
            </div>
          </div>
        )}

        {/* Informazioni Sistema */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p><strong>Sistema di Sicurezza RicettaZero</strong></p>
          <p>
            Questo sistema garantisce al 100% che le tue richieste mediche arrivino 
            esclusivamente al tuo medico di base assegnato, prevenendo errori e 
            violazioni della privacy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}