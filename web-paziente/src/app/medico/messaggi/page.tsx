"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWindow } from "@/components/messaggistica/ChatWindow";
import { Loading } from "@/components/shared/Loading";
import { MessageSquare, User } from "lucide-react";
import { useState } from "react";

export default function MedicoMessaggiPage() {
  const [selectedPazienteId, setSelectedPazienteId] = useState<number | null>(null);

  // Carica lista pazienti con cui il medico ha conversazioni
  const { data: pazienti, isLoading } = useQuery({
    queryKey: ["messaggistica", "pazienti"],
    queryFn: async () => {
      const response = await api.get("/messaggistica/pazienti");
      return response.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const pazienteSelezionato = pazienti?.find((p: any) => p.id === selectedPazienteId);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messaggi</h1>
        <p className="text-gray-600 mt-2">Comunica con i tuoi pazienti</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Pazienti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Pazienti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pazienti && pazienti.length > 0 ? (
              <div className="space-y-2">
                {pazienti.map((paziente: any) => (
                  <button
                    key={paziente.id}
                    onClick={() => setSelectedPazienteId(paziente.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPazienteId === paziente.id
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {paziente.nome} {paziente.cognome}
                        </p>
                        {paziente.ultimoMessaggio && (
                          <p className="text-sm text-gray-500 truncate">
                            {paziente.ultimoMessaggio}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nessuna conversazione disponibile
              </p>
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedPazienteId ? (
            <ChatWindow
              medicoId={0} // Per il medico, passiamo pazienteId invece
              medicoNome={pazienteSelezionato?.nome}
              medicoCognome={pazienteSelezionato?.cognome}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Seleziona un paziente per iniziare la conversazione</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


