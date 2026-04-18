"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { SPECIALIZZAZIONI_SPECIALISTI } from "@/lib/specializzazioni";

const registerSchema = z.object({
  username: z.string().min(3, "Username deve essere di almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
  ruolo: z.enum(["paziente", "medico", "specialista", "farmacista", "rider"], {
    required_error: "Seleziona un ruolo",
  }),
  // Dati comuni
  nome: z.string().optional(),
  cognome: z.string().optional(),
  // Dati paziente
  codiceFiscale: z.string().optional(),
  dataNascita: z.string().optional(),
  telefono: z.string().optional(),
  indirizzo: z.string().optional(),
  citta: z.string().optional(),
  cap: z.string().optional(),
  provincia: z.string().optional(),
  // Dati medico
  codiceRegionale: z.string().optional(),
  specializzazione: z.string().optional(),
  // Dati farmacista
  partitaIva: z.string().optional(),
}).refine((data) => {
  if (data.ruolo === "paziente") {
    if (!data.codiceFiscale) return false;
    if (!data.nome) return false;
    if (!data.cognome) return false;
    if (!data.dataNascita) return false;
  }
  if (data.ruolo === "medico") {
    if (!data.codiceRegionale) return false;
    if (!data.nome) return false;
    if (!data.cognome) return false;
  }
  if (data.ruolo === "specialista") {
    if (!data.nome) return false;
    if (!data.cognome) return false;
    if (!data.specializzazione) return false;
  }
  if (data.ruolo === "farmacista" && !data.partitaIva) {
    return false;
  }
  return true;
}, {
  message: "Campi richiesti mancanti per questo ruolo",
  path: ["codiceFiscale"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      ruolo: undefined,
      nome: "",
      cognome: "",
      codiceFiscale: "",
      dataNascita: "",
      telefono: "",
      indirizzo: "",
      citta: "",
      cap: "",
      provincia: "",
      codiceRegionale: "",
      specializzazione: "",
      partitaIva: "",
    },
  });

  const selectedRole = form.watch("ruolo");

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      await register(data);
      
      toast({
        title: "Registrazione completata",
        description: "Account creato con successo",
      });

      // Redirect based on role
      if (data.ruolo === "paziente") {
        router.push("/onboarding");
      } else if (data.ruolo === "medico") {
        router.push("/specialista/dashboard");
      } else if (data.ruolo === "specialista") {
        router.push("/specialista/dashboard");
      } else if (data.ruolo === "farmacista") {
        router.push("/farmacia/dashboard");
      } else if (data.ruolo === "rider") {
        router.push("/delivery/dashboard");
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Errore durante la registrazione";
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Registrazione</CardTitle>
          <CardDescription>
            Crea un nuovo account RicettaZero
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="mario_rossi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="mario.rossi@example.com" {...field} />
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ruolo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ruolo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un ruolo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      <SelectItem value="paziente">Paziente</SelectItem>
                      <SelectItem value="medico">Medico</SelectItem>
                      <SelectItem value="specialista">Specialista</SelectItem>
                      <SelectItem value="farmacista">Farmacista</SelectItem>
                        <SelectItem value="rider">Rider</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleziona il tuo ruolo nel sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === "paziente" && (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Mario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cognome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input placeholder="Rossi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codiceFiscale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Fiscale</FormLabel>
                        <FormControl>
                          <Input placeholder="RSSMRA80A01H501U" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dataNascita"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data di Nascita</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="+39 123 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="indirizzo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indirizzo (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="Via Roma 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="citta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Città (opzionale)</FormLabel>
                          <FormControl>
                            <Input placeholder="Roma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAP (opzionale)</FormLabel>
                          <FormControl>
                            <Input placeholder="00100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="provincia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provincia (opzionale)</FormLabel>
                          <FormControl>
                            <Input placeholder="RM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {selectedRole === "medico" && (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Giuseppe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cognome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input placeholder="Verdi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codiceRegionale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Regionale</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specializzazione"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specializzazione (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="Medicina Generale" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="+39 123 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedRole === "specialista" && (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Giuseppe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cognome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input placeholder="Verdi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specializzazione"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specializzazione</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona una specializzazione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SPECIALIZZAZIONI_SPECIALISTI.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="+39 123 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedRole === "farmacista" && (
                <FormField
                  control={form.control}
                  name="partitaIva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partita IVA</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678901" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrazione in corso..." : "Registrati"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Hai già un account? </span>
            <Link href="/login" className="text-primary hover:underline">
              Accedi
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
