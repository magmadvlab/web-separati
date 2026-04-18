'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

interface RichiestaConsegna {
  id: number;
  clienteId: number;
  clienteTipo?: string;
  dataRichiesta?: string;
  oraInizio?: string;
  stato?: string;
}

interface Consegna {
  id: number;
  clienteId: number;
  clienteTipo?: string;
  dataConsegna?: string;
  oraConsegna?: string;
  stato?: string;
}

interface ClienteConConsegne {
  pazienteId: number;
  richiesteTotali: number;
  richiesteInAttesa: number;
  consegneTotali: number;
  prossimoEvento?: string;
}

function extractArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === 'object' && 'data' in value) {
    const nested = (value as { data?: unknown }).data;
    if (Array.isArray(nested)) {
      return nested as T[];
    }
  }

  return [];
}

function isPaziente(clienteTipo?: string): boolean {
  if (!clienteTipo) {
    return true;
  }
  return clienteTipo.toLowerCase() === 'paziente';
}

function toIsoDateTime(data?: string, ora?: string): string | undefined {
  if (!data) {
    return undefined;
  }

  const safeTime = (ora || '00:00').slice(0, 5);
  const parsed = new Date(`${data}T${safeTime}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

export default function FornitoreClientiPage() {
  const [richieste, setRichieste] = useState<RichiestaConsegna[]>([]);
  const [consegne, setConsegne] = useState<Consegna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [richiesteRes, consegneRes] = await Promise.all([
          api.get('/fornitore/richieste-consegna'),
          api.get('/fornitore/consegne'),
        ]);

        setRichieste(extractArray<RichiestaConsegna>(richiesteRes.data));
        setConsegne(extractArray<Consegna>(consegneRes.data));
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(message || 'Errore caricamento clienti');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const clienti = useMemo<ClienteConConsegne[]>(() => {
    const map = new Map<number, ClienteConConsegne>();

    for (const richiesta of richieste) {
      if (!isPaziente(richiesta.clienteTipo)) {
        continue;
      }

      const current = map.get(richiesta.clienteId) || {
        pazienteId: richiesta.clienteId,
        richiesteTotali: 0,
        richiesteInAttesa: 0,
        consegneTotali: 0,
      };

      current.richiesteTotali += 1;
      if (String(richiesta.stato || '').toLowerCase() === 'in_attesa') {
        current.richiesteInAttesa += 1;
      }

      const dateIso = toIsoDateTime(richiesta.dataRichiesta, richiesta.oraInizio);
      if (dateIso) {
        const candidate = new Date(dateIso).getTime();
        const currentValue = current.prossimoEvento
          ? new Date(current.prossimoEvento).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (candidate < currentValue) {
          current.prossimoEvento = dateIso;
        }
      }

      map.set(richiesta.clienteId, current);
    }

    for (const consegna of consegne) {
      if (!isPaziente(consegna.clienteTipo)) {
        continue;
      }

      const current = map.get(consegna.clienteId) || {
        pazienteId: consegna.clienteId,
        richiesteTotali: 0,
        richiesteInAttesa: 0,
        consegneTotali: 0,
      };

      current.consegneTotali += 1;

      const dateIso = toIsoDateTime(consegna.dataConsegna, consegna.oraConsegna);
      if (dateIso) {
        const candidate = new Date(dateIso).getTime();
        const currentValue = current.prossimoEvento
          ? new Date(current.prossimoEvento).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (candidate < currentValue) {
          current.prossimoEvento = dateIso;
        }
      }

      map.set(consegna.clienteId, current);
    }

    return Array.from(map.values()).sort((a, b) => {
      const da = a.prossimoEvento ? new Date(a.prossimoEvento).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.prossimoEvento ? new Date(b.prossimoEvento).getTime() : Number.MAX_SAFE_INTEGER;
      return da - db;
    });
  }, [richieste, consegne]);

  if (loading) {
    return <div className="p-8 text-gray-600">Caricamento clienti...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Persone con consegne</h1>
        <p className="text-gray-600 mt-2">Vista sintetica di richieste e consegne per paziente</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">{error}</div>
      )}

      {clienti.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center text-gray-500">
          Nessun cliente paziente trovato
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clienti.map((cliente) => (
            <div key={cliente.pazienteId} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Paziente</div>
              <div className="text-xl font-semibold text-gray-900">#{cliente.pazienteId}</div>

              <div className="mt-4 space-y-1 text-sm text-gray-700">
                <div>Richieste: {cliente.richiesteTotali}</div>
                <div>In attesa: {cliente.richiesteInAttesa}</div>
                <div>Consegne: {cliente.consegneTotali}</div>
                <div>
                  Prossimo evento:{' '}
                  {cliente.prossimoEvento
                    ? new Date(cliente.prossimoEvento).toLocaleString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'n/d'}
                </div>
              </div>

              <a
                href={`/fornitore/assistiti?pazienteId=${cliente.pazienteId}`}
                className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Apri assistito
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
