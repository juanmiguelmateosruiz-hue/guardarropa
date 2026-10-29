import React from 'react';
import { Bookmark, Sparkles, Trash2, Calendar, Share2, Layers, Shirt } from 'lucide-react';
import { SavedOutfit } from '../types/wardrobe';

interface LookbookSectionProps {
  outfits: SavedOutfit[];
  onDeleteOutfit: (id: string) => void;
  onGoToGenerator: () => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({
  outfits,
  onDeleteOutfit,
  onGoToGenerator,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <span>Mi Lookbook Permanente</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold">
              {outfits.length} looks
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Combinaciones guardadas y sincronizadas en tu cuenta multi-dispositivo.
          </p>
        </div>

        <button
          onClick={onGoToGenerator}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Crear Nuevo Look</span>
        </button>
      </div>

      {/* Outfits Grid */}
      {outfits.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Tu Lookbook está vacío</h3>
          <p className="text-xs text-slate-400">
            Aún no has guardado ningún outfit. Dirígete al Generador Pro para mezclar tus prendas en el maniquí y guardarlas aquí.
          </p>
          <button
            onClick={onGoToGenerator}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Ir al Generador Pro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((outfit) => (
            <div
              key={outfit.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between transition-all"
            >
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {outfit.occasion}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">
                      {outfit.matchScore}% Armonía
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este look de tu Lookbook?')) {
                          onDeleteOutfit(outfit.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      title="Eliminar outfit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white truncate">{outfit.name}</h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(outfit.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>

              {/* Pieces Collage Preview */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80">
                {outfit.pieces.superior && (
                  <div className="relative group" title={`Superior: ${outfit.pieces.superior.title}`}>
                    <img
                      src={outfit.pieces.superior.imageUrl}
                      alt={outfit.pieces.superior.title}
                      className="w-full h-18 object-cover rounded-xl"
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[8px] font-bold text-slate-300 px-1 rounded">
                      Top
                    </span>
                  </div>
                )}
                {outfit.pieces.inferior && (
                  <div className="relative group" title={`Inferior: ${outfit.pieces.inferior.title}`}>
                    <img
                      src={outfit.pieces.inferior.imageUrl}
                      alt={outfit.pieces.inferior.title}
                      className="w-full h-18 object-cover rounded-xl"
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[8px] font-bold text-slate-300 px-1 rounded">
                      Pantalón
                    </span>
                  </div>
                )}
                {outfit.pieces.calzado ? (
                  <div className="relative group" title={`Calzado: ${outfit.pieces.calzado.title}`}>
                    <img
                      src={outfit.pieces.calzado.imageUrl}
                      alt={outfit.pieces.calzado.title}
                      className="w-full h-18 object-cover rounded-xl"
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[8px] font-bold text-slate-300 px-1 rounded">
                      Calzado
                    </span>
                  </div>
                ) : (
                  <div className="h-18 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-600">
                    -
                  </div>
                )}
                {outfit.pieces.accesorio || outfit.pieces.abrigo ? (
                  <div
                    className="relative group"
                    title={
                      outfit.pieces.abrigo
                        ? `Abrigo: ${outfit.pieces.abrigo.title}`
                        : `Accesorio: ${outfit.pieces.accesorio?.title}`
                    }
                  >
                    <img
                      src={
                        outfit.pieces.abrigo?.imageUrl || outfit.pieces.accesorio?.imageUrl
                      }
                      alt="Complemento"
                      className="w-full h-18 object-cover rounded-xl"
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[8px] font-bold text-slate-300 px-1 rounded">
                      {outfit.pieces.abrigo ? 'Abrigo' : 'Acc.'}
                    </span>
                  </div>
                ) : (
                  <div className="h-18 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-600">
                    -
                  </div>
                )}
              </div>

              {/* Stylist Commentary */}
              {outfit.aiStylistNotes && (
                <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 line-clamp-2 italic">
                  "{outfit.aiStylistNotes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
