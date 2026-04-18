"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Pill, Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";

export default function PreferenzeDisponibilitaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferenze, setPreferenze] = useState({
    accettaGenerico: true,
    accettaSostituzioni: true,
    chiamataInCasoMancanza: false,
  });

  // Carica preferenze attuali
  const { data: preferenzeAttuali, isLoading } = useQuery({
    queryKey: ["preferenze-disponibilita"],
    queryFn: async () => {
      const response = await api.get("/paziente/preferenze-disponibilita");
      return response.data;
    },
  });

  useEffect(() => {
    if (preferenzeAttuali) {
      setPreferenze({
        accettaGenerico: preferenzeAttuali.accettaGenerico ?? true,
        accettaSostituzioni: preferenzeAttuali.accettaSostituzioni ?? true,
        chiamataInCasoMancanza: preferenzeAttuali.chiamataInCasoMancanza ?? false,
      });
    }
  }, [preferenzeAttuali]);

  // Salva preferenze
  const salvaPreferenzeMutation = useMutation({
    mutationFn: async (pref: typeof preferenze) => {
      const response = await api.put("/paziente/preferenze-disponibilita", pref);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferenze-disponibilita"] });
      toast({
        title: "Preferenze salvate",
        description: "Le tue preferenze sono state aggiornate con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nel salvataggio delle preferenze",
        variant: "destructive",
      });
    },
  });

  const handleSalva = () => {
    salvaPreferenzeMutation.mutate(preferenze);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Preferenze Disponibilità Farmaci</h1>
        <p className="text-gray-600 mt-2">
          Configura come gestire la disponibilità dei farmaci nelle farmacie
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Opzioni Disponibilità
            </CardTitle>
            <CardDescription>
              Scegli come gestire i farmaci quando non sono disponibili in farmacia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="accettaGenerico"
                checked={preferenze.accettaGenerico}
                onCheckedChange={(checked) =>
                  setPreferenze({ ...preferenze, accettaGenerico: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="accettaGenerico" className="text-base font-medium cursor-pointer">
                  Accetta farmaci generici
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Se il farmaco prescritto non è disponibile, accetta automaticamente il farmaco generico equivalente
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="accettaSostituzioni"
                checked={preferenze.accettaSostituzioni}
                onCheckedChange={(checked) =>
                  setPreferenze({ ...preferenze, accettaSostituzioni: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="accettaSostituzioni" className="text-base font-medium cursor-pointer">
                  Accetta sostituzioni proposte
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Permetti alla farmacia di proporre farmaci alternativi con lo stesso principio attivo
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="chiamataInCasoMancanza"
                checked={preferenze.chiamataInCasoMancanza}
                onCheckedChange={(checked) =>
                  setPreferenze({ ...preferenze, chiamataInCasoMancanza: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="chiamataInCasoMancanza" className="text-base font-medium cursor-pointer">
                  Chiamata in caso di mancanza
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Richiedi che la farmacia ti chiami telefonicamente se il farmaco non è disponibile
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Queste preferenze si applicano a tutti i tuoi ordini futuri. Puoi sempre modificare
                le preferenze per ordini specifici durante il checkout.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSalva}
              disabled={salvaPreferenzeMutation.isPending}
              className="w-full"
            >
              Salva Preferenze
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


