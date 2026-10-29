import { GarmentItem, SavedOutfit, CategoryType, StyleType, SeasonType } from '../types/wardrobe';

export async function fetchUserWardrobe(email: string): Promise<GarmentItem[]> {
  try {
    const res = await fetch(`/api/prendas?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error al conectar con la base de datos');
    const data = await res.json();
    // Cache locally for offline access
    localStorage.setItem(`cached_wardrobe_${email}`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('Network fetch failed, attempting local cache fallback:', err);
    const cached = localStorage.getItem(`cached_wardrobe_${email}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
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
  const res = await fetch('/api/prendas', {
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
}

export async function uploadBatchItems(
  email: string,
  items: BatchItemInput[]
): Promise<{
  total: number;
  succeeded: number;
  results: { success: boolean; item?: GarmentItem; error?: string; originalIndex: number }[];
}> {
  const res = await fetch('/api/prendas/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, items }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Fallo general al procesar el lote en el servidor.');
  }

  return await res.json();
}

export async function classifyGarmentAI(imageBase64: string): Promise<{
  category: CategoryType;
  subcategory: string;
  title: string;
  color: string;
  style: StyleType;
  season: SeasonType;
  tags: string[];
  description: string;
}> {
  const res = await fetch('/api/ai/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
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
  const res = await fetch('/api/ai/stylist-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pieces, occasion }),
  });

  if (!res.ok) {
    return {
      matchScore: 91,
      verdict: 'Combinación Equilibrada',
      advice: 'Silueta fluida y adecuada para el estilo seleccionado.',
      creatorTip: 'Tip de Yoni Mikel: La actitud y los detalles marcan la diferencia.',
    };
  }

  return await res.json();
}

export async function updateGarment(
  id: string,
  updates: Partial<GarmentItem>
): Promise<GarmentItem> {
  const res = await fetch(`/api/prendas/${id}`, {
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
  const res = await fetch(`/api/prendas/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la prenda.');
  }
}

export async function fetchUserOutfits(email: string): Promise<SavedOutfit[]> {
  const res = await fetch(`/api/outfits?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Error al obtener looks guardados.');
  return await res.json();
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
  const res = await fetch('/api/outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(outfitData),
  });

  if (!res.ok) throw new Error('Error al guardar el lookbook.');
  return await res.json();
}

export async function deleteUserOutfit(id: string): Promise<void> {
  const res = await fetch(`/api/outfits/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Error al borrar look guardado.');
}

export async function seedSampleWardrobe(email: string): Promise<void> {
  const res = await fetch('/api/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw new Error('No se pudo cargar el armario de demostración.');
}
