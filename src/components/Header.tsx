import React from 'react';
import { Shirt, LogOut, Cloud, Download, Instagram, RefreshCw, Smartphone, Laptop } from 'lucide-react';

interface HeaderProps {
  userEmail: string;
  onLogout: () => void;
  onOpenYoniModal: () => void;
  isYoniUnlocked: boolean;
  installPrompt: any;
  onInstallApp: () => void;
  onOpenSyncModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onLogout,
  onOpenYoniModal,
  isYoniUnlocked,
  installPrompt,
  onInstallApp,
  onOpenSyncModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SmartWardrobe Pro
              </span>
              <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                IA Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Por{' '}
              <button
                onClick={onOpenYoniModal}
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Yoni Mikel</span>
                <span className="text-[10px] text-pink-400">@yonimikel</span>
              </button>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Direct Sync Button (Mobile <-> PC) */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition shadow-sm cursor-pointer"
            title="Sincronizar entre Móvil y PC"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <RefreshCw className="w-3 h-3 text-indigo-300" />
            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Sincronizar PC</span>
          </button>

          {/* Creator Support Button */}
          <button
            onClick={onOpenYoniModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              isYoniUnlocked
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30 hover:border-pink-500/50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-pink-600/20 animate-pulse'
            }`}
            title="Seguir a @yonimikel"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-300" />
            <span className="hidden sm:inline">
              {isYoniUnlocked ? 'VIP @yonimikel ✓' : 'Seguir @yonimikel'}
            </span>
          </button>

          {/* PWA Install Button */}
          {installPrompt && (
            <button
              onClick={onInstallApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition shadow-sm cursor-pointer"
              title="Instalar App en el dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar PWA</span>
            </button>
          )}

          {/* Cloud Status Pill */}
          <button
            onClick={onOpenSyncModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            title="Estado de la Nube"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nube Activa</span>
          </button>

          {/* User Info */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-xs font-medium text-slate-300 max-w-[120px] truncate" title={userEmail}>
              {userEmail}
            </span>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
