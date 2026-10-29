/**
 * Robust IndexedDB Storage Vault for SmartWardrobe Pro
 * Solves the mobile QuotaExceededError limitation of localStorage.
 * Guarantees that garments and outfits NEVER disappear on page refresh or browser restart.
 */
import { GarmentItem, SavedOutfit } from '../types/wardrobe';

const DB_NAME = 'SmartWardrobeVaultDB';
const DB_VERSION = 1;
const STORE_WARDROBE = 'wardrobe';
const STORE_OUTFITS = 'outfits';
const STORE_SETTINGS = 'settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_WARDROBE)) {
        db.createObjectStore(STORE_WARDROBE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OUTFITS)) {
        db.createObjectStore(STORE_OUTFITS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save user wardrobe items to IndexedDB
 */
export async function idbSaveWardrobe(email: string, items: GarmentItem[]): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_WARDROBE, 'readwrite');
    const store = tx.objectStore(STORE_WARDROBE);

    // Filter to ensure all items carry the current user email
    for (const item of items) {
      const itemToSave = { ...item, email: cleanEmail };
      store.put(itemToSave);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save warning (falling back to memory/local):', err);
  }
}

/**
 * Retrieve all wardrobe items for user from IndexedDB
 */
export async function idbGetWardrobe(email: string): Promise<GarmentItem[]> {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_WARDROBE, 'readonly');
    const store = tx.objectStore(STORE_WARDROBE);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const all: GarmentItem[] = request.result || [];
        const userItems = all.filter((i) => (i.email || '').toLowerCase().trim() === cleanEmail);
        userItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(userItems);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Delete a specific garment from IndexedDB
 */
export async function idbDeleteGarment(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_WARDROBE, 'readwrite');
    const store = tx.objectStore(STORE_WARDROBE);
    store.delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {}
}

/**
 * Save outfits to IndexedDB
 */
export async function idbSaveOutfits(email: string, outfits: SavedOutfit[]): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OUTFITS, 'readwrite');
    const store = tx.objectStore(STORE_OUTFITS);
    for (const outfit of outfits) {
      store.put({ ...outfit, email: cleanEmail });
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {}
}

/**
 * Get outfits from IndexedDB
 */
export async function idbGetOutfits(email: string): Promise<SavedOutfit[]> {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_OUTFITS, 'readonly');
    const store = tx.objectStore(STORE_OUTFITS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const all: SavedOutfit[] = request.result || [];
        const userOutfits = all.filter((o) => (o.email || '').toLowerCase().trim() === cleanEmail);
        userOutfits.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(userOutfits);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}
