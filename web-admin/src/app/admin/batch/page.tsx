"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  CheckCircle2,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  Layers,
  Building2,
  Truck,
  AlertCircle,
  Settings2,
} from "lucide-react";

interface BatchOrder {
  id: number;
  codiceOrdine: string;
  stato: string;
  zonaConsegna?: string | null;
  batchAssignmentId?: number | null;
  paziente?: {
    id: number;
    nome: string;
    cognome: string;
    citta?: string | null;
    indirizzo?: string | null;
    telefono?: string | null;
  } | null;
  farmacia?: {
    id: number;
    nome: string;
    citta?: string | null;
  } | null;
  rider?: {
    id: number;
    nome: string;
    cognome: string;
    telefono?: string | null;
  } | null;
}

interface BatchAssignment {
  id: number;
  zonaGeografica: string;
  stato: string;
  ordiniAssegnati: number;
  farmacia?: {
    id: number;
    nome: string;
    citta?: string | null;
    telefono?: string | null;
  } | null;
  farmaciaBackup?: {
    id: number;
    nome: string;
    citta?: string | null;
    telefono?: string | null;
  } | null;
  ordini?: BatchOrder[];
  _count?: {
    ordini: number;
  };
}

interface BatchWindow {
  id: number;
  nome: string;
  dataInizio: string;
  dataFine: string;
  dataConsegna: string;
  stato: string;
  zoneOperative: string[];
  ordiniTotali?: number;
  farmacieCoinvolte?: number;
  ordiniCount?: number;
  assignments?: BatchAssignment[];
  ordini?: BatchOrder[];
  _count?: {
    ordini: number;
    assignments: number;
  };
}

const STATI_COLORI: Record<string, string> = {
  raccolta: "bg-blue-100 text-blue-800",
  elaborazione: "bg-yellow-100 text-yellow-800",
  assegnato: "bg-green-100 text-green-800",
  farmacia_assegnata: "bg-amber-100 text-amber-800",
  rider_assegnato: "bg-green-100 text-green-800",
  completato: "bg-gray-100 text-gray-700",
};

const ZONE_DEFAULT = ["Matera Centro", "Matera Nord", "Matera Sud"];

const formatDate = (value?: string | null, opts?: { dateOnly?: boolean }) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return opts?.dateOnly
    ? d.toLocaleDateString("it-IT")
    : d.toLocaleString("it-IT");
};

const formatOrderState = (stato?: string) => {
  if (!stato) {
    return "sconosciuto";
  }
  return stato.replace(/_/g, " ");
};

const getAssignmentRiderNames = (assignment: BatchAssignment) => {
  const names = new Set(
    (assignment.ordini || [])
      .map((ordine) =>
        ordine.rider ? `${ordine.rider.nome} ${ordine.rider.cognome}` : null,
      )
      .filter(Boolean) as string[],
  );

  return Array.from(names);
};

const getBatchDisplayStatus = (batch: BatchWindow | null | undefined, assignedRiders: number) => {
  if (!batch) {
    return { key: "none", label: "" };
  }

  if (batch.stato === "assegnato" && assignedRiders === 0) {
    return { key: "farmacia_assegnata", label: "FARMACIA ASSEGNATA" };
  }

  if (batch.stato === "assegnato" && assignedRiders > 0) {
    return { key: "rider_assegnato", label: "RIDER ASSEGNATO" };
  }

  return { key: batch.stato || "", label: (batch.stato || "").toUpperCase() };
};

const getAssignmentDisplayStatus = (assignment: BatchAssignment) => {
  const hasPharmacy = Boolean(assignment.farmacia?.id);
  const hasRider = getAssignmentRiderNames(assignment).length > 0;

  if (hasRider) {
    return { key: "rider_assegnato", label: "rider assegnato" };
  }

  if (hasPharmacy) {
    return { key: "farmacia_assegnata", label: "farmacia assegnata" };
  }

  return { key: assignment.stato, label: assignment.stato };
};

const getZoneTerritoryLabel = (zone: any) => {
  const parts: string[] = [];

  if (zone?.cap) {
    parts.push(zone.cap);
  }

  if (zone?.localitaCanonica) {
    parts.push(zone.localitaCanonica);
  } else if (zone?.zona) {
    parts.push(zone.zona);
  }

  return parts.join(' · ');
};

const normalizeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function AdminBatchPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovaDataConsegna, setNuovaDataConsegna] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [showAdvancedSections, setShowAdvancedSections] = useState(false);
  const [manualSelections, setManualSelections] = useState<Record<string, number>>({});
  // riderId selezionato per ogni assignment (assignmentId → riderId stringa)
  const [selectedRiderPerAssignment, setSelectedRiderPerAssignment] = useState<Record<number, string>>({});

  const { data: activeBatch, isLoading } = useQuery<BatchWindow | null>({
    queryKey: ["admin-batch-active"],
    queryFn: async () => {
      try {
        const r = await api.get("/delivery/batch/windows/current");
        const d = r.data as any;
        const batch = d?.data ?? d ?? null;

        if (!batch) {
          return null;
        }

        return {
          ...batch,
          zoneOperative: normalizeArray<string>(batch.zoneOperative),
          assignments: normalizeArray<BatchAssignment>(batch.assignments),
          ordini: normalizeArray<BatchOrder>(batch.ordini),
        };
      } catch {
        return null;
      }
    },
    refetchInterval: 15000,
  });

  const { data: ridersDisponibili } = useQuery<Array<{ id: number; nome: string; cognome: string; mezzoTrasporto?: string }>>({
    queryKey: ["admin-riders-disponibili"],
    queryFn: async () => {
      const r = await api.get("/delivery/riders/disponibili");
      return (r.data as any)?.data ?? [];
    },
    enabled: !!activeBatch,
  });

  const assegnaRiderMutation = useMutation({
    mutationFn: async ({ riderId, ordineIds }: { riderId: number; ordineIds: number[] }) => {
      const r = await api.post("/delivery/ordini/assegna-multipli", { riderId, ordineIds });
      return (r.data as any)?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-batch-active"] });
      queryClient.invalidateQueries({ queryKey: ["admin-riders-disponibili"] });
      const count = data?.count ?? "?";
      toast({
        title: "Rider assegnato ✓",
        description: `${count} ordine/i assegnato/i con successo`,
      });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.response?.data?.error || String(e);
      toast({ title: "Errore assegnazione rider", description: msg, variant: "destructive" });
    },
  });

  const { data: history } = useQuery<BatchWindow[]>({
    queryKey: ["admin-batch-history"],
    queryFn: async () => {
      const r = await api.get("/delivery/batch/scheduler/history?limit=10");
      const d = r.data as any;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const nome = nuovoNome || `Batch ${new Date().toLocaleDateString("it-IT")}`;
      const dataInizio = new Date().toISOString();
      const dataFine = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const dataConsegna = new Date(nuovaDataConsegna + "T10:00:00").toISOString();
      return api.post("/delivery/batch/windows", {
        nome,
        dataInizio,
        dataFine,
        dataConsegna,
        zoneOperative: ZONE_DEFAULT,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batch-active"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batch-history"] });
      toast({ title: "Batch aperto", description: "Gli ordini possono ora entrare nel raggruppamento territoriale." });
      setNuovoNome("");
    },
    onError: (e: any) => {
      toast({ title: "Errore", description: e?.response?.data?.message || String(e), variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/delivery/batch/windows/${id}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batch-active"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batch-history"] });
      toast({ title: "Batch chiuso", description: "Raccolta chiusa. Ora puoi assegnare farmacia e rider." });
    },
    onError: (e: any) => {
      toast({ title: "Errore chiusura", description: e?.response?.data?.message || String(e), variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (id: number) => api.post(`/delivery/batch/windows/${id}/assign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batch-active"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batch-history"] });
      toast({
        title: "Raggruppamento preparato",
        description: "Le farmacie candidate sono disponibili per la conferma manuale o assistita.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Errore assegnazione", description: e?.response?.data?.message || String(e), variant: "destructive" });
    },
  });

  const { data: batchZones } = useQuery<{ zone: any[]; farmacie: any[] }>({
    queryKey: ["admin-batch-zones", activeBatch?.id],
    queryFn: async () => {
      const r = await api.get(`/delivery/batch/windows/${activeBatch!.id}/zones`);
      const raw = (r.data as any)?.data ?? r.data ?? {};

      return {
        zone: normalizeArray(raw.zone),
        farmacie: normalizeArray(raw.farmacie),
      };
    },
    enabled: !!activeBatch?.id && showManualAssign,
  });

  const assignManualMutation = useMutation({
    mutationFn: ({ batchId, zona, farmaciaId }: { batchId: number; zona: string; farmaciaId: number }) =>
      api.post(`/delivery/batch/windows/${batchId}/assign-manual`, { zona, farmaciaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batch-active"] });
      queryClient.invalidateQueries({ queryKey: ["admin-batch-zones", activeBatch?.id] });
      toast({ title: "Farmacia assegnata", description: "Assegnazione manuale completata." });
    },
    onError: (e: any) => {
      toast({ title: "Errore", description: e?.response?.data?.message || String(e), variant: "destructive" });
    },
  });

  const assignmentCount = activeBatch?._count?.assignments ?? activeBatch?.assignments?.length ?? 0;
  const totalOrders = activeBatch?._count?.ordini ?? activeBatch?.ordiniTotali ?? activeBatch?.ordini?.length ?? 0;
  const unassignedOrders = (activeBatch?.ordini || []).filter((ordine) => !ordine.batchAssignmentId);
  const activeAssignments = Array.isArray(activeBatch?.assignments) ? activeBatch.assignments : [];
  const manualBatchZones = Array.isArray(batchZones?.zone) ? batchZones.zone : [];
  const manualFarmacie = Array.isArray(batchZones?.farmacie) ? batchZones.farmacie : [];
  const assignedRiders = new Set(
    activeAssignments.flatMap((assignment) =>
      getAssignmentRiderNames(assignment),
    ),
  ).size;
  const batchDisplayStatus = getBatchDisplayStatus(activeBatch, assignedRiders);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8 text-blue-600" />
            Gestione Batch Delivery
          </h1>
          <p className="text-gray-600 mt-1">
            Vista essenziale del batch: raccogli, raggruppa per cluster territoriale e assegna la farmacia solo quando serve.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-batch-active"] });
            queryClient.invalidateQueries({ queryKey: ["admin-batch-history"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Stato batch attivo */}
      <Card className={activeBatch ? "border-blue-300 bg-blue-50/30" : "border-dashed"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Batch Attivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Caricamento...</p>
          ) : activeBatch ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={STATI_COLORI[batchDisplayStatus.key] || "bg-gray-100"}>
                  {batchDisplayStatus.label}
                </Badge>
                <span className="font-semibold text-lg">{activeBatch.nome}</span>
                <span className="text-gray-500 text-sm">ID: {activeBatch.id}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Inizio raccolta</p>
                  <p className="font-medium">{formatDate(activeBatch.dataInizio)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fine raccolta</p>
                  <p className="font-medium">{formatDate(activeBatch.dataFine)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data consegna</p>
                  <p className="font-medium">{formatDate(activeBatch.dataConsegna, { dateOnly: true })}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Zone</p>
                  <p className="font-medium">{(activeBatch.zoneOperative || []).join(", ")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Ordini nel batch</p>
                  <p className="text-2xl font-semibold">{totalOrders}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Zone assegnate</p>
                  <p className="text-2xl font-semibold">{assignmentCount}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Farmacie coinvolte</p>
                  <p className="text-2xl font-semibold">{activeBatch.farmacieCoinvolte || assignmentCount}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Rider coinvolti</p>
                  <p className="text-2xl font-semibold">{assignedRiders}</p>
                </div>
              </div>

              {unassignedOrders.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
                    <div className="space-y-1">
                      <p className="font-medium text-amber-900">
                        Ordini ancora senza assegnazione farmacia
                      </p>
                      <p className="text-sm text-amber-800">
                        {unassignedOrders.length} ordini sono nel batch ma non risultano ancora collegati a una zona/farmacia.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeBatch.stato === "assegnato" && assignedRiders === 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="font-medium text-blue-900">
                    Farmacia assegnata, ma il rider non vede ancora ordini
                  </p>
                  <p className="text-sm text-blue-800">
                    Questo batch e&apos; gia collegato a una farmacia, ma qui non risulta ancora nessun rider.
                    Finche&apos; non compare un rider o l&apos;ordine non entra negli stati rider-visibili,
                    nel portale rider non comparira&apos; nulla.
                  </p>
                </div>
              )}

              {/* Timeline visiva del batch */}
              {(() => {
                const steps = [
                  { key: "raccolta", label: "Raccolta" },
                  { key: "elaborazione", label: "Farmacia assegnata" },
                  { key: "assegnato", label: "Rider assegnato" },
                  { key: "in_consegna", label: "In consegna" },
                  { key: "completato", label: "Consegnato" },
                ];
                const stateOrder = ["raccolta", "elaborazione", "assegnato", "in_consegna", "completato"];
                const currentIdx = stateOrder.indexOf(
                  activeBatch.stato === "assegnato" && assignedRiders === 0
                    ? "elaborazione"
                    : activeBatch.stato
                );
                return (
                  <div className="flex items-center gap-0 overflow-x-auto py-2">
                    {steps.map((step, i) => {
                      const done = i < currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step.key} className="flex items-center flex-shrink-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              done ? "bg-green-500 border-green-500 text-white" :
                              active ? "bg-blue-600 border-blue-600 text-white" :
                              "bg-white border-gray-300 text-gray-400"
                            }`}>
                              {done ? "✓" : i + 1}
                            </div>
                            <p className={`text-xs mt-1 text-center max-w-[70px] ${active ? "font-semibold text-blue-700" : done ? "text-green-700" : "text-gray-400"}`}>
                              {step.label}
                            </p>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`h-0.5 w-8 mx-1 mb-4 ${done ? "bg-green-500" : "bg-gray-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Alert zone senza rider */}
              {activeAssignments.length > 0 && (() => {
                const zoneNoRider = activeAssignments.filter(
                  (a) => getAssignmentRiderNames(a).length === 0
                );
                if (zoneNoRider.length === 0) return null;
                return (
                  <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-900">
                          ⚠️ {zoneNoRider.length} zona{zoneNoRider.length > 1 ? " senza" : " senza"} rider assegnato
                        </p>
                        <p className="text-sm text-red-800 mt-0.5">
                          {zoneNoRider.map((a) => a.zonaGeografica).join(", ")} — assegna un rider per avviare la consegna.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeAssignments.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold">Assegnazioni Correnti</h2>
                    <p className="text-sm text-gray-600">
                      Qui vedi chiaramente cosa è stato assegnato a quale farmacia e a quale rider.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {activeAssignments.map((assignment) => {
                      const riderNames = getAssignmentRiderNames(assignment);
                      const assignmentDisplayStatus = getAssignmentDisplayStatus(assignment);

                      return (
                        <div key={assignment.id} className="rounded-xl border bg-white p-4 space-y-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Zona</p>
                              <p className="text-lg font-semibold">{assignment.zonaGeografica}</p>
                            </div>
                            <Badge className={STATI_COLORI[assignmentDisplayStatus.key] || "bg-gray-100"}>
                              {assignmentDisplayStatus.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                Farmacia assegnata
                              </p>
                              <p className="font-medium">{assignment.farmacia?.nome || "Non assegnata"}</p>
                              <p className="text-xs text-gray-500">{assignment.farmacia?.citta || "-"}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-gray-500">Backup</p>
                              <p className="font-medium">{assignment.farmaciaBackup?.nome || "Nessuna"}</p>
                              <p className="text-xs text-gray-500">{assignment.farmaciaBackup?.citta || "-"}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="text-gray-500 flex items-center gap-1">
                                <Truck className="h-3.5 w-3.5" />
                                Rider
                              </p>
                              <p className="font-medium">
                                {riderNames.length > 0 ? riderNames.join(", ") : "Non assegnato"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {assignment._count?.ordini ?? assignment.ordiniAssegnati ?? assignment.ordini?.length ?? 0} ordini
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Ordini della zona</p>
                            <div className="space-y-2">
                              {(assignment.ordini || []).length > 0 ? (
                                assignment.ordini!.map((ordine) => (
                                  <div
                                    key={ordine.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                                  >
                                    <div>
                                      <p className="font-medium">{ordine.codiceOrdine}</p>
                                      <p className="text-gray-500">
                                        {ordine.paziente?.nome} {ordine.paziente?.cognome}
                                        {ordine.paziente?.citta ? ` · ${ordine.paziente.citta}` : ""}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{formatOrderState(ordine.stato)}</p>
                                      <p className="text-gray-500">
                                        {ordine.rider
                                          ? `${ordine.rider.nome} ${ordine.rider.cognome}`
                                          : "Rider non ancora assegnato"}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">Nessun ordine collegato visibile.</p>
                              )}
                            </div>

                            {/* Assegnazione rider — sempre visibile se mancante */}
                            {(() => {
                              const unassignedIds = (assignment.ordini || [])
                                .filter((o) => !o.rider && (o.stato === "pronto" || o.stato === "pronto_ritiro"))
                                .map((o) => o.id);
                              const riderSel = selectedRiderPerAssignment[assignment.id];
                              const hasRider = getAssignmentRiderNames(assignment).length > 0;
                              if (hasRider && unassignedIds.length === 0) return null;
                              return (
                                <div className={`flex items-center gap-2 pt-3 border-t flex-wrap ${!hasRider ? "bg-red-50 -mx-4 px-4 pb-2 rounded-b-xl" : ""}`}>
                                  {!hasRider && (
                                    <span className="text-sm text-red-700 font-semibold w-full mb-1">
                                      ⚠️ Nessun rider assegnato per questa zona
                                    </span>
                                  )}
                                  {unassignedIds.length > 0 && (
                                    <span className="text-sm text-amber-700 font-medium">
                                      {unassignedIds.length} ordini senza rider:
                                    </span>
                                  )}
                                  <Select
                                    value={riderSel || ""}
                                    onValueChange={(val) =>
                                      setSelectedRiderPerAssignment((prev) => ({ ...prev, [assignment.id]: val }))
                                    }
                                  >
                                    <SelectTrigger className="w-48 h-8 text-sm">
                                      <SelectValue placeholder="Seleziona rider…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(ridersDisponibili || []).map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                          {r.nome} {r.cognome}
                                          {r.mezzoTrasporto && (
                                            <span className="ml-1 text-xs text-gray-400">({r.mezzoTrasporto})</span>
                                          )}
                                        </SelectItem>
                                      ))}
                                      {(ridersDisponibili || []).length === 0 && (
                                        <SelectItem value="__none" disabled>
                                          Nessun rider disponibile
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {unassignedIds.length > 0 && (
                                    <Button
                                      size="sm"
                                      disabled={!riderSel || assegnaRiderMutation.isPending}
                                      onClick={() =>
                                        assegnaRiderMutation.mutate({
                                          riderId: parseInt(riderSel!),
                                          ordineIds: unassignedIds,
                                        })
                                      }
                                    >
                                      <Truck className="h-3.5 w-3.5 mr-1" />
                                      Assegna rider ({unassignedIds.length})
                                    </Button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap pt-2">
                {activeBatch.stato === "raccolta" && (
                  <Button
                    onClick={() => closeMutation.mutate(activeBatch.id)}
                    disabled={closeMutation.isPending}
                    variant="outline"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {closeMutation.isPending ? "Chiusura..." : "Chiudi raccolta"}
                  </Button>
                )}
                {(activeBatch.stato === "elaborazione" || activeBatch.stato === "raccolta") && (
                  <Button
                    onClick={() => assignMutation.mutate(activeBatch.id)}
                    disabled={assignMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {assignMutation.isPending ? "Preparando..." : "Prepara assegnazione"}
                  </Button>
                )}
                {(activeBatch.stato === "elaborazione" || activeBatch.stato === "raccolta" || activeBatch.stato === "assegnato" || activeBatch.stato === "completato") && (
                  <Button
                    variant="outline"
                    onClick={() => setShowManualAssign((v) => !v)}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    {showManualAssign ? "Nascondi assegnazione manuale" : "Scegli farmacia manualmente"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvancedSections((v) => !v)}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  {showAdvancedSections ? "Nascondi dettagli avanzati" : "Mostra dettagli avanzati"}
                </Button>
              </div>

              {showAdvancedSections && showManualAssign && batchZones && (
                <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                  <p className="font-semibold text-blue-900">Assegnazione manuale per cluster territoriale</p>
                  <p className="text-sm text-blue-700">
                    Seleziona la farmacia per ogni cluster CAP/località. Clicca &quot;Assegna&quot; per confermare cluster per cluster.
                  </p>
                  {manualBatchZones.length === 0 && (
                    <p className="text-sm text-gray-500">Nessun ordine nel batch.</p>
                  )}
                  {manualBatchZones.map((z: any) => (
                    <div key={z.zona} className="flex items-center gap-3 rounded-lg border bg-white p-3 flex-wrap">
                      <div className="min-w-[140px]">
                        <p className="text-xs text-gray-500">Cluster</p>
                        <p className="font-medium">{getZoneTerritoryLabel(z)}</p>
                        <p className="text-xs text-gray-400">{z.zona}</p>
                        <p className="text-xs text-gray-400">{z.ordini} ordini</p>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs text-gray-500 mb-1">
                          {z.assignment?.farmacia?.nome
                            ? `Attuale: ${z.assignment.farmacia.nome}`
                            : "Nessuna farmacia assegnata"}
                        </p>
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={manualSelections[z.zona] ?? z.assignment?.farmaciaId ?? ""}
                          onChange={(e) =>
                            setManualSelections((prev) => ({
                              ...prev,
                              [z.zona]: Number(e.target.value),
                            }))
                          }
                        >
                          <option value="">-- Seleziona farmacia --</option>
                          {manualFarmacie.map((f: any) => (
                            <option key={f.id} value={f.id}>
                              {f.nome} {f.citta ? `· ${f.citta}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        disabled={!manualSelections[z.zona] || assignManualMutation.isPending}
                        onClick={() =>
                          assignManualMutation.mutate({
                            batchId: activeBatch.id,
                            zona: z.zona,
                            farmaciaId: manualSelections[z.zona],
                          })
                        }
                      >
                        Assegna
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500">
                Nessun batch attivo. Apri una nuova finestra per raccogliere gli ordini del medico.
              </p>
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Nome batch (opzionale)</label>
                  <Input
                    placeholder="es. Batch Mattina 8 Mar"
                    value={nuovoNome}
                    onChange={(e) => setNuovoNome(e.target.value)}
                    className="w-64"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Data consegna</label>
                  <Input
                    type="date"
                    value={nuovaDataConsegna}
                    onChange={(e) => setNuovaDataConsegna(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? "Creazione..." : "Apri Batch"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Zone attive: {ZONE_DEFAULT.join(", ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storico */}
      {showAdvancedSections && history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Storico Batch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((bw: any) => (
                <div
                  key={bw.id}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={STATI_COLORI[bw.stato] || "bg-gray-100"}>
                      {bw.stato}
                    </Badge>
                    <span className="font-medium">{bw.nome}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500">
                    <span>{formatDate(bw.dataConsegna, { dateOnly: true })}</span>
                    {bw.ordiniCount !== undefined && (
                      <span>{bw.ordiniCount} ordini</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
