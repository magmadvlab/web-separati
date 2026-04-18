"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, ProssimaAssunzione } from "@/types/api";
import { Clock, Pill, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProssimeAssunzioniCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: assunzioni, isLoading } = useQuery<ProssimaAssunzione[]>({
    queryKey: ["paziente-assunzioni-prossime"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProssimaAssunzione[]>>(
        "/paziente/assunzioni-programmate"
      );
      return response.data.data;
    },
  });

  const registraAssunzioneMutation = useMutation({
    mutationFn: async (assunzione: ProssimaAssunzione) => {
      const response = await api.post<ApiResponse<any>>("/paziente/assunzioni", {
        terapiaId: assunzione.terapiaId,
        dataOraProgrammata: assunzione.dataOraProgrammata,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-assunzioni-prossime"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-terapie-reminder"] });
      toast({
        title: "Assunzione registrata",
        description: "L'assunzione è stata registrata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prossime Assunzioni</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  const assunzioniOggi = assunzioni?.filter((a) => {
    const data = new Date(a.dataOraProgrammata);
    const oggi = new Date();
    return (
      data.getDate() === oggi.getDate() &&
      data.getMonth() === oggi.getMonth() &&
      data.getFullYear() === oggi.getFullYear()
    );
  }) || [];

  const assunzioniProssime = assunzioni?.slice(0, 5) || [];

  const formatOrario = (dataOra: string) => {
    const data = new Date(dataOra);
    return data.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatData = (dataOra: string) => {
    const data = new Date(dataOra);
    const oggi = new Date();
    const domani = new Date(oggi);
    domani.setDate(domani.getDate() + 1);

    if (
      data.getDate() === oggi.getDate() &&
      data.getMonth() === oggi.getMonth() &&
      data.getFullYear() === oggi.getFullYear()
    ) {
      return "Oggi";
    } else if (
      data.getDate() === domani.getDate() &&
      data.getMonth() === domani.getMonth() &&
      data.getFullYear() === domani.getFullYear()
    ) {
      return "Domani";
    } else {
      return data.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const isOggi = (dataOra: string) => {
    const data = new Date(dataOra);
    const oggi = new Date();
    return (
      data.getDate() === oggi.getDate() &&
      data.getMonth() === oggi.getMonth() &&
      data.getFullYear() === oggi.getFullYear()
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Prossime Assunzioni</CardTitle>
          {assunzioniOggi.length > 0 && (
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              {assunzioniOggi.length} oggi
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {assunzioniProssime.length > 0 ? (
          <div className="space-y-3">
            {assunzioniProssime.map((assunzione, index) => (
              <div
                key={index}
                className={`flex items-start justify-between p-3 rounded-lg border ${
                  isOggi(assunzione.dataOraProgrammata)
                    ? "bg-orange-50 border-orange-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded-full ${
                      isOggi(assunzione.dataOraProgrammata)
                        ? "bg-orange-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Pill
                      className={`h-4 w-4 ${
                        isOggi(assunzione.dataOraProgrammata)
                          ? "text-orange-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {assunzione.terapia?.farmaco?.nomeCommerciale ||
                          "Farmaco"}
                      </p>
                      {assunzione.giaAssunta && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatOrario(assunzione.dataOraProgrammata)}</span>
                      </div>
                      <span>•</span>
                      <span>{formatData(assunzione.dataOraProgrammata)}</span>
                      {assunzione.terapia?.conPasto && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">Con pasto</span>
                        </>
                      )}
                    </div>
                    {assunzione.terapia?.posologia && (
                      <p className="text-xs text-gray-500 mt-1">
                        {assunzione.terapia.posologia}
                      </p>
                    )}
                  </div>
                </div>
                {!assunzione.giaAssunta && isOggi(assunzione.dataOraProgrammata) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => {
                      registraAssunzioneMutation.mutate(assunzione);
                    }}
                    disabled={registraAssunzioneMutation.isPending}
                  >
                    {registraAssunzioneMutation.isPending ? "Registrando..." : "Segna"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-4">
            Nessuna assunzione programmata per i prossimi giorni
          </p>
        )}
      </CardContent>
    </Card>
  );
}

