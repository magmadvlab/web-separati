"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { PaymentMethodSelector, MetodoPagamento } from "@/components/payments/PaymentMethodSelector";
import { StripePaymentForm } from "@/components/payments/StripePaymentForm";
import { PayPalButton } from "@/components/payments/PayPalButton";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, Ordine } from "@/types/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PagamentoOrdinePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const ordineId = parseInt(params.id as string);
  const [selectedMethod, setSelectedMethod] = useState<MetodoPagamento | undefined>();

  const { data: ordine, isLoading } = useQuery<Ordine>({
    queryKey: ["paziente-ordine", ordineId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine>>(`/paziente/ordini/${ordineId}`);
      return response.data.data;
    },
    enabled: !!ordineId,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ["payment-status", ordineId],
    queryFn: async () => {
      const response = await api.get(`/payments/ordine/${ordineId}`);
      return response.data;
    },
    enabled: !!ordineId,
  });

  const setupContrassegnoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/payments/contrassegno", { ordineId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-status", ordineId] });
      queryClient.invalidateQueries({ queryKey: ["paziente-ordine", ordineId] });
      toast({
        title: "Contrassegno configurato",
        description: "Il pagamento verrà effettuato alla consegna.",
      });
      router.push(`/ordini/${ordineId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella configurazione del contrassegno",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!ordine) {
    return <NotFound message="Ordine non trovato" />;
  }

  const totale = Number(ordine.totale || 0);
  const isPaid = paymentStatus?.statoPagamento === "paid";

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["payment-status", ordineId] });
    queryClient.invalidateQueries({ queryKey: ["paziente-ordine", ordineId] });
    router.push(`/ordini/${ordineId}`);
  };

  const handleContrassegnoConfirm = () => {
    setupContrassegnoMutation.mutate();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/ordini/${ordineId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna all&apos;ordine
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Pagamento Ordine</h1>
        <p className="text-gray-600">Ordine #{ordine.codiceOrdine}</p>
      </div>

      {isPaid && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PaymentStatusBadge
                statoPagamento={paymentStatus?.statoPagamento}
                metodoPagamento={paymentStatus?.metodoPagamento}
              />
              <p className="text-sm text-gray-600">
                Questo ordine è già stato pagato. Puoi visualizzare i dettagli dell&apos;ordine.
              </p>
            </div>
            <Link href={`/ordini/${ordineId}`}>
              <Button className="mt-4">Vedi Dettagli Ordine</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isPaid && (
        <div className="space-y-6">
          {!selectedMethod && (
            <PaymentMethodSelector
              totale={totale}
              onSelect={setSelectedMethod}
              selected={selectedMethod}
            />
          )}

          {selectedMethod === "carta" && (
            <StripePaymentForm
              ordineId={ordineId}
              totale={totale}
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                toast({
                  title: "Errore",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          )}

          {selectedMethod === "paypal" && (
            <PayPalButton
              ordineId={ordineId}
              totale={totale}
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                toast({
                  title: "Errore",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          )}

          {selectedMethod === "contrassegno" && (
            <Card>
              <CardHeader>
                <CardTitle>Conferma Contrassegno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Il pagamento verrà effettuato direttamente al fattorino al momento della consegna.
                  Verrà applicata una commissione di incasso del 5%.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMethod(undefined)}
                  >
                    Indietro
                  </Button>
                  <Button
                    onClick={handleContrassegnoConfirm}
                    disabled={setupContrassegnoMutation.isPending}
                  >
                    {setupContrassegnoMutation.isPending ? "Configurazione..." : "Conferma Contrassegno"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}



