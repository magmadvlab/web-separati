"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Terapia } from "@/types/api";
import { Calendar, Pill, TrendingUp, AlertCircle } from "lucide-react";

interface ProgressiTerapiaCardProps {
  terapia: Terapia;
}

export function ProgressiTerapiaCard({ terapia }: ProgressiTerapiaCardProps) {
  // Calcola valori dai dati della terapia
  const quantitaTotale = terapia.quantitaTotale || 0;
  const quantitaRimanente = terapia.quantitaRimanente || 0;
  const doseGiornaliera = Number(terapia.doseGiornaliera) || 1;
  
  // Calcoli
  const compresseAssunte = Math.max(0, quantitaTotale - quantitaRimanente);
  const percentualeCompletamento = quantitaTotale > 0 
    ? Math.round((compresseAssunte / quantitaTotale) * 100) 
    : 0;
  const giorniRimanenti = doseGiornaliera > 0 
    ? Math.ceil(quantitaRimanente / doseGiornaliera) 
    : 0;
  
  // Determina colore in base alla percentuale rimanente
  const getProgressColor = () => {
    const percentualeRimanente = 100 - percentualeCompletamento;
    if (percentualeRimanente <= 20) return "bg-red-500";
    if (percentualeRimanente <= 40) return "bg-orange-500";
    return "bg-blue-500";
  };

  const getStatusBadge = () => {
    const percentualeRimanente = 100 - percentualeCompletamento;
    if (percentualeRimanente <= 10) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Quasi finita
        </Badge>
      );
    }
    if (percentualeRimanente <= 20) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          In esaurimento
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
        <TrendingUp className="h-3 w-3 mr-1" />
        In corso
      </Badge>
    );
  };

  if (quantitaTotale === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Progressi Terapia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-4">
            Informazioni sui progressi non disponibili per questa terapia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Progressi Terapia
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiche principali */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Compresse Assunte</p>
            <p className="text-2xl font-bold text-blue-600">
              {compresseAssunte} <span className="text-sm font-normal text-gray-500">/ {quantitaTotale}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Percentuale</p>
            <p className="text-2xl font-bold text-green-600">
              {percentualeCompletamento}%
            </p>
          </div>
        </div>

        {/* Barra di progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Progresso terapia</span>
            <span>{percentualeCompletamento}% completata</span>
          </div>
          <Progress value={percentualeCompletamento} className="h-3" />
        </div>

        {/* Informazioni aggiuntive */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Giorni Rimanenti</p>
              <p className="text-sm font-semibold">
                {giorniRimanenti > 0 ? `${giorniRimanenti} giorni` : "Completata"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-600">Dose Giornaliera</p>
              <p className="text-sm font-semibold">
                {doseGiornaliera} {doseGiornaliera === 1 ? "compressa" : "compresse"}
              </p>
            </div>
          </div>
        </div>

        {/* Messaggio informativo */}
        {percentualeCompletamento >= 100 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✓ Terapia completata
            </p>
            <p className="text-xs text-green-700 mt-1">
              Tutte le compresse sono state assunte
            </p>
          </div>
        )}
        {percentualeCompletamento < 100 && quantitaRimanente <= doseGiornaliera * 15 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 font-medium">
              ⚠️ Terapia in esaurimento
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Mancano {giorniRimanenti} giorni. Considera di richiedere un rinnovo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



