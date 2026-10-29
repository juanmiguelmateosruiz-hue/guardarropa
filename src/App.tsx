import React, { useState, useEffect } from 'react';
import {
  Shirt,
  Wand2,
  Bookmark,
  Instagram,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { WardrobeSection } from './components/WardrobeSection';
import { OutfitGenerator } from './components/OutfitGenerator';
import { LookbookSection } from './components/LookbookSection';
import { BatchUploadModal } from './components/BatchUploadModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { GarmentDetailModal } from './components/GarmentDetailModal';
import { YoniMikelModal } from './components/YoniMikelModal';
import { GarmentItem, SavedOutfit, CategoryType } from './types/wardrobe';
import {
  fetchUserWardrobe,
  fetchUserOutfits,
  updateGarment,
  deleteGarment,
  deleteUserOutfit,
  seedSampleWardrobe
} from './utils/api';

import {
  syncAndFetchWardrobe,
  syncAndFetchOutfits,
  getCachedWardrobe,
  getCachedOutfits,
  deleteGarmentFromAllTiers,
  persistSavedOutfit,
  saveCachedWardrobe,
  persistUserSession,
  getStoredUserSession,
  clearUserSession
} from './utils/cloudSync';

export default function App() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return getStoredUserSession();
  });
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'generator' | 'lookbook'>('wardrobe');
  const [wardrobe, setWardrobe] = useState<GarmentItem[]>(() => {
    const email = getStoredUserSession();
    return email ? getCachedWardrobe(email) : [];
  });
  const [outfits, setOutfits] = useState<SavedOutfit[]>(() => {
    const email = getStoredUserSession();
    return email ? getCachedOutfits(email) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Modals state
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GarmentItem | null>(null);
  const [isYoniModalOpen, setIsYoniModalOpen] = useState(false);
  const [isYoniUnlocked, setIsYoniUnlocked] = useState(false);

  // PWA beforeinstallprompt event
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Check saved session & Yoni Mikel unlock on load
  useEffect(() => {
    const savedEmail = localStorage.getItem('smartwardrobe_user_email');
    if (savedEmail && !currentUserEmail) {
      setCurrentUserEmail(savedEmail);
    }
    const unlocked = localStorage.getItem('smartwardrobe_yoni_unlocked') === 'true';
    if (unlocked) {
      setIsYoniUnlocked(true);
    }

    // Capture PWA install event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Fetch wardrobe and outfits whenever user email is set
  useEffect(() => {
    if (!currentUserEmail) return;

    // Load instantly from local cache to prevent ANY flash to 0 items
    const cachedItems = getCachedWardrobe(currentUserEmail);
    if (cachedItems.length > 0) {
      setWardrobe(cachedItems);
    }
    const cachedLooks = getCachedOutfits(currentUserEmail);
    if (cachedLooks.length > 0) {
      setOutfits(cachedLooks);
    }

    // Sync in background with Supabase Cloud DB and Server
    const syncData = async () => {
      setIsLoading(true);
      try {
        const [cloudItems, cloudOutfits] = await Promise.all([
          syncAndFetchWardrobe(currentUserEmail),
          syncAndFetchOutfits(currentUserEmail),
        ]);
        if (cloudItems.length > 0) {
          setWardrobe(cloudItems);
        }
        if (cloudOutfits.length > 0) {
          setOutfits(cloudOutfits);
        }
      } catch (err: any) {
        console.warn('Sync notice:', err);
      } finally {
        setIsLoading(false);
      }
    };

    syncData();
  }, [currentUserEmail]);

  // Login Handler
  const handleLogin = async (email: string) => {
    const clean = email.trim().toLowerCase();
    persistUserSession(clean);
    setCurrentUserEmail(clean);
    // Instant populate from cache and IndexedDB
    setWardrobe(getCachedWardrobe(clean));
    setOutfits(getCachedOutfits(clean));
    showToast(`¡Sesión iniciada con éxito!`, 'success');
  };

  // Logout Handler
  const handleLogout = () => {
    clearUserSession();
    setCurrentUserEmail('');
    setWardrobe([]);
    setOutfits([]);
    setActiveTab('wardrobe');
  };

  // Unlock Yoni Mikel Perks
  const handleUnlockYoni = () => {
    localStorage.setItem('smartwardrobe_yoni_unlocked', 'true');
    setIsYoniUnlocked(true);
    setIsYoniModalOpen(false);
    showToast('¡Guardado de looks desbloqueado con éxito!', 'success');
  };

  // Update Category Handler
  const handleUpdateCategory = async (id: string, newCat: CategoryType) => {
    const updatedWardrobe = wardrobe.map((item) =>
      item.id === id ? { ...item, category: newCat } : item
    );
    setWardrobe(updatedWardrobe);
    saveCachedWardrobe(currentUserEmail, updatedWardrobe);
    try {
      await updateGarment(id, { category: newCat });
      showToast('Categoría actualizada', 'success');
    } catch (err) {
      console.error(err);
      showToast('Actualizado en local', 'success');
    }
  };

  // Edit Item Handler
  const handleSaveEditedItem = async (updated: GarmentItem) => {
    const updatedWardrobe = wardrobe.map((item) => (item.id === updated.id ? updated : item));
    setWardrobe(updatedWardrobe);
    saveCachedWardrobe(currentUserEmail, updatedWardrobe);
    try {
      await updateGarment(updated.id, updated);
      showToast('Prenda guardada con éxito', 'success');
    } catch (err) {
      showToast('Guardado localmente', 'success');
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async (id: string) => {
    const updatedWardrobe = wardrobe.filter((item) => item.id !== id);
    setWardrobe(updatedWardrobe);
    try {
      await deleteGarmentFromAllTiers(currentUserEmail, id);
      showToast('Prenda eliminada', 'success');
    } catch (err) {
      console.error(err);
      showToast('Eliminada del armario', 'success');
    }
  };

  // Delete Outfit Handler
  const handleDeleteOutfit = async (id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    try {
      await deleteUserOutfit(id);
      showToast('Outfit eliminado del lookbook', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Seed Demo Handler
  const handleSeedDemo = async () => {
    if (!currentUserEmail) return;
    setIsSeeding(true);
    try {
      await seedSampleWardrobe(currentUserEmail);
      const items = await syncAndFetchWardrobe(currentUserEmail);
      setWardrobe(items);
      showToast('¡Armario de demostración cargado con éxito!', 'success');
    } catch (err: any) {
      showToast('Error al cargar armario demo: ' + err.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Install PWA Trigger
  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  // If not logged in, show Auth Screen
  if (!currentUserEmail) {
    return <AuthModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-semibold animate-slide-up">
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="text-white">{toastMsg.text}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        userEmail={currentUserEmail}
        onLogout={handleLogout}
        onOpenYoniModal={() => setIsYoniModalOpen(true)}
        isYoniUnlocked={isYoniUnlocked}
        installPrompt={installPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-md max-w-xl mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'wardrobe'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Mi Armario ({wardrobe.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Generador Pro</span>
          </button>

          <button
            onClick={() => setActiveTab('lookbook')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'lookbook'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Lookbook ({outfits.length})</span>
          </button>
        </div>

        {/* View Content */}
        {activeTab === 'wardrobe' && (
          <WardrobeSection
            wardrobe={wardrobe}
            onUploadFiles={(files) => setBatchFiles(files)}
            onOpenCamera={() => setIsCameraOpen(true)}
            onUpdateCategory={handleUpdateCategory}
            onEditItem={(item) => setEditingItem(item)}
            onDeleteItem={handleDeleteItem}
            onSeedDemo={handleSeedDemo}
            isSeeding={isSeeding}
          />
        )}

        {activeTab === 'generator' && (
          <OutfitGenerator
            wardrobe={wardrobe}
            userEmail={currentUserEmail}
            isYoniUnlocked={isYoniUnlocked}
            onOpenYoniModal={() => setIsYoniModalOpen(true)}
            onOutfitSaved={(newOutfit) => {
              setOutfits((prev) => [newOutfit, ...prev]);
              showToast('Look guardado en tu Lookbook', 'success');
            }}
            onGoToWardrobe={() => setActiveTab('wardrobe')}
          />
        )}

        {activeTab === 'lookbook' && (
          <LookbookSection
            outfits={outfits}
            onDeleteOutfit={handleDeleteOutfit}
            onGoToGenerator={() => setActiveTab('generator')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">SmartWardrobe Pro</span>
            <span>•</span>
            <span>Diseñado con IA por <strong className="text-slate-300">Yoni Mikel</strong></span>
          </div>

          <a
            href="https://instagram.com/yonimikel"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-semibold transition"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Sígueme en Instagram @yonimikel</span>
          </a>
        </div>
      </footer>

      {/* Batch Upload Modal - Solves silent batch drops */}
      {batchFiles && batchFiles.length > 0 && (
        <BatchUploadModal
          files={batchFiles}
          userEmail={currentUserEmail}
          onClose={() => setBatchFiles(null)}
          onBatchCompleted={(newItems) => {
            setWardrobe((prev) => [...newItems, ...prev]);
            showToast(`¡${newItems.length} prendas sincronizadas con éxito!`, 'success');
          }}
        />
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onPhotoCaptured={(file) => {
            setBatchFiles([file]);
          }}
        />
      )}

      {/* Garment Detail Edit Modal */}
      {editingItem && (
        <GarmentDetailModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEditedItem}
          onDelete={handleDeleteItem}
        />
      )}

      {/* Creator VIP & Instagram Modal */}
      {isYoniModalOpen && (
        <YoniMikelModal
          isOpen={isYoniModalOpen}
          onClose={() => setIsYoniModalOpen(false)}
          isUnlocked={isYoniUnlocked}
          onUnlock={handleUnlockYoni}
        />
      )}
    </div>
  );
}
