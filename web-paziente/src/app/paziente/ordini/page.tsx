"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, MapPin } from "lucide-react";
import api from "@/lib/api";

interface Ordine {
  id: number;
  numeroOrdine: string;
  dataOrdine: string;
  stato: string;
  totale: number;
  farmacia?: {
    nome: string;
    indirizzo: string;
  };
  items: Array<{
    farmaco: string;
    quantita: number;
    prezzo: number;
  }>;
}

export default function OrdiniPage() {
  const { token } = useAuthStore();
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdini();
  }, []);

  const fetchOrdini = async () => {
    try {
      const response = await api.get("/paziente/ordini");
      setOrdini(response.data);
    } catch (error) {
      console.error("Errore caricamento ordini:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatoBadge = (stato: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in_preparazione: "default",
      pronto: "secondary",
      in_consegna: "default",
      consegnato: "secondary",
      annullato: "destructive",
    };
    const labels: Record<string, string> = {
      in_preparazione: "In Preparazione",
      pronto: "Pronto",
      in_consegna: "In Consegna",
      consegnato: "Consegnato",
      annullato: "Annullato",
    };
    return (
      <Badge variant={variants[stato] || "outline"}>
        {labels[stato] || stato}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento ordini...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">I Miei Ordini</h1>
        <p className="text-gray-600 mt-2">
          Visualizza lo stato dei tuoi ordini
        </p>
      </div>

      {ordini.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Nessun ordine effettuato
            </p>
            <Button className="mt-4">Crea Nuovo Ordine</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ordini.map((ordine) => (
            <Card key={ordine.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Ordine #{ordine.numeroOrdine || ordine.id}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(ordine.dataOrdine).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatoBadge(ordine.stato)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordine.farmacia && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium">{ordine.farmacia.nome || "Farmacia"}</p>
                        <p className="text-gray-600">{ordine.farmacia.indirizzo || ""}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Articoli:</p>
                    <ul className="space-y-1">
                      {(ordine.items || []).map((item, index) => (
                        <li key={index} className="text-sm flex justify-between">
                          <span>
                            {item.quantita || 0}x {item.farmaco || "Prodotto"}
                          </span>
                          <span className="font-medium">€{Number(item.prezzo || 0).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Totale</span>
                    <span className="text-lg font-bold">€{Number(ordine.totale || 0).toFixed(2)}</span>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Traccia Ordine
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
