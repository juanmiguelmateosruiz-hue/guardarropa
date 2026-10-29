import React from 'react';
import { Instagram, Sparkles, CheckCircle2, Heart, X, ExternalLink, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface YoniMikelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
}

export const YoniMikelModal: React.FC<YoniMikelModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlock,
}) => {
  if (!isOpen) return null;

  const handleFollowAction = () => {
    // Open Instagram profile
    window.open('https://instagram.com/yonimikel', '_blank', 'noopener,noreferrer');

    // Trigger celebration unlock
    onUnlock();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e1306c', '#fd1d1d', '#f56040', '#405de6', '#5851db'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Creator Avatar & Instagram badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-1 shadow-xl mx-auto">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-black">
              YM
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-purple-600 to-pink-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900">
            <Instagram className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-pink-400" />
            <span>Creador Oficial</span>
          </div>
          <h3 className="text-xl font-black text-white">Yoni Mikel</h3>
          <p className="text-sm font-semibold text-pink-400">@yonimikel</p>
        </div>

        {/* Bio / Message */}
        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
          ¡Gracias por usar <strong>SmartWardrobe Pro</strong>! Para apoyar el desarrollo continuo y desbloquear el <strong>Guardado Ilimitado de Outfits en tu Lookbook permanente</strong>, sigue la cuenta oficial del creador en Instagram.
        </p>

        {/* Perks Box */}
        <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Guardado ilimitado de estilismos y looks en la nube</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Consejos exclusivos de moda y combinaciones IA</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Soporte directo de la comunidad @yonimikel</span>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleFollowAction}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all cursor-pointer active:scale-95"
          >
            <Instagram className="w-4 h-4" />
            <span>{isUnlocked ? 'Visitar Instagram @yonimikel' : 'Seguir @yonimikel y Desbloquear'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isUnlocked ? (
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>¡VIP Desbloqueado! Tienes acceso ilimitado a Lookbook.</span>
            </p>
          ) : (
            <button
              onClick={onUnlock}
              className="text-[11px] text-slate-400 hover:text-slate-300 underline"
            >
              Ya le sigo, activar desbloqueo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
