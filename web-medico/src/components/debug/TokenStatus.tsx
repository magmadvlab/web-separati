"use client";

import { useEffect, useState } from "react";
import { getTokenInfo, formatTimeRemaining } from "@/lib/token-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

/**
 * Componente per visualizzare lo stato dei token (solo in sviluppo)
 */
export function TokenStatus() {
  const [tokenInfo, setTokenInfo] = useState(getTokenInfo());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostra solo in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    setIsVisible(true);

    // Aggiorna ogni 10 secondi
    const interval = setInterval(() => {
      setTokenInfo(getTokenInfo());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { accessToken, refreshToken } = tokenInfo;

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Stato Token (Debug)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Access Token</span>
            <Badge variant={accessToken.isValid ? "default" : "destructive"}>
              {accessToken.isValid ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {accessToken.isValid ? "Valido" : "Scaduto"}
            </Badge>
          </div>
          {accessToken.isValid && (
            <div className="text-xs text-muted-foreground pl-4">
              <div>Scade tra: {formatTimeRemaining(accessToken.expiresIn)}</div>
              {accessToken.expiresAt && (
                <div>Scade il: {accessToken.expiresAt.toLocaleString()}</div>
              )}
              {accessToken.isExpiringSoon && (
                <div className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Sta per scadere!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Refresh Token</span>
            <Badge variant={refreshToken.isValid ? "default" : "destructive"}>
              {refreshToken.isValid ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {refreshToken.isValid ? "Valido" : "Scaduto"}
            </Badge>
          </div>
          {refreshToken.isValid && (
            <div className="text-xs text-muted-foreground pl-4">
              <div>Scade tra: {formatTimeRemaining(refreshToken.expiresIn)}</div>
              {refreshToken.expiresAt && (
                <div>Scade il: {refreshToken.expiresAt.toLocaleString()}</div>
              )}
            </div>
          )}
        </div>

        {!accessToken.isValid && !refreshToken.isValid && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-2">
            ⚠️ Entrambi i token sono scaduti. Effettua il login.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

