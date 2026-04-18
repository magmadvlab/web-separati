'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import CalendarioMensile from '@/components/calendario/CalendarioMensile';
import SlotOrari from '@/components/calendario/SlotOrari';

type TabType = 'laboratorio' | 'medico' | 'specialista' | 'professionista' | 'veterinario';

export default function AppuntamentiPage() {
  const [activeTab, setActiveTab] = useState<TabType>('laboratorio');

  const tabs = [
    { id: 'laboratorio' as TabType, label: 'Esami Laboratorio', icon: '🔬' },
    { id: 'medico' as TabType, label: 'Visite Medico', icon: '👨‍⚕️' },
    { id: 'specialista' as TabType, label: 'Visite Specialista', icon: '🩺' },
    { id: 'professionista' as TabType, label: 'Professionisti Sanitari', icon: '💊' },
    { id: 'veterinario' as TabType, label: 'Visite Veterinario', icon: '🐾' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">I Miei Appuntamenti</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'laboratorio' && <LaboratorioTab />}
        {activeTab === 'medico' && <MedicoTab />}
        {activeTab === 'specialista' && <SpecialistaTab />}
        {activeTab === 'professionista' && <ProfessionistaTab />}
        {activeTab === 'veterinario' && <VeterinarioTab />}
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
      const res = await api.get('/paziente/laboratori');
      setLaboratori(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento laboratori');
    } finally {
      setLoading(false);
    }
  };

  const fetchRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/richieste-esami');
      setRichieste(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  // Fetch disponibilità mensile
  const fetchDisponibilitaLab = async (labId: number, mese: string) => {
    const res = await api.get(`/laboratorio/${labId}/calendario/disponibilita`, {
      params: { mese },
    });
    return res.data.giorni || [];
  };

  // Fetch slot giornalieri
  const fetchSlotsLab = async (labId: number, data: string) => {
    const res = await api.get(`/laboratorio/${labId}/calendario/slots`, {
      params: { data },
    });
    return res.data.slots || [];
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab || !selectedDate || !selectedSlot) return;

    try {
      setLoading(true);
      await api.post('/paziente/richieste-esami', {
        laboratorio_id: selectedLab.id,
        data_richiesta: selectedDate,
        ora_inizio: selectedSlot.ora_inizio,
        ora_fine: selectedSlot.ora_fine,
        esami_richiesti: formData.esami.filter(e => e.nome),
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

        <div className="grid gap-4">
          {laboratori.map((lab) => (
            <div key={lab.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{lab.nome}</h3>
                  <p className="text-sm text-gray-600">{lab.indirizzo}</p>
                  {lab.telefono && (
                    <p className="text-sm text-gray-600">📞 {lab.telefono}</p>
                  )}
                  {lab.orariApertura && (
                    <p className="text-sm text-gray-600 mt-2">
                      🕐 {lab.orariApertura}
                    </p>
                  )}
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
          <h2 className="text-xl font-semibold mb-4">
            Prenota Esami - {selectedLab.nome}
          </h2>
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
          <p className="text-sm text-gray-600">
            Seleziona un orario disponibile
          </p>
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
                      {richiesta.laboratori?.nome || 'Laboratorio'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(richiesta.data_richiesta).toLocaleDateString('it-IT')} alle{' '}
                      {richiesta.ora_inizio}
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
                    {richiesta.esami_richiesti?.map((esame: any, i: number) => (
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

function MedicoTab() {
  const [view, setView] = useState<'info' | 'calendar' | 'slots' | 'form' | 'requests'>('info');
  const [medico, setMedico] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [richieste, setRichieste] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form richiesta visita
  const [formData, setFormData] = useState({
    motivo: '',
    sintomi: '',
    urgente: false,
    note: '',
  });

  useEffect(() => {
    loadMedicoCurante();
  }, []);

  useEffect(() => {
    if (view === 'requests') {
      loadRichieste();
    }
  }, [view]);

  const loadMedicoCurante = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/medico-curante');
      setMedico(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento medico');
    } finally {
      setLoading(false);
    }
  };

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/richieste-visita');
      setRichieste(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilitaMedico = async (medicoId: number, mese: string) => {
    const res = await api.get(`/medico/${medicoId}/calendario/disponibilita`, {
      params: { mese },
    });
    return res.data.giorni || [];
  };

  const fetchSlotsMedico = async (medicoId: number, data: string) => {
    const res = await api.get(`/medico/${medicoId}/calendario/slots`, {
      params: { data },
    });
    return res.data.slots || [];
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medico || !selectedDate || !selectedSlot) return;

    try {
      setLoading(true);
      await api.post('/paziente/richieste-visita', {
        medico_id: medico.id,
        data_richiesta: selectedDate,
        ora_inizio: selectedSlot.ora_inizio,
        ora_fine: selectedSlot.ora_fine,
        motivo: formData.motivo,
        sintomi: formData.sintomi,
        urgente: formData.urgente,
        note: formData.note,
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

  if (loading && !medico) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  // Nessun medico assegnato
  if (!medico && !loading) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">👨‍⚕️</div>
        <h3 className="text-xl font-semibold mb-2">Nessun Medico Assegnato</h3>
        <p className="text-gray-600 mb-4">
          Non hai ancora un medico di base assegnato nella tua città.
        </p>
        <p className="text-sm text-gray-500">
          Contatta l'amministrazione per richiedere l'assegnazione di un medico curante.
        </p>
      </div>
    );
  }

  // Vista Info Medico
  if (view === 'info') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Il Tuo Medico Curante</h2>
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

        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              👨‍⚕️
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                Dott. {medico.nome} {medico.cognome}
              </h3>
              <p className="text-sm text-gray-600 mb-3">Medico di Base</p>
              
              <div className="space-y-2 text-sm">
                {medico.indirizzo_studio && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📍</span>
                    <span>{medico.indirizzo_studio}</span>
                  </div>
                )}
                {medico.telefono && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📞</span>
                    <span>{medico.telefono}</span>
                  </div>
                )}
                {medico.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>✉️</span>
                    <span>{medico.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setView('calendar')}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Prenota Visita
        </button>
      </div>
    );
  }

  // Vista Calendario
  if (view === 'calendar' && medico) {
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
            Prenota Visita - Dott. {medico.cognome}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Seleziona una data disponibile dal calendario
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <CalendarioMensile
            servizioId={medico.id}
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

  // Vista Slot
  if (view === 'slots' && medico && selectedDate) {
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
            Prenota Visita - Dott. {medico.cognome}
          </h2>
          <p className="text-sm text-gray-600">Seleziona un orario disponibile</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
        )}

        <SlotOrari
          servizioId={medico.id}
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

  // Vista Form
  if (view === 'form' && medico && selectedDate && selectedSlot) {
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
            Completa Richiesta Visita - Dott. {medico.cognome}
          </h2>

          {/* Riepilogo */}
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
                  Dott. {medico.nome} {medico.cognome}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmitRichiesta} className="space-y-4">
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
                      Dott. {richiesta.medici?.cognome || medico?.cognome}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(richiesta.data_richiesta).toLocaleDateString('it-IT')} alle{' '}
                      {richiesta.ora_inizio}
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

  const loadSpecialisti = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/specialisti');
      setSpecialisti(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento specialisti');
    } finally {
      setLoading(false);
    }
  };

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/richieste-consulto');
      setRichieste(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilitaSpecialista = async (specialistaId: number, mese: string) => {
    const res = await api.get(`/specialista/${specialistaId}/calendario/disponibilita`, {
      params: { mese },
    });
    return res.data.giorni || [];
  };

  const fetchSlotsSpecialista = async (specialistaId: number, data: string) => {
    const res = await api.get(`/specialista/${specialistaId}/calendario/slots`, {
      params: { data },
    });
    return res.data.slots || [];
  };

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialista || !selectedDate || !selectedSlot) return;

    try {
      setLoading(true);
      await api.post('/paziente/richieste-consulto', {
        specialista_id: selectedSpecialista.id,
        data_richiesta: selectedDate,
        ora_inizio: selectedSlot.ora_inizio,
        ora_fine: selectedSlot.ora_fine,
        motivo: formData.motivo,
        tipo_visita: formData.tipoVisita,
        priorita: formData.priorita,
        note_paziente: formData.note,
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
                      Dott. {richiesta.specialisti?.nome} {richiesta.specialisti?.cognome}
                    </h3>
                    <p className="text-sm text-purple-600 font-medium">
                      {richiesta.specialisti?.specializzazione}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(richiesta.data_richiesta).toLocaleDateString('it-IT')} alle{' '}
                      {richiesta.ora_inizio}
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
                    <span>Tipo: {richiesta.tipo_visita}</span>
                    <span>Priorità: {richiesta.priorita}</span>
                  </div>
                </div>

                {richiesta.note_paziente && (
                  <p className="text-sm text-gray-600 mt-2">
                    Note: {richiesta.note_paziente}
                  </p>
                )}

                {richiesta.note_specialista && (
                  <div className="mt-2 p-3 bg-purple-50 rounded">
                    <p className="text-sm font-medium text-purple-900">
                      Note Specialista:
                    </p>
                    <p className="text-sm text-purple-800">{richiesta.note_specialista}</p>
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

function ProfessionistaTab() {
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

  const loadProfessionisti = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paziente/professionisti');
      setProfessionisti(res.data);
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
      setRichieste(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento richieste');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilitaProfessionista = async (professionistaId: number, mese: string) => {
    const res = await api.get(`/professionista/${professionistaId}/calendario/disponibilita`, {
      params: { mese },
    });
    return res.data.giorni || [];
  };

  const fetchSlotsProfessionista = async (professionistaId: number, data: string) => {
    const res = await api.get(`/professionista/${professionistaId}/calendario/slots`, {
      params: { data },
    });
    return res.data.slots || [];
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
          <h2 className="text-xl font-semibold">Professionisti Sanitari Disponibili</h2>
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
            <p className="text-gray-600">Nessun professionista trovato</p>
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
          ← Torna ai Professionisti
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
          ← Torna ai Professionisti
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
                      {richiesta.professionisti?.nome} {richiesta.professionisti?.cognome}
                    </h3>
                    <p className="text-sm text-orange-600 font-medium">
                      {richiesta.professionisti?.categoria || 'Professionista Sanitario'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(richiesta.data_richiesta).toLocaleDateString('it-IT')} alle{' '}
                      {richiesta.ora_inizio}
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
    <div>
      <h2 className="text-xl font-semibold mb-4">Visite Veterinarie</h2>
      <p className="text-gray-600 mb-4">Prenota visite per i tuoi animali domestici</p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Prenota Visita Veterinaria
      </button>
    </div>
  );
}
