'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

interface PazienteInfo {
  id: number;
  nome?: string;
  cognome?: string;
  codiceFiscale?: string;
}

interface AppuntamentoItem {
  id?: number;
  pazienteId: number;
  stato?: string;
  dataAppuntamento?: string;
  oraAppuntamento?: string;
  motivoVisita?: string;
  richiesta?: {
    motivoVisita?: string;
  };
  paziente?: PazienteInfo;
}

interface RichiestaItem {
  id?: number;
  pazienteId: number;
  stato: string;
  dataRichiesta?: string;
  oraInizio?: string;
  motivoVisita?: string;
  note?: string;
  paziente?: PazienteInfo;
}

interface AssistitoSummary {
  pazienteId: number;
  paziente?: PazienteInfo;
  appuntamentiTotali: number;
  richiesteTotali: number;
  richiesteInAttesa: number;
}

interface DocumentoInviato {
  id?: number;
  pazienteId: number;
  titolo: string;
  tipoDocumento: string;
  urlDocumento?: string;
  createdAt: string;
}

type StoricoEvento = {
  id: string;
  tipo: 'richiesta' | 'appuntamento' | 'documento';
  dataIso: string;
  titolo: string;
  descrizione?: string;
  stato?: string;
};

const getNomeCompleto = (paziente?: PazienteInfo, fallbackId?: number) => {
  const nome = `${paziente?.nome || ''} ${paziente?.cognome || ''}`.trim();
  if (nome) {
    return nome;
  }
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

const normalizeDateTime = (dateValue?: string, timeValue?: string) => {
  if (dateValue) {
    if (timeValue) {
      if (timeValue.includes('T')) {
        const parsedTimeDate = new Date(timeValue);
        if (!Number.isNaN(parsedTimeDate.getTime())) {
          return parsedTimeDate.toISOString();
        }
      }

      const day = dateValue.includes('T') ? dateValue.slice(0, 10) : dateValue;
      const hhmmss = timeValue.length <= 5 ? `${timeValue.slice(0, 5)}:00` : timeValue.slice(0, 8);
      const merged = new Date(`${day}T${hhmmss}`);
      if (!Number.isNaN(merged.getTime())) {
        return merged.toISOString();
      }
    }

    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

export default function ProfessionistaAssistitiPage() {
  const searchParams = useSearchParams();
  const pazienteIdFromQuery = searchParams.get('pazienteId');

  const [appuntamenti, setAppuntamenti] = useState<AppuntamentoItem[]>([]);
  const [richieste, setRichieste] = useState<RichiestaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pazienteId, setPazienteId] = useState<number>(0);
  const [titolo, setTitolo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<'referto' | 'consulto' | 'prescrizione' | 'altro'>('referto');
  const [descrizione, setDescrizione] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentDocs, setSentDocs] = useState<DocumentoInviato[]>([]);

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
        setError(e?.response?.data?.message || 'Errore caricamento assistiti');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const assistiti = useMemo<AssistitoSummary[]>(() => {
    const map = new Map<number, AssistitoSummary>();

    for (const a of appuntamenti) {
      const current = map.get(a.pazienteId) || {
        pazienteId: a.pazienteId,
        appuntamentiTotali: 0,
        richiesteTotali: 0,
        richiesteInAttesa: 0,
      };
      current.appuntamentiTotali += 1;
      current.paziente = mergePazienteInfo(current.paziente, a.paziente, a.pazienteId);
      map.set(a.pazienteId, current);
    }

    for (const r of richieste) {
      const current = map.get(r.pazienteId) || {
        pazienteId: r.pazienteId,
        appuntamentiTotali: 0,
        richiesteTotali: 0,
        richiesteInAttesa: 0,
      };
      current.richiesteTotali += 1;
      if (['in_attesa', 'pendente'].includes(String(r.stato || '').toLowerCase())) {
        current.richiesteInAttesa += 1;
      }
      current.paziente = mergePazienteInfo(current.paziente, r.paziente, r.pazienteId);
      map.set(r.pazienteId, current);
    }

    return Array.from(map.values()).sort((a, b) => {
      const nomeA = getNomeCompleto(a.paziente, a.pazienteId);
      const nomeB = getNomeCompleto(b.paziente, b.pazienteId);
      return nomeA.localeCompare(nomeB, 'it', { sensitivity: 'base' });
    });
  }, [appuntamenti, richieste]);

  const assistitiMap = useMemo(
    () => new Map(assistiti.map((assistito) => [assistito.pazienteId, assistito])),
    [assistiti],
  );

  const selectedAssistito = useMemo(
    () => assistitiMap.get(pazienteId),
    [assistitiMap, pazienteId],
  );

  const storicoPaziente = useMemo<StoricoEvento[]>(() => {
    if (!pazienteId) {
      return [];
    }

    const eventiRichieste: StoricoEvento[] = richieste
      .filter((item) => item.pazienteId === pazienteId)
      .map((item) => ({
        id: `richiesta-${item.id ?? `${item.pazienteId}-${item.dataRichiesta || 'nd'}-${item.oraInizio || 'nd'}`}`,
        tipo: 'richiesta',
        dataIso: normalizeDateTime(item.dataRichiesta, item.oraInizio),
        titolo: 'Richiesta appuntamento',
        descrizione: item.motivoVisita || item.note || 'Nessun motivo specificato',
        stato: item.stato,
      }));

    const eventiAppuntamenti: StoricoEvento[] = appuntamenti
      .filter((item) => item.pazienteId === pazienteId)
      .map((item) => ({
        id: `appuntamento-${item.id ?? `${item.pazienteId}-${item.dataAppuntamento || 'nd'}-${item.oraAppuntamento || 'nd'}`}`,
        tipo: 'appuntamento',
        dataIso: normalizeDateTime(item.dataAppuntamento, item.oraAppuntamento),
        titolo: 'Visita / appuntamento',
        descrizione: item.motivoVisita || item.richiesta?.motivoVisita || 'Motivo non indicato',
        stato: item.stato,
      }));

    const eventiDocumenti: StoricoEvento[] = sentDocs
      .filter((item) => item.pazienteId === pazienteId)
      .map((item) => ({
        id: `documento-${item.id ?? `${item.pazienteId}-${item.createdAt}`}`,
        tipo: 'documento',
        dataIso: item.createdAt,
        titolo: `Documento inviato: ${item.titolo}`,
        descrizione: `Tipo documento: ${item.tipoDocumento}`,
      }));

    return [...eventiRichieste, ...eventiAppuntamenti, ...eventiDocumenti]
      .sort((a, b) => new Date(b.dataIso).getTime() - new Date(a.dataIso).getTime())
      .slice(0, 12);
  }, [appuntamenti, richieste, sentDocs, pazienteId]);

  useEffect(() => {
    if (pazienteIdFromQuery && !Number.isNaN(Number(pazienteIdFromQuery))) {
      setPazienteId(Number(pazienteIdFromQuery));
    }
  }, [pazienteIdFromQuery]);

  useEffect(() => {
    if (assistiti.length === 0) {
      return;
    }

    if (!pazienteId || !assistiti.some((assistito) => assistito.pazienteId === pazienteId)) {
      setPazienteId(assistiti[0].pazienteId);
    }
  }, [assistiti, pazienteId]);

  const handleInviaDocumento = async (e: FormEvent) => {
    e.preventDefault();
    if (!pazienteId || !titolo.trim()) {
      setError('Seleziona assistito e titolo documento');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      let urlDocumento: string | undefined;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/upload/documento', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urlDocumento = uploadRes?.data?.data?.url;
      }

      const payload = {
        pazienteId,
        tipoDocumento,
        titolo: titolo.trim(),
        descrizione: descrizione.trim() || undefined,
        note: note.trim() || undefined,
        urlDocumento,
        metodoInvio: 'portale' as const,
      };

      const res = await api.post('/professionista/documenti/invia', payload);

      setSentDocs((prev) => [
        {
          id: res?.data?.id,
          pazienteId,
          titolo: payload.titolo,
          tipoDocumento: payload.tipoDocumento,
          urlDocumento,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setTitolo('');
      setDescrizione('');
      setNote('');
      setFile(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Errore invio documento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Caricamento assistiti...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assistiti</h1>
        <p className="text-gray-600 mt-2">
          Gestione assistiti e invio documenti (referti, consulti, prescrizioni)
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Elenco assistiti</h2>
          {assistiti.length === 0 ? (
            <p className="text-gray-500">Nessun assistito disponibile</p>
          ) : (
            <div className="space-y-3">
              {assistiti.map((a) => (
                <button
                  key={a.pazienteId}
                  type="button"
                  onClick={() => setPazienteId(a.pazienteId)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                    pazienteId === a.pazienteId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {getNomeCompleto(a.paziente, a.pazienteId)}
                  </div>
                  {a.paziente?.codiceFiscale && (
                    <div className="text-xs text-gray-500 mt-1">CF: {a.paziente.codiceFiscale}</div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    Appuntamenti: {a.appuntamentiTotali} • Richieste: {a.richiesteTotali} • In attesa:{' '}
                    {a.richiesteInAttesa}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleInviaDocumento} className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Invia documento</h2>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Assistito</label>
            <select
              value={pazienteId || ''}
              onChange={(e) => setPazienteId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            >
              {assistiti.map((a) => (
                <option key={a.pazienteId} value={a.pazienteId}>
                  {getNomeCompleto(a.paziente, a.pazienteId)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Tipo documento</label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="referto">Referto</option>
              <option value="consulto">Consulto</option>
              <option value="prescrizione">Prescrizione</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Titolo</label>
            <input
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Es. Referto visita di controllo"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Descrizione</label>
            <textarea
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20"
              placeholder="Descrizione breve del documento"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Allegato (opzionale)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20"
              placeholder="Note aggiuntive"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || assistiti.length === 0}
            className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Invio in corso...' : 'Invia documento'}
          </button>
        </form>
      </div>

      {selectedAssistito && (
        <div className="rounded-lg border bg-white p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quadro generale assistito</h2>
            <p className="text-sm text-gray-600 mt-1">
              {getNomeCompleto(selectedAssistito.paziente, selectedAssistito.pazienteId)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Visite / appuntamenti</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {selectedAssistito.appuntamentiTotali}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Richieste totali</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {selectedAssistito.richiesteTotali}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Documenti inviati (sessione)</div>
              <div className="text-2xl font-semibold text-gray-900 mt-1">
                {sentDocs.filter((item) => item.pazienteId === selectedAssistito.pazienteId).length}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Storico attività assistito</h3>
            {storicoPaziente.length === 0 ? (
              <p className="text-sm text-gray-500">Nessuna attività disponibile per questo assistito.</p>
            ) : (
              <div className="space-y-2">
                {storicoPaziente.map((evento) => (
                  <div key={evento.id} className="rounded border border-gray-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-gray-900">{evento.titolo}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(evento.dataIso).toLocaleString('it-IT')}
                      </div>
                    </div>
                    {evento.descrizione && (
                      <div className="text-gray-700 mt-1">{evento.descrizione}</div>
                    )}
                    {evento.stato && (
                      <div className="text-xs text-gray-500 mt-1">Stato: {evento.stato}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {sentDocs.length > 0 && (
        <div className="rounded-lg border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documenti inviati (sessione corrente)</h2>
          <div className="space-y-2">
            {sentDocs.map((d, i) => (
              <div key={`${d.createdAt}-${i}`} className="rounded border border-gray-200 p-3 text-sm">
                <div className="font-medium text-gray-900">
                  {d.titolo} •{' '}
                  {getNomeCompleto(assistitiMap.get(d.pazienteId)?.paziente, d.pazienteId)}
                </div>
                <div className="text-gray-600">
                  Tipo: {d.tipoDocumento} • {new Date(d.createdAt).toLocaleString('it-IT')}
                </div>
                {d.urlDocumento && (
                  <a
                    href={d.urlDocumento}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-1 text-blue-600 hover:text-blue-700"
                  >
                    Download allegato
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
