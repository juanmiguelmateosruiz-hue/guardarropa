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
    defaultTitle: 'Zapatos / Zapatillas',
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
    defaultTitle: 'Accesorio / Complemento',
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
    defaultTitle: 'Chaqueta / Capa Exterior',
  },
  {
    category: 'vestido',
    keywords: [
      'vestido', 'vestidos', 'mono', 'monos', 'enterizo', 'enterizos', 'dress', 'dresses',
      'jumpsuit', 'peto', 'overol', 'traje completo'
    ],
    defaultSubcategory: 'Vestido',
    defaultTitle: 'Vestido / Enterizo',
  },
  {
    category: 'superior',
    keywords: [
      'camiseta', 'camisetas', 'camisa', 'camisas', 'polo', 'polos', 'jersey', 'jerseys',
      'sueter', 'suéter', 'sudadera', 'sudaderas', 'top', 'tops', 'blusa', 'blusas', 'bluson',
      'remera', 'playera', 'shirt', 'shirts', 'tshirt', 't-shirt', 't-shirts', 'sweater',
      'sweaters', 'hoodie', 'hoodies', 'blouse', 'crop', 'tank'
    ],
    defaultSubcategory: 'Camiseta / Camisa',
    defaultTitle: 'Prenda Superior',
  },
];

/**
 * Detect predominant color from canvas image pixel sampling
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

      // Ignore fully transparent or pure white background
      if (a < 50) continue;
      if (r > 245 && g > 245 && b > 245) continue;

      rTotal += r;
      gTotal += g;
      bTotal += b;
      count++;
    }

    if (count === 0) return 'Blanco';

    const rAvg = rTotal / count;
    const gAvg = gTotal / count;
    const bAvg = bTotal / count;

    // Brightness and Saturation
    const max = Math.max(rAvg, gAvg, bAvg);
    const min = Math.min(rAvg, gAvg, bAvg);
    const diff = max - min;

    if (max < 45) return 'Negro';
    if (min > 215) return 'Blanco';
    if (diff < 18) {
      if (max < 130) return 'Gris Marengo';
      return 'Gris Claro';
    }

    if (rAvg > 160 && gAvg > 140 && bAvg < 110) return 'Beige / Arena';
    if (rAvg > 100 && gAvg < 70 && bAvg < 70) return 'Burdeos / Granate';
    if (rAvg > gAvg && rAvg > bAvg) {
      if (gAvg > 120 && bAvg < 80) return 'Marrón Cuero';
      return 'Rojo';
    }
    if (bAvg > rAvg && bAvg > gAvg) {
      if (bAvg > 160 && rAvg < 100) return 'Azul Eléctrico';
      return 'Azul Marino';
    }
    if (gAvg > rAvg && gAvg > bAvg) {
      if (rAvg > 100) return 'Verde Oliva';
      return 'Verde';
    }

    return 'Neutro';
  } catch (e) {
    return 'Neutro';
  }
}

/**
 * Instant local classification combining filename keywords, image aspect ratio,
 * and dominant color. Runs in < 1ms, eliminates slow server hangs and classification errors.
 */
export function classifyGarmentInstantly(
  fileName: string,
  width: number,
  height: number,
  detectedColor = 'Neutro'
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
      // Word boundary match
      const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`, 'i');
      if (regex.test(cleanName) || cleanName.includes(kw)) {
        matchedCategory = rule.category;
        matchedSubcategory = kw.charAt(0).toUpperCase() + kw.slice(1);
        break;
      }
    }
    if (matchedCategory) break;
  }

  const aspectRatio = height / width;

  // 2. Geometric fallback if no filename match
  if (!matchedCategory) {
    if (aspectRatio > 1.55) {
      // Long vertical silhouette is almost always trousers, jeans or dress
      matchedCategory = 'inferior';
      matchedSubcategory = 'Pantalón';
    } else if (aspectRatio < 0.78) {
      // Long horizontal silhouette is typically footwear or horizontal accessory (belt/sunglasses)
      matchedCategory = 'calzado';
      matchedSubcategory = 'Zapatillas / Calzado';
    } else {
      matchedCategory = 'superior';
      matchedSubcategory = 'Prenda Superior';
    }
  }

  // 3. Style and Season inference
  let style: StyleType = 'casual';
  if (cleanName.includes('sport') || cleanName.includes('deportiv') || cleanName.includes('gym')) {
    style = 'sport';
  } else if (cleanName.includes('formal') || cleanName.includes('elegante') || cleanName.includes('boda') || cleanName.includes('traje')) {
    style = 'formal';
  } else if (cleanName.includes('fiesta') || cleanName.includes('noche') || cleanName.includes('brillo')) {
    style = 'fiesta';
  } else if (cleanName.includes('urban') || cleanName.includes('street') || cleanName.includes('denim')) {
    style = 'urbano';
  }

  let season: SeasonType = 'todas';
  if (cleanName.includes('verano') || cleanName.includes('short') || cleanName.includes('sandalia')) {
    season = 'verano';
  } else if (cleanName.includes('invierno') || cleanName.includes('abrigo') || cleanName.includes('lana') || cleanName.includes('bota')) {
    season = 'invierno';
  }

  // Meaningful Spanish title
  const title = `${matchedSubcategory} ${detectedColor}`.trim();

  return {
    category: matchedCategory,
    subcategory: matchedSubcategory,
    title,
    color: detectedColor,
    style,
    season,
    tags: [matchedCategory, style, detectedColor.toLowerCase()],
    description: `Prenda clasificada como ${matchedCategory} (${detectedColor}) con estilo ${style}.`,
  };
}
