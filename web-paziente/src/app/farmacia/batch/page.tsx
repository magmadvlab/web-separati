'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FarmaciaBatchListPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['farmacia-batch-assignments'],
    queryFn: async () => {
      const response = await api.get('/farmacia/batch/assignments');
      return response.data;
    },
  });

  const getStatoBadge = (stato: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      assegnato: { variant: 'default', label: 'Assegnato' },
      confermato: { variant: 'default', label: 'Confermato' },
      problemi: { variant: 'destructive', label: 'Problemi' },
      in_lavorazione: { variant: 'default', label: 'In Lavorazione' },
      pronto_ritiro: { variant: 'default', label: 'Pronto Ritiro' },
      completato: { variant: 'default', label: 'Completato' },
    };

    const config = variants[stato] || { variant: 'default', label: stato };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📦 Ordini Batch</h1>
        <Link href="/farmacia/ordini">
          <Button variant="outline">← Torna agli Ordini</Button>
        </Link>
      </div>

      {!assignments || assignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">
              Nessun batch assegnato
            </h3>
            <p className="text-gray-600">
              Non ci sono ordini batch assegnati alla tua farmacia al momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: any) => (
            <Card key={assignment.id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {assignment.batchWindow.nome}
                    </CardTitle>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>📍 Zona: {assignment.zonaGeografica}</span>
                      <span>📦 Ordini: {assignment.ordiniAssegnati}</span>
                      <span>
                        📅 Consegna:{' '}
                        {new Date(
                          assignment.batchWindow.dataConsegna,
                        ).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                  {getStatoBadge(assignment.stato)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Link href={`/farmacia/batch/${assignment.id}`}>
                    <Button>Vedi Dettaglio</Button>
                  </Link>
                  {assignment.stato === 'assegnato' && (
                    <Link href={`/farmacia/batch/${assignment.id}`}>
                      <Button variant="outline">
                        ✅ Conferma Disponibilità
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
