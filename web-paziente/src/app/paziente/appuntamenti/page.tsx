'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import CalendarioMensile from '@/components/calendario/CalendarioMensile';
import SlotOrari from '@/components/calendario/SlotOrari';

const toArray = <T = any>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.richieste)) return value.richieste;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const GIORNI_ORARI: Record<string, string> = {
  lunedi: 'Lunedì',
  martedi: 'Martedì',
  mercoledi: 'Mercoledì',
  giovedi: 'Giovedì',
  venerdi: 'Venerdì',
  sabato: 'Sabato',
  domenica: 'Domenica',
};

function AppuntamentiPageInner() {
  const searchParams = useSearchParams();
  const initialMinoreId = Number(searchParams.get('minoreId') || '') || null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">I Miei Appuntamenti</h1>
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Per richiedere consulti con specialisti o altri professionisti sanitari usa{' '}
        <a href="/paziente/ricerca-servizi" className="font-semibold underline hover:no-underline">
          Cerca Professionisti
        </a>
        . In questa sezione restano disponibili solo le richieste per Medico e Pediatra.
      </div>

      {/* Content */}
      <div className="mt-6">
        <MedicoTab initialMinoreId={initialMinoreId} />
      </div>
    </div>
  );
}

function LaboratorioTab() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'calendar' | 'slots' | 'form' | 'requests'>('list');
  const [laboratori, setLaboratori] = useState<any[]>([]);
  const [richieste, setRichieste] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form prenotazione
  const [formData, setFormData] = useState({
    esami: [{ codice: '', nome: '', categoria: '', costo: 0 }],
    urgente: false,
    digiuno: false,
    note: '',
  });

  useEffect(() => {
    if (view === 'list') {
      fetchLaboratori();
    } else if (view === 'requests') {
      fetchRichieste();
    }
  }, [view]);

  const fetchLaboratori = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/esami-laboratorio/laboratori');
      setLaboratori(toArray(res.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento laboratori');
    } finally {
      setLoading(false);
    }
  };

  const fetchRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/esami-laboratorio/richieste');
      setRichieste(toArray(res.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const buildLabMonthAvailability = (mese: string, calendario: any) => {
    const [yearStr, monthStr] = mese.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const disponibilita = Array.isArray(calendario?.disponibilita)
      ? calendario.disponibilita
      : [];
    const eccezioni = Array.isArray(calendario?.eccezioni) ? calendario.eccezioni : [];

    const availableWeekdays = new Set<number>();
    disponibilita.forEach((d: any) => {
      if (d?.attivo && typeof d?.giornoSettimana === 'number') {
        availableWeekdays.add(d.giornoSettimana);
      }
    });

    const eccezioniByDate = new Map<string, any>();
    eccezioni.forEach((e: any) => {
      if (!e?.data) return;
      const dateStr = new Date(e.data).toISOString().split('T')[0];
      eccezioniByDate.set(dateStr, e);
    });

    const result: any[] = [];
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const weekday = d.getDay();
      let isAvailable = availableWeekdays.size === 0 || availableWeekdays.has(weekday);

      const eccezione = eccezioniByDate.get(dateStr);
      if (eccezione) {
        const tipo = String(eccezione.tipo || '').toLowerCase();
        if (eccezione.disponibile === true || tipo === 'aperto') {
          isAvailable = true;
        } else if (
          eccezione.disponibile === false ||
          eccezione.chiuso === true ||
          tipo === 'chiuso'
        ) {
          isAvailable = false;
        } else {
          isAvailable = false;
        }
      }

      result.push({
        data: dateStr,
        disponibile: isAvailable,
        posti_totali: 1,
        posti_occupati: 0,
        posti_disponibili: isAvailable ? 1 : 0,
        stato: isAvailable ? 'disponibile' : 'non_disponibile',
      });
    }

    return result;
  };

  // Fetch disponibilità mensile
  const fetchDisponibilitaLab = async (labId: number, mese: string) => {
    const res = await api.get(`/paziente/esami-laboratorio/laboratori/${labId}/calendario`, {
      params: { data: `${mese}-01` },
    });
    return buildLabMonthAvailability(mese, res.data);
  };

  // Fetch slot giornalieri
  const fetchSlotsLab = async (labId: number, data: string) => {
    const res = await api.get(
      `/paziente/esami-laboratorio/laboratori/${labId}/slot-disponibili`,
      { params: { data } }
    );
    const slots = toArray(res.data?.slots ?? res.data);
    return slots.map((s: any) => ({
      ora_inizio: s.ora_inizio || s.oraInizio,
      ora_fine: s.ora_fine || s.oraFine,
      disponibile: s.disponibile ?? true,
      posti_disponibili: s.posti_disponibili ?? s.postiDisponibili ?? 1,
      max_prenotazioni: s.max_prenotazioni ?? s.maxPrenotazioni,
    }));
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab || !selectedDate || !selectedSlot) return;

    try {
      setLoading(true);
      await api.post('/paziente/esami-laboratorio/richiesta', {
        laboratorioId: selectedLab.id,
        dataRichiesta: selectedDate,
        oraInizio: selectedSlot.ora_inizio,
        esamiRichiesti: formData.esami.filter((e) => e.nome),
        urgente: formData.urgente,
        digiuno: formData.digiuno,
        note: formData.note,
      });
      alert('Richiesta inviata con successo!');
      setView('requests');
      setSelectedLab(null);
      setSelectedDate('');
      setSelectedSlot(null);
      setFormData({
        esami: [{ codice: '', nome: '', categoria: '', costo: 0 }],
        urgente: false,
        digiuno: false,
        note: '',
      });
    } catch (err: any) {
      if (err.response?.data?.code === 'SLOT_UNAVAILABLE') {
        setError('Slot non più disponibile. Seleziona un altro orario.');
        setView('slots');
      } else {
        setError(err.response?.data?.message || 'Errore invio richiesta');
      }
    } finally {
      setLoading(false);
    }
  };

  const addEsame = () => {
    setFormData({
      ...formData,
      esami: [...formData.esami, { codice: '', nome: '', categoria: '', costo: 0 }],
    });
  };

  const removeEsame = (index: number) => {
    setFormData({
      ...formData,
      esami: formData.esami.filter((_, i) => i !== index),
    });
  };

  const updateEsame = (index: number, field: string, value: any) => {
    const newEsami = [...formData.esami];
    newEsami[index] = { ...newEsami[index], [field]: value };
    setFormData({ ...formData, esami: newEsami });
  };

  const filteredLaboratori = laboratori.filter((lab) =>
    `${lab.nome} ${lab.indirizzo || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading && !laboratori.length && !richieste.length) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  // Vista Lista Laboratori
  if (view === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Laboratori Disponibili</h2>
          <button
            onClick={() => setView('requests')}
            className="text-blue-600 hover:underline"
          >
            Le Mie Richieste
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {/* Barra Ricerca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cerca per nome o indirizzo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div className="grid gap-4">
          {filteredLaboratori.map((lab) => (
            <div key={lab.id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                    🔬
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{lab.nome}</h3>
                    {lab.indirizzo && (
                      <p className="text-sm text-gray-600 mt-1">📍 {lab.indirizzo}</p>
                    )}
                    {lab.telefono && (
                      <p className="text-sm text-gray-600">📞 {lab.telefono}</p>
                    )}
                    {lab.orariApertura && (
                      <p className="text-xs text-gray-500 mt-1">
                        🕐 {lab.orariApertura}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedLab(lab);
                    setView('calendar');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Prenota
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLaboratori.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Nessun laboratorio trovato</p>
          </div>
        )}
      </div>
    );
  }

  // Vista Calendario Mensile
  if (view === 'calendar' && selectedLab) {
    return (
      <div>
        <button
          onClick={() => {
            setView('list');
            setSelectedLab(null);
            setSelectedDate('');
          }}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna ai Laboratori
        </button>

        <div className="bg-white border rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Esami - {selectedLab.nome}
          </h2>
          <p className="text-sm text-blue-600 font-medium mb-4">Laboratorio Analisi</p>
          <p className="text-sm text-gray-600 mb-4">
            Seleziona una data disponibile dal calendario
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <CalendarioMensile
            servizioId={selectedLab.id}
            tipoServizio="laboratorio"
            onSelectDate={(date) => {
              setSelectedDate(date);
              setView('slots');
            }}
            selectedDate={selectedDate}
            fetchDisponibilita={fetchDisponibilitaLab}
          />
        </div>
      </div>
    );
  }

  // Vista Slot Orari
  if (view === 'slots' && selectedLab && selectedDate) {
    return (
      <div>
        <button
          onClick={() => {
            setView('list');
            setSelectedLab(null);
            setSelectedDate('');
          }}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna ai Laboratori
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Esami - {selectedLab.nome}
          </h2>
          <p className="text-sm text-blue-600 font-medium mb-2">Laboratorio Analisi</p>
          <p className="text-sm text-gray-600">Seleziona un orario disponibile</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        <SlotOrari
          servizioId={selectedLab.id}
          tipoServizio="laboratorio"
          selectedDate={selectedDate}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setView('form');
          }}
          onBack={() => setView('calendar')}
          selectedSlot={selectedSlot}
          fetchSlots={fetchSlotsLab}
        />
      </div>
    );
  }

  // Vista Form Prenotazione
  if (view === 'form' && selectedLab && selectedDate && selectedSlot) {
    return (
      <div>
        <button
          onClick={() => setView('slots')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Cambia Orario
        </button>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Completa Prenotazione - {selectedLab.nome}
          </h2>

          {/* Riepilogo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Riepilogo Prenotazione</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Data:</span>{' '}
                <span className="font-medium">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Orario:</span>{' '}
                <span className="font-medium">
                  {selectedSlot.ora_inizio} - {selectedSlot.ora_fine}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Laboratorio:</span>{' '}
                <span className="font-medium">{selectedLab.nome}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmitRichiesta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Esami Richiesti</label>
              {formData.esami.map((esame, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nome esame"
                    required
                    value={esame.nome}
                    onChange={(e) => updateEsame(index, 'nome', e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Categoria"
                    value={esame.categoria}
                    onChange={(e) => updateEsame(index, 'categoria', e.target.value)}
                    className="w-32 border rounded px-3 py-2"
                  />
                  {formData.esami.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEsame(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEsame}
                className="text-blue-600 hover:underline text-sm"
              >
                + Aggiungi Esame
              </button>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.urgente}
                  onChange={(e) =>
                    setFormData({ ...formData, urgente: e.target.checked })
                  }
                />
                <span className="text-sm">Urgente</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.digiuno}
                  onChange={(e) =>
                    setFormData({ ...formData, digiuno: e.target.checked })
                  }
                />
                <span className="text-sm">Richiede digiuno</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Invio...' : 'Invia Richiesta'}
              </button>
              <button
                type="button"
                onClick={() => setView('slots')}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Cambia Orario
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setSelectedLab(null);
                  setSelectedDate('');
                  setSelectedSlot(null);
                }}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Vista Richieste
  if (view === 'requests') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Le Mie Richieste</h2>
          <button
            onClick={() => setView('list')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Nuova Prenotazione
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {richieste.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">Nessuna richiesta presente</p>
            <button
              onClick={() => setView('list')}
              className="text-blue-600 hover:underline"
            >
              Prenota il tuo primo esame
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {richieste.map((richiesta) => (
              <div key={richiesta.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {richiesta.laboratorio?.nome || 'Laboratorio'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(richiesta.dataRichiesta || richiesta.data_richiesta).toLocaleDateString('it-IT')} alle{' '}
                      {richiesta.oraInizio || richiesta.ora_inizio}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      richiesta.stato === 'confermata'
                        ? 'bg-green-100 text-green-800'
                        : richiesta.stato === 'in_attesa'
                        ? 'bg-yellow-100 text-yellow-800'
                        : richiesta.stato === 'rifiutata'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {richiesta.stato}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm font-medium mb-2">Esami richiesti:</p>
                  <ul className="text-sm space-y-1">
                    {(richiesta.esamiRichiesti || richiesta.esami_richiesti || []).map((esame: any, i: number) => (
                      <li key={i}>
                        • {esame.nome}
                        {esame.categoria && ` (${esame.categoria})`}
                      </li>
                    ))}
                  </ul>
                </div>

                {richiesta.urgente && (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2">
                    Urgente
                  </span>
                )}
                {richiesta.digiuno && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Digiuno richiesto
                  </span>
                )}

                {richiesta.note && (
                  <p className="text-sm text-gray-600 mt-2">Note: {richiesta.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function MedicoTab({ initialMinoreId }: { initialMinoreId?: number | null }) {
  type VisitMode = 'medico' | 'pediatra';
  const [view, setView] = useState<'info' | 'calendar' | 'slots' | 'form' | 'requests'>('info');
  const [visitMode, setVisitMode] = useState<VisitMode>(initialMinoreId ? 'pediatra' : 'medico');
  const [medico, setMedico] = useState<any>(null);
  const [minori, setMinori] = useState<any[]>([]);
  const [selectedMinoreId, setSelectedMinoreId] = useState<number | null>(initialMinoreId ?? null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [richieste, setRichieste] = useState<any[]>([]);
  const [orariVisita, setOrariVisita] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrari, setLoadingOrari] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    motivo: '',
    sintomi: '',
    urgente: false,
    note: '',
  });

  const selectedMinore = minori.find((m: any) => m.id === selectedMinoreId) || null;
  const pediatraAssegnato = selectedMinore?.pediatra || null;
  const activeMedico = visitMode === 'pediatra' ? pediatraAssegnato : medico;
  const canBookCurrentFlow = visitMode === 'pediatra' ? !!activeMedico && !!selectedMinore : !!medico;
  const tipoMedicoLabel = visitMode === 'pediatra' ? 'Pediatra di Famiglia' : 'Medico di Base';

  const toIsoDate = (value?: string | Date | null) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const getEta = (value?: string | Date | null) => {
    if (!value) return null;
    const birthDate = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(birthDate.getTime())) return null;
    const diff = Date.now() - birthDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  };

  const loadMedicoCurante = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/medico-curante');
      setMedico(res.data || null);
    } catch {
      setMedico(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMinori = async () => {
    try {
      const res = await api.get('/paziente/medico-curante/minori-a-carico');
      setMinori(toArray(res.data));
      return;
    } catch {
      // fallback legacy/deploy intermedi
    }

    try {
      const res = await api.get('/paziente/medico-curante/minori');
      setMinori(toArray(res.data));
    } catch {
      setMinori([]);
    }
  };

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/visite-medico/richieste');
      setRichieste(toArray(res.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const loadOrariVisita = async () => {
    try {
      setLoadingOrari(true);
      const res = await api.get('/paziente/visite-medico/orari', {
        params: {
          ...(visitMode === 'pediatra' && selectedMinoreId ? { minoreId: selectedMinoreId } : {}),
        },
      });
      setOrariVisita(toArray(res.data));
    } catch {
      setOrariVisita([]);
    } finally {
      setLoadingOrari(false);
    }
  };

  useEffect(() => {
    void loadMedicoCurante();
    void loadMinori();
  }, []);

  useEffect(() => {
    if (initialMinoreId) {
      setVisitMode('pediatra');
      setSelectedMinoreId(initialMinoreId);
    }
  }, [initialMinoreId]);

  useEffect(() => {
    if (view === 'requests') {
      void loadRichieste();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'info') {
      void loadOrariVisita();
    }
  }, [view, visitMode, selectedMinoreId, activeMedico?.id]);

  useEffect(() => {
    if (visitMode === 'pediatra' && !selectedMinoreId && minori.length > 0) {
      const firstWithPediatra =
        minori.find((m: any) => m?.pediatraId && m?.pediatra) || minori[0];
      setSelectedMinoreId(firstWithPediatra.id);
    }
  }, [visitMode, minori, selectedMinoreId]);

  const fetchDisponibilitaMedico = async (_medicoId: number, mese: string) => {
    const res = await api.get('/paziente/visite-medico/calendario', {
      params: {
        data: `${mese}-01`,
        ...(visitMode === 'pediatra' && selectedMinoreId ? { minoreId: selectedMinoreId } : {}),
      },
    });
    const calendario = res.data || {};
    const disponibilita = Array.isArray(calendario.disponibilita) ? calendario.disponibilita : [];
    const eccezioni = Array.isArray(calendario.eccezioni) ? calendario.eccezioni : [];

    const [yearStr, monthStr] = mese.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const availableWeekdays = new Set<number>();
    disponibilita.forEach((d: any) => {
      if (d?.attivo && typeof d?.giornoSettimana === 'number') {
        availableWeekdays.add(d.giornoSettimana);
      }
    });

    const eccezioniByDate = new Map<string, any>();
    eccezioni.forEach((e: any) => {
      if (!e?.data) return;
      const dateStr = new Date(e.data).toISOString().split('T')[0];
      eccezioniByDate.set(dateStr, e);
    });

    const result: any[] = [];
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const weekday = d.getDay();
      let isAvailable = availableWeekdays.size === 0 || availableWeekdays.has(weekday);

      const eccezione = eccezioniByDate.get(dateStr);
      if (eccezione) {
        const tipo = String(eccezione.tipo || '').toLowerCase();
        if (eccezione.disponibile === true || tipo === 'aperto') {
          isAvailable = true;
        } else if (
          eccezione.disponibile === false ||
          eccezione.chiuso === true ||
          tipo === 'chiusura' ||
          tipo === 'ferie'
        ) {
          isAvailable = false;
        } else {
          isAvailable = false;
        }
      }

      result.push({
        data: dateStr,
        disponibile: isAvailable,
        posti_totali: 1,
        posti_occupati: 0,
        posti_disponibili: isAvailable ? 1 : 0,
        stato: isAvailable ? 'disponibile' : 'non_disponibile',
      });
    }

    return result;
  };

  const fetchSlotsMedico = async (_medicoId: number, data: string) => {
    const res = await api.get('/paziente/visite-medico/slot-disponibili', {
      params: {
        data,
        ...(visitMode === 'pediatra' && selectedMinoreId ? { minoreId: selectedMinoreId } : {}),
      },
    });
    const slots = toArray(res.data?.slots ?? res.data);
    return slots.map((s: any) => ({
      ora_inizio: s.ora_inizio || s.oraInizio,
      ora_fine: s.ora_fine || s.oraFine,
      disponibile: s.disponibile ?? true,
      posti_disponibili: s.posti_disponibili ?? s.postiDisponibili ?? 1,
      max_prenotazioni: s.max_prenotazioni ?? s.maxPrenotazioni,
    }));
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMedico || !selectedDate || !selectedSlot) return;
    if (visitMode === 'pediatra' && (!selectedMinore || !selectedMinore.pediatraId)) {
      setError('Seleziona un minore con pediatra assegnato.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/paziente/visite-medico/richiesta', {
        dataRichiesta: selectedDate,
        oraInizio: selectedSlot.ora_inizio,
        motivoVisita: formData.motivo,
        urgente: formData.urgente,
        note: formData.note,
        ...(visitMode === 'pediatra' && selectedMinore
          ? {
              minoreId: selectedMinore.id,
              nomeBambino: selectedMinore.nome,
              cognomeBambino: selectedMinore.cognome,
              dataNascitaBambino: toIsoDate(selectedMinore.dataNascita) || undefined,
              codiceFiscaleBambino: selectedMinore.codiceFiscale || undefined,
            }
          : {}),
      });
      alert('Richiesta inviata con successo!');
      setView('requests');
      setSelectedDate('');
      setSelectedSlot(null);
      setFormData({
        motivo: '',
        sintomi: '',
        urgente: false,
        note: '',
      });
    } catch (err: any) {
      if (err.response?.data?.code === 'SLOT_UNAVAILABLE') {
        setError('Slot non più disponibile. Seleziona un altro orario.');
        setView('slots');
      } else {
        setError(err.response?.data?.message || 'Errore invio richiesta');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !medico && minori.length === 0) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  if (!medico && minori.length === 0 && !loading) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">👨‍⚕️</div>
        <h3 className="text-xl font-semibold mb-2">Nessun Medico o Pediatra Assegnato</h3>
        <p className="text-gray-600 mb-4">
          Per prenotare visite devi prima impostare il medico di famiglia e, se hai minori, il pediatra.
        </p>
        <a href="/paziente/terapie/wizard" className="text-blue-600 hover:underline text-sm">
          Apri il wizard iniziale
        </a>
      </div>
    );
  }

  if (view === 'info') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Medico e Pediatra di Famiglia</h2>
          <button
            onClick={() => setView('requests')}
            className="text-blue-600 hover:underline"
          >
            Le Mie Richieste
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => {
              setVisitMode('medico');
              setError(null);
            }}
            className={`border rounded-lg p-3 text-left transition ${
              visitMode === 'medico'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold">👨‍⚕️ Medico di famiglia</p>
            <p className="text-sm text-gray-600">Per visite personali</p>
          </button>
          <button
            onClick={() => {
              setVisitMode('pediatra');
              setError(null);
            }}
            className={`border rounded-lg p-3 text-left transition ${
              visitMode === 'pediatra'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold">🧸 Pediatra di famiglia</p>
            <p className="text-sm text-gray-600">Per visite dei minori a carico</p>
          </button>
        </div>

        {visitMode === 'pediatra' && (
          <div className="bg-white border rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium mb-2">Seleziona minore</label>
            {minori.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nessun minore registrato. Aggiungilo dal wizard iniziale.
              </p>
            ) : (
              <select
                value={selectedMinoreId ?? ''}
                onChange={(e) => setSelectedMinoreId(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {minori.map((minore: any) => (
                  <option key={minore.id} value={minore.id}>
                    {minore.nome} {minore.cognome}
                    {minore?.pediatra ? ` · Pediatra: ${minore.pediatra.nome} ${minore.pediatra.cognome}` : ' · Pediatra non assegnato'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {visitMode === 'pediatra' && selectedMinore && !selectedMinore?.pediatra && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-4">
            Il minore selezionato non ha ancora un pediatra assegnato. Completa l&apos;assegnazione nel wizard iniziale.
          </div>
        )}

        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                visitMode === 'pediatra' ? 'bg-blue-100' : 'bg-green-100'
              }`}
            >
              {visitMode === 'pediatra' ? '🧸' : '👨‍⚕️'}
            </div>
            <div className="flex-1">
              {activeMedico ? (
                <>
                  <h3 className="text-lg font-semibold">
                    Dott. {activeMedico.nome} {activeMedico.cognome}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{tipoMedicoLabel}</p>

                  {visitMode === 'pediatra' && selectedMinore && (
                    <div className="bg-blue-50 rounded p-3 mb-3 text-sm">
                      <p className="font-medium text-blue-900">
                        Minore: {selectedMinore.nome} {selectedMinore.cognome}
                      </p>
                      <p className="text-blue-700">
                        Età: {getEta(selectedMinore.dataNascita) ?? '-'} anni
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {(activeMedico.indirizzoStudio || activeMedico.indirizzo_studio) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📍</span>
                        <span>{activeMedico.indirizzoStudio || activeMedico.indirizzo_studio}</span>
                      </div>
                    )}
                    {activeMedico.telefono && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📞</span>
                        <span>{activeMedico.telefono}</span>
                      </div>
                    )}
                    {activeMedico.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>✉️</span>
                        <span>{activeMedico.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-slate-900">Orari di visita</h4>
                      {loadingOrari && <span className="text-xs text-slate-500">Caricamento…</span>}
                    </div>
                    {orariVisita.length > 0 ? (
                      <div className="space-y-2">
                        {orariVisita.map((orario) => (
                          <div key={`${orario.giorno}-${orario.oraInizio}-${orario.oraFine}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm border border-slate-200">
                            <span className="font-medium text-slate-800">
                              {GIORNI_ORARI[orario.giorno] || orario.giorno}
                            </span>
                            <span className="text-slate-600">
                              {orario.oraInizio} - {orario.oraFine}
                            </span>
                            <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                              {orario.tipoVisita === 'ambulatorio'
                                ? 'Ambulatorio'
                                : orario.tipoVisita === 'domicilio'
                                ? 'Domicilio'
                                : 'Entrambi'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Nessun orario di visita pubblicato.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600">
                  {visitMode === 'medico'
                    ? 'Nessun medico di famiglia assegnato.'
                    : 'Seleziona un minore con pediatra assegnato.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setView('calendar');
          }}
          disabled={!canBookCurrentFlow}
          className={`w-full px-6 py-3 rounded-lg font-medium ${
            canBookCurrentFlow
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {visitMode === 'pediatra' ? 'Prenota Visita Pediatrica' : 'Prenota Visita Medica'}
        </button>
        {!canBookCurrentFlow && (
          <p className="text-xs text-gray-500 mt-2">
            Completa prima l&apos;assegnazione nel wizard iniziale per procedere con la prenotazione.
          </p>
        )}
      </div>
    );
  }

  if (view === 'calendar' && activeMedico) {
    return (
      <div>
        <button
          onClick={() => setView('info')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna alle Info
        </button>

        <div className="bg-white border rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Visita - Dott. {activeMedico.cognome}
            {visitMode === 'pediatra' && selectedMinore
              ? ` (${selectedMinore.nome} ${selectedMinore.cognome})`
              : ''}
          </h2>
          <p className="text-sm text-green-600 font-medium mb-4">{tipoMedicoLabel}</p>
          <p className="text-sm text-gray-600 mb-4">
            Seleziona una data disponibile dal calendario
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <CalendarioMensile
            servizioId={activeMedico.id}
            tipoServizio="medico"
            onSelectDate={(date) => {
              setSelectedDate(date);
              setView('slots');
            }}
            selectedDate={selectedDate}
            fetchDisponibilita={fetchDisponibilitaMedico}
          />
        </div>
      </div>
    );
  }

  if (view === 'slots' && activeMedico && selectedDate) {
    return (
      <div>
        <button
          onClick={() => setView('info')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna alle Info
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Visita - Dott. {activeMedico.cognome}
            {visitMode === 'pediatra' && selectedMinore
              ? ` (${selectedMinore.nome} ${selectedMinore.cognome})`
              : ''}
          </h2>
          <p className="text-sm text-green-600 font-medium mb-2">{tipoMedicoLabel}</p>
          <p className="text-sm text-gray-600">Seleziona un orario disponibile</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        <SlotOrari
          servizioId={activeMedico.id}
          tipoServizio="medico"
          selectedDate={selectedDate}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setView('form');
          }}
          onBack={() => setView('calendar')}
          selectedSlot={selectedSlot}
          fetchSlots={fetchSlotsMedico}
        />
      </div>
    );
  }

  if (view === 'form' && activeMedico && selectedDate && selectedSlot) {
    return (
      <div>
        <button
          onClick={() => setView('slots')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Cambia Orario
        </button>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Completa Richiesta Visita - Dott. {activeMedico.cognome}
          </h2>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Riepilogo Prenotazione</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Data:</span>{' '}
                <span className="font-medium">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Orario:</span>{' '}
                <span className="font-medium">
                  {selectedSlot.ora_inizio} - {selectedSlot.ora_fine}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Medico:</span>{' '}
                <span className="font-medium">
                  Dott. {activeMedico.nome} {activeMedico.cognome}
                </span>
              </div>
              {visitMode === 'pediatra' && selectedMinore && (
                <div>
                  <span className="text-gray-600">Paziente:</span>{' '}
                  <span className="font-medium">
                    {selectedMinore.nome} {selectedMinore.cognome}
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmitRichiesta} className="space-y-4">
            {visitMode === 'pediatra' && selectedMinore && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-800 text-sm">Dati del Bambino/a</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome</label>
                    <input
                      type="text"
                      value={selectedMinore.nome}
                      disabled
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cognome</label>
                    <input
                      type="text"
                      value={selectedMinore.cognome}
                      disabled
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Data di Nascita</label>
                    <input
                      type="date"
                      value={toIsoDate(selectedMinore.dataNascita)}
                      disabled
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Codice Fiscale</label>
                    <input
                      type="text"
                      value={selectedMinore.codiceFiscale || ''}
                      disabled
                      className="w-full border rounded px-3 py-2"
                      maxLength={16}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Motivo della Visita *
              </label>
              <input
                type="text"
                required
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Es: Controllo generale, dolore addominale..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sintomi</label>
              <textarea
                value={formData.sintomi}
                onChange={(e) => setFormData({ ...formData, sintomi: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder="Descrivi i sintomi che stai riscontrando..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.urgente}
                  onChange={(e) =>
                    setFormData({ ...formData, urgente: e.target.checked })
                  }
                />
                <span className="text-sm">Visita urgente</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note Aggiuntive</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                className="w-full border rounded px-3 py-2"
                placeholder="Eventuali note o informazioni aggiuntive..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Invio...' : 'Invia Richiesta'}
              </button>
              <button
                type="button"
                onClick={() => setView('slots')}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Cambia Orario
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('info');
                  setSelectedDate('');
                  setSelectedSlot(null);
                }}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Vista Richieste
  if (view === 'requests') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Le Mie Richieste di Visita</h2>
          <button
            onClick={() => setView('info')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Nuova Prenotazione
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {richieste.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">Nessuna richiesta presente</p>
            <button
              onClick={() => setView('info')}
              className="text-blue-600 hover:underline"
            >
              Prenota la tua prima visita
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {richieste.map((richiesta) => (
              <div key={richiesta.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      Dott. {richiesta.medici?.cognome || activeMedico?.cognome || medico?.cognome}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(richiesta.dataRichiesta || richiesta.data_richiesta).toLocaleDateString('it-IT')} alle{' '}
                      {richiesta.oraInizio || richiesta.ora_inizio}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      richiesta.stato === 'confermata'
                        ? 'bg-green-100 text-green-800'
                        : richiesta.stato === 'in_attesa'
                        ? 'bg-yellow-100 text-yellow-800'
                        : richiesta.stato === 'rifiutata'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {richiesta.stato}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-2">
                  <p className="text-sm font-medium mb-1">Motivo:</p>
                  <p className="text-sm">{richiesta.motivo}</p>
                  {richiesta.sintomi && (
                    <>
                      <p className="text-sm font-medium mt-2 mb-1">Sintomi:</p>
                      <p className="text-sm">{richiesta.sintomi}</p>
                    </>
                  )}
                </div>

                {(richiesta.nomeBambino || richiesta.nome_bambino) && (
                  <div className="bg-blue-50 rounded p-3 mb-2 text-sm">
                    <p className="font-medium text-blue-800 mb-1">Bambino/a:</p>
                    <p>{richiesta.nomeBambino || richiesta.nome_bambino} {richiesta.cognomeBambino || richiesta.cognome_bambino}</p>
                    {(richiesta.dataNascitaBambino || richiesta.data_nascita_bambino) && (
                      <p className="text-gray-600">Nato/a il {new Date(richiesta.dataNascitaBambino || richiesta.data_nascita_bambino).toLocaleDateString('it-IT')}</p>
                    )}
                  </div>
                )}

                {richiesta.urgente && (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    Urgente
                  </span>
                )}

                {richiesta.note && (
                  <p className="text-sm text-gray-600 mt-2">Note: {richiesta.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function SpecialistaTab() {
  const [view, setView] = useState<'list' | 'calendar' | 'slots' | 'form' | 'requests'>('list');
  const [specialisti, setSpecialisti] = useState<any[]>([]);
  const [selectedSpecialista, setSelectedSpecialista] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [richieste, setRichieste] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form richiesta consulto
  const [formData, setFormData] = useState({
    motivo: '',
    tipoVisita: 'prima_visita',
    priorita: 'normale',
    note: '',
  });

  useEffect(() => {
    if (view === 'list') {
      loadSpecialisti();
    } else if (view === 'requests') {
      loadRichieste();
    }
  }, [view]);

  const buildMonthAvailability = (mese: string) => {
    const [yearStr, monthStr] = mese.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const result: any[] = [];

    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        data: dateStr,
        disponibile: true,
        posti_totali: 1,
        posti_occupati: 0,
        posti_disponibili: 1,
        stato: 'disponibile',
      });
    }

    return result;
  };

  const loadSpecialisti = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/consulti/destinatari');
      const list = toArray(res.data)
        .filter((d: any) => d.tipo === 'specialista')
        .map((d: any) => ({
          id: d.id,
          nome: d.nome,
          cognome: d.cognome,
          specializzazione: d.specializzazione,
          telefono: d.telefono,
          indirizzo_studio: d.indirizzoStudio,
        }));
      setSpecialisti(list);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento specialisti');
    } finally {
      setLoading(false);
    }
  };

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/consulti/richieste');
      setRichieste(toArray(res.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilitaSpecialista = async (specialistaId: number, mese: string) => {
    const [anno, meseStr] = mese.split('-');
    try {
      const res = await api.get(
        `/paziente/consulti/specialisti/${specialistaId}/calendario/${anno}/${meseStr}`
      );
      const giorni = toArray(res.data?.giorni ?? res.data?.disponibilita);
      return giorni.length ? giorni : buildMonthAvailability(mese);
    } catch {
      return buildMonthAvailability(mese);
    }
  };

  const fetchSlotsSpecialista = async (specialistaId: number, data: string) => {
    const res = await api.get(`/paziente/consulti/specialisti/${specialistaId}/slots/${data}`);
    const slots = toArray(res.data?.slots ?? res.data);
    return slots.map((s: any) => ({
      ora_inizio: s.ora_inizio || s.oraInizio,
      ora_fine: s.ora_fine || s.oraFine,
      disponibile: s.disponibile ?? true,
      posti_disponibili: s.posti_disponibili ?? s.postiDisponibili ?? 1,
      max_prenotazioni: s.max_prenotazioni ?? s.maxPrenotazioni,
    }));
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialista || !selectedDate || !selectedSlot) return;

    try {
      setLoading(true);
      await api.post('/paziente/consulti/richieste', {
        specialistaId: selectedSpecialista.id,
        dataRichiesta: selectedDate,
        oraInizio: selectedSlot.ora_inizio,
        oraFine: selectedSlot.ora_fine,
        motivo: formData.motivo,
        tipoVisita: formData.tipoVisita,
        priorita: formData.priorita,
        notePaziente: formData.note,
      });
      alert('Richiesta inviata con successo!');
      setView('requests');
      setSelectedSpecialista(null);
      setSelectedDate('');
      setSelectedSlot(null);
      setFormData({
        motivo: '',
        tipoVisita: 'prima_visita',
        priorita: 'normale',
        note: '',
      });
    } catch (err: any) {
      if (err.response?.data?.code === 'SLOT_UNAVAILABLE') {
        setError('Slot non più disponibile. Seleziona un altro orario.');
        setView('slots');
      } else {
        setError(err.response?.data?.message || 'Errore invio richiesta');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSpecialisti = specialisti.filter((spec) =>
    `${spec.nome} ${spec.cognome} ${spec.specializzazione}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading && !specialisti.length && !richieste.length) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  // Vista Lista Specialisti
  if (view === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Specialisti Disponibili</h2>
          <button
            onClick={() => setView('requests')}
            className="text-blue-600 hover:underline"
          >
            Le Mie Richieste
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {/* Barra Ricerca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cerca per nome o specializzazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div className="grid gap-4">
          {filteredSpecialisti.map((spec) => (
            <div key={spec.id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                    🩺
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Dott. {spec.nome} {spec.cognome}
                    </h3>
                    <p className="text-sm text-purple-600 font-medium">
                      {spec.specializzazione}
                    </p>
                    {spec.indirizzo_studio && (
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {spec.indirizzo_studio}
                      </p>
                    )}
                    {spec.telefono && (
                      <p className="text-sm text-gray-600">📞 {spec.telefono}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSpecialista(spec);
                    setView('calendar');
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Prenota
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredSpecialisti.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Nessuno specialista trovato</p>
            <p className="text-sm text-gray-500 mt-2">Prova a modificare i criteri di ricerca</p>
          </div>
        )}
      </div>
    );
  }

  // Vista Calendario
  if (view === 'calendar' && selectedSpecialista) {
    return (
      <div>
        <button
          onClick={() => {
            setView('list');
            setSelectedSpecialista(null);
            setSelectedDate('');
          }}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna agli Specialisti
        </button>

        <div className="bg-white border rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Consulto - Dott. {selectedSpecialista.cognome}
          </h2>
          <p className="text-sm text-purple-600 font-medium mb-4">
            {selectedSpecialista.specializzazione}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Seleziona una data disponibile dal calendario
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <CalendarioMensile
            servizioId={selectedSpecialista.id}
            tipoServizio="specialista"
            onSelectDate={(date) => {
              setSelectedDate(date);
              setView('slots');
            }}
            selectedDate={selectedDate}
            fetchDisponibilita={fetchDisponibilitaSpecialista}
          />
        </div>
      </div>
    );
  }

  // Vista Slot
  if (view === 'slots' && selectedSpecialista && selectedDate) {
    return (
      <div>
        <button
          onClick={() => {
            setView('list');
            setSelectedSpecialista(null);
            setSelectedDate('');
          }}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna agli Specialisti
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Consulto - Dott. {selectedSpecialista.cognome}
          </h2>
          <p className="text-sm text-purple-600 font-medium mb-2">
            {selectedSpecialista.specializzazione}
          </p>
          <p className="text-sm text-gray-600">Seleziona un orario disponibile</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        <SlotOrari
          servizioId={selectedSpecialista.id}
          tipoServizio="specialista"
          selectedDate={selectedDate}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setView('form');
          }}
          onBack={() => setView('calendar')}
          selectedSlot={selectedSlot}
          fetchSlots={fetchSlotsSpecialista}
        />
      </div>
    );
  }

  // Vista Form
  if (view === 'form' && selectedSpecialista && selectedDate && selectedSlot) {
    return (
      <div>
        <button
          onClick={() => setView('slots')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Cambia Orario
        </button>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Completa Richiesta Consulto - Dott. {selectedSpecialista.cognome}
          </h2>

          {/* Riepilogo */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Riepilogo Prenotazione</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Data:</span>{' '}
                <span className="font-medium">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Orario:</span>{' '}
                <span className="font-medium">
                  {selectedSlot.ora_inizio} - {selectedSlot.ora_fine}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Specialista:</span>{' '}
                <span className="font-medium">
                  Dott. {selectedSpecialista.nome} {selectedSpecialista.cognome}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Specializzazione:</span>{' '}
                <span className="font-medium">{selectedSpecialista.specializzazione}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmitRichiesta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Motivo del Consulto *
              </label>
              <textarea
                required
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder="Descrivi il motivo per cui richiedi il consulto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo Visita</label>
              <select
                value={formData.tipoVisita}
                onChange={(e) => setFormData({ ...formData, tipoVisita: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="prima_visita">Prima Visita</option>
                <option value="controllo">Controllo</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priorità</label>
              <select
                value={formData.priorita}
                onChange={(e) => setFormData({ ...formData, priorita: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
                <option value="programmata">Programmata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note Aggiuntive</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                className="w-full border rounded px-3 py-2"
                placeholder="Eventuali note o informazioni aggiuntive..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Invio...' : 'Invia Richiesta'}
              </button>
              <button
                type="button"
                onClick={() => setView('slots')}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Cambia Orario
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setSelectedSpecialista(null);
                  setSelectedDate('');
                  setSelectedSlot(null);
                }}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Vista Richieste
  if (view === 'requests') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Le Mie Richieste di Consulto</h2>
          <button
            onClick={() => setView('list')}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Nuova Prenotazione
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {richieste.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">Nessuna richiesta presente</p>
            <button
              onClick={() => setView('list')}
              className="text-blue-600 hover:underline"
            >
              Prenota il tuo primo consulto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {richieste.map((richiesta) => (
              <div key={richiesta.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      Dott. {richiesta.specialisti?.nome || richiesta.specialista?.nome}{' '}
                      {richiesta.specialisti?.cognome || richiesta.specialista?.cognome}
                    </h3>
                    <p className="text-sm text-purple-600 font-medium">
                      {richiesta.specialisti?.specializzazione ||
                        richiesta.specialista?.specializzazione}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(
                        richiesta.data_richiesta || richiesta.dataRichiesta
                      ).toLocaleDateString('it-IT')}{' '}
                      alle {richiesta.ora_inizio || richiesta.oraInizio}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      richiesta.stato === 'confermata'
                        ? 'bg-green-100 text-green-800'
                        : richiesta.stato === 'in_attesa'
                        ? 'bg-yellow-100 text-yellow-800'
                        : richiesta.stato === 'rifiutata'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {richiesta.stato}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-2">
                  <p className="text-sm font-medium mb-1">Motivo:</p>
                  <p className="text-sm">{richiesta.motivo}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>Tipo: {richiesta.tipo_visita || richiesta.tipoVisita}</span>
                    <span>Priorità: {richiesta.priorita}</span>
                  </div>
                </div>

                {(richiesta.note_paziente || richiesta.notePaziente) && (
                  <p className="text-sm text-gray-600 mt-2">
                    Note: {richiesta.note_paziente || richiesta.notePaziente}
                  </p>
                )}

                {(richiesta.note_specialista || richiesta.noteSpecialista) && (
                  <div className="mt-2 p-3 bg-purple-50 rounded">
                    <p className="text-sm font-medium text-purple-900">
                      Note Specialista:
                    </p>
                    <p className="text-sm text-purple-800">
                      {richiesta.note_specialista || richiesta.noteSpecialista}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ProfessionistaTab({
  categoria,
  title,
  emptyTitle,
  emptySubtitle,
}: {
  categoria?: string;
  title?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}) {
  const listTitle = title || 'Professionisti Sanitari Disponibili';
  const listEmptyTitle = emptyTitle || 'Nessun professionista trovato';
  const listEmptySubtitle = emptySubtitle || '';
  const backLabel = title?.toLowerCase().includes('veterin')
    ? 'Veterinari'
    : 'Professionisti';
  const [view, setView] = useState<'list' | 'calendar' | 'slots' | 'form' | 'requests'>('list');
  const [professionisti, setProfessionisti] = useState<any[]>([]);
  const [selectedProfessionista, setSelectedProfessionista] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [richieste, setRichieste] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Form richiesta appuntamento
  const [formData, setFormData] = useState({
    modalita: 'ambulatorio',
    durataStimata: 30,
    esigenzeSpecifiche: '',
    note: '',
  });

  useEffect(() => {
    if (view === 'list') {
      loadProfessionisti();
    } else if (view === 'requests') {
      loadRichieste();
    }
  }, [view]);

  const buildMonthAvailability = (mese: string, orariDisponibilita?: any) => {
    const [yearStr, monthStr] = mese.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const result: any[] = [];

    const dayMap: Record<string, number> = {
      domenica: 0,
      lunedi: 1,
      martedi: 2,
      mercoledi: 3,
      giovedi: 4,
      venerdi: 5,
      sabato: 6,
    };

    const availableWeekdays = new Set<number>();
    if (orariDisponibilita && typeof orariDisponibilita === 'object') {
      Object.keys(orariDisponibilita).forEach((k) => {
        const key = k.toLowerCase();
        if (dayMap[key] !== undefined) {
          availableWeekdays.add(dayMap[key]);
        }
      });
    }

    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const weekday = d.getDay();
      const isAvailable =
        availableWeekdays.size === 0 || availableWeekdays.has(weekday);
      result.push({
        data: dateStr,
        disponibile: isAvailable,
        posti_totali: 1,
        posti_occupati: 0,
        posti_disponibili: isAvailable ? 1 : 0,
        stato: isAvailable ? 'disponibile' : 'non_disponibile',
      });
    }

    return result;
  };

  const buildSlotsFromOrari = (data: string, orariDisponibilita?: any, appuntamenti?: any[]) => {
    if (!orariDisponibilita || typeof orariDisponibilita !== 'object') {
      return [];
    }

    const dayNames = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    const dateObj = new Date(data + 'T00:00:00');
    const dayKey = dayNames[dateObj.getDay()];
    const range = orariDisponibilita[dayKey];
    if (!range) return [];

    const ranges = Array.isArray(range) ? range : [range];
    const slots: any[] = [];

    const appointments = (appuntamenti || []).map((a) => {
      const dateStr = new Date(a.dataAppuntamento).toISOString().split('T')[0];
      const timeStr = new Date(a.oraAppuntamento).toISOString().split('T')[1].slice(0, 5);
      const start = new Date(`${dateStr}T${timeStr}:00`);
      const end = new Date(start.getTime() + (a.durata || 30) * 60000);
      return { start, end };
    });

    const duration = 30;

    ranges.forEach((r: any) => {
      const str = typeof r === 'string' ? r : `${r.inizio || r.start}-${r.fine || r.end}`;
      const [startStr, endStr] = str.split('-');
      if (!startStr || !endStr) return;

      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      let current = sh * 60 + sm;
      const end = eh * 60 + em;

      while (current + duration <= end) {
        const oraInizio = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(
          current % 60
        ).padStart(2, '0')}`;
        const oraFine = `${String(Math.floor((current + duration) / 60)).padStart(2, '0')}:${String(
          (current + duration) % 60
        ).padStart(2, '0')}`;

        const slotStart = new Date(`${data}T${oraInizio}:00`);
        const slotEnd = new Date(`${data}T${oraFine}:00`);

        const overlaps = appointments.some(
          (a) => slotStart < a.end && slotEnd > a.start
        );

        slots.push({
          ora_inizio: oraInizio,
          ora_fine: oraFine,
          disponibile: !overlaps,
          posti_disponibili: overlaps ? 0 : 1,
          max_prenotazioni: 1,
        });

        current += duration;
      }
    });

    return slots;
  };

  const loadProfessionisti = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/professionisti', {
        params: {
          ...(categoria ? { categoria } : {}),
        },
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProfessionisti(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento professionisti');
    } finally {
      setLoading(false);
    }
  };

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/richieste-appuntamento');
      setRichieste(toArray(res.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilitaProfessionista = async (professionistaId: number, mese: string) => {
    const res = await api.get(`/paziente/professionisti/${professionistaId}/calendario/disponibilita`, {
      params: { mese },
    });
    return toArray(res.data?.giorni);
  };

  const fetchSlotsProfessionista = async (professionistaId: number, data: string) => {
    const res = await api.get(`/paziente/professionisti/${professionistaId}/calendario/slots`, {
      params: { data },
    });
    return toArray(res.data?.slots);
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessionista || !selectedDate || !selectedSlot) return;

    try {
      setLoading(true);
      await api.post('/paziente/richieste-appuntamento', {
        professionista_id: selectedProfessionista.id,
        data_richiesta: selectedDate,
        ora_inizio: selectedSlot.ora_inizio,
        ora_fine: selectedSlot.ora_fine,
        modalita: formData.modalita,
        durata_stimata: formData.durataStimata,
        esigenze_specifiche: formData.esigenzeSpecifiche,
        note: formData.note,
      });
      alert('Richiesta inviata con successo!');
      setView('requests');
      setSelectedProfessionista(null);
      setSelectedDate('');
      setSelectedSlot(null);
      setFormData({
        modalita: 'ambulatorio',
        durataStimata: 30,
        esigenzeSpecifiche: '',
        note: '',
      });
    } catch (err: any) {
      if (err.response?.data?.code === 'SLOT_UNAVAILABLE') {
        setError('Slot non più disponibile. Seleziona un altro orario.');
        setView('slots');
      } else {
        setError(err.response?.data?.message || 'Errore invio richiesta');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionisti = professionisti.filter((prof) =>
    `${prof.nome} ${prof.cognome} ${prof.categoria || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading && !professionisti.length && !richieste.length) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  // Vista Lista Professionisti
  if (view === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{listTitle}</h2>
          <button
            onClick={() => setView('requests')}
            className="text-blue-600 hover:underline"
          >
            Le Mie Richieste
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {/* Barra Ricerca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cerca per nome o categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div className="grid gap-4">
          {filteredProfessionisti.map((prof) => (
            <div key={prof.id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl">
                    💊
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {prof.nome} {prof.cognome}
                    </h3>
                    <p className="text-sm text-orange-600 font-medium">
                      {prof.categoria || 'Professionista Sanitario'}
                    </p>
                    {prof.indirizzo && (
                      <p className="text-sm text-gray-600 mt-1">📍 {prof.indirizzo}</p>
                    )}
                    {prof.telefono && (
                      <p className="text-sm text-gray-600">📞 {prof.telefono}</p>
                    )}
                    {prof.servizi_offerti && (
                      <p className="text-xs text-gray-500 mt-1">
                        Servizi: {prof.servizi_offerti}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedProfessionista(prof);
                    setView('calendar');
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Prenota
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProfessionisti.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">{listEmptyTitle}</p>
            {listEmptySubtitle && (
              <p className="text-sm text-gray-500 mt-2">{listEmptySubtitle}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista Calendario
  if (view === 'calendar' && selectedProfessionista) {
    return (
      <div>
        <button
          onClick={() => {
            setView('list');
            setSelectedProfessionista(null);
            setSelectedDate('');
          }}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna ai {backLabel}
        </button>

        <div className="bg-white border rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Appuntamento - {selectedProfessionista.nome} {selectedProfessionista.cognome}
          </h2>
          <p className="text-sm text-orange-600 font-medium mb-4">
            {selectedProfessionista.categoria || 'Professionista Sanitario'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Seleziona una data disponibile dal calendario
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <CalendarioMensile
            servizioId={selectedProfessionista.id}
            tipoServizio="professionista"
            onSelectDate={(date) => {
              setSelectedDate(date);
              setView('slots');
            }}
            selectedDate={selectedDate}
            fetchDisponibilita={fetchDisponibilitaProfessionista}
          />
        </div>
      </div>
    );
  }

  // Vista Slot
  if (view === 'slots' && selectedProfessionista && selectedDate) {
    return (
      <div>
        <button
          onClick={() => {
            setView('list');
            setSelectedProfessionista(null);
            setSelectedDate('');
          }}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Torna ai {backLabel}
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Prenota Appuntamento - {selectedProfessionista.nome} {selectedProfessionista.cognome}
          </h2>
          <p className="text-sm text-orange-600 font-medium mb-2">
            {selectedProfessionista.categoria || 'Professionista Sanitario'}
          </p>
          <p className="text-sm text-gray-600">Seleziona un orario disponibile</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        <SlotOrari
          servizioId={selectedProfessionista.id}
          tipoServizio="professionista"
          selectedDate={selectedDate}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setView('form');
          }}
          onBack={() => setView('calendar')}
          selectedSlot={selectedSlot}
          fetchSlots={fetchSlotsProfessionista}
        />
      </div>
    );
  }

  // Vista Form
  if (view === 'form' && selectedProfessionista && selectedDate && selectedSlot) {
    return (
      <div>
        <button
          onClick={() => setView('slots')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Cambia Orario
        </button>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Completa Richiesta Appuntamento - {selectedProfessionista.nome} {selectedProfessionista.cognome}
          </h2>

          {/* Riepilogo */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Riepilogo Prenotazione</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Data:</span>{' '}
                <span className="font-medium">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Orario:</span>{' '}
                <span className="font-medium">
                  {selectedSlot.ora_inizio} - {selectedSlot.ora_fine}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Professionista:</span>{' '}
                <span className="font-medium">
                  {selectedProfessionista.nome} {selectedProfessionista.cognome}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Categoria:</span>{' '}
                <span className="font-medium">
                  {selectedProfessionista.categoria || 'Professionista Sanitario'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmitRichiesta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Modalità Appuntamento</label>
              <select
                value={formData.modalita}
                onChange={(e) => setFormData({ ...formData, modalita: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="ambulatorio">Ambulatorio</option>
                <option value="domicilio">Domicilio</option>
                <option value="online">Online (Videoconsulto)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Durata Stimata (minuti)
              </label>
              <input
                type="number"
                min="15"
                max="180"
                step="15"
                value={formData.durataStimata}
                onChange={(e) =>
                  setFormData({ ...formData, durataStimata: parseInt(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Esigenze Specifiche
              </label>
              <textarea
                value={formData.esigenzeSpecifiche}
                onChange={(e) =>
                  setFormData({ ...formData, esigenzeSpecifiche: e.target.value })
                }
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder="Descrivi le tue esigenze specifiche per l'appuntamento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note Aggiuntive</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                className="w-full border rounded px-3 py-2"
                placeholder="Eventuali note o informazioni aggiuntive..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Invio...' : 'Invia Richiesta'}
              </button>
              <button
                type="button"
                onClick={() => setView('slots')}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Cambia Orario
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setSelectedProfessionista(null);
                  setSelectedDate('');
                  setSelectedSlot(null);
                }}
                className="border px-6 py-2 rounded hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Vista Richieste
  if (view === 'requests') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Le Mie Richieste di Appuntamento</h2>
          <button
            onClick={() => setView('list')}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Nuova Prenotazione
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        {richieste.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">Nessuna richiesta presente</p>
            <button
              onClick={() => setView('list')}
              className="text-blue-600 hover:underline"
            >
              Prenota il tuo primo appuntamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {richieste.map((richiesta) => (
              <div key={richiesta.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {richiesta.professionisti?.nome ||
                        richiesta.professionista?.nome}{' '}
                      {richiesta.professionisti?.cognome ||
                        richiesta.professionista?.cognome}
                    </h3>
                    <p className="text-sm text-orange-600 font-medium">
                      {richiesta.professionisti?.categoria ||
                        richiesta.professionista?.categoria ||
                        'Professionista Sanitario'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(
                        richiesta.data_richiesta || richiesta.dataAppuntamento
                      ).toLocaleDateString('it-IT')}{' '}
                      alle{' '}
                      {richiesta.ora_inizio ||
                        new Date(richiesta.oraAppuntamento)
                          .toISOString()
                          .split('T')[1]
                          .slice(0, 5)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      richiesta.stato === 'confermata'
                        ? 'bg-green-100 text-green-800'
                        : richiesta.stato === 'in_attesa'
                        ? 'bg-yellow-100 text-yellow-800'
                        : richiesta.stato === 'rifiutata'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {richiesta.stato}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-2">
                  <div className="flex gap-4 text-sm mb-2">
                    <span>
                      <span className="font-medium">Modalità:</span> {richiesta.modalita}
                    </span>
                    <span>
                      <span className="font-medium">Durata:</span> {richiesta.durata_stimata} min
                    </span>
                  </div>
                  {richiesta.esigenze_specifiche && (
                    <>
                      <p className="text-sm font-medium mb-1">Esigenze:</p>
                      <p className="text-sm">{richiesta.esigenze_specifiche}</p>
                    </>
                  )}
                </div>

                {richiesta.note && (
                  <p className="text-sm text-gray-600 mt-2">Note: {richiesta.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function VeterinarioTab() {
  return (
    <ProfessionistaTab
      categoria="veterinario"
      title="Veterinari Disponibili"
      emptyTitle="Nessun veterinario trovato"
      emptySubtitle="Non ci sono veterinari disponibili al momento."
    />
  );
}

import { Suspense } from 'react';
export default function AppuntamentiPage() {
  return <Suspense><AppuntamentiPageInner /></Suspense>;
}
