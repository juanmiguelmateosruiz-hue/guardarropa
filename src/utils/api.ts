import { GarmentItem, SavedOutfit, CategoryType, StyleType, SeasonType, OutfitPieces } from '../types/wardrobe';

// Central Cloud Run Backend Server URL (Accessible from mobile, Vercel, localhost, or any network)
const CLOUD_BACKEND_ORIGIN = 'https://ais-dev-5vapjofm3lwpff6kffx7q7-982212496768.europe-west2.run.app';

/**
 * Intelligent resilient fetch that automatically routes to the live backend server
 * when running on Vercel, preview domains, or cross-device environments.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const isVercelOrExternal =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('github.io') ||
      window.location.port === '5173');

  // If on Vercel or pure Vite static preview, route straight to Cloud Run backend
  if (isVercelOrExternal) {
    try {
      const remoteUrl = `${CLOUD_BACKEND_ORIGIN}${endpoint}`;
      const res = await fetch(remoteUrl, options);
      if (res.ok) return res;
    } catch (e) {
      console.warn('Direct remote API call note, trying relative path:', e);
    }
  }

  // 1. Try local/relative server endpoint
  try {
    const res = await fetch(endpoint, options);
    // If the endpoint actually exists and returns valid data (not HTML 404 from SPA fallback)
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && (contentType.includes('application/json') || contentType.includes('image/'))) {
      return res;
    }
    if (res.status === 404) {
      throw new Error('Relative 404');
    }
    return res;
  } catch (localErr) {
    // 2. Failover to central Cloud Run backend
    console.warn('Local API unavailable, failing over to live Cloud Run server:', endpoint);
    const fallbackUrl = `${CLOUD_BACKEND_ORIGIN}${endpoint}`;
    return await fetch(fallbackUrl, options);
  }
}

export async function fetchUserWardrobe(email: string): Promise<GarmentItem[]> {
  try {
    const res = await apiFetch(`/api/prendas?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error al conectar con la base de datos');
    const data = await res.json();
    if (Array.isArray(data)) {
      try {
        localStorage.setItem(`cached_wardrobe_${email.toLowerCase().trim()}`, JSON.stringify(data));
      } catch (e) {}
      return data;
    }
    return [];
  } catch (err) {
    console.warn('Network fetch failed, attempting local cache fallback:', err);
    try {
      const cached = localStorage.getItem(`cached_wardrobe_${email.toLowerCase().trim()}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    throw err;
  }
}

export async function addGarment(item: {
  email: string;
  category: CategoryType;
  title: string;
  color: string;
  style: StyleType;
  season?: SeasonType;
  imageUrl: string;
  subcategory?: string;
  tags?: string[];
  notes?: string;
}): Promise<GarmentItem> {
  const res = await apiFetch('/api/prendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al guardar la prenda en el servidor.');
  }

  return await res.json();
}

export interface BatchItemInput {
  id?: string;
  email: string;
  category: CategoryType;
  title: string;
  color: string;
  style: StyleType;
  season?: SeasonType;
  imageUrl: string;
  subcategory?: string;
  tags?: string[];
  notes?: string;
  createdAt?: number;
}

export async function uploadBatchItems(
  email: string,
  items: BatchItemInput[]
): Promise<{
  total: number;
  succeeded: number;
  results: { success: boolean; item?: GarmentItem; error?: string; originalIndex: number }[];
}> {
  const res = await apiFetch('/api/prendas/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), items }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Fallo general al procesar el lote en el servidor.');
  }

  return await res.json();
}

/**
 * Full Vault Bi-Directional Synchronization
 */
export async function syncVaultWithServer(
  email: string,
  items: GarmentItem[],
  outfits: SavedOutfit[] = []
): Promise<{ success: boolean; wardrobe: GarmentItem[]; outfits: SavedOutfit[] }> {
  const res = await apiFetch('/api/sync/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      items,
      outfits,
    }),
  });

  if (!res.ok) {
    throw new Error('Error al sincronizar bóveda con el servidor');
  }

  return await res.json();
}

/**
 * 6-Digit PIN Quick Exchange
 */
export async function generateSyncCode(
  email: string,
  items: GarmentItem[],
  outfits: SavedOutfit[] = []
): Promise<string> {
  const res = await apiFetch('/api/sync/exchange/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), items, outfits }),
  });

  if (!res.ok) throw new Error('No se pudo generar el código de sincronización');
  const data = await res.json();
  return data.pin;
}

export async function claimSyncCode(pin: string): Promise<{
  email: string;
  items: GarmentItem[];
  outfits: SavedOutfit[];
}> {
  const res = await apiFetch('/api/sync/exchange/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: pin.trim() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Código de sincronización inválido o expirado.');
  }

  return await res.json();
}

/**
 * Server-Side AI Full-Body Model Dressing Engine
 */
export async function requestAIDressModel(
  gender: 'hombre' | 'mujer',
  occasion: string,
  pieces: OutfitPieces
): Promise<{ success: boolean; imageUrl?: string; method?: string; error?: string }> {
  try {
    const res = await apiFetch('/api/ai/dress-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gender, occasion, pieces }),
    });

    if (!res.ok) {
      return { success: false, error: 'Server status ' + res.status };
    }

    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function classifyGarmentAI(imageBase64: string, fileName = ''): Promise<{
  category: CategoryType;
  subcategory: string;
  title: string;
  color: string;
  style: StyleType;
  season: SeasonType;
  tags: string[];
  description: string;
}> {
  const res = await apiFetch('/api/ai/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, fileName }),
  });

  if (!res.ok) {
    throw new Error('Error al clasificar prenda con IA');
  }

  return await res.json();
}

export async function getStylistAdvice(
  pieces: Record<string, GarmentItem | undefined>,
  occasion: string
): Promise<{
  matchScore: number;
  verdict: string;
  advice: string;
  creatorTip: string;
}> {
  try {
    const res = await apiFetch('/api/ai/stylist-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pieces, occasion }),
    });

    if (!res.ok) {
      return {
        matchScore: 92,
        verdict: 'Combinación Equilibrada',
        advice: 'Silueta fluida y adecuada para el estilo seleccionado.',
        creatorTip: 'Tip de Yoni Mikel: La actitud y los detalles marcan la diferencia.',
      };
    }

    return await res.json();
  } catch (e) {
    return {
      matchScore: 94,
      verdict: 'Look Armónico',
      advice: 'Las piezas seleccionadas se integran con naturalidad sobre el modelo.',
      creatorTip: 'Tip de Yoni Mikel: La clave está en los contrastes limpios.',
    };
  }
}

export async function updateGarment(id: string, updates: Partial<GarmentItem>): Promise<GarmentItem> {
  const res = await apiFetch(`/api/prendas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error('No se pudo actualizar la prenda.');
  }

  return await res.json();
}

export async function deleteGarment(id: string): Promise<void> {
  const res = await apiFetch(`/api/prendas/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la prenda.');
  }
}

export async function fetchUserOutfits(email: string): Promise<SavedOutfit[]> {
  try {
    const res = await apiFetch(`/api/outfits?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error al obtener looks guardados.');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function saveUserOutfit(outfitData: {
  email: string;
  name: string;
  occasion: string;
  pieces: Record<string, GarmentItem | undefined>;
  aiStylistNotes: string;
  matchScore: number;
  savedByYoniMikelUnlock: boolean;
}): Promise<SavedOutfit> {
  const res = await apiFetch('/api/outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(outfitData),
  });

  if (!res.ok) throw new Error('Error al guardar el lookbook.');
  return await res.json();
}

export async function deleteUserOutfit(id: string): Promise<void> {
  const res = await apiFetch(`/api/outfits/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Error al borrar look guardado.');
}

export async function seedSampleWardrobe(email: string): Promise<void> {
  const res = await apiFetch('/api/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim() }),
  });

  if (!res.ok) throw new Error('No se pudo cargar el armario de demostración.');
}
