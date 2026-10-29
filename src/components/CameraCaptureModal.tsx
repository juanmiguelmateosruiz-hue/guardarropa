import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = async () => {
    stopStream();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no está disponible en este navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'No se pudo acceder a la cámara.');
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen && !capturedDataUrl) {
      startStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedDataUrl]);

  if (!isOpen) return null;

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedDataUrl(dataUrl);
    stopStream();
  };

  const confirmPhoto = () => {
    if (!capturedDataUrl) return;

    // Convert dataUrl to File
    const arr = capturedDataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const file = new File([u8arr], `prenda_foto_${Date.now()}.jpg`, { type: mime });
    onPhotoCaptured(file);
    onClose();
  };

  const retakePhoto = () => {
    setCapturedDataUrl(null);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>Fotografiar Prenda</span>
          </h3>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Capture area */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
          {capturedDataUrl ? (
            <img src={capturedDataUrl} alt="Captura" className="w-full h-full object-cover" />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300">{cameraError}</p>
              <button
                onClick={startStream}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200"
              >
                Reintentar Cámara
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
              />
              {/* Guides */}
              <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none" />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          {capturedDataUrl ? (
            <>
              <button
                onClick={retakePhoto}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Repetir</span>
              </button>
              <button
                onClick={confirmPhoto}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25"
              >
                <Check className="w-4 h-4" />
                <span>Usar esta Foto</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Cambiar cámara"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 shadow-xl hover:scale-105 active:scale-95 transition-transform"
              >
                <div className="w-full h-full rounded-full border-4 border-white bg-transparent flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white" />
                </div>
              </button>

              <div className="w-11" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
