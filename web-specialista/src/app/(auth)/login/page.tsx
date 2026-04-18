"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, isNetworkError } from "@/hooks/useErrorHandler";
import { authStorage } from "@/lib/auth-storage";
import Link from "next/link";
import { User, Stethoscope, Building2, Truck, UserCog, FlaskConical, Shield } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const roleConfig = {
  paziente: {
    title: "Portale Paziente",
    description: "Accedi per gestire le tue prescrizioni e ordini",
    icon: User,
    color: "blue",
  },
  medico: {
    title: "Portale Medico",
    description: "Accedi per gestire i tuoi pazienti e prescrizioni",
    icon: Stethoscope,
    color: "green",
  },
  farmacista: {
    title: "Portale Farmacia",
    description: "Accedi per gestire ordini e catalogo",
    icon: Building2,
    color: "purple",
  },
  rider: {
    title: "Portale Delivery",
    description: "Accedi per gestire le consegne",
    icon: Truck,
    color: "orange",
  },
  specialista: {
    title: "Portale Specialista",
    description: "Accedi per gestire consulti specialistici",
    icon: UserCog,
    color: "teal",
  },
  laboratorio: {
    title: "Portale Laboratorio",
    description: "Accedi per gestire esami e referti",
    icon: FlaskConical,
    color: "pink",
  },
  admin: {
    title: "Portale Admin",
    description: "Accedi per gestire il sistema",
    icon: Shield,
    color: "red",
  },
};

// Force dynamic rendering - no prerendering
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "laboratorio") {
      router.push("/laboratorio/login");
      return;
    }
    if (role && roleConfig[role as keyof typeof roleConfig]) {
      setSelectedRole(role);
    }
  }, [searchParams, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      await login(data);

      const token = authStorage.getAccessToken();
      if (!token) {
        console.warn("ATTENZIONE: Token non trovato dopo il login. Controllo authService.");
      }

      toast({
        title: "Login effettuato",
        description: "Accesso completato con successo",
      });

      // Get user from store immediately after login (store is updated synchronously)
      const currentUser = useAuthStore.getState().user;

      // Redirect based on role
      if (currentUser?.ruolo === "paziente") {
        router.push("/paziente/dashboard");
      } else if (currentUser?.ruolo === "medico") {
        router.push("/specialista/dashboard");
      } else if (currentUser?.ruolo === "specialista") {
        router.push("/specialista/dashboard");
      } else if (currentUser?.ruolo === "farmacista") {
        router.push("/farmacia/dashboard");
      } else if (currentUser?.ruolo === "rider") {
        router.push("/delivery/dashboard");
      } else if (currentUser?.ruolo === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/specialista/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let errorMessage = getErrorMessage(err);

      // Check for network errors
      if (isNetworkError(err)) {
        errorMessage = "Impossibile connettersi al server. Verifica che il backend sia avviato.";
      }

      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const config = selectedRole ? roleConfig[selectedRole as keyof typeof roleConfig] : null;
  const Icon = config?.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Back to home - GRANDE E VISIBILE */}
      <Link 
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all text-gray-900 font-semibold border-2 border-gray-200 hover:border-blue-500"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Vedi tutti i portali
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          {config && Icon && (
            <div className={`w-16 h-16 rounded-full bg-${config.color}-100 flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`w-8 h-8 text-${config.color}-600`} />
            </div>
          )}
          <CardTitle className="text-2xl">{config?.title || "Login"}</CardTitle>
          <CardDescription>
            {config?.description || "Accedi al tuo account RicettaZero"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="mario.rossi@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </Form>

          {!selectedRole && (
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Non hai un account? </span>
              <Link href="/register" className="text-primary hover:underline">
                Registrati
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
