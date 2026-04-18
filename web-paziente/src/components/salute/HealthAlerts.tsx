"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Clock } from "lucide-react";
import api from "@/lib/api";

interface HealthAlert {
  tipo: string;
  gravita: 'lieve' | 'moderata' | 'grave';
  titolo: string;
  messaggio: string;
  azioneConsigliata: string;
  dataRilevamento: string;
  parametro?: string;
  valore?: number;
}

export function HealthAlerts() {
  const { data: alerts, isLoading } = useQuery<HealthAlert[]>({
    queryKey: ['health-alerts'],
    queryFn: async () => {
      const response = await api.get('/salute/alert');
      return response.data.data || response.data;
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Caricamento alert...</CardContent></Card>;
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alert Salute</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Nessun alert attivo. Tutto nella norma!</p>
        </CardContent>
      </Card>
    );
  }

  const getGravitaColor = (gravita: string) => {
    switch (gravita) {
      case 'grave':
        return 'destructive';
      case 'moderata':
        return 'default';
      case 'lieve':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'valore_fuori_range':
      case 'trend_negativo':
        return <AlertTriangle className="w-5 h-5" />;
      case 'aderenza_bassa':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Alert Salute ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`p-4 border rounded-lg ${
              alert.gravita === 'grave'
                ? 'border-red-300 bg-red-50'
                : alert.gravita === 'moderata'
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-blue-300 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getIcon(alert.tipo)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{alert.titolo}</h3>
                    <Badge variant={getGravitaColor(alert.gravita)}>
                      {alert.gravita}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.messaggio}</p>
                  {alert.parametro && alert.valore && (
                    <p className="text-xs text-gray-600">
                      {alert.parametro}: {alert.valore}
                    </p>
                  )}
                  <p className="text-sm font-medium text-blue-700 mt-2">
                    💡 {alert.azioneConsigliata}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}




