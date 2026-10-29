export type CategoryType = 'superior' | 'inferior' | 'calzado' | 'accesorio' | 'abrigo' | 'vestido';
export type StyleType = 'casual' | 'formal' | 'sport' | 'fiesta' | 'elegante' | 'urbano';
export type SeasonType = 'todas' | 'verano' | 'invierno' | 'primavera' | 'otoño';
export type OccasionType = 'casual' | 'formal' | 'sport' | 'fiesta' | 'oficina' | 'cita' | 'verano' | 'invierno';

export interface GarmentItem {
  id: string;
  email: string;
  category: CategoryType;
  subcategory?: string;
  title: string;
  color: string;
  style: StyleType;
  season: SeasonType;
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  notes?: string;
  createdAt: number;
}

export interface OutfitPieces {
  superior?: GarmentItem;
  inferior?: GarmentItem;
  calzado?: GarmentItem;
  accesorio?: GarmentItem;
  abrigo?: GarmentItem;
  [key: string]: GarmentItem | undefined;
}

export interface SavedOutfit {
  id: string;
  email: string;
  name: string;
  occasion: OccasionType;
  pieces: OutfitPieces;
  aiStylistNotes?: string;
  matchScore: number;
  savedByYoniMikelUnlock: boolean;
  createdAt: number;
}

export interface BatchItemProgress {
  id: string;
  fileName: string;
  fileSize: number;
  compressedSize?: number;
  previewUrl: string;
  status: 'esperando' | 'comprimiendo' | 'analizando' | 'guardando' | 'completado' | 'error';
  progress: number;
  error?: string;
  detectedData?: {
    category: CategoryType;
    subcategory: string;
    title: string;
    color: string;
    style: StyleType;
    season: SeasonType;
    tags: string[];
    description: string;
  };
  resultItem?: GarmentItem;
}
