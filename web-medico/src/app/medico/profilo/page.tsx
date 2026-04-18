"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse, Medico } from "@/types/api";
import { User, Mail, Phone, MapPin, Briefcase } from "lucide-react";

export default function MedicoProfiloPage() {
  const { data: profile, isLoading } = useQuery<Medico>({
    queryKey: ["medico-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Medico>>("/medico/profile");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profilo</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Personali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Nome Completo</p>
              <p className="font-medium">{profile?.nome} {profile?.cognome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Specializzazione</p>
              <p className="font-medium">{profile?.specializzazione || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile?.emailProfessionale || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Telefono</p>
              <p className="font-medium">{profile?.telefono || "N/A"}</p>
            </div>
          </div>
          {profile?.indirizzoStudio && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Indirizzo Studio</p>
                <p className="font-medium">{profile.indirizzoStudio}, {profile.citta}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

