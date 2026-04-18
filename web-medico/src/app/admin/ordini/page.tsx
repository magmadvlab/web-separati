"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ApiResponse, Ordine, Rider } from "@/types/api";
import { Package, Truck, User, Phone, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminOrdiniPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrdine, setSelectedOrdine] = useState<Ordine | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: ordiniDisponibili, isLoading: ordiniLoading } = useQuery<Ordine[]>({
    queryKey: ["admin-ordini-disponibili"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/delivery/ordini/disponibili");
      return response.data.data;
    },
  });

  const { data: ridersDisponibili, isLoading: ridersLoading } = useQuery<Rider[]>({
    queryKey: ["admin-riders-disponibili"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Rider[]>>("/delivery/riders/disponibili");
      return response.data.data;
    },
  });

  const assegnaOrdineMutation = useMutation({
    mutationFn: async ({ ordineId, riderId }: { ordineId: number; riderId: number }) => {
      await api.post(`/delivery/ordini/${ordineId}/assegna`, {
        riderId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ordini-disponibili"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-rider-ordini"] });
      setIsDialogOpen(false);
      setSelectedOrdine(null);
      setSelectedRiderId("");
      toast({
        title: "Ordine assegnato",
        description: "L&apos;ordine è stato assegnato al rider con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l&apos;assegnazione",
        variant: "destructive",
      });
    },
  });

  const handleAssegnaClick = (ordine: Ordine) => {
    setSelectedOrdine(ordine);
    setSelectedRiderId("");
    setIsDialogOpen(true);
  };

  const handleConfermaAssegnazione = () => {
    if (!selectedOrdine || !selectedRiderId) {
      toast({
        title: "Errore",
        description: "Seleziona un rider",
        variant: "destructive",
      });
      return;
    }
    assegnaOrdineMutation.mutate({
      ordineId: selectedOrdine.id,
      riderId: parseInt(selectedRiderId),
    });
  };

  if (ordiniLoading || ridersLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestione Ordini Disponibili</h1>
        <p className="text-gray-600 mt-2">
          Assegna ordini pronti per la consegna ai rider disponibili
        </p>
      </div>

      {/* Statistiche Rapide */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Disponibili</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordiniDisponibili?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Pronti per consegna</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riders Disponibili</CardTitle>
            <Truck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ridersDisponibili?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Online e disponibili</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Assegnazione</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ridersDisponibili && ridersDisponibili.length > 0 && ordiniDisponibili && ordiniDisponibili.length > 0
                ? Math.round((ordiniDisponibili.length / ridersDisponibili.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Ordini per rider</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Ordini Disponibili */}
      <Card>
        <CardHeader>
          <CardTitle>Ordini Pronti per Consegna</CardTitle>
        </CardHeader>
        <CardContent>
          {ordiniDisponibili && ordiniDisponibili.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice Ordine</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Farmacia</TableHead>
                  <TableHead>Indirizzo Consegna</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Data Pronto</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordiniDisponibili.map((ordine) => (
                  <TableRow key={ordine.id}>
                    <TableCell className="font-medium">
                      #{(ordine as any).codiceOrdine || ordine.id}
                    </TableCell>
                    <TableCell>
                      {ordine.paziente
                        ? `${ordine.paziente.nome} ${ordine.paziente.cognome}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {ordine.farmacia ? (
                        <div>
                          <p className="font-medium">{ordine.farmacia.nome}</p>
                          <p className="text-xs text-gray-600">{ordine.farmacia.citta}</p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ordine.indirizzoConsegna || "-"}
                    </TableCell>
                    <TableCell>
                      {ordine.importoTotale
                        ? `€${ordine.importoTotale.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {(ordine as any).dataPronto
                        ? new Date((ordine as any).dataPronto).toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleAssegnaClick(ordine)}
                        disabled={!ridersDisponibili || ridersDisponibili.length === 0}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Assegna Rider
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun ordine disponibile per la consegna</p>
              <p className="text-sm text-gray-500 mt-2">
                Gli ordini appariranno qui quando le farmacie li marcheranno come &quot;Pronti&quot;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Assegnazione */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assegna Ordine a Rider</DialogTitle>
            <DialogDescription>
              Seleziona un rider disponibile per assegnare l&apos;ordine
            </DialogDescription>
          </DialogHeader>

          {selectedOrdine && (
            <div className="space-y-4">
              {/* Informazioni Ordine */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dettagli Ordine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Codice:</span>
                    <span className="font-medium">
                      #{(selectedOrdine as any).codiceOrdine || selectedOrdine.id}
                    </span>
                  </div>
                  {selectedOrdine.paziente && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Paziente:</span>
                      <span className="font-medium">
                        {selectedOrdine.paziente.nome} {selectedOrdine.paziente.cognome}
                      </span>
                    </div>
                  )}
                  {selectedOrdine.farmacia && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Farmacia:</span>
                      <span className="font-medium">{selectedOrdine.farmacia.nome}</span>
                    </div>
                  )}
                  {selectedOrdine.indirizzoConsegna && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-600">Indirizzo Consegna:</span>
                      <p className="text-sm font-medium mt-1">{selectedOrdine.indirizzoConsegna}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selezione Rider */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleziona Rider</label>
                <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un rider disponibile" />
                  </SelectTrigger>
                  <SelectContent>
                    {ridersDisponibili && ridersDisponibili.length > 0 ? (
                      ridersDisponibili.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {rider.nome} {rider.cognome}
                            </span>
                            {rider.mezzoTrasporto && (
                              <Badge variant="outline" className="ml-2">
                                {rider.mezzoTrasporto}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Nessun rider disponibile
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedRiderId && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    {(() => {
                      const rider = ridersDisponibili?.find(
                        (r) => r.id.toString() === selectedRiderId
                      );
                      return rider ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {rider.nome} {rider.cognome}
                            </span>
                          </div>
                          {rider.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{rider.telefono}</span>
                            </div>
                          )}
                          {rider.mezzoTrasporto && (
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{rider.mezzoTrasporto}</span>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {(!ridersDisponibili || ridersDisponibili.length === 0) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Nessun rider disponibile al momento. L&apos;ordine rimarrà in attesa.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleConfermaAssegnazione}
              disabled={
                !selectedRiderId ||
                assegnaOrdineMutation.isPending ||
                !ridersDisponibili ||
                ridersDisponibili.length === 0
              }
            >
              {assegnaOrdineMutation.isPending ? "Assegnazione..." : "Conferma Assegnazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}













