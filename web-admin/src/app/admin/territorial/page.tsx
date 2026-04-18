'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, 
  Truck, 
  Building2, 
  Plus, 
  Settings,
  Globe,
  Shield,
  Loader2,
  Search
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface City {
  id: number;
  nome: string;
  provincia: string;
  regione: string;
  paese: string;
  attiva: boolean;
  _count: {
    zone: number;
    farmacie: number;
    riders: number;
  };
}

interface Zone {
  id: number;
  nome: string;
  cittaId: number;
  attiva: boolean;
  _count: {
    farmacie: number;
    ridersAssegnati: number;
  };
}

interface Rider {
  id: number;
  nome: string;
  cognome: string;
  telefono: string;
  tipoVeicolo: string;
  zonaAssegnataId?: number;
  cittaAssegnataId?: number;
  zonaOperativa?: string;
  zoneExtraAmmesse?: number[];
  cittaOperative?: string[];
  stato: string;
  ordiniAttivi: number;
  maxOrdiniSimultanei: number;
}

interface RiderCredentials {
  username: string;
  email: string;
  password: string;
  context: 'create' | 'reset';
}

type TerritorialTab = 'cities' | 'zones' | 'riders' | 'config';

export default function AdminTerritorialPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TerritorialTab>('cities');
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddRider, setShowAddRider] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [newCity, setNewCity] = useState({
    nome: '',
    provincia: '',
    regione: '',
    lat: '',
    lng: '',
  });

  const geocodeCity = async (cityName: string) => {
    if (!cityName.trim()) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ', Italia')}&format=json&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'it' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const r = data[0];
        const addr = r.address || {};
        setNewCity(prev => ({
          ...prev,
          lat: parseFloat(r.lat).toFixed(6),
          lng: parseFloat(r.lon).toFixed(6),
          provincia: prev.provincia || addr.county || addr.state_district || addr.city || '',
          regione: prev.regione || addr.state || '',
        }));
      }
    } catch {
      // Geocoding fallito, l'utente può inserire manualmente
    } finally {
      setIsGeocoding(false);
    }
  };
  const [newZone, setNewZone] = useState({
    nome: '',
    raggioKm: '5',
  });
  const [newRider, setNewRider] = useState({
    nome: '',
    cognome: '',
    telefono: '',
    email: '',
    password: '',
    tipoVeicolo: '',
    maxOrdiniSimultanei: '5',
  });
  const [assigningRiderId, setAssigningRiderId] = useState<number | null>(null);
  const [coverageActionKey, setCoverageActionKey] = useState<string | null>(null);
  const [resettingPasswordRiderId, setResettingPasswordRiderId] = useState<number | null>(null);
  const [credentialsToShow, setCredentialsToShow] = useState<RiderCredentials | null>(null);

  const queryClient = useQueryClient();

  const getApiErrorMessage = (error: any, fallback: string) => {
    const message = error?.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || fallback;
  };

  const createCityMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: newCity.nome.trim(),
        provincia: newCity.provincia.trim() || undefined,
        regione: newCity.regione.trim() || undefined,
        lat: newCity.lat ? Number(newCity.lat) : undefined,
        lng: newCity.lng ? Number(newCity.lng) : undefined,
      };
      return api.post('/admin/territorial/cities', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['territorial-stats'] });
      setShowAddCity(false);
      setNewCity({ nome: '', provincia: '', regione: '', lat: '', lng: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore creazione città',
        description: getApiErrorMessage(error, 'Impossibile creare la città'),
        variant: 'destructive',
      });
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCity) {
        throw new Error('Seleziona una città');
      }
      const payload = {
        nome: newZone.nome.trim(),
        cittaId: selectedCity,
        raggioKm: newZone.raggioKm ? Number(newZone.raggioKm) : undefined,
      };
      return api.post('/admin/territorial/zones', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-zones', selectedCity] });
      queryClient.invalidateQueries({ queryKey: ['territorial-stats'] });
      setShowAddZone(false);
      setNewZone({ nome: '', raggioKm: '5' });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore creazione zona',
        description: getApiErrorMessage(error, 'Impossibile creare la zona'),
        variant: 'destructive',
      });
    },
  });

  const createRiderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCity) {
        throw new Error('Seleziona una città');
      }
      const payload = {
        nome: newRider.nome.trim(),
        cognome: newRider.cognome.trim(),
        telefono: newRider.telefono.trim(),
        email: newRider.email.trim(),
        password: newRider.password.trim() || undefined,
        tipoVeicolo: newRider.tipoVeicolo.trim(),
        cittaAssegnataId: selectedCity,
        zonaAssegnataId: selectedZone || undefined,
        maxOrdiniSimultanei: newRider.maxOrdiniSimultanei
          ? Number(newRider.maxOrdiniSimultanei)
          : undefined,
      };
      const response = await api.post('/admin/territorial/riders', payload);
      return response.data.data;
    },
    onSuccess: (createdRider: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders', selectedCity, selectedZone] });
      queryClient.invalidateQueries({ queryKey: ['territorial-stats'] });
      setShowAddRider(false);
      const generatedPassword = createdRider?.credenzialiAccesso?.passwordTemporanea;
      if (generatedPassword && createdRider?.credenzialiAccesso?.username && createdRider?.credenzialiAccesso?.email) {
        setCredentialsToShow({
          username: createdRider.credenzialiAccesso.username,
          email: createdRider.credenzialiAccesso.email,
          password: generatedPassword,
          context: 'create',
        });
      } else {
        toast({
          title: 'Rider creato',
          description: 'Account rider creato con password impostata manualmente',
        });
      }
      setNewRider({
        nome: '',
        cognome: '',
        telefono: '',
        email: '',
        password: '',
        tipoVeicolo: '',
        maxOrdiniSimultanei: '5',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore creazione rider',
        description: getApiErrorMessage(error, 'Impossibile creare il rider'),
        variant: 'destructive',
      });
    },
  });

  const assignRiderMutation = useMutation({
    mutationFn: async (riderId: number) => {
      if (!selectedCity) {
        throw new Error('Seleziona una città');
      }

      const endpoint = selectedZone
        ? `/admin/territorial/riders/${riderId}/assign/${selectedZone}`
        : `/admin/territorial/riders/${riderId}/assign-city/${selectedCity}`;

      return api.post(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders', selectedCity, selectedZone] });
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['territorial-stats'] });
      toast({
        title: 'Assegnazione aggiornata',
        description: selectedZone
          ? 'Il rider è stato assegnato alla zona selezionata'
          : 'Il rider è stato assegnato alla città selezionata',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore assegnazione rider',
        description: getApiErrorMessage(error, 'Impossibile aggiornare l\'assegnazione del rider'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setAssigningRiderId(null);
    },
  });

  const updateCoverageMutation = useMutation({
    mutationFn: async ({
      riderId,
      action,
    }: {
      riderId: number;
      action: 'add' | 'remove';
    }) => {
      if (!selectedZone) {
        throw new Error('Seleziona una zona');
      }

      const endpoint =
        action === 'add'
          ? `/admin/territorial/riders/${riderId}/add-zone/${selectedZone}`
          : `/admin/territorial/riders/${riderId}/remove-zone/${selectedZone}`;

      return api.post(endpoint);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders', selectedCity, selectedZone] });
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['territorial-stats'] });
      toast({
        title: variables.action === 'add' ? 'Copertura zona aggiunta' : 'Copertura zona rimossa',
        description:
          variables.action === 'add'
            ? 'Il rider ora copre anche questa zona'
            : 'La zona è stata rimossa dalle coperture extra del rider',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Errore aggiornamento copertura',
        description: getApiErrorMessage(error, 'Impossibile aggiornare la copertura del rider'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setCoverageActionKey(null);
    },
  });

  const resetRiderPasswordMutation = useMutation({
    mutationFn: async (riderId: number) => {
      const response = await api.post(`/admin/territorial/riders/${riderId}/reset-password`, {});
      return response.data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders', selectedCity, selectedZone] });
      if (data?.username && data?.email && data?.passwordTemporanea) {
        setCredentialsToShow({
          username: data.username,
          email: data.email,
          password: data.passwordTemporanea,
          context: 'reset',
        });
      } else {
        toast({
          title: 'Password aggiornata',
          description: 'La password del rider è stata aggiornata',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Errore reset password',
        description: getApiErrorMessage(error, 'Impossibile reimpostare la password del rider'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setResettingPasswordRiderId(null);
    },
  });

  // Fetch cities
  const { data: cities, isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const response = await api.get('/admin/territorial/cities');
      return response.data.data;
    },
  });

  // Fetch zones for selected city
  const { data: zones } = useQuery<Zone[]>({
    queryKey: ['admin-zones', selectedCity],
    queryFn: async () => {
      if (!selectedCity) return [];
      const response = await api.get(`/admin/territorial/cities/${selectedCity}/zones`);
      return response.data.data;
    },
    enabled: !!selectedCity,
  });

  // Fetch riders for selected zone
  const { data: riders } = useQuery<Rider[]>({
    queryKey: ['admin-riders', selectedCity, selectedZone],
    queryFn: async () => {
      if (!selectedCity) return [];
      const endpoint = selectedZone
        ? `/admin/territorial/zones/${selectedZone}/riders`
        : `/admin/territorial/cities/${selectedCity}/riders`;
      const response = await api.get(endpoint);
      return response.data.data;
    },
    enabled: !!selectedCity,
  });

  // Fetch territorial stats
  const { data: stats } = useQuery({
    queryKey: ['territorial-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/territorial/stats/overview');
      return response.data.data;
    },
  });

  const getCoveredZonesCount = (rider: Rider) => {
    const zoneIds = new Set<number>();
    if (rider.zonaAssegnataId) {
      zoneIds.add(rider.zonaAssegnataId);
    }
    (rider.zoneExtraAmmesse || []).forEach((zoneId) => zoneIds.add(zoneId));
    return zoneIds.size;
  };

  const isSelectedZoneExtraForRider = (rider: Rider) => {
    if (!selectedZone) {
      return false;
    }
    return (rider.zoneExtraAmmesse || []).includes(selectedZone);
  };

  const handleSelectCity = (cityId: number) => {
    setSelectedCity(cityId);
    setSelectedZone(null);
  };

  useEffect(() => {
    if (!cities || cities.length === 0) {
      return;
    }

    if (selectedCity && !cities.some((city) => city.id === selectedCity)) {
      setSelectedCity(null);
      setSelectedZone(null);
      return;
    }

    if ((activeTab === 'zones' || activeTab === 'riders') && !selectedCity) {
      const preferredCity =
        cities.find((city) => city._count?.riders > 0)
        || cities.find((city) => city._count?.zone > 0)
        || cities[0];

      if (preferredCity) {
        setSelectedCity(preferredCity.id);
      }
    }
  }, [activeTab, cities, selectedCity]);

  useEffect(() => {
    if (selectedZone && zones && !zones.some((zone) => zone.id === selectedZone)) {
      setSelectedZone(null);
    }
  }, [selectedZone, zones]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Amministrazione Territoriale
          </h1>
          <p className="text-gray-600">Gestione città, zone e rider per ogni paese</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Globe className="h-3 w-3 mr-1" />
            Sistema Multi-Paese
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Paesi Attivi</p>
                  <p className="text-2xl font-bold">{stats.paesiAttivi || 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Città Operative</p>
                  <p className="text-2xl font-bold">{stats.cittaAttive || cities?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Zone Totali</p>
                  <p className="text-2xl font-bold">{stats.zoneTotali || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Rider Attivi</p>
                  <p className="text-2xl font-bold">{stats.riderAttivi || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TerritorialTab)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="cities">Città</TabsTrigger>
          <TabsTrigger value="zones">Zone</TabsTrigger>
          <TabsTrigger value="riders">Rider</TabsTrigger>
          <TabsTrigger value="config">Configurazione Paese</TabsTrigger>
        </TabsList>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestione Città</h2>
            <Button onClick={() => setShowAddCity(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Città
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities?.map((city) => (
              <Card 
                key={city.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCity === city.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleSelectCity(city.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{city.nome}</CardTitle>
                    <Badge variant={city.attiva ? "default" : "secondary"}>
                      {city.attiva ? "Attiva" : "Inattiva"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {city.provincia}, {city.regione}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-blue-600">{city._count.zone}</p>
                      <p className="text-gray-500">Zone</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{city._count.farmacie}</p>
                      <p className="text-gray-500">Farmacie</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-orange-600">{city._count.riders}</p>
                      <p className="text-gray-500">Rider</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-medium text-blue-600">
                    {selectedCity === city.id
                      ? 'Città selezionata per gestire zone e rider'
                      : 'Clicca per selezionare questa città'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Gestione Zone
              {selectedCity && (
                <span className="text-sm text-gray-500 ml-2">
                  - {cities?.find(c => c.id === selectedCity)?.nome}
                </span>
              )}
            </h2>
            <Button 
              onClick={() => setShowAddZone(true)}
              disabled={!selectedCity}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Zona
            </Button>
          </div>

          {cities && cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <Button
                  key={`zones-city-${city.id}`}
                  variant={selectedCity === city.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectCity(city.id)}
                >
                  {city.nome}
                  <span className="ml-2 text-xs opacity-80">{city._count.zone} zone</span>
                </Button>
              ))}
            </div>
          )}

          {!selectedCity ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Seleziona una città per gestire le zone</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones?.map((zone) => (
                <Card 
                  key={zone.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedZone === zone.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{zone.nome}</CardTitle>
                      <Badge variant={zone.attiva ? "default" : "secondary"}>
                        {zone.attiva ? "Attiva" : "Inattiva"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{zone._count.farmacie}</p>
                        <p className="text-gray-500">Farmacie</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-orange-600">{zone._count.ridersAssegnati}</p>
                        <p className="text-gray-500">Rider</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Riders Tab */}
        <TabsContent value="riders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Gestione Rider
              {selectedZone && (
                <span className="text-sm text-gray-500 ml-2">
                  - {zones?.find(z => z.id === selectedZone)?.nome}
                </span>
              )}
              {!selectedZone && selectedCity && (
                <span className="text-sm text-gray-500 ml-2">
                  - {cities?.find(c => c.id === selectedCity)?.nome}
                </span>
              )}
            </h2>
            <Button 
              onClick={() => setShowAddRider(true)}
              disabled={!selectedCity}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Rider
            </Button>
          </div>

          {cities && cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <Button
                  key={`riders-city-${city.id}`}
                  variant={selectedCity === city.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectCity(city.id)}
                >
                  {city.nome}
                  <span className="ml-2 text-xs opacity-80">{city._count.riders} rider</span>
                </Button>
              ))}
            </div>
          )}

          {!selectedCity ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Seleziona una città per gestire i rider</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {riders?.map((rider) => (
                <Card key={rider.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{rider.nome} {rider.cognome}</h3>
                          <p className="text-sm text-gray-600">{rider.telefono}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{rider.tipoVeicolo}</Badge>
                            {rider.zonaOperativa && (
                              <Badge variant="outline">{rider.zonaOperativa}</Badge>
                            )}
                            <Badge variant="outline">Zone: {getCoveredZonesCount(rider)}</Badge>
                            <Badge variant={rider.stato === 'disponibile' ? 'default' : 'secondary'}>
                              {rider.stato}
                            </Badge>
                          </div>
                          {rider.cittaOperative && rider.cittaOperative.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                              {rider.cittaOperative.slice(0, 3).map((cityName) => (
                                <Badge key={`${rider.id}-${cityName}`} variant="secondary">
                                  {cityName}
                                </Badge>
                              ))}
                              {rider.cittaOperative.length > 3 && (
                                <Badge variant="secondary">
                                  +{rider.cittaOperative.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Ordini Attivi</p>
                        <p className="text-lg font-semibold">
                          {rider.ordiniAttivi}/{rider.maxOrdiniSimultanei}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={assigningRiderId === rider.id}
                          onClick={() => {
                            setAssigningRiderId(rider.id);
                            assignRiderMutation.mutate(rider.id);
                          }}
                        >
                          {assigningRiderId === rider.id && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                          {selectedZone ? 'Assegna a questa zona' : 'Assegna a questa città'}
                        </Button>
                        {selectedZone && rider.zonaAssegnataId !== selectedZone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            disabled={
                              coverageActionKey ===
                              `${rider.id}:${isSelectedZoneExtraForRider(rider) ? 'remove' : 'add'}`
                            }
                            onClick={() => {
                              const action = isSelectedZoneExtraForRider(rider) ? 'remove' : 'add';
                              setCoverageActionKey(`${rider.id}:${action}`);
                              updateCoverageMutation.mutate({ riderId: rider.id, action });
                            }}
                          >
                            {coverageActionKey ===
                              `${rider.id}:${isSelectedZoneExtraForRider(rider) ? 'remove' : 'add'}` && (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            )}
                            {isSelectedZoneExtraForRider(rider)
                              ? 'Rimuovi copertura zona'
                              : 'Aggiungi copertura zona'}
                          </Button>
                        )}
                        {selectedZone && rider.zonaAssegnataId === selectedZone && (
                          <p className="text-xs text-gray-500 mt-2">Questa è la zona primaria del rider</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={resettingPasswordRiderId === rider.id}
                          onClick={() => {
                            setResettingPasswordRiderId(rider.id);
                            resetRiderPasswordMutation.mutate(rider.id);
                          }}
                        >
                          {resettingPasswordRiderId === rider.id && (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          )}
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Country Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Configurazione Paese</h2>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Salva Configurazione
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Generali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Paese</label>
                  <Input placeholder="Italia" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Codice Paese</label>
                  <Input placeholder="IT" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valuta</label>
                  <Input placeholder="EUR" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fuso Orario</label>
                  <Input placeholder="Europe/Rome" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurazione Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Costo Base Consegna (€)</label>
                  <Input type="number" placeholder="3.50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Raggio Massimo Consegna (km)</label>
                  <Input type="number" placeholder="15" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tempo Massimo Consegna (min)</label>
                  <Input type="number" placeholder="60" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Ordini per Rider</label>
                  <Input type="number" placeholder="5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddCity} onOpenChange={setShowAddCity}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova Città</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <div className="flex gap-2">
                <Input
                  value={newCity.nome}
                  onChange={(e) => setNewCity({ ...newCity, nome: e.target.value })}
                  onBlur={(e) => geocodeCity(e.target.value)}
                  placeholder="Matera"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => geocodeCity(newCity.nome)}
                  disabled={isGeocoding || !newCity.nome.trim()}
                  title="Cerca coordinate su OpenStreetMap"
                >
                  {isGeocoding
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Le coordinate vengono cercate automaticamente su OpenStreetMap
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Provincia</label>
              <Input
                value={newCity.provincia}
                onChange={(e) => setNewCity({ ...newCity, provincia: e.target.value })}
                placeholder="MT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Regione</label>
              <Input
                value={newCity.regione}
                onChange={(e) => setNewCity({ ...newCity, regione: e.target.value })}
                placeholder="Basilicata"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Latitudine
                  {isGeocoding && <span className="text-xs text-blue-500 ml-1">ricerca…</span>}
                  {newCity.lat && !isGeocoding && <span className="text-xs text-green-600 ml-1">✓</span>}
                </label>
                <Input
                  type="number"
                  value={newCity.lat}
                  onChange={(e) => setNewCity({ ...newCity, lat: e.target.value })}
                  placeholder="auto"
                  disabled={isGeocoding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Longitudine
                  {isGeocoding && <span className="text-xs text-blue-500 ml-1">ricerca…</span>}
                  {newCity.lng && !isGeocoding && <span className="text-xs text-green-600 ml-1">✓</span>}
                </label>
                <Input
                  type="number"
                  value={newCity.lng}
                  onChange={(e) => setNewCity({ ...newCity, lng: e.target.value })}
                  placeholder="auto"
                  disabled={isGeocoding}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCity(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => createCityMutation.mutate()}
              disabled={!newCity.nome.trim() || createCityMutation.isPending}
            >
              Crea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddZone} onOpenChange={setShowAddZone}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova Zona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <Input
                value={newZone.nome}
                onChange={(e) => setNewZone({ ...newZone, nome: e.target.value })}
                placeholder="Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Raggio (km)</label>
              <Input
                type="number"
                value={newZone.raggioKm}
                onChange={(e) => setNewZone({ ...newZone, raggioKm: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddZone(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => createZoneMutation.mutate()}
              disabled={!newZone.nome.trim() || !selectedCity || createZoneMutation.isPending}
            >
              Crea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddRider} onOpenChange={setShowAddRider}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Rider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <Input
                  value={newRider.nome}
                  onChange={(e) => setNewRider({ ...newRider, nome: e.target.value })}
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cognome</label>
                <Input
                  value={newRider.cognome}
                  onChange={(e) => setNewRider({ ...newRider, cognome: e.target.value })}
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefono</label>
              <Input
                value={newRider.telefono}
                onChange={(e) => setNewRider({ ...newRider, telefono: e.target.value })}
                placeholder="+39 333 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={newRider.email}
                onChange={(e) => setNewRider({ ...newRider, email: e.target.value })}
                placeholder="rider@ricettazero.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password (opzionale)</label>
              <Input
                type="password"
                value={newRider.password}
                onChange={(e) => setNewRider({ ...newRider, password: e.target.value })}
                placeholder="Se vuota, viene generata automaticamente"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimo 8 caratteri. Se lasciata vuota, il sistema genera una password temporanea.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo Veicolo</label>
              <Input
                value={newRider.tipoVeicolo}
                onChange={(e) => setNewRider({ ...newRider, tipoVeicolo: e.target.value })}
                placeholder="Scooter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Ordini Simultanei</label>
              <Input
                type="number"
                value={newRider.maxOrdiniSimultanei}
                onChange={(e) => setNewRider({ ...newRider, maxOrdiniSimultanei: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddRider(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => createRiderMutation.mutate()}
              disabled={
                !selectedCity ||
                !newRider.nome.trim() ||
                !newRider.cognome.trim() ||
                !newRider.telefono.trim() ||
                !newRider.email.trim() ||
                (newRider.password.trim().length > 0 && newRider.password.trim().length < 8) ||
                !newRider.tipoVeicolo.trim() ||
                createRiderMutation.isPending
              }
            >
              Crea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentialsToShow} onOpenChange={(open) => !open && setCredentialsToShow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {credentialsToShow?.context === 'reset'
                ? 'Password rider reimpostata'
                : 'Credenziali rider create'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Salva ora queste credenziali: la password temporanea viene mostrata una sola volta.
            </p>
            <div>
              <p className="text-gray-500">Username</p>
              <p className="font-medium break-all">{credentialsToShow?.username}</p>
            </div>
            <div>
              <p className="text-gray-500">Email login</p>
              <p className="font-medium break-all">{credentialsToShow?.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Password temporanea</p>
              <p className="font-mono font-semibold break-all">{credentialsToShow?.password}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCredentialsToShow(null)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
