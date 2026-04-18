"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/shared/Loading";
import { toast } from "sonner";
import { Clock, Calendar, AlertCircle } from "lucide-react";

interface OrarioGiorno {
  giorno: string;
  aperturaMattina?: string;
  chiusuraMattina?: string;
  aperturaPomeriggio?: string;
  chiusuraPomeriggio?: string;
  orarioContinuato: boolean;
  turnoNotturno: boolean;
  servizioUrgenze: boolean;
  chiuso: boolean;
}

const GIORNI = [
  { key: "lunedi", label: "Lunedì" },
  { key: "martedi", label: "Martedì" },
  { key: "mercoledi", label: "Mercoledì" },
  { key: "giovedi", label: "Giovedì" },
  { key: "venerdi", label: "Venerdì" },
  { key: "sabato", label: "Sabato" },
  { key: "domenica", label: "Domenica" },
];

export default function FarmaciaOrariPage() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: orari, isLoading } = useQuery<OrarioGiorno[]>({
    queryKey: ["farmacia-orari"],
    queryFn: async () => {
      const response = await api.get("/farmacia/orari");
      return response.data;
    },
  });

  const [formData, setFormData] = useState<OrarioGiorno[]>([]);

  const updateMutation = useMutation({
    mutationFn: async (data: OrarioGiorno[]) => {
      const response = await api.put("/farmacia/orari", { orari: data });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacia-orari"] });
      setIsEditing(false);
      toast.success("Orari aggiornati con successo");
    },
    onError: () => {
      toast.error("Errore nell'aggiornamento degli orari");
    },
  });

  const handleEdit = () => {
    if (orari && orari.length > 0) {
      setFormData(orari);
    } else {
      // Inizializza con orari vuoti
      setFormData(
        GIORNI.map((g) => ({
          giorno: g.key,
          aperturaMattina: "09:00",
          chiusuraMattina: "13:00",
          aperturaPomeriggio: "15:00",
          chiusuraPomeriggio: "19:00",
          orarioContinuato: false,
          turnoNotturno: false,
          servizioUrgenze: false,
          chiuso: g.key === "domenica",
        }))
      );
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData([]);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (index: number, field: keyof OrarioGiorno, value: any) => {
    const newData = [...formData];
    newData[index] = { ...newData[index], [field]: value };
    setFormData(newData);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Orari Farmacia
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci gli orari di apertura e chiusura della farmacia
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit}>
            <Calendar className="mr-2 h-4 w-4" />
            Modifica Orari
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formData.map((orario, index) => {
            const giornoLabel = GIORNI.find((g) => g.key === orario.giorno)?.label || orario.giorno;
            
            return (
              <Card key={orario.giorno}>
                <CardHeader>
                  <CardTitle className="text-lg">{giornoLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id={`chiuso-${index}`}
                      checked={orario.chiuso}
                      onCheckedChange={(checked) => handleChange(index, "chiuso", checked)}
                    />
                    <Label htmlFor={`chiuso-${index}`} className="text-red-600 font-medium">
                      Chiuso
                    </Label>
                  </div>

                  {!orario.chiuso && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`aperturaMattina-${index}`}>Apertura Mattina</Label>
                          <Input
                            id={`aperturaMattina-${index}`}
                            type="time"
                            value={orario.aperturaMattina || ""}
                            onChange={(e) => handleChange(index, "aperturaMattina", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`chiusuraMattina-${index}`}>Chiusura Mattina</Label>
                          <Input
                            id={`chiusuraMattina-${index}`}
                            type="time"
                            value={orario.chiusuraMattina || ""}
                            onChange={(e) => handleChange(index, "chiusuraMattina", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`aperturaPomeriggio-${index}`}>Apertura Pomeriggio</Label>
                          <Input
                            id={`aperturaPomeriggio-${index}`}
                            type="time"
                            value={orario.aperturaPomeriggio || ""}
                            onChange={(e) => handleChange(index, "aperturaPomeriggio", e.target.value)}
                            disabled={orario.orarioContinuato}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`chiusuraPomeriggio-${index}`}>Chiusura Pomeriggio</Label>
                          <Input
                            id={`chiusuraPomeriggio-${index}`}
                            type="time"
                            value={orario.chiusuraPomeriggio || ""}
                            onChange={(e) => handleChange(index, "chiusuraPomeriggio", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`orarioContinuato-${index}`}
                            checked={orario.orarioContinuato}
                            onCheckedChange={(checked) => handleChange(index, "orarioContinuato", checked)}
                          />
                          <Label htmlFor={`orarioContinuato-${index}`}>Orario Continuato</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`turnoNotturno-${index}`}
                            checked={orario.turnoNotturno}
                            onCheckedChange={(checked) => handleChange(index, "turnoNotturno", checked)}
                          />
                          <Label htmlFor={`turnoNotturno-${index}`}>Turno Notturno (24h)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`servizioUrgenze-${index}`}
                            checked={orario.servizioUrgenze}
                            onCheckedChange={(checked) => handleChange(index, "servizioUrgenze", checked)}
                          />
                          <Label htmlFor={`servizioUrgenze-${index}`}>Servizio Urgenze</Label>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva Orari"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
        </form>
      ) : (
        <>
          {orari && orari.length > 0 ? (
            <div className="space-y-4">
              {GIORNI.map((giorno) => {
                const orario = orari.find((o) => o.giorno === giorno.key);
                if (!orario) return null;

                return (
                  <Card key={giorno.key}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{giorno.label}</span>
                        {orario.chiuso && (
                          <span className="text-sm font-normal text-red-600 bg-red-50 px-3 py-1 rounded-full">
                            Chiuso
                          </span>
                        )}
                        {orario.turnoNotturno && (
                          <span className="text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            24h
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    {!orario.chiuso && (
                      <CardContent>
                        <div className="space-y-2">
                          {orario.orarioContinuato ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>
                                {orario.aperturaMattina} - {orario.chiusuraPomeriggio}
                              </span>
                              <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                                Orario Continuato
                              </span>
                            </div>
                          ) : (
                            <>
                              {orario.aperturaMattina && orario.chiusuraMattina && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span>Mattina: {orario.aperturaMattina} - {orario.chiusuraMattina}</span>
                                </div>
                              )}
                              {orario.aperturaPomeriggio && orario.chiusuraPomeriggio && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span>Pomeriggio: {orario.aperturaPomeriggio} - {orario.chiusuraPomeriggio}</span>
                                </div>
                              )}
                            </>
                          )}
                          {orario.servizioUrgenze && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span>Servizio Urgenze Attivo</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600 mb-4">Nessun orario configurato</p>
                <Button onClick={handleEdit}>Configura Orari</Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
