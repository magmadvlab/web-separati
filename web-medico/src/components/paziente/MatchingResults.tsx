"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface MatchingResult {
  id: number;
  nomeCommerciale: string;
  principioAttivo: string;
  codiceAIC?: string;
  codiceGTIN?: string;
  punteggio: number;
  dosaggio?: string;
}

interface MatchingResultsProps {
  risultati: MatchingResult[];
  onSelect?: (farmaco: MatchingResult) => void;
}

export function MatchingResults({ risultati, onSelect }: MatchingResultsProps) {
  if (!risultati || risultati.length === 0) {
    return null;
  }

  const getPunteggioColor = (punteggio: number) => {
    if (punteggio >= 90) return "text-green-600";
    if (punteggio >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  const getPunteggioBadge = (punteggio: number) => {
    if (punteggio >= 90) return "bg-green-500";
    if (punteggio >= 70) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenzaLabel = (punteggio: number) => {
    if (punteggio >= 90) return "Alta Confidenza";
    if (punteggio >= 70) return "Media Confidenza";
    return "Bassa Confidenza";
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="w-5 h-5" />
          Risultati Matching ({risultati.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {risultati.map((farmaco, index) => (
          <div
            key={farmaco.id || index}
            className={`p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
              index === 0 && farmaco.punteggio >= 90
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onSelect?.(farmaco)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{farmaco.nomeCommerciale}</h3>
                  {index === 0 && farmaco.punteggio >= 90 && (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Miglior Match
                    </Badge>
                  )}
                </div>
                {farmaco.principioAttivo && (
                  <p className="text-sm text-gray-600 mb-1">
                    Principio attivo: {farmaco.principioAttivo}
                  </p>
                )}
                {farmaco.dosaggio && (
                  <p className="text-xs text-gray-500 mb-2">Dosaggio: {farmaco.dosaggio}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {farmaco.codiceAIC && (
                    <Badge variant="outline" className="text-xs">
                      AIC: {farmaco.codiceAIC}
                    </Badge>
                  )}
                  {farmaco.codiceGTIN && (
                    <Badge variant="outline" className="text-xs">
                      GTIN: {farmaco.codiceGTIN}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className={`text-2xl font-bold ${getPunteggioColor(farmaco.punteggio)}`}>
                  {farmaco.punteggio.toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">{getConfidenzaLabel(farmaco.punteggio)}</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={farmaco.punteggio} className="h-2" />
            </div>
          </div>
        ))}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Suggerimento:</strong> I risultati sono ordinati per punteggio di confidenza.
            Seleziona il farmaco corretto o verifica manualmente se nessun risultato corrisponde.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


