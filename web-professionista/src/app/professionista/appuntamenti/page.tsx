'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

interface PazienteInfo {
  id: number;
  nome?: string;
  cognome?: string;
  codiceFiscale?: string;
}

interface AppuntamentoItem {
  id: number;
  pazienteId: number;
  dataAppuntamento: string;
  oraAppuntamento: string;
  stato: string;
  paziente?: PazienteInfo;
}

interface RichiestaItem {
  id: number;
  pazienteId: number;
  stato: string;
  paziente?: PazienteInfo;
}

interface PersonaConAppuntamenti {
  pazienteId: number;
  paziente?: PazienteInfo;
  appuntamentiTotali: number;
  richiesteInAttesa: number;
  prossimo?: string;
}

const getNomeCompleto = (paziente?: PazienteInfo, fallbackId?: number) => {
  const nome = `${paziente?.nome || ''} ${paziente?.cognome || ''}`.trim();
  if (nome) return nome;
  return `Paziente #${fallbackId ?? paziente?.id ?? '-'}`;
};

const mergePazienteInfo = (
  current: PazienteInfo | undefined,
  next: PazienteInfo | undefined,
  pazienteId: number,
): PazienteInfo | undefined => {
  if (!current && !next) {
    return undefined;
  }
  return {
    id: pazienteId,
    nome: current?.nome || next?.nome,
    cognome: current?.cognome || next?.cognome,
    codiceFiscale: current?.codiceFiscale || next?.codiceFiscale,
  };
};

export default function ProfessionistaAppuntamentiPage() {
  const [appuntamenti, setAppuntamenti] = useState<AppuntamentoItem[]>([]);
  const [richieste, setRichieste] = useState<RichiestaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [appRes, reqRes] = await Promise.all([
          api.get('/professionista/appuntamenti'),
          api.get('/professionista/richieste-appuntamento'),
        ]);

        setAppuntamenti(Array.isArray(appRes.data) ? appRes.data : appRes.data?.data || []);
        setRichieste(Array.isArray(reqRes.data) ? reqRes.data : reqRes.data?.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Errore caricamento appuntamenti');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const persone = useMemo<PersonaConAppuntamenti[]>(() => {
    const map = new Map<number, PersonaConAppuntamenti>();

    for (const a of appuntamenti) {
      const current = map.get(a.pazienteId) || {
        pazienteId: a.pazienteId,
        appuntamentiTotali: 0,
        richiesteInAttesa: 0,
      };

      current.appuntamentiTotali += 1;
      current.paziente = mergePazienteInfo(current.paziente, a.paziente, a.pazienteId);
      const dt = new Date(`${a.dataAppuntamento}T${(a.oraAppuntamento || '00:00').slice(0, 5)}:00`);
      if (!Number.isNaN(dt.getTime())) {
        const iso = dt.toISOString();
        if (!current.prossimo || new Date(iso) < new Date(current.prossimo)) {
          current.prossimo = iso;
        }
      }
      map.set(a.pazienteId, current);
    }

    for (const r of richieste) {
      const current = map.get(r.pazienteId) || {
        pazienteId: r.pazienteId,
        appuntamentiTotali: 0,
        richiesteInAttesa: 0,
      };
      if (['in_attesa', 'pendente'].includes(String(r.stato || '').toLowerCase())) {
        current.richiesteInAttesa += 1;
      }
      current.paziente = mergePazienteInfo(current.paziente, r.paziente, r.pazienteId);
      map.set(r.pazienteId, current);
    }

    return Array.from(map.values()).sort((a, b) => {
      const da = a.prossimo ? new Date(a.prossimo).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.prossimo ? new Date(b.prossimo).getTime() : Number.MAX_SAFE_INTEGER;
      return da - db;
    });
  }, [appuntamenti, richieste]);

  if (loading) {
    return <div className="p-8 text-gray-600">Caricamento appuntamenti...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Persone con appuntamenti</h1>
        <p className="text-gray-600 mt-2">
          Vista sintetica di pazienti con appuntamenti e richieste attive
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">{error}</div>
      )}

      {persone.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center text-gray-500">
          Nessun paziente con appuntamenti al momento
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {persone.map((p) => (
            <div key={p.pazienteId} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Assistito</div>
              <div className="text-xl font-semibold text-gray-900">
                {getNomeCompleto(p.paziente, p.pazienteId)}
              </div>
              {p.paziente?.codiceFiscale && (
                <div className="text-xs text-gray-500 mt-1">CF: {p.paziente.codiceFiscale}</div>
              )}

              <div className="mt-4 space-y-1 text-sm text-gray-700">
                <div>Appuntamenti: {p.appuntamentiTotali}</div>
                <div>Richieste in attesa: {p.richiesteInAttesa}</div>
                <div>
                  Prossimo:{' '}
                  {p.prossimo
                    ? new Date(p.prossimo).toLocaleString('it-IT', {
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
                href={`/professionista/assistiti?pazienteId=${p.pazienteId}`}
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
