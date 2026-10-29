import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  RefreshCw,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BatchItemProgress, CategoryType, StyleType, SeasonType, GarmentItem } from '../types/wardrobe';
import { compressGarmentImage, formatBytes } from '../utils/imageCompressor';
import { classifyGarmentAI, addGarment } from '../utils/api';

interface BatchUploadModalProps {
  files: File[];
  userEmail: string;
  onClose: () => void;
  onBatchCompleted: (addedItems: GarmentItem[]) => void;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  files,
  userEmail,
  onClose,
  onBatchCompleted,
}) => {
  const [items, setItems] = useState<BatchItemProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const addedItemsRef = useRef<GarmentItem[]>([]);
  const hasStartedRef = useRef(false);

  // Initialize batch items queue
  useEffect(() => {
    const initialList: BatchItemProgress[] = files.map((file, idx) => ({
      id: `queue_${Date.now()}_${idx}`,
      fileName: file.name,
      fileSize: file.size,
      previewUrl: URL.createObjectURL(file),
      status: 'esperando',
      progress: 0,
    }));
    setItems(initialList);
  }, [files]);

  // Sequential processing loop
  useEffect(() => {
    if (items.length === 0 || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const processAll = async () => {
      setIsProcessing(true);

      for (let i = 0; i < files.length; i++) {
        setCurrentIndex(i);
        const file = files[i];

        // Step 1: Compression
        updateItemStatus(i, { status: 'comprimiendo', progress: 25 });
        let compressedDataUrl = '';
        let compSize = 0;

        try {
          const compResult = await compressGarmentImage(file, 720, 0.74);
          compressedDataUrl = compResult.dataUrl;
          compSize = compResult.compressedSize;
          updateItemStatus(i, {
            compressedSize: compSize,
            status: 'analizando',
            progress: 50,
          });
        } catch (err: any) {
          updateItemStatus(i, {
            status: 'error',
            error: 'Error al optimizar la imagen con canvas: ' + err.message,
            progress: 0,
          });
          continue;
        }

        // Step 2: AI Classification (Gemini Vision)
        let aiResult: {
          category: CategoryType;
          subcategory: string;
          title: string;
          color: string;
          style: StyleType;
          season: SeasonType;
          tags: string[];
          description: string;
        } = {
          category: 'superior' as CategoryType,
          subcategory: 'Prenda',
          title: 'Prenda ' + (i + 1),
          color: 'Neutro',
          style: 'casual' as StyleType,
          season: 'todas',
          tags: ['armario'],
          description: 'Prenda analizada',
        };

        try {
          aiResult = await classifyGarmentAI(compressedDataUrl);
          updateItemStatus(i, {
            detectedData: aiResult,
            status: 'guardando',
            progress: 80,
          });
        } catch (err: any) {
          console.warn('AI classification fallback applied:', err);
          updateItemStatus(i, {
            detectedData: aiResult,
            status: 'guardando',
            progress: 80,
          });
        }

        // Step 3: Cloud Database Storage
        try {
          const savedItem = await addGarment({
            email: userEmail,
            category: aiResult.category,
            subcategory: aiResult.subcategory,
            title: aiResult.title,
            color: aiResult.color,
            style: aiResult.style,
            season: aiResult.season,
            imageUrl: compressedDataUrl,
            tags: aiResult.tags,
            notes: aiResult.description,
          });

          addedItemsRef.current.push(savedItem);
          setSavedCount((prev) => prev + 1);

          updateItemStatus(i, {
            status: 'completado',
            progress: 100,
            resultItem: savedItem,
          });
        } catch (err: any) {
          updateItemStatus(i, {
            status: 'error',
            error: 'Error de persistencia en la nube: ' + err.message,
            progress: 0,
          });
        }
      }

      setIsProcessing(false);
    };

    processAll();
  }, [items.length]);

  const updateItemStatus = (index: number, updates: Partial<BatchItemProgress>) => {
    setItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...updates };
      }
      return copy;
    });
  };

  // Retry an individual failed item
  const retryItem = async (index: number) => {
    const file = files[index];
    if (!file) return;

    updateItemStatus(index, { status: 'comprimiendo', progress: 30, error: undefined });

    try {
      const compResult = await compressGarmentImage(file, 720, 0.74);
      updateItemStatus(index, {
        compressedSize: compResult.compressedSize,
        status: 'analizando',
        progress: 60,
      });

      const aiResult = await classifyGarmentAI(compResult.dataUrl);
      updateItemStatus(index, { status: 'guardando', progress: 85, detectedData: aiResult });

      const savedItem = await addGarment({
        email: userEmail,
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        title: aiResult.title,
        color: aiResult.color,
        style: aiResult.style,
        season: aiResult.season,
        imageUrl: compResult.dataUrl,
        tags: aiResult.tags,
        notes: aiResult.description,
      });

      addedItemsRef.current.push(savedItem);
      setSavedCount((prev) => prev + 1);
      updateItemStatus(index, {
        status: 'completado',
        progress: 100,
        resultItem: savedItem,
      });
    } catch (err: any) {
      updateItemStatus(index, {
        status: 'error',
        error: 'Reintento fallido: ' + err.message,
        progress: 0,
      });
    }
  };

  const handleFinish = () => {
    onBatchCompleted(addedItemsRef.current);
    onClose();
  };

  const completedCount = items.filter((i) => i.status === 'completado').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const overallPercent =
    items.length > 0 ? Math.round(((completedCount + errorCount) / items.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Subida Múltiple y Clasificación IA</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">
                  {files.length} fotos
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pipeline seguro: Compresión Canvas ➔ Gemini Vision IA ➔ Nube Permanente.
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={handleFinish}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>
                    Procesando prenda {Math.min(currentIndex + 1, files.length)} de {files.length}...
                  </span>
                </>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Procesamiento de lote finalizado</span>
                </span>
              )}
            </span>
            <span className="font-mono text-indigo-400 font-bold">{overallPercent}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${overallPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Sincronizadas con éxito: <strong className="text-emerald-400 font-semibold">{completedCount}</strong></span>
            {errorCount > 0 && (
              <span className="text-rose-400 font-semibold">Errores: {errorCount}</span>
            )}
            <span>Total en lote: {items.length}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60">
          {items.map((item, idx) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3.5">
              {/* Preview Thumbnail */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 shadow-sm">
                <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                {item.status === 'completado' && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px]">
                    ✓
                  </div>
                )}
              </div>

              {/* Info & Stages */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-200 truncate pr-2">
                    {item.detectedData?.title || item.fileName}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.compressedSize
                      ? `${formatBytes(item.compressedSize)} (-${Math.round(
                          ((item.fileSize - item.compressedSize) / item.fileSize) * 100
                        )}%)`
                      : formatBytes(item.fileSize)}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {item.status === 'esperando' && (
                    <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                      En cola...
                    </span>
                  )}
                  {item.status === 'comprimiendo' && (
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Optimizando imagen...
                    </span>
                  )}
                  {item.status === 'analizando' && (
                    <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Clasificando con Gemini IA...
                    </span>
                  )}
                  {item.status === 'guardando' && (
                    <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Guardando en nube...
                    </span>
                  )}
                  {item.status === 'completado' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        {item.detectedData?.category || 'Superior'}
                      </span>
                      {item.detectedData?.color && (
                        <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                          {item.detectedData.color}
                        </span>
                      )}
                      {item.detectedData?.style && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md capitalize">
                          {item.detectedData.style}
                        </span>
                      )}
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Error
                      </span>
                      <button
                        onClick={() => retryItem(idx)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Reintentar
                      </button>
                    </div>
                  )}
                </div>

                {item.error && (
                  <p className="text-[10px] text-rose-400 truncate">{item.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {isProcessing ? 'No cierres esta ventana mientras se sincronizan las fotos.' : 'Todas las fotos se han procesado de forma segura.'}
          </p>

          <button
            onClick={handleFinish}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              isProcessing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white cursor-pointer active:scale-95 shadow-indigo-600/30'
            }`}
          >
            <span>Ver mi Armario Actualizado</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
