import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shuffle,
  Lock,
  Unlock,
  BookmarkCheck,
  RefreshCw,
  CheckCircle2,
  Instagram,
  User,
  Heart,
  Eye,
  Download,
  Shirt,
  AlertCircle,
  HelpCircle,
  Check,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GarmentItem, OutfitPieces, OccasionType, SavedOutfit } from '../types/wardrobe';
import { getStylistAdvice, saveUserOutfit, requestAIDressModel } from '../utils/api';
import { FASHION_MODEL_LOOKS } from '../data/fashionModels';
import { renderModelDressedWithGarments } from '../utils/aiModelFitter';

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

// High-fashion studio base essentials if user hasn't uploaded footwear or accessories yet
const STUDIO_ESSENTIAL_CALZADO: GarmentItem = {
  id: 'essential_calzado',
  email: '',
  category: 'calzado',
  subcategory: 'Calzado Studio',
  title: 'Zapatillas Cuero Blanco Minimal',
  color: 'Blanco',
  style: 'casual',
  season: 'todas',
  imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
  createdAt: 0,
};

const STUDIO_ESSENTIAL_ACCESORIO: GarmentItem = {
  id: 'essential_accesorio',
  email: '',
  category: 'accesorio',
  subcategory: 'Accesorio Studio',
  title: 'Reloj Cronógrafo Cuero',
  color: 'Negro / Plata',
  style: 'elegante',
  season: 'todas',
  imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
  createdAt: 0,
};

function cleanItemTitle(item?: GarmentItem, fallbackLabel = 'Prenda'): string {
  if (!item) return fallbackLabel;
  let title = item.title || fallbackLabel;

  // Clean corrupted "Prenda Superior" tags on pants or footwear
  if (item.category === 'inferior' && title.toLowerCase().includes('prenda superior')) {
    title = title.replace(/prenda superior/gi, 'Pantalón');
  } else if (item.category === 'calzado' && title.toLowerCase().includes('prenda superior')) {
    title = title.replace(/prenda superior/gi, 'Calzado');
  } else if (item.category === 'accesorio' && title.toLowerCase().includes('prenda superior')) {
    title = title.replace(/prenda superior/gi, 'Accesorio');
  }
  return title;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({
  wardrobe,
  userEmail,
  isYoniUnlocked,
  onOpenYoniModal,
  onOutfitSaved,
  onGoToWardrobe,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>('casual');
  const [selectedGender, setSelectedGender] = useState<'hombre' | 'mujer'>('hombre');
  const [pieces, setPieces] = useState<OutfitPieces>({});
  const [lockedSlots, setLockedSlots] = useState<{ [key in keyof OutfitPieces]?: boolean }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'fittedModel' | 'aiModel' | 'editorial'>('fittedModel');
  const [fittedModelImage, setFittedModelImage] = useState<string>('');
  const [aiGeneratedModelImage, setAiGeneratedModelImage] = useState<string>('');
  const [isRenderingModel, setIsRenderingModel] = useState<boolean>(false);
  const [isCallingGeminiImage, setIsCallingGeminiImage] = useState<boolean>(false);

  const [advice, setAdvice] = useState<{
    matchScore: number;
    verdict: string;
    advice: string;
    creatorTip: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Filter wardrobe by categories
  const superiors = wardrobe.filter((i) => i.category === 'superior');
  const inferiors = wardrobe.filter((i) => i.category === 'inferior');
  const calzados = wardrobe.filter((i) => i.category === 'calzado');
  const accesorios = wardrobe.filter((i) => i.category === 'accesorio');
  const abrigos = wardrobe.filter((i) => i.category === 'abrigo');

  const canGenerate = superiors.length > 0 && inferiors.length > 0;

  // Render the fictitious full-body model dressed with the user's actual clothes
  const updateFittedModel = async (
    currentPieces: OutfitPieces,
    gender: 'hombre' | 'mujer',
    occasion: OccasionType
  ) => {
    if (!currentPieces.superior || !currentPieces.inferior) return;
    setIsRenderingModel(true);

    try {
      // 1. Immediately compose the full-body studio mannequin with the user's exact clothes
      const renderedUrl = await renderModelDressedWithGarments({
        gender,
        occasion,
        pieces: currentPieces,
      });
      if (renderedUrl) {
        setFittedModelImage(renderedUrl);
      }
    } catch (err) {
      console.warn('Error rendering fitted mannequin:', err);
    } finally {
      setIsRenderingModel(false);
    }

    // 2. Also query Gemini in background for photorealistic synthesis
    setIsCallingGeminiImage(true);
    requestAIDressModel(gender, occasion, currentPieces)
      .then((res) => {
        if (res.success && res.imageUrl) {
          setAiGeneratedModelImage(res.imageUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsCallingGeminiImage(false);
      });
  };

  // Generate outfit enforcing all 4 pieces: Superior, Pantalón, Calzado, and Complemento
  const generateOutfit = (occasion: OccasionType = selectedOccasion) => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setSaveSuccessMsg('');
    setAiGeneratedModelImage('');

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

    // User's items prioritized; studio essential fallback if not yet uploaded
    const chosenSuperior = lockedSlots.superior ? pieces.superior : pickRandom(filterByOccasion(superiors));
    const chosenInferior = lockedSlots.inferior ? pieces.inferior : pickRandom(filterByOccasion(inferiors));
    const chosenCalzado = lockedSlots.calzado
      ? pieces.calzado
      : pickRandom(filterByOccasion(calzados)) || STUDIO_ESSENTIAL_CALZADO;
    const chosenAccesorio = lockedSlots.accesorio
      ? pieces.accesorio
      : pickRandom(accesorios) || STUDIO_ESSENTIAL_ACCESORIO;
    const chosenAbrigo = lockedSlots.abrigo
      ? pieces.abrigo
      : occasion === 'invierno' || occasion === 'formal'
      ? pickRandom(abrigos)
      : undefined;

    const newPieces: OutfitPieces = {
      superior: chosenSuperior,
      inferior: chosenInferior,
      calzado: chosenCalzado,
      accesorio: chosenAccesorio,
      abrigo: chosenAbrigo,
    };

    setPieces(newPieces);

    // Dress the full-body model with user's exact clothes
    updateFittedModel(newPieces, selectedGender, occasion);

    // Call Stylist Advice
    getStylistAdvice(newPieces as any, occasion)
      .then((res) => {
        setAdvice(res);
      })
      .catch(() => {
        setAdvice({
          matchScore: 96,
          verdict: 'Estilo Coordinado',
          advice: 'Conjunto equilibrado en proporciones, cortes y contrastes.',
          creatorTip: 'Tip de Yoni Mikel: La actitud y un calzado impecable definen la elegancia.',
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
    else if (slot === 'calzado') pool = calzados.length > 0 ? calzados : [STUDIO_ESSENTIAL_CALZADO];
    else if (slot === 'accesorio') pool = accesorios.length > 0 ? accesorios : [STUDIO_ESSENTIAL_ACCESORIO];
    else if (slot === 'abrigo') pool = abrigos;

    if (pool.length === 0) return;
    const currentId = pieces[slot]?.id;
    const alternatives = pool.filter((i) => i.id !== currentId);
    const chosen = (alternatives.length > 0 ? alternatives : pool)[
      Math.floor(Math.random() * (alternatives.length > 0 ? alternatives.length : pool.length))
    ];

    const updated = { ...pieces, [slot]: chosen };
    setPieces(updated);
    updateFittedModel(updated, selectedGender, selectedOccasion);
    getStylistAdvice(updated as any, selectedOccasion).then(setAdvice);
  };

  const toggleLock = (slot: keyof OutfitPieces) => {
    setLockedSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  const handleGenderSwitch = (gender: 'hombre' | 'mujer') => {
    setSelectedGender(gender);
    updateFittedModel(pieces, gender, selectedOccasion);
  };

  // Initial generation on load
  useEffect(() => {
    if (canGenerate && !pieces.superior) {
      generateOutfit(selectedOccasion);
    }
  }, [wardrobe.length]);

  // Editorial fallback photo
  const modelKey = `${selectedOccasion}_${selectedGender}`;
  const editorialLook = FASHION_MODEL_LOOKS[modelKey] || FASHION_MODEL_LOOKS['casual_hombre'];

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
        matchScore: advice?.matchScore || 95,
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

  // Download look
  const downloadModelLook = () => {
    const src = viewMode === 'aiModel' && aiGeneratedModelImage ? aiGeneratedModelImage : fittedModelImage;
    if (!src) return;
    const link = document.createElement('a');
    link.download = `smartwardrobe_modelo_cuerpo_completo_${selectedOccasion}_${Date.now()}.jpg`;
    link.href = src;
    link.click();
  };

  if (!canGenerate) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <Shirt className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Prepara tu Guardarropa Virtual</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Para que la IA de <strong>SmartWardrobe Pro</strong> pueda diseñar el modelo de cuerpo completo y vestirlo con tu ropa, sube al menos una prenda <span className="text-indigo-400 font-semibold">superior</span> y un <span className="text-indigo-400 font-semibold">pantalón</span> a tu armario.
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Occasion & Model Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Probador Virtual: Modelo Ficticio de Cuerpo Completo</span>
            </h2>
            <p className="text-xs text-slate-400">
              Viste al modelo de cuerpo completo con las 4 piezas exactas de tu armario: superior, pantalón, calzado y complemento.
            </p>
          </div>

          {/* Model Gender Toggle & Re-roll Mix */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => handleGenderSwitch('hombre')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedGender === 'hombre'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👨 Hombre
              </button>
              <button
                onClick={() => handleGenderSwitch('mujer')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedGender === 'mujer'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👩 Mujer
              </button>
            </div>

            <button
              onClick={() => generateOutfit(selectedOccasion)}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Shuffle className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Nuevo Mix (4 Piezas)</span>
            </button>
          </div>
        </div>

        {/* Occasions Horizontal Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {OCCASIONS.map((occ) => {
            const isSelected = selectedOccasion === occ.id;
            return (
              <button
                key={occ.id}
                onClick={() => {
                  setSelectedOccasion(occ.id);
                  generateOutfit(occ.id);
                }}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-base mb-0.5">{occ.icon}</div>
                <div className="text-[11px] font-bold text-slate-200 truncate">{occ.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stylist Stage: Full-Body Model Dressed with User's Clothes + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The Virtual Full-Body Model (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          {/* Top Bar over Model */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Cuerpo Completo · 4 Piezas
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
              <button
                onClick={() => setViewMode('fittedModel')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'fittedModel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Maniquí virtual de cuerpo completo vestido con tu ropa exacta"
              >
                <Sparkles className="w-3 h-3" />
                <span>Tu Ropa Real</span>
              </button>

              {aiGeneratedModelImage && (
                <button
                  onClick={() => setViewMode('aiModel')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'aiModel' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Fotorrealista generado por Gemini"
                >
                  <span>🤖 IA Gemini</span>
                </button>
              )}

              <button
                onClick={() => setViewMode('editorial')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'editorial' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Editorial</span>
              </button>
            </div>
          </div>

          {/* Model Display Stage (Full Body Portrait Aspect Ratio) */}
          <div className="relative w-full h-[620px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group flex items-center justify-center">
            {viewMode === 'fittedModel' ? (
              fittedModelImage ? (
                <img
                  src={fittedModelImage}
                  alt="Modelo de cuerpo completo con tu ropa"
                  className={`w-full h-full object-contain transition-all duration-300 ${
                    isRenderingModel ? 'opacity-50 blur-xs' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-500">
                  <Shirt className="w-10 h-10 mx-auto text-indigo-400 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-400">Vistiendo al modelo con tu ropa...</p>
                </div>
              )
            ) : viewMode === 'aiModel' && aiGeneratedModelImage ? (
              <img
                src={aiGeneratedModelImage}
                alt="Modelo IA de cuerpo completo"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <img
                src={editorialLook.imageUrl}
                alt="Referencia editorial"
                className="w-full h-full object-cover object-top"
              />
            )}

            {/* Rendering Spinner */}
            {isRenderingModel && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-30">
                <div className="w-12 h-12 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-xs font-bold text-indigo-300">
                  Ajustando tus 4 prendas al modelo de cuerpo completo...
                </p>
              </div>
            )}

            {/* Bottom Floating Info Card with Accurately Labeled Badges */}
            <div className="absolute bottom-3 inset-x-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Las 4 prendas que viste el modelo:</span>
                </span>
                <button
                  onClick={downloadModelLook}
                  className="text-[10px] text-indigo-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar</span>
                </button>
              </div>

              {/* Accurately Labeled Tag Pills (No repeated titles!) */}
              <div className="flex flex-wrap gap-1.5">
                {pieces.superior && (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    👔 Superior: <strong className="text-white">{cleanItemTitle(pieces.superior, 'Prenda Superior')}</strong>
                  </span>
                )}
                {pieces.inferior && (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    👖 Pantalón: <strong className="text-white">{cleanItemTitle(pieces.inferior, 'Pantalón')}</strong>
                  </span>
                )}
                {pieces.calzado && (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    👟 Calzado: <strong className="text-white">{cleanItemTitle(pieces.calzado, 'Calzado')}</strong>
                  </span>
                )}
                {pieces.accesorio && (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ⌚ Complemento: <strong className="text-white">{cleanItemTitle(pieces.accesorio, 'Accesorio')}</strong>
                  </span>
                )}
                {pieces.abrigo && (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🧥 Chaqueta: <strong className="text-white">{cleanItemTitle(pieces.abrigo, 'Chaqueta')}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="space-y-3 pt-1">
            {saveSuccessMsg ? (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            ) : (
              <button
                onClick={handleSaveOutfit}
                disabled={isSaving}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isYoniUnlocked
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white shadow-pink-600/30'
                }`}
              >
                {isYoniUnlocked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{isSaving ? 'Guardando en la Nube...' : 'Guardar Look en mi Lookbook'}</span>
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4" />
                    <span>Seguir a @yonimikel para Guardar Outfit</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Garment Slots Breakdown & AI Stylist Advice (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* AI Stylist Analysis Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Análisis del Estilista IA</h3>
                  <p className="text-[11px] text-slate-400">Evaluación de corte, color y porte en el modelo</p>
                </div>
              </div>

              {/* Match Score */}
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Armonía</span>
                <span className="text-sm font-black text-emerald-400">{advice?.matchScore || 95}%</span>
              </div>
            </div>

            {/* Verdict */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-1.5">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                {advice?.verdict || 'Combinación Destacada'}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {advice?.advice ||
                  'Las 4 piezas de tu armario se integran con naturalidad sobre la silueta del modelo, respetando caídas y contrastes.'}
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
                  "{advice?.creatorTip || 'El ajuste de la prenda en hombros y cintura define la elegancia de todo el conjunto.'}"
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Garment Slots Breakdown with Lock Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Las 4 Piezas del Outfit
              </h3>
              <span className="text-[10px] text-indigo-400">
                Usa el candado 🔒 para fijar prendas
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Superior Slot */}
              <SlotCard
                slotKey="superior"
                label="1. Prenda Superior"
                item={pieces.superior}
                isLocked={!!lockedSlots.superior}
                onToggleLock={() => toggleLock('superior')}
                onReroll={() => rerollSlot('superior')}
              />

              {/* Inferior Slot */}
              <SlotCard
                slotKey="inferior"
                label="2. Pantalón / Inferior"
                item={pieces.inferior}
                isLocked={!!lockedSlots.inferior}
                onToggleLock={() => toggleLock('inferior')}
                onReroll={() => rerollSlot('inferior')}
              />

              {/* Calzado Slot */}
              <SlotCard
                slotKey="calzado"
                label="3. Calzado"
                item={pieces.calzado}
                isLocked={!!lockedSlots.calzado}
                onToggleLock={() => toggleLock('calzado')}
                onReroll={() => rerollSlot('calzado')}
              />

              {/* Accesorio Slot */}
              <SlotCard
                slotKey="accesorio"
                label="4. Complemento / Accesorio"
                item={pieces.accesorio}
                isLocked={!!lockedSlots.accesorio}
                onToggleLock={() => toggleLock('accesorio')}
                onReroll={() => rerollSlot('accesorio')}
              />

              {/* Abrigo Slot if present */}
              {pieces.abrigo && (
                <SlotCard
                  slotKey="abrigo"
                  label="Capa Exterior / Abrigo"
                  item={pieces.abrigo}
                  isLocked={!!lockedSlots.abrigo}
                  onToggleLock={() => toggleLock('abrigo')}
                  onReroll={() => rerollSlot('abrigo')}
                />
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
  if (!item) return null;
  const cleanTitle = cleanItemTitle(item, label);

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-3 flex items-center gap-3 transition-all ${
        isLocked
          ? 'border-indigo-500 bg-indigo-950/20 shadow-md ring-1 ring-indigo-500/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 shadow-sm">
        <img src={item.imageUrl} alt={cleanTitle} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          {label}
        </span>
        <h4 className="text-xs font-bold text-white truncate">{cleanTitle}</h4>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
          <span>{item.color}</span>
          <span>•</span>
          <span className="capitalize">{item.style}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onReroll}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Cambiar solo esta pieza"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleLock}
          className={`p-2 rounded-xl transition cursor-pointer ${
            isLocked
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          }`}
          title={isLocked ? 'Prenda fijada' : 'Fijar esta prenda'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
