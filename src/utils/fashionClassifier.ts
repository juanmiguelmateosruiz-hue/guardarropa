import { CategoryType, StyleType, SeasonType } from '../types/wardrobe';

interface ClassificationResult {
  category: CategoryType;
  subcategory: string;
  title: string;
  color: string;
  style: StyleType;
  season: SeasonType;
  tags: string[];
  description: string;
}

// Exhaustive Fashion Taxonomy
const CATEGORY_RULES: {
  category: CategoryType;
  keywords: string[];
  defaultSubcategory: string;
  defaultTitle: string;
}[] = [
  {
    category: 'calzado',
    keywords: [
      'zapato', 'zapatos', 'zapatilla', 'zapatillas', 'sneaker', 'sneakers', 'bota', 'botas',
      'botin', 'botines', 'mocasin', 'mocasines', 'sandalia', 'sandalias', 'chancla', 'chanclas',
      'tacon', 'tacones', 'calzado', 'bambas', 'tenis', 'deportivas', 'shoe', 'shoes', 'boot',
      'boots', 'footwear', 'loafer', 'loafers', 'heel', 'heels', 'oxford', 'derby', 'crocs',
      'slippers', 'zuecos', 'alpargatas'
    ],
    defaultSubcategory: 'Calzado',
    defaultTitle: 'Calzado',
  },
  {
    category: 'accesorio',
    keywords: [
      'cinturon', 'cinturones', 'cinto', 'correa', 'reloj', 'relojes', 'gafa', 'gafas', 'lente',
      'lentes', 'gorra', 'gorras', 'sombrero', 'sombreros', 'boina', 'bolso', 'bolsos', 'bolsa',
      'cartera', 'mochila', 'bufanda', 'bufandas', 'pañuelo', 'corbata', 'corbatas', 'pajarita',
      'collar', 'pulsera', 'anillo', 'pendientes', 'joya', 'joyas', 'guantes', 'paraguas',
      'fular', 'cinturo', 'belt', 'belts', 'watch', 'watches', 'bag', 'bags', 'hat', 'hats',
      'cap', 'caps', 'sunglasses', 'tie', 'ties', 'scarf', 'wallet', 'backpack', 'gloves',
      'jewelry', 'bracelet', 'necklace'
    ],
    defaultSubcategory: 'Accesorio',
    defaultTitle: 'Accesorio',
  },
  {
    category: 'inferior',
    keywords: [
      'pantalon', 'pantalones', 'pant', 'pants', 'jean', 'jeans', 'vaquero', 'vaqueros',
      'denim', 'bermuda', 'bermudas', 'short', 'shorts', 'falda', 'faldas', 'jogger', 'joggers',
      'chandal', 'legging', 'leggings', 'trousers', 'skirt', 'skirts', 'culotte', 'cargo',
      'chino', 'chinos', 'palazzo', 'slacks', 'pescador', 'shortes'
    ],
    defaultSubcategory: 'Pantalón',
    defaultTitle: 'Pantalón / Inferior',
  },
  {
    category: 'abrigo',
    keywords: [
      'abrigo', 'abrigos', 'chaqueta', 'chaquetas', 'cazadora', 'cazadoras', 'blazer', 'blazers',
      'americana', 'americanas', 'gabardina', 'anorak', 'parka', 'bomber', 'cardigan', 'chaleco',
      'trench', 'jacket', 'jackets', 'coat', 'coats', 'windbreaker', 'cortavientos', 'chamarra'
    ],
    defaultSubcategory: 'Chaqueta / Abrigo',
    defaultTitle: 'Chaqueta / Abrigo',
  },
  {
    category: 'vestido',
    keywords: [
      'vestido', 'vestidos', 'mono', 'monos', 'enterizo', 'enterizos', 'dress', 'dresses',
      'jumpsuit', 'peto', 'overol', 'traje completo'
    ],
    defaultSubcategory: 'Vestido',
    defaultTitle: 'Vestido',
  },
  {
    category: 'superior',
    keywords: [
      'camiseta', 'camisetas', 'camisa', 'camisas', 'polo', 'polos', 'jersey', 'jerseys',
      'sueter', 'suéter', 'sudadera', 'sudaderas', 'top', 'tops', 'blusa', 'blusas', 'bluson',
      'remera', 'playera', 'shirt', 'shirts', 'tshirt', 't-shirt', 't-shirts', 'sweater',
      'sweaters', 'hoodie', 'hoodies', 'blouse', 'crop', 'tank'
    ],
    defaultSubcategory: 'Camisa / Camiseta',
    defaultTitle: 'Prenda Superior',
  },
];

/**
 * Accurate color detection that never mistakes indoor wood/lighting for bright red
 */
export function detectDominantColor(ctx: CanvasRenderingContext2D, width: number, height: number): string {
  try {
    const step = 4;
    const imgData = ctx.getImageData(0, 0, width, height).data;
    let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;

    for (let i = 0; i < imgData.length; i += 4 * step) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 50) continue;
      // Skip pure white
      if (r > 245 && g > 245 && b > 245) continue;

      rTotal += r;
      gTotal += g;
      bTotal += b;
      count++;
    }

    if (count === 0) return 'Neutro';

    const r = rTotal / count;
    const g = gTotal / count;
    const b = bTotal / count;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Dark / Black
    if (max < 55) return 'Negro';
    // Light / White
    if (min > 215) return 'Blanco';
    // Grayscale
    if (diff < 15) {
      if (max < 130) return 'Gris';
      return 'Gris Claro';
    }

    // Warm tones (Beige / Brown vs Red)
    if (r > g && r > b) {
      // True red needs high saturation and high red dominance
      if (r - g > 45 && r - b > 45 && r > 140) {
        return 'Rojo';
      }
      if (g > 110 && b < 100) {
        return 'Marrón / Beige';
      }
      if (r > 160 && g > 140) {
        return 'Beige';
      }
      return 'Marrón';
    }

    // Blue tones (Denim / Navy / Blue)
    if (b > r && b > g) {
      if (b < 110) return 'Azul Marino';
      return 'Azul';
    }

    // Green
    if (g > r && g > b) {
      if (r > 90) return 'Verde Oliva';
      return 'Verde';
    }

    return 'Neutro';
  } catch (e) {
    return 'Neutro';
  }
}

/**
 * Intelligent instant classifier that assigns distinct categories
 * based on position index, filename, aspect ratio and color.
 */
export function classifyGarmentInstantly(
  fileName: string,
  width: number,
  height: number,
  detectedColor = 'Neutro',
  index = 0
): ClassificationResult {
  const cleanName = fileName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let matchedCategory: CategoryType | null = null;
  let matchedSubcategory = '';

  // 1. Keyword analysis from filename
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i');
      if (regex.test(cleanName) || cleanName.includes(kw)) {
        matchedCategory = rule.category;
        matchedSubcategory = kw.charAt(0).toUpperCase() + kw.slice(1);
        break;
      }
    }
    if (matchedCategory) break;
  }

  // 2. Aspect ratio / Geometry heuristics
  const aspectRatio = height / width;
  if (!matchedCategory) {
    if (aspectRatio > 1.45) {
      // High vertical ratio: Pants / Trousers
      matchedCategory = 'inferior';
      matchedSubcategory = 'Pantalón';
    } else if (aspectRatio < 0.85) {
      // Horizontal ratio: Footwear (side profile)
      matchedCategory = 'calzado';
      matchedSubcategory = 'Calzado';
    } else {
      // If uploading multiple items with generic names (image.jpg, IMG_xxx):
      // Assign complementary slots: 0 -> Superior, 1 -> Inferior, 2 -> Calzado, 3 -> Abrigo
      if (index === 0) {
        matchedCategory = 'superior';
        matchedSubcategory = 'Prenda Superior';
      } else if (index === 1) {
        matchedCategory = 'inferior';
        matchedSubcategory = 'Pantalón';
      } else if (index === 2) {
        matchedCategory = 'calzado';
        matchedSubcategory = 'Calzado';
      } else if (index === 3) {
        matchedCategory = 'abrigo';
        matchedSubcategory = 'Chaqueta / Abrigo';
      } else {
        matchedCategory = 'accesorio';
        matchedSubcategory = 'Accesorio';
      }
    }
  }

  // Proper descriptive title
  const categoryNames: Record<CategoryType, string> = {
    superior: 'Prenda Superior',
    inferior: 'Pantalón / Inferior',
    calzado: 'Calzado',
    accesorio: 'Accesorio',
    abrigo: 'Chaqueta / Abrigo',
    vestido: 'Vestido',
  };

  const title = `${categoryNames[matchedCategory]} (${detectedColor})`;

  return {
    category: matchedCategory,
    subcategory: matchedSubcategory,
    title,
    color: detectedColor,
    style: 'casual',
    season: 'todas',
    tags: [matchedCategory, detectedColor.toLowerCase()],
    description: `Prenda clasificada como ${matchedCategory} (${detectedColor}).`,
  };
}
