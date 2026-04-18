"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, AlertTriangle, Package, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TentataConsegnaProps {
  ordineId: number;
  tentativaConsegna: {
    data: string;
    motivo: string;
    noteRider?: string;
  };
}

export function TentataConsegna({ ordineId, tentativaConsegna }: TentataConsegnaProps) {
  const [nuovaData, setNuovaData] = useState("");
  const [nuovaOra, setNuovaOra] = useState("");
  const [isRiprogrammaOpen, setIsRiprogrammaOpen] = useState(false);
  const [isDepositoOpen, setIsDepositoOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Riprogramma consegna
  const riprogrammaMutation = useMutation({
    mutationFn: async (data: { nuovaData: string; nuovaOra: string }) => {
      const dataCompleta = `${data.nuovaData}T${data.nuovaOra}`;
      const response = await api.post(`/delivery/ordini/${ordineId}/riprogramma`, {
        nuovaData: dataCompleta,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-ordine", ordineId] });
      setIsRiprogrammaOpen(false);
      setNuovaData("");
      setNuovaOra("");
      toast({
        title: "Consegna riprogrammata",
        description: "La nuova data di consegna è stata impostata.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella riprogrammazione",
        variant: "destructive",
      });
    },
  });

  // Deposito temporaneo
  const depositoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/delivery/ordini/${ordineId}/deposito-temporaneo`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-ordine", ordineId] });
      setIsDepositoOpen(false);
      toast({
        title: "Deposito temporaneo richiesto",
        description: "La farmacia è stata informata del deposito temporaneo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella richiesta",
        variant: "destructive",
      });
    },
  });

  const handleRiprogramma = () => {
    if (!nuovaData || !nuovaOra) {
      toast({
        title: "Errore",
        description: "Inserisci data e ora",
        variant: "destructive",
      });
      return;
    }
    riprogrammaMutation.mutate({ nuovaData, nuovaOra });
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          Tentata Consegna
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-300 bg-yellow-100">
          <AlertDescription className="text-yellow-800">
            <strong>Attenzione:</strong> Il tentativo di consegna è fallito.
            <br />
            <span className="text-sm">
              Motivo: {tentativaConsegna.motivo}
              {tentativaConsegna.noteRider && (
                <>
                  <br />
                  Note rider: {tentativaConsegna.noteRider}
                </>
              )}
            </span>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3">
          <Dialog open={isRiprogrammaOpen} onOpenChange={setIsRiprogrammaOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Calendar className="w-4 h-4 mr-2" />
                Riprogramma Consegna
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Riprogramma Consegna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="data">Nuova Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={nuovaData}
                    onChange={(e) => setNuovaData(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="ora">Nuova Ora</Label>
                  <Input
                    id="ora"
                    type="time"
                    value={nuovaOra}
                    onChange={(e) => setNuovaOra(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleRiprogramma}
                  disabled={riprogrammaMutation.isPending}
                  className="w-full"
                >
                  Conferma Riprogrammazione
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDepositoOpen} onOpenChange={setIsDepositoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Deposito Temporaneo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Richiedi Deposito Temporaneo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Richiedi che l'ordine venga depositato temporaneamente in farmacia per il ritiro.
                  Il deposito è disponibile per un massimo di 7 giorni.
                </p>
                <Button
                  onClick={() => depositoMutation.mutate()}
                  disabled={depositoMutation.isPending}
                  className="w-full"
                >
                  Conferma Deposito
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            Ritiro in Farmacia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


