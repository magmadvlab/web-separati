'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Phone, Mail, Navigation, Filter } from 'lucide-react';

interface ServizioSanitario {
  id: number;
  tipo: string;
  nome: string;
  descrizione?: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  coordinate?: { lat: number; lng: number };
  telefono?: string;
  email?: string;
  valutazioneMedia?: number;
  numeroRecensioni?: number;
  disponibile: boolean;
  distanza?: number;
  tariffaBase?: number;
  accettaSSN?: boolean;
  linkMaps?: string;
  linkDettaglio?: string;
}

interface RisultatoRicerca {
  risultati: ServizioSanitario[];
  totale: number;
  perTipo: Record<string, number>;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RicercaServiziPage() {
  const [query, setQuery] = useState('');
  const [citta, setCitta] = useState('');
  const [raggio, setRaggio] = useState(10);
  const [tipoServizio, setTipoServizio] = useState<string>('');
  const [ratingMinimo, setRatingMinimo] = useState<number>(0);
  const [soloDisponibili, setSoloDisponibili] = useState(false);
  const [accettaSSN, setAccettaSSN] = useState(false);
  const [ordinaPer, setOrdinaPer] = useState('rating');
  
  const [risultati, setRisultati] = useState<ServizioSanitario[]>([]);
  const [totale, setTotale] = useState(0);
  const [perTipo, setPerTipo] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Ottieni posizione utente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  const cerca = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (citta) params.append('citta', citta);
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('raggio', raggio.toString());
      }
      if (tipoServizio) params.append('tipiServizio', tipoServizio);
      if (ratingMinimo > 0) params.append('ratingMinimo', ratingMinimo.toString());
      if (soloDisponibili) params.append('soloDisponibili', 'true');
      if (accettaSSN) params.append('accettaSSN', 'true');
      params.append('ordinaPer', ordinaPer);
      params.append('ordine', 'desc');
      params.append('limit', '20');

      const endpoint = tipoServizio 
        ? `/api/ricerca/${tipoServizio.toLowerCase()}?${params}`
        : `/api/ricerca?${params}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Errore nella ricerca');
      }

      const data: RisultatoRicerca = await response.json();
      setRisultati(data.risultati);
      setTotale(data.totale);
      setPerTipo(data.perTipo);
    } catch (err: any) {
      setError(err.message || 'Errore durante la ricerca');
      setRisultati([]);
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      MEDICO: 'bg-blue-100 text-blue-800',
      SPECIALISTA: 'bg-purple-100 text-purple-800',
      LABORATORIO: 'bg-green-100 text-green-800',
      FARMACIA: 'bg-red-100 text-red-800',
      PROFESSIONISTA: 'bg-yellow-100 text-yellow-800',
      FORNITORE: 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cerca Servizi Sanitari
          </h1>
          <p className="text-gray-600">
            Trova medici, specialisti, laboratori, farmacie e professionisti sanitari vicino a te
          </p>
        </div>

        {/* Barra di ricerca principale */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cosa stai cercando?
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Es: fisioterapista, farmacia, laboratorio analisi..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && cerca()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Città
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={citta}
                  onChange={(e) => setCitta(e.target.value)}
                  placeholder="Es: Milano, Roma..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && cerca()}
                />
              </div>
            </div>
          </div>

          {/* Filtri avanzati */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Nascondi filtri' : 'Mostra filtri avanzati'}
            </button>

            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Navigation className="h-4 w-4" />
                Posizione rilevata
              </div>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Servizio
                </label>
                <select
                  value={tipoServizio}
                  onChange={(e) => setTipoServizio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tutti</option>
                  <option value="medici">Medici</option>
                  <option value="specialisti">Specialisti</option>
                  <option value="laboratori">Laboratori</option>
                  <option value="farmacie">Farmacie</option>
                  <option value="professionisti">Professionisti</option>
                  <option value="fornitori">Fornitori</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raggio (km)
                </label>
                <input
                  type="number"
                  value={raggio}
                  onChange={(e) => setRaggio(Number(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating Minimo
                </label>
                <select
                  value={ratingMinimo}
                  onChange={(e) => setRatingMinimo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">Tutti</option>
                  <option value="3">3+ stelle</option>
                  <option value="4">4+ stelle</option>
                  <option value="4.5">4.5+ stelle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordina per
                </label>
                <select
                  value={ordinaPer}
                  onChange={(e) => setOrdinaPer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rating">Rating</option>
                  <option value="distanza">Distanza</option>
                  <option value="prezzo">Prezzo</option>
                  <option value="nome">Nome</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="disponibili"
                  checked={soloDisponibili}
                  onChange={(e) => setSoloDisponibili(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="disponibili" className="ml-2 text-sm text-gray-700">
                  Solo disponibili
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ssn"
                  checked={accettaSSN}
                  onChange={(e) => setAccettaSSN(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ssn" className="ml-2 text-sm text-gray-700">
                  Accetta SSN
                </label>
              </div>
            </div>
          )}

          <button
            onClick={cerca}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Ricerca in corso...' : 'Cerca'}
          </button>
        </div>

        {/* Statistiche risultati */}
        {totale > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {totale} risultati trovati
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(perTipo).map(([tipo, count]) => (
                  count > 0 && (
                    <span
                      key={tipo}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTipoColor(tipo)}`}
                    >
                      {tipo}: {count}
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Errore */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Risultati */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {risultati.map((servizio) => (
            <div
              key={`${servizio.tipo}-${servizio.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              {/* Header card */}
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(servizio.tipo)}`}>
                  {servizio.tipo}
                </span>
                {servizio.disponibile && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Disponibile
                  </span>
                )}
              </div>

              {/* Nome e descrizione */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {servizio.nome}
              </h3>
              {servizio.descrizione && (
                <p className="text-sm text-gray-600 mb-3">{servizio.descrizione}</p>
              )}

              {/* Rating */}
              {servizio.valutazioneMedia && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {servizio.valutazioneMedia.toFixed(1)}
                    </span>
                  </div>
                  {servizio.numeroRecensioni && (
                    <span className="text-sm text-gray-500">
                      ({servizio.numeroRecensioni} recensioni)
                    </span>
                  )}
                </div>
              )}

              {/* Indirizzo */}
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p>{servizio.indirizzo}</p>
                  <p>{servizio.citta}, {servizio.provincia}</p>
                </div>
              </div>

              {/* Distanza */}
              {servizio.distanza !== undefined && (
                <p className="text-sm text-blue-600 font-medium mb-2">
                  📍 {servizio.distanza} km da te
                </p>
              )}

              {/* Contatti */}
              <div className="space-y-1 mb-4">
                {servizio.telefono && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${servizio.telefono}`} className="hover:text-blue-600">
                      {servizio.telefono}
                    </a>
                  </div>
                )}
                {servizio.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${servizio.email}`} className="hover:text-blue-600">
                      {servizio.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Prezzo e SSN */}
              <div className="flex items-center justify-between mb-4">
                {servizio.tariffaBase && (
                  <span className="text-sm font-medium text-gray-900">
                    €{servizio.tariffaBase}
                  </span>
                )}
                {servizio.accettaSSN && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Accetta SSN
                  </span>
                )}
              </div>

              {/* Azioni */}
              <div className="flex gap-2">
                {servizio.linkMaps && (
                  <a
                    href={servizio.linkMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-center text-sm font-medium transition-colors"
                  >
                    Mappa
                  </a>
                )}
                <button
                  onClick={() => window.location.href = `/paziente/${servizio.tipo.toLowerCase()}/${servizio.id}`}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Dettagli
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nessun risultato */}
        {!loading && risultati.length === 0 && totale === 0 && query && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun risultato trovato
            </h3>
            <p className="text-gray-600">
              Prova a modificare i filtri di ricerca o cerca in un'altra città
            </p>
          </div>
        )}

        {/* Stato iniziale */}
        {!loading && risultati.length === 0 && !query && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Inizia la tua ricerca
            </h3>
            <p className="text-gray-600">
              Cerca medici, specialisti, laboratori, farmacie e professionisti sanitari
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
