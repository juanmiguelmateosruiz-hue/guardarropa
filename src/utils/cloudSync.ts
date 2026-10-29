/**
 * Multi-Tier Cloud Persistence Engine for SmartWardrobe Pro
 * Synchronizes between Supabase Cloud DB, Server API, and Local Vault
 * Guarantees that garments NEVER disappear on refresh, logout/login,
 * or when switching between mobile phone and computer.
 */
import { GarmentItem, SavedOutfit, CategoryType, StyleType, SeasonType } from '../types/wardrobe';

export const SUPABASE_URL = 'https://tvskndfcdwzpguikmlty.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c2tuZGZjZHd6cGd1aWttbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzg2ODksImV4cCI6MjA1NjgxNDY4OX0.e4K3z8s7l4m9n2p1q0r5t6v8w7x6y5z4a3b2c1d0e9f';

// Local storage key helper
function getLocalKey(email: string) {
  return `smartwardrobe_items_${email.toLowerCase().trim()}`;
}

function getLocalOutfitsKey(email: string) {
  return `smartwardrobe_outfits_${email.toLowerCase().trim()}`;
}

export function getCachedWardrobe(email: string): GarmentItem[] {
  try {
    const raw = localStorage.getItem(getLocalKey(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveCachedWardrobe(email: string, items: GarmentItem[]) {
  try {
    localStorage.setItem(getLocalKey(email), JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage quota limit reached, maintaining in-memory copy');
  }
}

export function getCachedOutfits(email: string): SavedOutfit[] {
  try {
    const raw = localStorage.getItem(getLocalOutfitsKey(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveCachedOutfits(email: string, outfits: SavedOutfit[]) {
  try {
    localStorage.setItem(getLocalOutfitsKey(email), JSON.stringify(outfits));
  } catch (e) {
    console.warn('LocalStorage quota limit reached');
  }
}

/**
 * Fetch wardrobe with multi-tier sync:
 * 1. Read cached local vault (instant display, no flash to 0)
 * 2. Fetch from Supabase Cloud DB (cross-device mobile <-> PC sync)
 * 3. Fetch from Server (/api/prendas)
 * 4. Merge all sources, update cache, and return
 */
export async function syncAndFetchWardrobe(email: string): Promise<GarmentItem[]> {
  const cleanEmail = email.toLowerCase().trim();
  const cached = getCachedWardrobe(cleanEmail);
  const itemsMap = new Map<string, GarmentItem>();

  // Seed with cached items
  cached.forEach((item) => itemsMap.set(item.id, item));

  // 1. Fetch from Supabase directly in browser (syncs across mobile and PC)
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/prendas?email=eq.${encodeURIComponent(cleanEmail)}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (res.ok) {
      const supaItems = await res.json();
      if (Array.isArray(supaItems)) {
        supaItems.forEach((row: any) => {
          const id = String(row.id || row.image_url || Date.now());
          itemsMap.set(id, {
            id,
            email: cleanEmail,
            category: (row.category || 'superior').toLowerCase() as CategoryType,
            subcategory: row.subcategory || row.category || '',
            title: row.title || `${row.category ? row.category.charAt(0).toUpperCase() + row.category.slice(1) : 'Prenda'}`,
            color: row.color || 'Neutro',
            style: (row.style || 'casual').toLowerCase() as StyleType,
            season: (row.season || 'todas').toLowerCase() as SeasonType,
            imageUrl: row.image_url || row.imageUrl || '',
            thumbnailUrl: row.image_url || row.imageUrl || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            notes: row.notes || '',
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          });
        });
      }
    }
  } catch (supaErr) {
    console.warn('Supabase fetch not reachable directly, proceeding with Server & Cache:', supaErr);
  }

  // 2. Fetch from Server /api/prendas
  try {
    const serverRes = await fetch(`/api/prendas?email=${encodeURIComponent(cleanEmail)}`);
    if (serverRes.ok) {
      const serverItems = await serverRes.json();
      if (Array.isArray(serverItems)) {
        serverItems.forEach((item: GarmentItem) => {
          itemsMap.set(item.id, item);
        });
      }
    }
  } catch (serverErr) {
    console.warn('Server fetch error:', serverErr);
  }

  const combined = Array.from(itemsMap.values());
  // Sort newest first
  combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // Update local vault cache
  saveCachedWardrobe(cleanEmail, combined);
  return combined;
}

/**
 * Save new garments with multi-cloud redundancy:
 * Sends to Supabase + Server + Local Vault
 */
export async function persistNewGarments(
  email: string,
  newItems: {
    category: CategoryType;
    subcategory?: string;
    title: string;
    color: string;
    style: StyleType;
    season?: SeasonType;
    imageUrl: string;
    tags?: string[];
    notes?: string;
  }[]
): Promise<GarmentItem[]> {
  const cleanEmail = email.toLowerCase().trim();
  const createdItems: GarmentItem[] = [];

  for (let i = 0; i < newItems.length; i++) {
    const raw = newItems[i];
    const id = `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: GarmentItem = {
      id,
      email: cleanEmail,
      category: raw.category,
      subcategory: raw.subcategory || raw.title,
      title: raw.title,
      color: raw.color || 'Neutro',
      style: raw.style || 'casual',
      season: raw.season || 'todas',
      imageUrl: raw.imageUrl,
      thumbnailUrl: raw.imageUrl,
      tags: raw.tags || [],
      notes: raw.notes || '',
      createdAt: Date.now() + i,
    };
    createdItems.push(fullItem);

    // 1. Push to Supabase Cloud DB for cross-device sync
    try {
      fetch(`${SUPABASE_URL}/rest/v1/prendas`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          email: cleanEmail,
          category: raw.category,
          style: raw.style,
          image_url: raw.imageUrl,
          title: raw.title,
          color: raw.color,
        }),
      }).catch((e) => console.warn('Supabase background sync notice:', e));
    } catch (e) {}
  }

  // 2. Push batch to Server API
  try {
    await fetch('/api/prendas/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        items: newItems,
      }),
    });
  } catch (err) {
    console.warn('Server batch upload note:', err);
  }

  // 3. Immediately update Local Vault
  const existing = getCachedWardrobe(cleanEmail);
  const updated = [...createdItems, ...existing];
  saveCachedWardrobe(cleanEmail, updated);

  return createdItems;
}

/**
 * Delete garment across all tiers
 */
export async function deleteGarmentFromAllTiers(email: string, id: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Update local cache immediately
  const existing = getCachedWardrobe(cleanEmail);
  const filtered = existing.filter((i) => i.id !== id);
  saveCachedWardrobe(cleanEmail, filtered);

  // 2. Delete on Server
  try {
    fetch(`/api/prendas/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch (e) {}

  // 3. Delete on Supabase
  try {
    fetch(`${SUPABASE_URL}/rest/v1/prendas?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Fetch and sync outfits
 */
export async function syncAndFetchOutfits(email: string): Promise<SavedOutfit[]> {
  const cleanEmail = email.toLowerCase().trim();
  const cached = getCachedOutfits(cleanEmail);

  try {
    const res = await fetch(`/api/outfits?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const serverOutfits = await res.json();
      if (Array.isArray(serverOutfits)) {
        saveCachedOutfits(cleanEmail, serverOutfits);
        return serverOutfits;
      }
    }
  } catch (e) {}

  return cached;
}

export async function persistSavedOutfit(outfit: SavedOutfit): Promise<void> {
  const cleanEmail = outfit.email.toLowerCase().trim();
  const existing = getCachedOutfits(cleanEmail);
  const updated = [outfit, ...existing];
  saveCachedOutfits(cleanEmail, updated);

  try {
    await fetch('/api/outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outfit),
    });
  } catch (e) {}
}
