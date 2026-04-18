"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, Plus } from "lucide-react";
import api from "@/lib/api";

interface Prodotto {
  id: number;
  nome: string;
  principioAttivo: string;
  categoria: string;
  prezzo: number;
  disponibile: boolean;
  immagine?: string;
}

export default function ShopPage() {
  const { token } = useAuthStore();
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [carrello, setCarrello] = useState<number[]>([]);

  useEffect(() => {
    fetchProdotti();
  }, []);

  const fetchProdotti = async () => {
    try {
      const response = await api.get("/paziente/farmaci/otc");
      setProdotti(response.data);
    } catch (error) {
      console.error("Errore caricamento prodotti:", error);
    } finally {
      setLoading(false);
    }
  };

  const aggiungiAlCarrello = (prodottoId: number) => {
    setCarrello([...carrello, prodottoId]);
  };

  const prodottiFiltrati = prodotti.filter(
    (p) =>
      (p.nome?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (p.principioAttivo?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento prodotti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shop Farmacia</h1>
          <p className="text-gray-600 mt-2">
            Acquista farmaci da banco e prodotti per la salute
          </p>
        </div>
        <Button>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Carrello ({carrello.length})
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cerca prodotti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {prodottiFiltrati.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Nessun prodotto trovato
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prodottiFiltrati.map((prodotto) => (
            <Card key={prodotto.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{prodotto.nome || "Prodotto senza nome"}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {prodotto.principioAttivo || "N/A"}
                    </p>
                  </div>
                  <Badge variant={prodotto.disponibile ? "default" : "secondary"}>
                    {prodotto.disponibile ? "Disponibile" : "Esaurito"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Categoria</span>
                    <span className="text-sm font-medium">{prodotto.categoria || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">€{Number(prodotto.prezzo || 0).toFixed(2)}</span>
                    <Button
                      size="sm"
                      disabled={!prodotto.disponibile}
                      onClick={() => aggiungiAlCarrello(prodotto.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
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
