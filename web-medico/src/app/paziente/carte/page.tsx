"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Trash2, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";
import { StripePaymentForm } from "@/components/payments/StripePaymentForm";

interface CartaSalvata {
  id: number;
  ultime4Cifre: string;
  tipoCarta: string;
  scadenza: string;
  predefinita: boolean;
}

export default function CartePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carica carte salvate
  const { data: carte, isLoading } = useQuery({
    queryKey: ["payment", "carte"],
    queryFn: async () => {
      const response = await api.get("/payments/carte");
      return response.data;
    },
  });

  // Elimina carta
  const eliminaCartaMutation = useMutation({
    mutationFn: async (cartaId: number) => {
      const response = await api.post(`/payments/carta/${cartaId}/elimina`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", "carte"] });
      toast({
        title: "Carta eliminata",
        description: "La carta è stata eliminata con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nell'eliminazione della carta",
        variant: "destructive",
      });
    },
  });

  // Imposta carta predefinita
  const setPredefinitaMutation = useMutation({
    mutationFn: async (cartaId: number) => {
      const response = await api.post(`/payments/carta/${cartaId}/predefinita`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", "carte"] });
      toast({
        title: "Carta predefinita aggiornata",
        description: "La carta predefinita è stata aggiornata.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nell'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const handleSalvaCarta = async (paymentMethodId: string, cardDetails: any) => {
    try {
      await api.post("/payments/carta/salva", {
        paymentMethodId,
        ultime4Cifre: cardDetails.last4,
        tipoCarta: cardDetails.brand.toUpperCase(),
        scadenza: `${cardDetails.exp_month.toString().padStart(2, "0")}/${cardDetails.exp_year.toString().slice(-2)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["payment", "carte"] });
      setIsDialogOpen(false);
      toast({
        title: "Carta salvata",
        description: "La carta è stata salvata con successo.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nel salvataggio della carta",
        variant: "destructive",
      });
    }
  };

  // Wrapper per adattare handleSalvaCarta alla firma di StripePaymentForm
  const handleSalvaCartaWrapper = () => {
    // StripePaymentForm non supporta il salvataggio di carte senza pagamento
    // Questo è un placeholder - in produzione serve un componente dedicato
    toast({
      title: "Funzionalità non disponibile",
      description: "Il salvataggio di carte sarà disponibile a breve.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  const carteSalvate: CartaSalvata[] = carte || [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Carte di Pagamento</h1>
          <p className="text-gray-600 mt-2">Gestisci le tue carte salvate</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Carta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuova Carta</DialogTitle>
            </DialogHeader>
            <StripePaymentForm
              ordineId={0}
              totale={0}
              onSuccess={handleSalvaCartaWrapper}
              onError={(error) => {
                toast({
                  title: "Errore",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {carteSalvate.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nessuna carta salvata</p>
            <p className="text-sm text-gray-400 mt-2">
              Aggiungi una carta per pagamenti più rapidi
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {carteSalvate.map((carta) => (
            <Card key={carta.id} className={carta.predefinita ? "border-blue-500" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {carta.tipoCarta} •••• {carta.ultime4Cifre}
                        </h3>
                        {carta.predefinita && (
                          <Badge variant="default" className="text-xs">
                            Predefinita
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Scadenza: {carta.scadenza}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!carta.predefinita && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPredefinitaMutation.mutate(carta.id)}
                        disabled={setPredefinitaMutation.isPending}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminaCartaMutation.mutate(carta.id)}
                      disabled={eliminaCartaMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


