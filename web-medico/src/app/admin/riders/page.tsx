"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import { 
  Bike, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Map
} from "lucide-react";
import type { ApiResponse } from "@/types/api";

interface Rider {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  stato: string;
  zonaOperativa: string;
  veicoloTipo: string;
  targaVeicolo: string;
  disponibile: boolean;
  latitudineCorrente?: number;
  longitudineCorrente?: number;
  consegneTotali?: number;
  ratingMedio?: number;
}

interface ZonaOperativa {
  id: number;
  nome: string;
  citta: string;
  cap: string;
  latitudine: number;
  longitudine: number;
  raggioKm: number;
  ridersAttivi?: number;
}

export default function AdminRidersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [filtroZona, setFiltroZona] = useState<string>("all");
  const [filtroStato, setFiltroStato] = useState<string>("all");

  // Query riders
  const { data: riders, isLoading: loadingRiders } = useQuery<Rider[]>({
    queryKey: ["admin-riders", filtroZona, filtroStato],
    queryFn: async () => {
      let url = "/delivery/riders/disponibili";
      const params = new URLSearchParams();
      if (filtroZona !== "all") params.append("zona", filtroZona);
      if (filtroStato !== "all") params.append("stato", filtroStato);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get<ApiResponse<Rider[]>>(url);
      return response.data.data || [];
    },
  });

  // Query zone operative
  const { data: zone, isLoading: loadingZone } = useQuery<ZonaOperativa[]>({
    queryKey: ["zone-operative"],
    queryFn: async () => {
      // Endpoint da implementare nel backend
      const response = await api.get<ApiResponse<ZonaOperativa[]>>("/admin/zone-operative");
      return response.data.data || [];
    },
  });

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case "disponibile":
        return "bg-green-100 text-green-800";
      case "in_consegna":
        return "bg-blue-100 text-blue-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      case "pausa":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case "disponibile":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_consegna":
        return <Clock className="h-4 w-4" />;
      case "offline":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loadingRiders || loadingZone) {
    return <Loading />;
  }

  const zoneUniche = [...new Set(riders?.map(r => r.zonaOperativa) || [])];
  const ridersPerZona = zoneUniche.map(zona => ({
    zona,
    count: riders?.filter(r => r.zonaOperativa === zona).length || 0,
    disponibili: riders?.filter(r => r.zonaOperativa === zona && r.disponibile).length || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bike className="h-8 w-8 text-primary" />
            Gestione Riders
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci i rider e le zone operative
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsZoneDialogOpen(true)} variant="outline">
            <Map className="h-4 w-4 mr-2" />
            Gestisci Zone
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Rider
          </Button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riders Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riders?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibili</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {riders?.filter(r => r.disponibile).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Consegna</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {riders?.filter(r => r.stato === "in_consegna").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zone Attive</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {zoneUniche.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Zona Operativa</label>
              <Select value={filtroZona} onValueChange={setFiltroZona}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le zone</SelectItem>
                  {zoneUniche.map((zona) => (
                    <SelectItem key={zona} value={zona}>
                      {zona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Stato</label>
              <Select value={filtroStato} onValueChange={setFiltroStato}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="disponibile">Disponibile</SelectItem>
                  <SelectItem value="in_consegna">In Consegna</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="pausa">In Pausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riders per Zona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Distribuzione per Zona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {ridersPerZona.map((item) => (
              <div key={item.zona} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{item.zona}</h4>
                  <Badge variant="outline">{item.count} riders</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="text-green-600 font-medium">{item.disponibili}</span> disponibili
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista Riders */}
      <Card>
        <CardHeader>
          <CardTitle>Riders Attivi</CardTitle>
          <CardDescription>
            {riders?.length || 0} riders registrati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riders?.map((rider) => (
              <div key={rider.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Bike className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {rider.nome} {rider.cognome}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {rider.email}
                          <Phone className="h-3 w-3 ml-2" />
                          {rider.telefono}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge className={getStatoColor(rider.stato)}>
                        {getStatoIcon(rider.stato)}
                        <span className="ml-1 capitalize">{rider.stato.replace("_", " ")}</span>
                      </Badge>

                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {rider.zonaOperativa}
                      </div>

                      <div className="text-gray-600">
                        {rider.veicoloTipo} - {rider.targaVeicolo}
                      </div>

                      {rider.consegneTotali !== undefined && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="h-4 w-4" />
                          {rider.consegneTotali} consegne
                        </div>
                      )}

                      {rider.ratingMedio && (
                        <div className="text-yellow-600">
                          ⭐ {rider.ratingMedio.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRider(rider);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!riders || riders.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                Nessun rider trovato
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nuovo/Modifica Rider */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRider ? "Modifica Rider" : "Nuovo Rider"}
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati del rider e assegna la zona operativa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <Input placeholder="Mario" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cognome *</label>
                <Input placeholder="Rossi" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input type="email" placeholder="mario.rossi@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefono *</label>
                <Input placeholder="+39 333 1234567" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Zona Operativa *</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona zona" />
                </SelectTrigger>
                <SelectContent>
                  {zoneUniche.map((zona) => (
                    <SelectItem key={zona} value={zona}>
                      {zona}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo Veicolo *</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona veicolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bicicletta">Bicicletta</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Targa Veicolo</label>
                <Input placeholder="AB123CD" />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
              <Button>
                {selectedRider ? "Salva Modifiche" : "Crea Rider"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestione Zone */}
      <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestione Zone Operative</DialogTitle>
            <DialogDescription>
              Configura le zone operative per l'assegnazione dei rider
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              Funzionalità in sviluppo
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
