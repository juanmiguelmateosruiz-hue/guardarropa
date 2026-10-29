import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Copy,
  Check,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { GarmentItem, SavedOutfit } from '../types/wardrobe';
import { generateSyncCode, claimSyncCode, syncVaultWithServer } from '../utils/api';
import { saveCachedWardrobe, saveCachedOutfits } from '../utils/cloudSync';

interface SyncDevicesModalProps {
  userEmail: string;
  wardrobe: GarmentItem[];
  outfits: SavedOutfit[];
  onClose: () => void;
  onSyncCompleted: (items: GarmentItem[], outfits: SavedOutfit[]) => void;
}

export const SyncDevicesModal: React.FC<SyncDevicesModalProps> = ({
  userEmail,
  wardrobe,
  outfits,
  onClose,
  onSyncCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'send' | 'receive'>('status');
  const [isSyncing, setIsSyncing] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 1. Trigger Full Force Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      const res = await syncVaultWithServer(userEmail, wardrobe, outfits);
      if (res && res.wardrobe) {
        saveCachedWardrobe(userEmail, res.wardrobe);
        saveCachedOutfits(userEmail, res.outfits);
        onSyncCompleted(res.wardrobe, res.outfits);
        setFeedbackMsg({
          text: `¡Bóveda sincronizada con éxito! ${res.wardrobe.length} prendas guardadas en el servidor.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: 'Error al sincronizar: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Generate 6-digit PIN to transfer from this device
  const handleGeneratePin = async () => {
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      const pin = await generateSyncCode(userEmail, wardrobe, outfits);
      setGeneratedPin(pin);
      setActiveTab('send');
    } catch (err: any) {
      setFeedbackMsg({ text: 'Error al generar código: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Claim 6-digit PIN on this device (e.g. on PC)
  const handleClaimPin = async () => {
    if (!inputPin.trim()) return;
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      const data = await claimSyncCode(inputPin.trim());
      if (data && data.items) {
        saveCachedWardrobe(data.email || userEmail, data.items);
        if (data.outfits) saveCachedOutfits(data.email || userEmail, data.outfits);
        onSyncCompleted(data.items, data.outfits || []);
        setFeedbackMsg({
          text: `¡Éxito total! Se han importado ${data.items.length} prendas desde tu otro dispositivo.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Código inválido o expirado.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sincronización Móvil ⟷ PC</h3>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'status' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nube Activa
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'send' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Generar PIN
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'receive' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Introducir PIN
          </button>
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* TAB 1: Status & Force Sync */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Prendas en este dispositivo:</span>
                <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {wardrobe.length} prendas
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Looks en Lookbook:</span>
                <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {outfits.length} looks
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Base de datos en la nube siempre disponible</span>
              </div>
            </div>

            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando con Servidor...' : 'Forzar Sincronización con Servidor'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: Generate PIN (e.g. from Mobile) */}
        {activeTab === 'send' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">
              Genera un código PIN de 6 dígitos para transferir al instante todo tu armario a tu ordenador.
            </p>

            {generatedPin ? (
              <div className="p-5 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                  Código de Sincronización
                </span>
                <div className="text-3xl font-black text-white tracking-widest font-mono py-1">
                  {generatedPin}
                </div>
                <p className="text-[10px] text-slate-400">Válido durante 15 minutos en cualquier dispositivo</p>
                <button
                  onClick={() => copyToClipboard(generatedPin)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold transition cursor-pointer"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPin ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGeneratePin}
                disabled={isSyncing}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSyncing ? 'Generando PIN...' : 'Crear Código PIN de Transferencia'}</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: Claim PIN (e.g. on PC) */}
        {activeTab === 'receive' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Introduce el PIN de 6 dígitos generado en tu móvil para importar inmediatamente todas tus prendas en este ordenador.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ejemplo: 481920"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleClaimPin}
              disabled={isSyncing || inputPin.length < 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Importando Prendas...' : 'Vincular e Importar Armario'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
