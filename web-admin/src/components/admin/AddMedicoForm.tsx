"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddMedicoFormProps {
  cittaId: number;
  onSuccess: () => void;
}

export function AddMedicoForm({ cittaId, onSuccess }: AddMedicoFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    codiceRegionale: "",
    tipoMedico: "medico_base" as "medico_base" | "pediatra",
    specializzazione: "",
    indirizzoStudio: "",
    cap: "",
    provincia: "",
    etaMinimaAnni: "",
    etaMassimaAnni: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        etaMinimaAnni: data.etaMinimaAnni ? parseInt(data.etaMinimaAnni) : undefined,
        etaMassimaAnni: data.etaMassimaAnni ? parseInt(data.etaMassimaAnni) : undefined,
      };
      const response = await api.post(`/admin/citta/${cittaId}/medici`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Medico aggiunto con successo!");
      queryClient.invalidateQueries({ queryKey: ["admin-servizi-citta", cittaId] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Errore durante l'aggiunta del medico");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const isPediatra = formData.tipoMedico === "pediatra";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        {/* Cognome */}
        <div className="space-y-2">
          <Label htmlFor="cognome">Cognome *</Label>
          <Input
            id="cognome"
            value={formData.cognome}
            onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        {/* Telefono */}
        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
        </div>

        {/* Codice Regionale */}
        <div className="space-y-2">
          <Label htmlFor="codiceRegionale">Codice Regionale *</Label>
          <Input
            id="codiceRegionale"
            value={formData.codiceRegionale}
            onChange={(e) => setFormData({ ...formData, codiceRegionale: e.target.value })}
            required
          />
        </div>

        {/* Tipo Medico */}
        <div className="space-y-2">
          <Label htmlFor="tipoMedico">Tipo Medico *</Label>
          <Select
            value={formData.tipoMedico}
            onValueChange={(value: "medico_base" | "pediatra") =>
              setFormData({ ...formData, tipoMedico: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medico_base">Medico di Base</SelectItem>
              <SelectItem value="pediatra">Pediatra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Specializzazione */}
        <div className="space-y-2">
          <Label htmlFor="specializzazione">Specializzazione</Label>
          <Input
            id="specializzazione"
            value={formData.specializzazione}
            onChange={(e) => setFormData({ ...formData, specializzazione: e.target.value })}
          />
        </div>

        {/* Indirizzo Studio */}
        <div className="space-y-2">
          <Label htmlFor="indirizzoStudio">Indirizzo Studio</Label>
          <Input
            id="indirizzoStudio"
            value={formData.indirizzoStudio}
            onChange={(e) => setFormData({ ...formData, indirizzoStudio: e.target.value })}
          />
        </div>

        {/* CAP */}
        <div className="space-y-2">
          <Label htmlFor="cap">CAP *</Label>
          <Input
            id="cap"
            value={formData.cap}
            onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
            required
          />
        </div>

        {/* Provincia */}
        <div className="space-y-2">
          <Label htmlFor="provincia">Provincia *</Label>
          <Input
            id="provincia"
            maxLength={2}
            value={formData.provincia}
            onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
            required
          />
        </div>

        {/* Età Minima (solo per pediatra) */}
        {isPediatra && (
          <div className="space-y-2">
            <Label htmlFor="etaMinimaAnni">Età Minima (anni)</Label>
            <Input
              id="etaMinimaAnni"
              type="number"
              min="0"
              value={formData.etaMinimaAnni}
              onChange={(e) => setFormData({ ...formData, etaMinimaAnni: e.target.value })}
              placeholder="es. 0"
            />
          </div>
        )}

        {/* Età Massima (solo per pediatra) */}
        {isPediatra && (
          <div className="space-y-2">
            <Label htmlFor="etaMassimaAnni">Età Massima (anni)</Label>
            <Input
              id="etaMassimaAnni"
              type="number"
              min="0"
              value={formData.etaMassimaAnni}
              onChange={(e) => setFormData({ ...formData, etaMassimaAnni: e.target.value })}
              placeholder="es. 16"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p>
          <strong>Nota:</strong> Verrà creato automaticamente un account utente con username derivato
          dall&apos;email. Una password temporanea sicura sarà inviata via email al medico al primo accesso.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aggiungi Medico
        </Button>
      </div>
    </form>
  );
}
