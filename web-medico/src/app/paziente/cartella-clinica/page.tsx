"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiarioSalute } from "@/components/paziente/cartella-clinica/DiarioSalute";
import { StatiSalute } from "@/components/paziente/cartella-clinica/StatiSalute";
import { Misurazioni } from "@/components/paziente/cartella-clinica/Misurazioni";
import { DocumentiCompleti } from "@/components/paziente/cartella-clinica/DocumentiCompleti";
import { UploadDocumento } from "@/components/paziente/cartella-clinica/UploadDocumento";
import { Permessi } from "@/components/paziente/cartella-clinica/Permessi";
import { ReportExport } from "@/components/paziente/cartella-clinica/ReportExport";
import { AuditLog } from "@/components/paziente/cartella-clinica/AuditLog";
import MedicoBase from "@/components/paziente/MedicoBase";
import VerificaSicurezzaMedico from "@/components/paziente/VerificaSicurezzaMedico";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cartellaClinicaApi } from "@/lib/api-cartella-clinica";
import { ClipboardCheck, BookOpen, Activity, Ruler, FileText, Shield, FileDown, History, UserCheck } from "lucide-react";

export default function CartellaClinicaPage() {
  const queryClient = useQueryClient();
  // Carica statistiche per dashboard
  const { data: diarioEntries } = useQuery({
    queryKey: ["cartella-clinica-diario"],
    queryFn: () => cartellaClinicaApi.getDiarioEntries({ limit: 5 }),
  });

  const { data: statiSalute } = useQuery({
    queryKey: ["cartella-clinica-stati-salute"],
    queryFn: () => cartellaClinicaApi.getStatiSalute(),
  });

  const { data: documenti } = useQuery({
    queryKey: ["cartella-clinica-documenti"],
    queryFn: () => cartellaClinicaApi.getDocumenti(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Cartella Clinica
        </h1>
        <p className="text-gray-600 mt-2">
          Gestisci la tua cartella clinica personale: diario salute, misurazioni, documenti e molto altro
        </p>
      </div>

      {/* Dashboard Riepilogativa */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voci Diario</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diarioEntries?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Voci registrate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stati Salute</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statiSalute?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Stati registrati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documenti</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documenti?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Documenti caricati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permessi Attivi</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Medici autorizzati</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs per Sezioni */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="diario" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="diario" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Diario</span>
              </TabsTrigger>
              <TabsTrigger value="stati" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Stati Salute</span>
              </TabsTrigger>
              <TabsTrigger value="misurazioni" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <span className="hidden sm:inline">Misurazioni</span>
              </TabsTrigger>
              <TabsTrigger value="documenti" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documenti</span>
              </TabsTrigger>
              <TabsTrigger value="medico-base" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Medico Base</span>
              </TabsTrigger>
              <TabsTrigger value="permessi" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Permessi</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Report</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Audit</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diario" className="mt-6">
              <DiarioSalute />
            </TabsContent>

            <TabsContent value="stati" className="mt-6">
              <StatiSalute />
            </TabsContent>

            <TabsContent value="misurazioni" className="mt-6">
              <Misurazioni />
            </TabsContent>

            <TabsContent value="documenti" className="mt-6">
              <div className="space-y-6">
                <UploadDocumento 
                  onUploadSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["cartella-clinica-documenti"] });
                    queryClient.invalidateQueries({ queryKey: ["cartella-clinica-documenti-completi"] });
                  }}
                />
                <DocumentiCompleti />
              </div>
            </TabsContent>

            <TabsContent value="medico-base" className="mt-6">
              <div className="space-y-6">
                <MedicoBase />
                <VerificaSicurezzaMedico />
              </div>
            </TabsContent>

            <TabsContent value="permessi" className="mt-6">
              <Permessi />
            </TabsContent>

            <TabsContent value="report" className="mt-6">
              <ReportExport />
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <AuditLog />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


