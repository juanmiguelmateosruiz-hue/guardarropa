import React, { useState, useRef, useEffect } from 'react';
import { Shirt, Mail, ScanFace, Sparkles, CheckCircle2, AlertCircle, Camera, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onLogin: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'detecting' | 'verifying' | 'matched'>('idle');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const remembered = localStorage.getItem('smartwardrobe_user_email');
    if (remembered) {
      setEmail(remembered);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setError('Por favor, introduce un correo electrónico válido.');
      return;
    }
    setError('');
    onLogin(clean);
  };

  const handleDemoLogin = () => {
    onLogin('yoni@smartwardrobe.pro');
  };

  // Facial Recognition simulation flow
  const startFaceScan = async () => {
    setError('');
    setCameraError('');
    setIsFaceScanning(true);
    setScanStep('detecting');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err: any) {
      console.warn('Camera access unavailable for biometrics, running simulation mode:', err);
      setCameraError('Cámara no disponible, usando simulador biométrico virtual.');
    }

    // Step 1: Detecting face
    setTimeout(() => {
      setScanStep('verifying');
      // Step 2: Verification
      setTimeout(() => {
        setScanStep('matched');
        // Step 3: Match complete
        setTimeout(() => {
          stopCamera();
          setIsFaceScanning(false);
          const chosenEmail = email.trim() || 'yoni@smartwardrobe.pro';
          onLogin(chosenEmail);
        }, 1200);
      }, 1600);
    }, 1800);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center space-y-5">
          {/* Brand Icon */}
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 ring-1 ring-white/20">
            <Shirt className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">SmartWardrobe Pro</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Estilista de armario inteligente y generador de looks con sincronización permanente en la nube.
            </p>
          </div>

          {/* Biometric Face Scan Overlay if active */}
          {isFaceScanning ? (
            <div className="bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-5 space-y-4">
              <div className="relative w-48 h-56 mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500 shadow-inner flex items-center justify-center">
                {/* Live video */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* Cyberpunk scanning overlay */}
                <div className="absolute inset-0 border-2 border-indigo-400/40 rounded-2xl pointer-events-none">
                  {/* Scanning beam */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-[bounce_2s_infinite]"></div>

                  {/* Corner brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

                  {/* Central face oval */}
                  <div className="absolute inset-6 border border-dashed border-indigo-300/40 rounded-full animate-pulse"></div>
                </div>

                {scanStep === 'matched' && (
                  <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-400 animate-fade-in">
                    <CheckCircle2 className="w-12 h-12 mb-2 animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-wider">Identidad Confirmada</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="text-[11px] text-amber-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{cameraError}</span>
                </p>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300">
                  <ScanFace className="w-4 h-4 animate-spin" />
                  <span>
                    {scanStep === 'detecting' && 'Detectando puntos biométricos faciales...'}
                    {scanStep === 'verifying' && 'Validando credenciales criptográficas...'}
                    {scanStep === 'matched' && '¡Acceso concedido! Entrando a tu armario...'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Mire fijamente a la lente frontal</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsFaceScanning(false);
                }}
                className="text-xs text-slate-400 hover:text-white underline pt-1"
              >
                Cancelar y usar correo
              </button>
            </div>
          ) : (
            /* Email Login Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Correo Electrónico
                  </span>
                  <span className="text-[10px] text-indigo-400 font-normal">Sincronización multi-dispositivo</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo: tu@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Acceder a mi Armario</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  o accede con
                </span>
                <div className="border-t border-slate-800 w-full"></div>
              </div>

              {/* Biometric Scan Trigger */}
              <button
                type="button"
                onClick={startFaceScan}
                className="w-full bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ScanFace className="w-4 h-4 text-indigo-400" />
                <span>Simulación Biométrica (Face ID)</span>
              </button>

              {/* Instant Demo Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Entrar con cuenta Demo (yoni@smartwardrobe.pro)</span>
              </button>
            </form>
          )}

          {/* Footer creator acknowledgment */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Creado por <strong className="text-slate-300">Yoni Mikel</strong>
            </span>
            <a
              href="https://instagram.com/yonimikel"
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 hover:text-pink-300 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>@yonimikel</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
