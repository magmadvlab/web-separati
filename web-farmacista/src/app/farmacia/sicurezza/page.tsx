'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface FingerprintInfo {
  hasKey: boolean;
  fingerprint: string | null;
  createdAt: string | null;
  rotatedAt: string | null;
}

interface GeneratedKeys {
  privateKey: string;
  publicKey: string;
  fingerprint: string;
  generatedAt: string;
}

export default function SicurezzaFarmaciaPage() {
  const [info, setInfo] = useState<FingerprintInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Genera chiavi
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedKeys | null>(null);
  const [copied, setCopied] = useState(false);

  // Verifica chiave
  const [pemVerifica, setPemVerifica] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Rotazione
  const [rotating, setRotating] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [rotatedKeys, setRotatedKeys] = useState<GeneratedKeys | null>(null);

  useEffect(() => {
    void loadFingerprint();
  }, []);

  const loadFingerprint = async () => {
    try {
      setLoading(true);
      const res = await api.get('/farmacia/crypto/fingerprint');
      setInfo(res.data?.data ?? res.data);
    } catch {
      setInfo({ hasKey: false, fingerprint: null, createdAt: null, rotatedAt: null });
    } finally {
      setLoading(false);
    }
  };

  const generaChiavi = async () => {
    if (!confirm('Generare una nuova coppia di chiavi RSA? La chiave privata sarà mostrata UNA SOLA VOLTA.')) return;
    try {
      setGenerating(true);
      const res = await api.post('/farmacia/crypto/genera-chiavi');
      const data: GeneratedKeys = res.data?.data ?? res.data;
      setGenerated(data);
      setRotatedKeys(null);
      await loadFingerprint();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Errore durante la generazione');
    } finally {
      setGenerating(false);
    }
  };

  const ruotaChiavi = async () => {
    try {
      setRotating(true);
      const res = await api.post('/farmacia/crypto/ruota-chiavi', { confermaRotazione: true });
      const data: GeneratedKeys = res.data?.data ?? res.data;
      setRotatedKeys(data);
      setGenerated(null);
      setShowRotateConfirm(false);
      await loadFingerprint();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Errore durante la rotazione');
    } finally {
      setRotating(false);
    }
  };

  const verificaChiave = async () => {
    if (!pemVerifica.trim()) return;
    try {
      setVerifying(true);
      setVerifyResult(null);
      const res = await api.post('/farmacia/crypto/verifica-chiave', { privateKey: pemVerifica.trim() });
      const data = res.data?.data ?? res.data;
      setVerifyResult({ valid: data.valid, message: data.message });
    } catch (err: any) {
      setVerifyResult({ valid: false, message: err?.response?.data?.message || 'Errore di verifica' });
    } finally {
      setVerifying(false);
    }
  };

  const copiaChiave = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scaricaChiave = (key: string, filename: string) => {
    const blob = new Blob([key], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeKeys = generated ?? rotatedKeys;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔐 Sicurezza — Chiavi di Cifratura</h1>
        <p className="mt-1 text-sm text-gray-500">
          Le chiavi RSA proteggono i dati sensibili dei pazienti (farmaci, prescrizioni, dati anagrafici).
          Solo la farmacia con la chiave privata può leggere questi dati.
        </p>
      </div>

      {/* Stato attuale */}
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">Stato chiave pubblica</h2>
        {info?.hasKey ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">Chiave configurata</span>
            </div>
            {info.fingerprint && (
              <div className="bg-gray-50 rounded p-3 font-mono text-xs text-gray-600 break-all">
                SHA-256: {info.fingerprint}
              </div>
            )}
            <div className="text-xs text-gray-500 space-y-0.5">
              {info.createdAt && (
                <p>Generata il: {new Date(info.createdAt).toLocaleString('it-IT')}</p>
              )}
              {info.rotatedAt && (
                <p>Ultima rotazione: {new Date(info.rotatedAt).toLocaleString('it-IT')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              Nessuna chiave configurata — i dati dei pazienti non sono leggibili
            </span>
          </div>
        )}
      </div>

      {/* Chiave appena generata/ruotata */}
      {activeKeys && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-900">SALVARE SUBITO la chiave privata</p>
              <p className="text-sm text-amber-800 mt-0.5">
                Questa è l&apos;UNICA volta che viene mostrata. Se persa, i dati cifrati non saranno più
                recuperabili. Scaricarla o copiarla adesso.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-amber-300 p-3 font-mono text-xs text-gray-700 break-all max-h-48 overflow-y-auto whitespace-pre-wrap">
            {activeKeys.privateKey}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void copiaChiave(activeKeys.privateKey)}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition"
            >
              {copied ? '✓ Copiata!' : '📋 Copia chiave privata'}
            </button>
            <button
              onClick={() => scaricaChiave(activeKeys.privateKey, `farmacia-private-${activeKeys.fingerprint.slice(0, 8)}.pem`)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
            >
              💾 Scarica .pem
            </button>
          </div>

          <p className="text-xs text-amber-700">
            Fingerprint: <span className="font-mono">{activeKeys.fingerprint.slice(0, 16)}...</span>
          </p>
        </div>
      )}

      {/* Genera chiavi (solo se non ne ha) */}
      {!info?.hasKey && !activeKeys && (
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Genera coppia di chiavi</h2>
          <p className="text-sm text-gray-600">
            Genera una nuova coppia RSA-2048. La chiave pubblica viene salvata sul server per cifrare i
            dati dei pazienti. La chiave privata viene mostrata una sola volta — salvala in un posto
            sicuro (fuori dal sistema).
          </p>
          <button
            onClick={() => void generaChiavi()}
            disabled={generating}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
          >
            {generating ? 'Generazione in corso...' : '🔑 Genera Chiavi RSA'}
          </button>
        </div>
      )}

      {/* Verifica chiave */}
      {info?.hasKey && (
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Verifica chiave privata</h2>
          <p className="text-sm text-gray-600">
            Incolla la tua chiave privata per verificare che corrisponda alla chiave pubblica salvata.
            Non viene trasmessa al server in chiaro — la verifica avviene tramite crittografia.
          </p>
          <textarea
            value={pemVerifica}
            onChange={(e) => { setPemVerifica(e.target.value); setVerifyResult(null); }}
            rows={5}
            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            className="w-full border rounded-lg p-3 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => void verificaChiave()}
            disabled={verifying || !pemVerifica.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition disabled:opacity-50"
          >
            {verifying ? 'Verifica in corso...' : 'Verifica chiave'}
          </button>
          {verifyResult && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
              verifyResult.valid
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {verifyResult.valid ? '✓' : '✗'} {verifyResult.message}
            </div>
          )}
        </div>
      )}

      {/* Rotazione chiavi */}
      {info?.hasKey && (
        <div className="bg-white rounded-xl shadow p-5 space-y-3 border border-red-100">
          <h2 className="font-semibold text-red-700">⚠️ Rotazione chiavi</h2>
          <p className="text-sm text-gray-600">
            La rotazione genera una nuova coppia e invalida quella precedente.{' '}
            <strong>I dati già cifrati con la vecchia chiave non saranno più leggibili.</strong>{' '}
            Usare solo se la chiave privata è stata compromessa.
          </p>
          {!showRotateConfirm ? (
            <button
              onClick={() => setShowRotateConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
            >
              Ruota chiavi
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">
                Sei sicuro? I dati cifrati con la vecchia chiave saranno IRRECUPERABILI.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => void ruotaChiavi()}
                  disabled={rotating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition disabled:opacity-50"
                >
                  {rotating ? 'Rotazione...' : 'Sì, ruota le chiavi'}
                </button>
                <button
                  onClick={() => setShowRotateConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
