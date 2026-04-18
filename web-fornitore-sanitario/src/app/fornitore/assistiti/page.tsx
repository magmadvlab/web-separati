'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Shield } from 'lucide-react';

interface RichiestaConsegna {
  id: number;
  clienteId: number;
  clienteTipo?: string;
  stato?: string;
}

interface Consegna {
  id: number;
  clienteId: number;
  clienteTipo?: string;
}

interface AssistitoSummary {
  pazienteId: number;
  richiesteTotali: number;
  richiesteInAttesa: number;
  consegneTotali: number;
}

interface DocumentoInviato {
  pazienteId: number;
  titolo: string;
  tipoDocumento: string;
  urlDocumento?: string;
  createdAt: string;
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

export default function FornitoreAssistitiPage() {
  const searchParams = useSearchParams();
  const pazienteIdFromQuery = searchParams.get('pazienteId');

  const [richieste, setRichieste] = useState<RichiestaConsegna[]>([]);
  const [consegne, setConsegne] = useState<Consegna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pazienteId, setPazienteId] = useState<number>(0);
  const [titolo, setTitolo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<
    'conferma-consegna' | 'prescrizione' | 'referto' | 'altro'
  >('conferma-consegna');
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
        setError(message || 'Errore caricamento assistiti');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const assistiti = useMemo<AssistitoSummary[]>(() => {
    const map = new Map<number, AssistitoSummary>();

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
      map.set(consegna.clienteId, current);
    }

    return Array.from(map.values()).sort((a, b) => a.pazienteId - b.pazienteId);
  }, [richieste, consegne]);

  useEffect(() => {
    if (pazienteIdFromQuery && !Number.isNaN(Number(pazienteIdFromQuery))) {
      setPazienteId(Number(pazienteIdFromQuery));
    }
  }, [pazienteIdFromQuery]);

  useEffect(() => {
    if (!pazienteId && assistiti.length > 0) {
      setPazienteId(assistiti[0].pazienteId);
    }
  }, [assistiti, pazienteId]);

  const handleInviaDocumento = async (event: FormEvent) => {
    event.preventDefault();

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
        const uploadData = uploadRes?.data as { data?: { url?: string } };
        urlDocumento = uploadData?.data?.url;
      }

      await api.post('/fornitore/documenti/invia', {
        pazienteId,
        tipoDocumento,
        titolo: titolo.trim(),
        descrizione: descrizione.trim() || undefined,
        note: note.trim() || undefined,
        urlDocumento,
        metodoInvio: 'portale',
      });

      setSentDocs((prev) => [
        {
          pazienteId,
          titolo: titolo.trim(),
          tipoDocumento,
          urlDocumento,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setTitolo('');
      setDescrizione('');
      setNote('');
      setFile(null);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Errore invio documento');
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
          Gestione pazienti con consegne e invio documenti (conferme, referti, prescrizioni)
        </p>
      </div>

      {/* WEB-10: Alert dati sanitari sensibili */}
      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
        <Shield className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-orange-900">Dati sanitari sensibili &mdash; GDPR Art. 9</p>
          <p className="text-orange-800 mt-0.5">
            I dati degli assistiti includono informazioni sanitarie sensibili ai sensi del GDPR Art. 9.
            Accessibili <strong>solo al personale autorizzato</strong>. Non condividere, stampare o scaricare senza autorizzazione esplicita del titolare del trattamento.
          </p>
        </div>
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
              {assistiti.map((assistito) => (
                <button
                  key={assistito.pazienteId}
                  type="button"
                  onClick={() => setPazienteId(assistito.pazienteId)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                    pazienteId === assistito.pazienteId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Paziente #{assistito.pazienteId}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Richieste: {assistito.richiesteTotali} • In attesa: {assistito.richiesteInAttesa} • Consegne:{' '}
                    {assistito.consegneTotali}
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
              onChange={(event) => setPazienteId(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            >
              {assistiti.map((assistito) => (
                <option key={assistito.pazienteId} value={assistito.pazienteId}>
                  Paziente #{assistito.pazienteId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Tipo documento</label>
            <select
              value={tipoDocumento}
              onChange={(event) =>
                setTipoDocumento(
                  event.target.value as 'conferma-consegna' | 'prescrizione' | 'referto' | 'altro',
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="conferma-consegna">Conferma consegna</option>
              <option value="referto">Referto</option>
              <option value="prescrizione">Prescrizione</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Titolo</label>
            <input
              value={titolo}
              onChange={(event) => setTitolo(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Es. Conferma consegna materiale"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Descrizione</label>
            <textarea
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-20"
              placeholder="Descrizione breve del documento"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Allegato (opzionale)</label>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Note</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
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

      {sentDocs.length > 0 && (
        <div className="rounded-lg border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documenti inviati (sessione corrente)</h2>
          <div className="space-y-2">
            {sentDocs.map((documento, index) => (
              <div key={`${documento.createdAt}-${index}`} className="rounded border border-gray-200 p-3 text-sm">
                <div className="font-medium text-gray-900">
                  {documento.titolo} • Paziente #{documento.pazienteId}
                </div>
                <div className="text-gray-600">
                  Tipo: {documento.tipoDocumento} • {new Date(documento.createdAt).toLocaleString('it-IT')}
                </div>
                {documento.urlDocumento && (
                  <a
                    href={documento.urlDocumento}
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
