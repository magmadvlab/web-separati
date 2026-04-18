"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Paperclip, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  contenuto: string;
  tipoMessaggio: string;
  stato: string;
  dataInvio: string;
  dataLettura?: string;
  mittente: "paziente" | "medico";
}

interface ChatWindowProps {
  medicoId: number;
  medicoNome?: string;
  medicoCognome?: string;
  orariReperibilita?: string;
}

export function ChatWindow({ medicoId, medicoNome, medicoCognome, orariReperibilita }: ChatWindowProps) {
  const [messaggio, setMessaggio] = useState("");
  const [tipoMessaggio, setTipoMessaggio] = useState("GENERICO");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  // Carica conversazione
  const { data: conversazione, isLoading } = useQuery({
    queryKey: ["messaggistica", "conversazione", medicoId],
    queryFn: async () => {
      const response = await api.get(`/messaggistica/conversazione/${medicoId}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh ogni 30 secondi
  });

  // Invia messaggio
  const inviaMessaggioMutation = useMutation({
    mutationFn: async (data: { contenuto: string; tipoMessaggio: string }) => {
      const response = await api.post("/messaggistica/invia", {
        medicoId,
        contenuto: data.contenuto,
        tipoMessaggio: data.tipoMessaggio,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messaggistica", "conversazione", medicoId] });
      setMessaggio("");
      toast({
        title: "Messaggio inviato",
        description: "Il messaggio è stato inviato al medico.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nell'invio del messaggio",
        variant: "destructive",
      });
    },
  });

  const handleInvia = () => {
    if (!messaggio.trim()) return;
    inviaMessaggioMutation.mutate({ contenuto: messaggio, tipoMessaggio });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversazione]);

  const messaggi: Message[] = conversazione?.messaggi || [];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Chat con Dott. {medicoNome} {medicoCognome}
            </CardTitle>
            {orariReperibilita && (
              <p className="text-sm text-gray-500 mt-1">
                <Clock className="inline w-4 h-4 mr-1" />
                {orariReperibilita}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Banner Legale */}
      <Alert className="m-4 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-sm text-yellow-800">
          <strong>Importante:</strong> Non utilizzare questa chat per urgenze mediche. 
          In caso di emergenza, chiamare il 118 o recarsi al pronto soccorso.
        </AlertDescription>
      </Alert>

      {/* Lista Messaggi */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Caricamento messaggi...</div>
        ) : messaggi.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nessun messaggio. Inizia la conversazione!
          </div>
        ) : (
          messaggi.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.mittente === "paziente" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.mittente === "paziente"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.contenuto}</p>
                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span>{new Date(msg.dataInvio).toLocaleString("it-IT")}</span>
                  {msg.mittente === "paziente" && (
                    <span className="ml-2">
                      {msg.stato === "LETTO" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Messaggio */}
      <CardContent className="border-t p-4">
        <div className="space-y-2">
          <select
            value={tipoMessaggio}
            onChange={(e) => setTipoMessaggio(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="GENERICO">Messaggio Generico</option>
            <option value="RICHIESTA_RINNOVO">Richiesta Rinnovo</option>
            <option value="CHIARIMENTO">Chiarimento</option>
            <option value="CAMBIO_TERAPIA">Cambio Terapia</option>
          </select>
          <div className="flex gap-2">
            <Textarea
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-1"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInvia();
                }
              }}
            />
            <Button
              onClick={handleInvia}
              disabled={!messaggio.trim() || inviaMessaggioMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


