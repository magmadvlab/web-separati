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
  Map,
  AlertCircle,
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
  veicoloTipo?: string;
  tipoVeicolo?: string;
  targaVeicolo?: string;
  targa?: string;
  disponibile: boolean;
  consegneTotali?: number;
  consegneCompletate?: number;
  ratingMedio?: number;
  rating?: number;
  coverageZones?: string[];
  ordiniAssegnatiAttivi?: number;
  ritiriBatchPronti?: number;
  farmacieBatchPronte?: number;
}

interface ZonaOperativa {
  id: number;
  nome: string;
  citta: string;
  latitudine?: number;
  longitudine?: number;
  raggioKm?: number;
  attiva?: boolean;
  ridersAttivi?: number;
}

const emptyRiderForm = {
  nome: "",
  cognome: "",
  email: "",
  telefono: "",
  password: "",
  zonaOperativa: "",
  veicoloTipo: "",
  targaVeicolo: "",
  stato: "disponibile",
};

const emptyZonaForm = {
  nome: "",
  citta: "",
  latitudine: "",
  longitudine: "",
  raggioKm: "5",
};

export default function AdminRidersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Rider dialog state
  const [isRiderDialogOpen, setIsRiderDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [riderForm, setRiderForm] = useState(emptyRiderForm);

  // Zone dialog state
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState<ZonaOperativa | null>(null);
  const [zonaForm, setZonaForm] = useState(emptyZonaForm);
  const [showZonaForm, setShowZonaForm] = useState(false);

  // Filtri
  const [filtroZona, setFiltroZona] = useState<string>("all");
  const [filtroStato, setFiltroStato] = useState<string>("all");

  // ── Query ──────────────────────────────────────────────────────────────────

  const { data: riders, isLoading: loadingRiders } = useQuery<Rider[]>({
    queryKey: ["admin-riders", filtroZona, filtroStato],
    queryFn: async () => {
      // Usa /delivery/admin/riders per vedere TUTTI i rider (anche non disponibili)
      let url = "/delivery/admin/riders";
      const params = new URLSearchParams();
      if (filtroZona !== "all") params.append("zona", filtroZona);
      if (filtroStato !== "all") params.append("stato", filtroStato);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await api.get<ApiResponse<Rider[]>>(url);
      return response.data.data || [];
    },
  });

  const { data: zone, isLoading: loadingZone, refetch: refetchZone } = useQuery<ZonaOperativa[]>({
    queryKey: ["zone-operative"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ZonaOperativa[]>>("/delivery/admin/zone-operative");
      return response.data.data || [];
    },
  });

  // ── Mutations riders ────────────────────────────────────────────────────────

  const createRiderMutation = useMutation({
    mutationFn: (data: typeof emptyRiderForm) =>
      api.post("/delivery/admin/riders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      toast({ title: "Rider creato con successo" });
      setIsRiderDialogOpen(false);
      setRiderForm(emptyRiderForm);
      setSelectedRider(null);
    },
    onError: () => toast({ title: "Errore nella creazione del rider", variant: "destructive" }),
  });

  const updateRiderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof emptyRiderForm> }) =>
      api.put(`/delivery/admin/riders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      toast({ title: "Rider aggiornato con successo" });
      setIsRiderDialogOpen(false);
      setSelectedRider(null);
    },
    onError: () => toast({ title: "Errore nell'aggiornamento", variant: "destructive" }),
  });

  const deleteRiderMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/delivery/admin/riders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      toast({ title: "Rider eliminato" });
    },
    onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
  });

  const activateRiderMutation = useMutation({
    mutationFn: ({ id, stato }: { id: number; stato: string }) =>
      api.put(`/delivery/admin/riders/${id}`, { stato }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      const label = variables.stato === "disponibile" ? "attivato" : "disattivato";
      toast({ title: `Rider ${label} con successo` });
    },
    onError: () => toast({ title: "Errore nel cambio stato rider", variant: "destructive" }),
  });

  // ── Mutations zone ──────────────────────────────────────────────────────────

  const createZonaMutation = useMutation({
    mutationFn: (data: typeof emptyZonaForm) =>
      api.post("/delivery/admin/zone-operative", {
        ...data,
        latitudine: parseFloat(data.latitudine),
        longitudine: parseFloat(data.longitudine),
        raggioKm: parseFloat(data.raggioKm),
      }),
    onSuccess: () => {
      refetchZone();
      toast({ title: "Zona creata con successo" });
      setZonaForm(emptyZonaForm);
      setShowZonaForm(false);
      setSelectedZona(null);
    },
    onError: () => toast({ title: "Errore nella creazione della zona", variant: "destructive" }),
  });

  const updateZonaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof emptyZonaForm> }) =>
      api.put(`/delivery/admin/zone-operative/${id}`, {
        ...data,
        latitudine: data.latitudine ? parseFloat(data.latitudine) : undefined,
        longitudine: data.longitudine ? parseFloat(data.longitudine) : undefined,
        raggioKm: data.raggioKm ? parseFloat(data.raggioKm) : undefined,
      }),
    onSuccess: () => {
      refetchZone();
      toast({ title: "Zona aggiornata" });
      setZonaForm(emptyZonaForm);
      setShowZonaForm(false);
      setSelectedZona(null);
    },
    onError: () => toast({ title: "Errore nell'aggiornamento zona", variant: "destructive" }),
  });

  const deleteZonaMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/delivery/admin/zone-operative/${id}`),
    onSuccess: () => {
      refetchZone();
      toast({ title: "Zona eliminata" });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Impossibile eliminare: verificare che non ci siano rider assegnati";
      toast({ title: msg, variant: "destructive" });
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case "disponibile": return "bg-green-100 text-green-800";
      case "in_consegna": return "bg-blue-100 text-blue-800";
      case "offline": return "bg-gray-100 text-gray-800";
      case "pausa": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case "disponibile": return <CheckCircle2 className="h-4 w-4" />;
      case "in_consegna": return <Clock className="h-4 w-4" />;
      case "offline": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const openNewRider = () => {
    setSelectedRider(null);
    setRiderForm(emptyRiderForm);
    setIsRiderDialogOpen(true);
  };

  const openEditRider = (rider: Rider) => {
    setSelectedRider(rider);
    setRiderForm({
      nome: rider.nome,
      cognome: rider.cognome,
      email: rider.email,
      telefono: rider.telefono,
      password: "",
      zonaOperativa: rider.zonaOperativa || "",
      veicoloTipo: rider.veicoloTipo || rider.tipoVeicolo || "",
      targaVeicolo: rider.targaVeicolo || rider.targa || "",
      stato: rider.stato || "disponibile",
    });
    setIsRiderDialogOpen(true);
  };

  const handleRiderSubmit = () => {
    if (!riderForm.nome || !riderForm.cognome || !riderForm.email || !riderForm.telefono) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    if (selectedRider) {
      const { password, ...updateData } = riderForm;
      updateRiderMutation.mutate({ id: selectedRider.id, data: updateData as Partial<typeof emptyRiderForm> });
    } else {
      if (!riderForm.password) {
        toast({ title: "La password è obbligatoria per un nuovo rider", variant: "destructive" });
        return;
      }
      createRiderMutation.mutate(riderForm);
    }
  };

  const openNewZona = () => {
    setSelectedZona(null);
    setZonaForm(emptyZonaForm);
    setShowZonaForm(true);
  };

  const openEditZona = (zona: ZonaOperativa) => {
    setSelectedZona(zona);
    setZonaForm({
      nome: zona.nome,
      citta: zona.citta,
      latitudine: zona.latitudine?.toString() || "",
      longitudine: zona.longitudine?.toString() || "",
      raggioKm: zona.raggioKm?.toString() || "5",
    });
    setShowZonaForm(true);
  };

  const handleZonaSubmit = () => {
    if (!zonaForm.nome || !zonaForm.citta || !zonaForm.latitudine || !zonaForm.longitudine) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    if (selectedZona) {
      updateZonaMutation.mutate({ id: selectedZona.id, data: zonaForm });
    } else {
      createZonaMutation.mutate(zonaForm);
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────

  const zoneUniche = zone?.length
    ? zone.map((item) => item.nome)
    : [
        ...new Set(
          (riders || []).flatMap((rider) =>
            rider.coverageZones && rider.coverageZones.length > 0
              ? rider.coverageZones
              : rider.zonaOperativa
                ? [rider.zonaOperativa]
                : [],
          ),
        ),
      ];

  const riderCopreZona = (rider: Rider, zona: string) =>
    rider.coverageZones?.includes(zona) || rider.zonaOperativa === zona;

  const ridersPerZona = zoneUniche.map((zona) => ({
    zona,
    count: riders?.filter((r) => riderCopreZona(r, zona)).length || 0,
    disponibili: riders?.filter((r) => riderCopreZona(r, zona) && r.disponibile).length || 0,
  }));

  if (loadingRiders || loadingZone) return <Loading />;

  // ── Render ────────────────────────────────────────────────────────────────────

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
            Gestisci copertura territoriale, ordini gia assegnati e ritiri batch pronti.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsZoneDialogOpen(true)} variant="outline">
            <Map className="h-4 w-4 mr-2" />
            Gestisci Zone
          </Button>
          <Button onClick={openNewRider}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Rider
          </Button>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/70">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-amber-900">
            <p className="font-medium">Assegnare una zona non vuol dire vedere subito ordini.</p>
            <p>
              La zona abilita la copertura e l&apos;auto-assegnazione futura. Il rider vede i batch nel tab
              <span className="font-medium"> Ritiri Batch</span> quando la farmacia li segna pronti,
              mentre gli <span className="font-medium">Ordini Farmacia</span> compaiono solo se hanno
              gia `riderId` assegnato.
            </p>
          </div>
        </CardContent>
      </Card>

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
              {riders?.filter((r) => r.disponibile).length || 0}
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
              {riders?.filter((r) => r.stato === "in_consegna").length || 0}
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
              {zone?.filter((z) => z.attiva !== false).length || zoneUniche.length}
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

      {/* Distribuzione per Zona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Distribuzione per Zona
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ridersPerZona.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nessun rider assegnato a zone
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Lista Riders */}
      <Card>
        <CardHeader>
          <CardTitle>Riders Attivi</CardTitle>
          <CardDescription>{riders?.length || 0} riders registrati</CardDescription>
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

                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <Badge className={getStatoColor(rider.stato)}>
                        {getStatoIcon(rider.stato)}
                        <span className="ml-1 capitalize">{rider.stato.replace("_", " ")}</span>
                      </Badge>

                      {rider.zonaOperativa && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {rider.zonaOperativa}
                        </div>
                      )}

                      {rider.coverageZones && rider.coverageZones.length > 0 && (
                        <div className="text-gray-600">
                          Copertura: {rider.coverageZones.join(", ")}
                        </div>
                      )}

                      <div className="text-gray-600">
                        {rider.veicoloTipo || rider.tipoVeicolo || "—"}{" "}
                        {(rider.targaVeicolo || rider.targa) ? `- ${rider.targaVeicolo || rider.targa}` : ""}
                      </div>

                      {(rider.consegneTotali || rider.consegneCompletate) !== undefined && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="h-4 w-4" />
                          {rider.consegneTotali ?? rider.consegneCompletate} consegne
                        </div>
                      )}

                      {(rider.ratingMedio || rider.rating) && (
                        <div className="text-yellow-600">
                          ⭐ {Number(rider.ratingMedio ?? rider.rating).toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <Badge variant="outline">
                        {rider.ordiniAssegnatiAttivi || 0} ordini gia assegnati
                      </Badge>
                      <Badge variant="outline">
                        {rider.ritiriBatchPronti || 0} ritiri batch pronti
                      </Badge>
                      <Badge variant="outline">
                        {rider.farmacieBatchPronte || 0} farmacie con batch pronti
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {rider.stato !== "disponibile" && rider.stato !== "in_consegna" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 text-xs px-2"
                        onClick={() => activateRiderMutation.mutate({ id: rider.id, stato: "disponibile" })}
                        disabled={activateRiderMutation.isPending}
                        title="Attiva rider"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Attiva
                      </Button>
                    )}
                    {rider.stato === "disponibile" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-500 hover:bg-gray-100 text-xs px-2"
                        onClick={() => activateRiderMutation.mutate({ id: rider.id, stato: "offline" })}
                        disabled={activateRiderMutation.isPending}
                        title="Metti offline"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Offline
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEditRider(rider)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Eliminare il rider ${rider.nome} ${rider.cognome}?`)) {
                          deleteRiderMutation.mutate(rider.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!riders || riders.length === 0) && (
              <div className="text-center py-8 text-gray-500">Nessun rider trovato</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog Nuovo/Modifica Rider ─────────────────────────────────────── */}
      <Dialog open={isRiderDialogOpen} onOpenChange={setIsRiderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRider ? "Modifica Rider" : "Nuovo Rider"}</DialogTitle>
            <DialogDescription>
              Inserisci i dati del rider. La zona operativa abilita copertura e auto-assegnazione
              futura, ma non sposta gli ordini gia assegnati.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <Input
                  placeholder="Mario"
                  value={riderForm.nome}
                  onChange={(e) => setRiderForm({ ...riderForm, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cognome *</label>
                <Input
                  placeholder="Rossi"
                  value={riderForm.cognome}
                  onChange={(e) => setRiderForm({ ...riderForm, cognome: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  placeholder="mario.rossi@example.com"
                  value={riderForm.email}
                  onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefono *</label>
                <Input
                  placeholder="+39 333 1234567"
                  value={riderForm.telefono}
                  onChange={(e) => setRiderForm({ ...riderForm, telefono: e.target.value })}
                />
              </div>
            </div>

            {!selectedRider && (
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <Input
                  type="password"
                  placeholder="Password iniziale"
                  value={riderForm.password}
                  onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Zona Operativa</label>
              <Select
                value={riderForm.zonaOperativa}
                onValueChange={(v) => setRiderForm({ ...riderForm, zonaOperativa: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona zona" />
                </SelectTrigger>
                <SelectContent>
                  {zone && zone.length > 0
                    ? zone.map((z) => (
                        <SelectItem key={z.id} value={z.nome}>
                          {z.nome} ({z.citta}) - {z.ridersAttivi || 0} rider
                        </SelectItem>
                      ))
                    : zoneUniche.map((zona) => (
                        <SelectItem key={zona} value={zona}>
                          {zona}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRider && (
              <div>
                <label className="block text-sm font-medium mb-2">Stato Rider</label>
                <Select
                  value={riderForm.stato}
                  onValueChange={(v) => setRiderForm({ ...riderForm, stato: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponibile">✅ Disponibile</SelectItem>
                    <SelectItem value="offline">⚪ Offline</SelectItem>
                    <SelectItem value="pausa">🟡 In Pausa</SelectItem>
                    <SelectItem value="in_consegna">🔵 In Consegna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo Veicolo *</label>
                <Select
                  value={riderForm.veicoloTipo}
                  onValueChange={(v) => setRiderForm({ ...riderForm, veicoloTipo: v })}
                >
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
                <Input
                  placeholder="AB123CD"
                  value={riderForm.targaVeicolo}
                  onChange={(e) => setRiderForm({ ...riderForm, targaVeicolo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsRiderDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleRiderSubmit}
                disabled={createRiderMutation.isPending || updateRiderMutation.isPending}
              >
                {selectedRider ? "Salva Modifiche" : "Crea Rider"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Gestione Zone ─────────────────────────────────────────────── */}
      <Dialog open={isZoneDialogOpen} onOpenChange={(open) => {
        setIsZoneDialogOpen(open);
        if (!open) { setShowZonaForm(false); setSelectedZona(null); setZonaForm(emptyZonaForm); }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestione Zone Operative</DialogTitle>
            <DialogDescription>
              Configura le zone operative per l'assegnazione dei rider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Form nuova/modifica zona */}
            {showZonaForm ? (
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <h3 className="font-medium">
                  {selectedZona ? "Modifica Zona" : "Nuova Zona"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Zona *</label>
                    <Input
                      placeholder="es. Centro, Nord, Periferia"
                      value={zonaForm.nome}
                      onChange={(e) => setZonaForm({ ...zonaForm, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Città *</label>
                    <Input
                      placeholder="es. Matera"
                      value={zonaForm.citta}
                      onChange={(e) => setZonaForm({ ...zonaForm, citta: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitudine *</label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="40.6665"
                      value={zonaForm.latitudine}
                      onChange={(e) => setZonaForm({ ...zonaForm, latitudine: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Longitudine *</label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="16.6040"
                      value={zonaForm.longitudine}
                      onChange={(e) => setZonaForm({ ...zonaForm, longitudine: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Raggio (km)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="5"
                      value={zonaForm.raggioKm}
                      onChange={(e) => setZonaForm({ ...zonaForm, raggioKm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowZonaForm(false);
                      setSelectedZona(null);
                      setZonaForm(emptyZonaForm);
                    }}
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleZonaSubmit}
                    disabled={createZonaMutation.isPending || updateZonaMutation.isPending}
                  >
                    {selectedZona ? "Salva Modifiche" : "Crea Zona"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={openNewZona} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Zona Operativa
              </Button>
            )}

            {/* Lista zone esistenti */}
            {zone && zone.length > 0 ? (
              <div className="space-y-3">
                {zone.map((zona) => (
                  <div
                    key={zona.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{zona.nome}</span>
                        <Badge
                          className={
                            zona.attiva !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {zona.attiva !== false ? "Attiva" : "Inattiva"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span>{zona.citta}</span>
                        {zona.raggioKm && <span>Raggio: {zona.raggioKm} km</span>}
                        {zona.ridersAttivi !== undefined && (
                          <span className="flex items-center gap-1">
                            <Bike className="h-3 w-3" />
                            {zona.ridersAttivi} riders
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditZona(zona)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Eliminare la zona "${zona.nome}"? I rider assegnati devono essere prima spostati.`)) {
                            deleteZonaMutation.mutate(zona.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nessuna zona operativa configurata</p>
                <p className="text-sm mt-1">Crea la prima zona per iniziare</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
