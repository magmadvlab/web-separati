'use client';

import { useAuth } from '@/hooks/useAuth';
import { InviaDocumentoFarmacia } from '@/components/farmacia/documenti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Search } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Paziente {
  id: number;
  nome: string;
  cognome: string;
  codiceFiscale: string;
}

export default function FarmaciaDocumentiPage() {
  const { token, loading, error } = useAuth();
  const [searchPaziente, setSearchPaziente] = useState('');
  const [selectedPaziente, setSelectedPaziente] = useState<Paziente | null>(null);

  const { data: pazienti = [], isLoading } = useQuery({
    queryKey: ['farmacia-pazienti', searchPaziente],
    queryFn: async () => {
      if (!searchPaziente.trim()) return [];
      if (!token) return [];

      const res = await api.get(`/farmacia/pazienti/ricerca?q=${encodeURIComponent(searchPaziente)}`);
      return res.data?.data || [];
    },
    enabled: !!token && searchPaziente.length > 0,
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">Errore caricamento. Effettua il login.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Invia Documento al Paziente</h1>
        </div>
        <p className="text-gray-600">Conferma consegna, ricette o consigli farmacologici</p>
      </div>

      {!selectedPaziente ? (
        <Card>
          <CardHeader>
            <CardTitle>Seleziona Paziente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Cerca paziente per nome, cognome o CF..."
                value={searchPaziente}
                onChange={(e) => setSearchPaziente(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" disabled>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {searchPaziente && (
              <div className="mt-4">
                {isLoading ? (
                  <div className="text-center py-4 text-gray-500">Ricerca in corso...</div>
                ) : pazienti.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Nessun paziente trovato</div>
                ) : (
                  <div className="space-y-2">
                    {pazienti.map((paz: Paziente) => (
                      <div
                        key={paz.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => setSelectedPaziente(paz)}
                      >
                        <div>
                          <p className="font-semibold">
                            {paz.nome} {paz.cognome}
                          </p>
                          <p className="text-sm text-gray-600">CF: {paz.codiceFiscale}</p>
                        </div>
                        <Button size="sm">Seleziona</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {selectedPaziente.nome} {selectedPaziente.cognome}
              </h2>
              <p className="text-gray-600">CF: {selectedPaziente.codiceFiscale}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPaziente(null);
                setSearchPaziente('');
              }}
            >
              Cambia Paziente
            </Button>
          </div>

          <InviaDocumentoFarmacia
            pazienteId={selectedPaziente.id}
            pazienteName={`${selectedPaziente.nome} ${selectedPaziente.cognome}`}
          />
        </div>
      )}
    </div>
  );
}
