import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  X,
  Check,
  Shirt
} from 'lucide-react';
import { BatchItemProgress, CategoryType, StyleType, SeasonType, GarmentItem } from '../types/wardrobe';
import { compressGarmentImage, formatBytes } from '../utils/imageCompressor';
import { classifyGarmentInstantly } from '../utils/fashionClassifier';
import { persistNewGarments } from '../utils/cloudSync';

interface BatchUploadModalProps {
  files: File[];
  userEmail: string;
  onClose: () => void;
  onBatchCompleted: (addedItems: GarmentItem[]) => void;
}

const CATEGORY_CHOICES: { id: CategoryType; label: string; icon: string }[] = [
  { id: 'superior', label: 'Superior', icon: '👔' },
  { id: 'inferior', label: 'Pantalón', icon: '👖' },
  { id: 'calzado', label: 'Calzado', icon: '👟' },
  { id: 'abrigo', label: 'Chaqueta', icon: '🧥' },
  { id: 'accesorio', label: 'Accesorio', icon: '⌚' },
];

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  files,
  userEmail,
  onClose,
  onBatchCompleted,
}) => {
  const [items, setItems] = useState<BatchItemProgress[]>([]);
  const [isCompressing, setIsCompressing] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Instant Parallel Compression & Smart Sequential Assignment
  useEffect(() => {
    let isMounted = true;

    const processFilesImmediately = async () => {
      setIsCompressing(true);
      setErrorMessage('');

      try {
        const processed = await Promise.all(
          files.map(async (file, idx) => {
            try {
              const comp = await compressGarmentImage(file, 480, 0.65);
              const detected = classifyGarmentInstantly(
                file.name,
                comp.width,
                comp.height,
                comp.dominantColor,
                idx
              );

              return {
                id: `queue_${Date.now()}_${idx}`,
                fileName: file.name,
                fileSize: file.size,
                compressedSize: comp.compressedSize,
                previewUrl: comp.dataUrl,
                status: 'completado' as const,
                progress: 100,
                detectedData: detected,
              };
            } catch (err: any) {
              const fallbackCategory: CategoryType =
                idx === 0 ? 'superior' : idx === 1 ? 'inferior' : idx === 2 ? 'calzado' : 'abrigo';
              return {
                id: `queue_${Date.now()}_${idx}`,
                fileName: file.name,
                fileSize: file.size,
                previewUrl: URL.createObjectURL(file),
                status: 'completado' as const,
                progress: 100,
                detectedData: {
                  category: fallbackCategory,
                  subcategory: fallbackCategory,
                  title: `${fallbackCategory.charAt(0).toUpperCase() + fallbackCategory.slice(1)}`,
                  color: 'Neutro',
                  style: 'casual' as StyleType,
                  season: 'todas' as SeasonType,
                  tags: [fallbackCategory],
                  description: 'Prenda para el armario',
                },
              };
            }
          })
        );

        if (isMounted) {
          setItems(processed);
          setIsCompressing(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage('Error al preparar fotos: ' + err.message);
          setIsCompressing(false);
        }
      }
    };

    processFilesImmediately();

    return () => {
      isMounted = false;
    };
  }, [files]);

  // 1-Tap Category Selector on Mobile
  const handleCategorySelect = (index: number, newCategory: CategoryType) => {
    setItems((prev) => {
      const copy = [...prev];
      if (copy[index] && copy[index].detectedData) {
        const currentData = copy[index].detectedData!;
        const categoryTitles: Record<CategoryType, string> = {
          superior: 'Prenda Superior',
          inferior: 'Pantalón',
          calzado: 'Calzado',
          abrigo: 'Chaqueta / Abrigo',
          accesorio: 'Accesorio',
          vestido: 'Vestido',
        };
        copy[index] = {
          ...copy[index],
          detectedData: {
            ...currentData,
            category: newCategory,
            title: `${categoryTitles[newCategory]}`,
            subcategory: categoryTitles[newCategory],
          },
        };
      }
      return copy;
    });
  };

  // Upload to Cloud Database & Local Storage
  const handleUploadAll = async () => {
    setIsUploading(true);
    setErrorMessage('');

    try {
      const payload = items.map((item) => ({
        category: item.detectedData?.category || 'superior',
        subcategory: item.detectedData?.subcategory || '',
        title: item.detectedData?.title || item.fileName,
        color: item.detectedData?.color || 'Neutro',
        style: item.detectedData?.style || 'casual',
        season: item.detectedData?.season || 'todas',
        imageUrl: item.previewUrl,
        tags: item.detectedData?.tags || [],
        notes: item.detectedData?.description || '',
      }));

      // Multi-tier persistence to Supabase and Local Vault
      const savedItems = await persistNewGarments(userEmail, payload);

      setUploadSuccess(true);
      setTimeout(() => {
        onBatchCompleted(savedItems);
        onClose();
      }, 350);
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setErrorMessage(err.message || 'Error al guardar en la nube.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Guardar Fotos en Tu Armario</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {files.length} fotos
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Toca la categoría de cada foto para clasificarla correctamente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCompressing && (
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-300">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Optimizando imágenes para subida instantánea...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Garment Cards with 1-Tap Category Pills */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60">
          {items.map((item, idx) => {
            const currentCat = item.detectedData?.category || 'superior';
            return (
              <div key={item.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Photo Thumbnail */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border-2 border-slate-700 shadow-md">
                    <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                  </div>
                  <div className="sm:hidden flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.detectedData?.title}</h4>
                    <span className="text-[10px] text-indigo-400 font-semibold uppercase">{currentCat}</span>
                  </div>
                </div>

                {/* Info & Category 1-Tap Buttons */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="hidden sm:flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.detectedData?.title || `Prenda ${idx + 1}`}
                    </h4>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                      {formatBytes(item.compressedSize || 15000)}
                    </span>
                  </div>

                  {/* 1-Tap Button Bar */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORY_CHOICES.map((choice) => {
                      const isSelected = currentCat === choice.id;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleCategorySelect(idx, choice.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-400'
                              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <span>{choice.icon}</span>
                          <span>{choice.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Sincronización multi-dispositivo activa.
          </p>

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleUploadAll}
              disabled={isCompressing || isUploading || items.length === 0}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                isCompressing || isUploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-95 shadow-emerald-600/30'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando en la Nube...</span>
                </>
              ) : uploadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado con Éxito!</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Guardar {items.length} Prendas en mi Armario</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
