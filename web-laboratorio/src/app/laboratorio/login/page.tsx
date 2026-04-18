"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Building2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LaboratorioLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"apiKey" | "email">("apiKey");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { apiKey?: string; email?: string; password?: string }) => {
      const response = await api.post<{ success: boolean; token: string; laboratorio: any }>(
        "/laboratori/dashboard/login",
        credentials
      );
      // L'API restituisce direttamente { success, token, laboratorio }
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.token);
      toast({
        title: "Login effettuato",
        description: `Benvenuto, ${data.laboratorio.nome}`,
      });
      router.push("/laboratorio/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Credenziali non valide",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === "apiKey") {
      if (!apiKey) {
        toast({
          title: "Errore",
          description: "Inserisci l'API Key",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({ apiKey });
    } else {
      if (!email || !password) {
        toast({
          title: "Errore",
          description: "Inserisci email e password",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Login Dashboard Laboratorio
            </CardTitle>
            <CardDescription className="mt-2">Accedi alla dashboard del tuo laboratorio</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-2 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                variant={loginType === "apiKey" ? "default" : "outline"}
                onClick={() => setLoginType("apiKey")}
                className="w-full hover-lift"
              >
                <Key className="h-4 w-4 mr-2" />
                API Key
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                variant={loginType === "email" ? "default" : "outline"}
                onClick={() => setLoginType("email")}
                className="w-full hover-lift"
              >
                Email
              </Button>
            </motion.div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {loginType === "apiKey" ? (
                <motion.div
                  key="apiKey"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="Inserisci la tua API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                </div>
                </motion.div>
              ) : (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="email@laboratorio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button type="submit" className="w-full hover-lift" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? (
                    <motion.span
                      className="flex items-center justify-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Accesso...
                    </motion.span>
                  ) : (
                    "Accedi"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
