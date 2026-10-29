import { OccasionType } from '../types/wardrobe';

export interface FashionModelLook {
  id: string;
  gender: 'hombre' | 'mujer';
  occasion: OccasionType;
  modelName: string;
  setting: string;
  imageUrl: string;
  lighting: string;
  fitNotes: string;
}

export const FASHION_MODEL_LOOKS: Record<string, FashionModelLook> = {
  // CASUAL
  'casual_hombre': {
    id: 'casual_hombre',
    gender: 'hombre',
    occasion: 'casual',
    modelName: 'Leo (1.86m · Talla M / 42)',
    setting: 'Estudio de Moda Minimalista',
    imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz difusa de estudio 5600K',
    fitNotes: 'Ajuste regular fit cómodo con drapeado natural de algodón y calzado limpio.',
  },
  'casual_mujer': {
    id: 'casual_mujer',
    gender: 'mujer',
    occasion: 'casual',
    modelName: 'Elena (1.75m · Talla S / 38)',
    setting: 'Estudio Editorial Luz Natural',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz cenital suave de pasarela',
    fitNotes: 'Corte relajado de temporada, proporciones estilizadas y caída fluida.',
  },

  // FORMAL
  'formal_hombre': {
    id: 'formal_hombre',
    gender: 'hombre',
    occasion: 'formal',
    modelName: 'Adrián (1.88m · Talla L / 50)',
    setting: 'Set Ejecutivo & Sastrería',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85',
    lighting: 'Iluminación de contraste sastre italiano',
    fitNotes: 'Hombros estructurados, tiro medio recto y mocasines de cuero pulidos.',
  },
  'formal_mujer': {
    id: 'formal_mujer',
    gender: 'mujer',
    occasion: 'formal',
    modelName: 'Valeria (1.78m · Talla S / 36)',
    setting: 'Estudio Arquitectónico',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz direccional elegante',
    fitNotes: 'Líneas limpias ejecutivas de alta costura con silueta estilizada.',
  },

  // SPORT
  'sport_hombre': {
    id: 'sport_hombre',
    gender: 'hombre',
    occasion: 'sport',
    modelName: 'Marc (1.82m · Talla M / 40)',
    setting: 'Espacio Dinámico Athleisure',
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz activa de alta velocidad',
    fitNotes: 'Tejido elástico de alto rendimiento con transpirabilidad y sneakers técnicos.',
  },
  'sport_mujer': {
    id: 'sport_mujer',
    gender: 'mujer',
    occasion: 'sport',
    modelName: 'Sofía (1.73m · Talla S / 36)',
    setting: 'Estudio de Alto Rendimiento',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz natural contrastada',
    fitNotes: 'Conjunto deportivo de compresión óptima y libertad total de movimiento.',
  },

  // FIESTA
  'fiesta_hombre': {
    id: 'fiesta_hombre',
    gender: 'hombre',
    occasion: 'fiesta',
    modelName: 'Christian (1.85m · Talla M / 42)',
    setting: 'Atmósfera Nocturna & Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85',
    lighting: 'Iluminación cálida dorada de noche',
    fitNotes: 'Acabados satinados oscuros, contrastes de brillo y presencia magnética.',
  },
  'fiesta_mujer': {
    id: 'fiesta_mujer',
    gender: 'mujer',
    occasion: 'fiesta',
    modelName: 'Carmen (1.76m · Talla S / 38)',
    setting: 'Gala / Pasarela Nocturna',
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=900&q=85',
    lighting: 'Focos de pasarela con destellos',
    fitNotes: 'Silueta entallada de impacto visual con accesorios brillantes.',
  },

  // OFICINA
  'oficina_hombre': {
    id: 'oficina_hombre',
    gender: 'hombre',
    occasion: 'oficina',
    modelName: 'Mateo (1.83m · Talla M / 42)',
    setting: 'Espacio de Trabajo Contemporáneo',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz suave de oficinas corporativas',
    fitNotes: 'Smart-casual equilibrado con camisa abotonada y pantalón chino a tono.',
  },
  'oficina_mujer': {
    id: 'oficina_mujer',
    gender: 'mujer',
    occasion: 'oficina',
    modelName: 'Lucía (1.74m · Talla M / 38)',
    setting: 'Estudio Minimalista Profesional',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz neutra nítida',
    fitNotes: 'Elegancia sobria para reuniones y jornada profesional con confort.',
  },

  // CITA
  'cita_hombre': {
    id: 'cita_hombre',
    gender: 'hombre',
    occasion: 'cita',
    modelName: 'Álex (1.84m · Talla M / 42)',
    setting: 'Terraza Atardecer / Golden Hour',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz dorada cálida atardecer',
    fitNotes: 'Look seductor y pulido, corte moderno con detalles cuidados.',
  },
  'cita_mujer': {
    id: 'cita_mujer',
    gender: 'mujer',
    occasion: 'cita',
    modelName: 'Diana (1.75m · Talla S / 36)',
    setting: 'Ambiente Cálido Bistro',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz ambiental suave',
    fitNotes: 'Armonía femenina romántica con drapeado favorecedor y porte natural.',
  },

  // INVIERNO
  'invierno_hombre': {
    id: 'invierno_hombre',
    gender: 'hombre',
    occasion: 'invierno',
    modelName: 'David (1.87m · Talla L / 50)',
    setting: 'Estudio Editorial Nórdico',
    imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz fría natural de invierno',
    fitNotes: 'Capas estructuradas de lana y abrigo térmico con volumen elegante.',
  },
  'invierno_mujer': {
    id: 'invierno_mujer',
    gender: 'mujer',
    occasion: 'invierno',
    modelName: 'Nadia (1.77m · Talla S / 38)',
    setting: 'Exterior Ciudad Invernal',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz suave difusa de invierno',
    fitNotes: 'Abrigo envolvente con cuello alzado y botas altas protectoras.',
  },

  // VERANO
  'verano_hombre': {
    id: 'verano_hombre',
    gender: 'hombre',
    occasion: 'verano',
    modelName: 'Lucas (1.81m · Talla M / 40)',
    setting: 'Costa / Espacio Luminoso',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85',
    lighting: 'Sol radiante mediterráneo',
    fitNotes: 'Tejido de lino transpirable, corte ligero y frescura total para días cálidos.',
  },
  'verano_mujer': {
    id: 'verano_mujer',
    gender: 'mujer',
    occasion: 'verano',
    modelName: 'Mía (1.72m · Talla S / 36)',
    setting: 'Playa & Jardín Soleado',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
    lighting: 'Luz solar natural estival',
    fitNotes: 'Prendas vaporosas de verano en tonos claros que reflejan la luz.',
  },
};
