"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWindow } from "@/components/messaggistica/ChatWindow";
import { Loading } from "@/components/shared/Loading";
import { MessageSquare, User } from "lucide-react";
import { useState } from "react";

export default function MessaggiPage() {
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);

  // Carica messaggi del paziente
  const { data: messaggiData, isLoading } = useQuery({
    queryKey: ["messaggistica", "messaggi"],
    queryFn: async () => {
      const response = await api.get("/paziente/messaggi");
      return response.data;
    },
  });

  // Estrai lista medici unici dai messaggi
  const medici = messaggiData?.messaggi?.reduce((acc: any[], msg: any) => {
    const medicoId = msg.medico?.id;
    if (medicoId && !acc.find(m => m.id === medicoId)) {
      acc.push({
        id: medicoId,
        nome: msg.medico.nome,
        cognome: msg.medico.cognome,
        specializzazione: msg.medico.specializzazione,
        ultimoMessaggio: msg.contenutoCriptato?.substring(0, 50),
      });
    }
    return acc;
  }, []) || [];

  if (isLoading) {
    return <Loading />;
  }

  const medicoSelezionato = medici?.find((m: any) => m.id === selectedMedicoId);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messaggi</h1>
        <p className="text-gray-600 mt-2">Comunica con i tuoi medici in modo sicuro</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista Medici */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Medici
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medici && medici.length > 0 ? (
              <div className="space-y-2">
                {medici.map((medico: any) => (
                  <button
                    key={medico.id}
                    onClick={() => setSelectedMedicoId(medico.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMedicoId === medico.id
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          Dott. {medico.nome} {medico.cognome}
                        </p>
                        {medico.ultimoMessaggio && (
                          <p className="text-sm text-gray-500 truncate">
                            {medico.ultimoMessaggio}
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
          {selectedMedicoId ? (
            <ChatWindow
              medicoId={selectedMedicoId}
              medicoNome={medicoSelezionato?.nome}
              medicoCognome={medicoSelezionato?.cognome}
              orariReperibilita={medicoSelezionato?.orariReperibilita}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Seleziona un medico per iniziare la conversazione</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


