import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Shuffle,
  Lock,
  Unlock,
  BookmarkCheck,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Instagram,
  User,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GarmentItem, OutfitPieces, OccasionType, SavedOutfit } from '../types/wardrobe';
import { getStylistAdvice, saveUserOutfit } from '../utils/api';

interface OutfitGeneratorProps {
  wardrobe: GarmentItem[];
  userEmail: string;
  isYoniUnlocked: boolean;
  onOpenYoniModal: () => void;
  onOutfitSaved: (outfit: SavedOutfit) => void;
  onGoToWardrobe: () => void;
}

const OCCASIONS: { id: OccasionType; label: string; icon: string; desc: string }[] = [
  { id: 'casual', label: 'Casual', icon: '☕', desc: 'Cómodo, versátil y relajado' },
  { id: 'formal', label: 'Formal', icon: '👔', desc: 'Elegancia ejecutiva y sastrería' },
  { id: 'sport', label: 'Sport', icon: '👟', desc: 'Activo, dinámico y transpirable' },
  { id: 'fiesta', label: 'Fiesta / Noche', icon: '🍸', desc: 'Impacto visual y sofisticación' },
  { id: 'oficina', label: 'Oficina / Smart', icon: '💼', desc: 'Equilibrio profesional moderno' },
  { id: 'cita', label: 'Cita Romántica', icon: '✨', desc: 'Seductor, pulido y detallista' },
  { id: 'invierno', label: 'Invierno / Abrigo', icon: '❄️', desc: 'Capas térmicas con estilo' },
  { id: 'verano', label: 'Verano / Fresco', icon: '☀️', desc: 'Tejidos ligeros y colores vivos' },
];

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({
  wardrobe,
  userEmail,
  isYoniUnlocked,
  onOpenYoniModal,
  onOutfitSaved,
  onGoToWardrobe,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>('casual');
  const [pieces, setPieces] = useState<OutfitPieces>({});
  const [lockedSlots, setLockedSlots] = useState<{ [key in keyof OutfitPieces]?: boolean }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [advice, setAdvice] = useState<{
    matchScore: number;
    verdict: string;
    advice: string;
    creatorTip: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const mannequinRef = useRef<HTMLDivElement | null>(null);

  // Filter wardrobe by categories
  const superiors = wardrobe.filter((i) => i.category === 'superior');
  const inferiors = wardrobe.filter((i) => i.category === 'inferior');
  const calzados = wardrobe.filter((i) => i.category === 'calzado');
  const accesorios = wardrobe.filter((i) => i.category === 'accesorio');
  const abrigos = wardrobe.filter((i) => i.category === 'abrigo');

  const canGenerate = superiors.length > 0 && inferiors.length > 0;

  // Generate outfit
  const generateOutfit = (occasion: OccasionType = selectedOccasion) => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setSaveSuccessMsg('');

    // Filter by occasion if matches exist, else fallback to all
    const filterByOccasion = (items: GarmentItem[]) => {
      const matched = items.filter((i) => {
        if (occasion === 'formal') return i.style === 'formal' || i.style === 'elegante';
        if (occasion === 'sport') return i.style === 'sport';
        if (occasion === 'fiesta') return i.style === 'fiesta' || i.style === 'elegante';
        return true;
      });
      return matched.length > 0 ? matched : items;
    };

    const pickRandom = (items: GarmentItem[]) => {
      if (items.length === 0) return undefined;
      return items[Math.floor(Math.random() * items.length)];
    };

    const newPieces: OutfitPieces = {
      superior: lockedSlots.superior ? pieces.superior : pickRandom(filterByOccasion(superiors)),
      inferior: lockedSlots.inferior ? pieces.inferior : pickRandom(filterByOccasion(inferiors)),
      calzado: lockedSlots.calzado ? pieces.calzado : pickRandom(filterByOccasion(calzados)),
      accesorio: lockedSlots.accesorio ? pieces.accesorio : pickRandom(accesorios),
      abrigo: lockedSlots.abrigo
        ? pieces.abrigo
        : occasion === 'invierno' || occasion === 'formal' || Math.random() > 0.4
        ? pickRandom(abrigos)
        : undefined,
    };

    setPieces(newPieces);

    // Call Stylist Advice
    getStylistAdvice(newPieces as any, occasion)
      .then((res) => {
        setAdvice(res);
      })
      .catch(() => {
        setAdvice({
          matchScore: 92,
          verdict: 'Estilo Sofisticado',
          advice: 'Combinación versátil con armonía cromática.',
          creatorTip: 'Tip de Yoni Mikel: La actitud y un buen calzado completan el look.',
        });
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  // Re-roll only one specific slot
  const rerollSlot = (slot: keyof OutfitPieces) => {
    let pool: GarmentItem[] = [];
    if (slot === 'superior') pool = superiors;
    else if (slot === 'inferior') pool = inferiors;
    else if (slot === 'calzado') pool = calzados;
    else if (slot === 'accesorio') pool = accesorios;
    else if (slot === 'abrigo') pool = abrigos;

    if (pool.length === 0) return;
    const currentId = pieces[slot]?.id;
    const alternatives = pool.filter((i) => i.id !== currentId);
    const chosen = (alternatives.length > 0 ? alternatives : pool)[
      Math.floor(Math.random() * (alternatives.length > 0 ? alternatives.length : pool.length))
    ];

    const updated = { ...pieces, [slot]: chosen };
    setPieces(updated);

    // Refresh advice
    getStylistAdvice(updated as any, selectedOccasion).then(setAdvice);
  };

  const toggleLock = (slot: keyof OutfitPieces) => {
    setLockedSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  // Initial generation on load
  useEffect(() => {
    if (canGenerate && !pieces.superior) {
      generateOutfit(selectedOccasion);
    }
  }, [wardrobe.length]);

  // Handle Save Outfit
  const handleSaveOutfit = async () => {
    if (!isYoniUnlocked) {
      onOpenYoniModal();
      return;
    }

    if (!pieces.superior || !pieces.inferior) return;
    setIsSaving(true);

    try {
      const outfit = await saveUserOutfit({
        email: userEmail,
        name: `Look ${selectedOccasion.charAt(0).toUpperCase() + selectedOccasion.slice(1)} - ${new Date().toLocaleDateString('es-ES')}`,
        occasion: selectedOccasion,
        pieces,
        aiStylistNotes: advice?.advice || 'Outfit equilibrado',
        matchScore: advice?.matchScore || 94,
        savedByYoniMikelUnlock: true,
      });

      onOutfitSaved(outfit);
      setSaveSuccessMsg('¡Look guardado en tu Lookbook permanente con éxito!');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#ec4899', '#8b5cf6'],
      });
    } catch (err: any) {
      console.error('Error saving outfit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!canGenerate) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Prepara tu Guardarropa Virtual</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Para que la IA de <strong>SmartWardrobe Pro</strong> pueda armar combinaciones y colocarlas en el maniquí, necesitas subir al menos una prenda <span className="text-indigo-400 font-semibold">superior</span> (camisa, camiseta) y una prenda <span className="text-indigo-400 font-semibold">inferior</span> (pantalón, falda).
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onGoToWardrobe}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            Subir Fotos a Mi Armario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Occasion Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Generador de Estilismo & Maniquí IA</span>
            </h2>
            <p className="text-xs text-slate-400">
              Selecciona la ocasión deseada para coordinar silueta, colores y texturas.
            </p>
          </div>

          <button
            onClick={() => generateOutfit(selectedOccasion)}
            disabled={isGenerating}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
          >
            <Shuffle className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generar Nuevo Mix</span>
          </button>
        </div>

        {/* Occasion Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {OCCASIONS.map((occ) => {
            const isSelected = selectedOccasion === occ.id;
            return (
              <button
                key={occ.id}
                onClick={() => {
                  setSelectedOccasion(occ.id);
                  generateOutfit(occ.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-base mb-1">{occ.icon}</div>
                <div className="text-xs font-bold text-slate-200">{occ.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{occ.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stylist Stage: Split View (Mannequin 3D + Garments Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Virtual Mannequin (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Top Bar on Mannequin */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Maniquí Virtual Pro
            </span>
            <div className="flex items-center gap-1.5 text-xs text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
              <span className="capitalize font-semibold">{selectedOccasion}</span>
            </div>
          </div>

          {/* Mannequin Silhouette Display */}
          <div
            ref={mannequinRef}
            className="relative my-4 w-full h-[440px] bg-slate-950/90 rounded-2xl border border-slate-800/80 flex items-center justify-center overflow-hidden shadow-inner"
          >
            {/* Subtle background studio grid */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Stylized Human Silhouette */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
              {/* Head */}
              <div className="w-12 h-14 rounded-full border-2 border-indigo-400/80 mb-1" />
              {/* Neck & Shoulders */}
              <div className="w-24 h-4 rounded-t-full border-t-2 border-indigo-400/80" />
              {/* Torso */}
              <div className="w-28 h-36 border-x-2 border-indigo-400/80 rounded-b-xl" />
              {/* Legs */}
              <div className="w-24 h-48 flex justify-between px-2 pt-1">
                <div className="w-8 h-full border-x-2 border-b-2 border-indigo-400/80 rounded-b-lg" />
                <div className="w-8 h-full border-x-2 border-b-2 border-indigo-400/80 rounded-b-lg" />
              </div>
            </div>

            {/* Layer 1: Head / Accessory */}
            {pieces.accesorio && (
              <div
                className="absolute top-4 z-30 group cursor-pointer"
                title={`${pieces.accesorio.title} (${pieces.accesorio.color})`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-indigo-400 shadow-xl bg-slate-900 group-hover:scale-110 transition-transform">
                  <img
                    src={pieces.accesorio.imageUrl}
                    alt={pieces.accesorio.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/90 text-indigo-300 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-indigo-500/40">
                  Accesorio
                </div>
              </div>
            )}

            {/* Layer 2: Superior (Top) */}
            {pieces.superior && (
              <div
                className="absolute top-20 z-20 group cursor-pointer"
                title={`${pieces.superior.title} (${pieces.superior.color})`}
              >
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-400 shadow-2xl bg-slate-900 group-hover:scale-105 transition-transform">
                  <img
                    src={pieces.superior.imageUrl}
                    alt={pieces.superior.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  Superior
                </div>
              </div>
            )}

            {/* Layer 2.5: Abrigo (Outer layer if present) */}
            {pieces.abrigo && (
              <div
                className="absolute top-20 -right-2 sm:right-6 z-25 group cursor-pointer"
                title={`${pieces.abrigo.title} (${pieces.abrigo.color})`}
              >
                <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-purple-400 shadow-xl bg-slate-900/90 group-hover:scale-105 transition-transform">
                  <img
                    src={pieces.abrigo.imageUrl}
                    alt={pieces.abrigo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow">
                  Abrigo
                </div>
              </div>
            )}

            {/* Layer 3: Inferior (Bottom) */}
            {pieces.inferior && (
              <div
                className="absolute top-48 z-15 group cursor-pointer"
                title={`${pieces.inferior.title} (${pieces.inferior.color})`}
              >
                <div className="w-26 h-32 rounded-2xl overflow-hidden border-2 border-indigo-400 shadow-xl bg-slate-900 group-hover:scale-105 transition-transform">
                  <img
                    src={pieces.inferior.imageUrl}
                    alt={pieces.inferior.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                  Inferior
                </div>
              </div>
            )}

            {/* Layer 4: Calzado (Shoes) */}
            {pieces.calzado && (
              <div
                className="absolute bottom-3 z-30 group cursor-pointer"
                title={`${pieces.calzado.title} (${pieces.calzado.color})`}
              >
                <div className="w-24 h-16 rounded-xl overflow-hidden border-2 border-indigo-400 shadow-xl bg-slate-900 group-hover:scale-105 transition-transform">
                  <img
                    src={pieces.calzado.imageUrl}
                    alt={pieces.calzado.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow">
                  Calzado
                </div>
              </div>
            )}
          </div>

          {/* Save Action & VIP Lock status */}
          <div className="space-y-3 pt-2">
            {saveSuccessMsg ? (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            ) : (
              <button
                onClick={handleSaveOutfit}
                disabled={isSaving}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isYoniUnlocked
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white shadow-pink-600/30'
                }`}
              >
                {isYoniUnlocked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{isSaving ? 'Guardando en la Nube...' : 'Guardar en mi Lookbook'}</span>
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4" />
                    <span>Seguir a @yonimikel para Guardar Outfit</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                {isYoniUnlocked ? (
                  <span className="text-emerald-400 font-semibold">✓ Guardado ilimitado activo</span>
                ) : (
                  <span className="text-amber-400 font-medium">🔒 Desbloquea con 1 click apoyando al autor</span>
                )}
              </span>
              <button
                onClick={() => generateOutfit(selectedOccasion)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Otro Mix</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Outfit Breakdown & AI Stylist Advice (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Stylist Analysis Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Análisis del Estilista IA Pro</h3>
                  <p className="text-[11px] text-slate-400">Evaluación cromática y armonía de silueta</p>
                </div>
              </div>

              {/* Match Score Gauge */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Armonía</span>
                <span className="text-xs font-black text-emerald-400">{advice?.matchScore || 94}%</span>
              </div>
            </div>

            {/* Verdict & Stylist Critique */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  {advice?.verdict || 'Combinación Destacada'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Gemini Fashion Engine</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {advice?.advice ||
                  'Este outfit crea una relación de contraste armoniosa entre prendas superiores e inferiores, idónea para la ocasión.'}
              </p>
            </div>

            {/* Yoni Mikel Style Tip */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-pink-500/20 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0 mt-0.5">
                <Heart className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-pink-300 text-[11px]">Tip de Estilo por Yoni Mikel:</p>
                <p className="text-slate-300 text-xs italic">
                  "{advice?.creatorTip || 'El mejor accesorio siempre es la seguridad con la que llevas tus prendas.'}"
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Garment Slots Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Desglose de Prendas & Bloqueos</span>
              <span className="text-[10px] text-indigo-400 font-normal">
                Usa el candado para fijar piezas que te encanten
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Superior Slot */}
              <SlotCard
                slotKey="superior"
                label="Prenda Superior"
                item={pieces.superior}
                isLocked={!!lockedSlots.superior}
                onToggleLock={() => toggleLock('superior')}
                onReroll={() => rerollSlot('superior')}
              />

              {/* Inferior Slot */}
              <SlotCard
                slotKey="inferior"
                label="Prenda Inferior"
                item={pieces.inferior}
                isLocked={!!lockedSlots.inferior}
                onToggleLock={() => toggleLock('inferior')}
                onReroll={() => rerollSlot('inferior')}
              />

              {/* Calzado Slot */}
              <SlotCard
                slotKey="calzado"
                label="Calzado"
                item={pieces.calzado}
                isLocked={!!lockedSlots.calzado}
                onToggleLock={() => toggleLock('calzado')}
                onReroll={() => rerollSlot('calzado')}
              />

              {/* Accesorio Slot */}
              <SlotCard
                slotKey="accesorio"
                label="Accesorio / Detalle"
                item={pieces.accesorio}
                isLocked={!!lockedSlots.accesorio}
                onToggleLock={() => toggleLock('accesorio')}
                onReroll={() => rerollSlot('accesorio')}
              />

              {/* Abrigo Slot if present or available */}
              {abrigos.length > 0 && (
                <div className="sm:col-span-2">
                  <SlotCard
                    slotKey="abrigo"
                    label="Capa Exterior / Abrigo"
                    item={pieces.abrigo}
                    isLocked={!!lockedSlots.abrigo}
                    onToggleLock={() => toggleLock('abrigo')}
                    onReroll={() => rerollSlot('abrigo')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SlotCardProps {
  slotKey: keyof OutfitPieces;
  label: string;
  item?: GarmentItem;
  isLocked: boolean;
  onToggleLock: () => void;
  onReroll: () => void;
}

const SlotCard: React.FC<SlotCardProps> = ({
  label,
  item,
  isLocked,
  onToggleLock,
  onReroll,
}) => {
  if (!item) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-500">
        <span>{label}: No hay prendas en esta categoría</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900/90 border rounded-2xl p-3 flex items-center gap-3 transition-all ${
        isLocked
          ? 'border-indigo-500/80 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          {label}
        </span>
        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
          <span>{item.color}</span>
          <span>•</span>
          <span className="capitalize">{item.style}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Reroll single slot */}
        <button
          onClick={onReroll}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Cambiar solo esta pieza"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Lock single slot */}
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-xl transition cursor-pointer ${
            isLocked
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          }`}
          title={isLocked ? 'Prenda fijada (haz clic para desbloquear)' : 'Fijar esta prenda'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
