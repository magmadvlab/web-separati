"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimaleForm, Animale } from "@/components/onboarding/AnimaleForm";
import { useToast } from "@/hooks/use-toast";
import { PawPrint, ArrowLeft, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import type { ApiResponse } from "@/types/api";

export default function AnimaliPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [animali, setAnimali] = useState<Animale[]>([]);

  const { data: animaliSalvati, isLoading } = useQuery({
    queryKey: ["paziente-animali"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/animali");
      return response.data.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (animale: Animale) => {
      return await api.post("/paziente/animali", animale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-animali"] });
      setAnimali([]);
      toast({ 
        title: "Animale aggiunto",
        description: "L'animale è stato registrato con successo"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (animaleId: number) => {
      return await api.delete(`/paziente/animali/${animaleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-animali"] });
      toast({ 
        title: "Animale rimosso",
        description: "L'animale è stato rimosso con successo"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Errore durante la rimozione",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/paziente/profilo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al profilo
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PawPrint className="h-8 w-8 text-green-600" />
            I Miei Animali
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci i tuoi animali domestici per accedere ai servizi veterinari
          </p>
        </div>
      </div>

      {/* Form Aggiungi Animale */}
      <Card>
        <CardHeader>
          <CardTitle>Aggiungi Nuovo Animale</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimaleForm
            animali={animali}
            onAdd={(animale) => {
              setAnimali([...animali, animale]);
              saveMutation.mutate(animale);
            }}
            onRemove={(index) => {
              setAnimali(animali.filter((_, i) => i !== index));
            }}
          />
        </CardContent>
      </Card>

      {/* Lista Animali Salvati */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Caricamento...</p>
          </CardContent>
        </Card>
      ) : animaliSalvati && animaliSalvati.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Animali Registrati ({animaliSalvati.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {animaliSalvati.map((animale: any) => (
                <div 
                  key={animale.id} 
                  className="p-4 border rounded-lg flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <PawPrint className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{animale.nome}</h3>
                      <p className="text-sm text-gray-600">
                        {animale.specie} • {animale.razza}
                      </p>
                      {animale.dataNascita && (
                        <p className="text-xs text-gray-500 mt-1">
                          Nato il: {new Date(animale.dataNascita).toLocaleDateString('it-IT')}
                        </p>
                      )}
                      {animale.microchip && (
                        <p className="text-xs text-gray-500">
                          Microchip: {animale.microchip}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/paziente/profilo/animali/${animale.id}/diario`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Diario
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler rimuovere ${animale.nome}?`)) {
                          deleteMutation.mutate(animale.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nessun animale registrato</p>
            <p className="text-sm text-gray-500">
              Aggiungi il tuo primo animale per accedere ai servizi veterinari
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Servizi Veterinari */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <PawPrint className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Servizi Veterinari Disponibili</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Visite veterinarie a domicilio</li>
                <li>• Vaccinazioni e richiami programmati</li>
                <li>• Prescrizioni farmaci veterinari</li>
                <li>• Cartella clinica digitale</li>
                <li>• Consulti veterinari online</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
