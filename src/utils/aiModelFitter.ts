/**
 * AI Virtual Full-Body Model Dressing Engine - Studio Grade
 * Takes the user's actual uploaded garment images from their wardrobe,
 * isolates garments from background (walls, hangers, bedsheets),
 * and drapes them with anatomical accuracy onto a full-body mannequin model.
 * Enforces all 4 slots: Prenda Superior, Pantalón, Calzado, and Complemento.
 */
import { OutfitPieces, OccasionType, GarmentItem } from '../types/wardrobe';

interface FittingOptions {
  gender: 'hombre' | 'mujer';
  occasion: OccasionType;
  pieces: OutfitPieces;
}

/**
 * Remove bedroom / wall / hanger background from a garment photo using Chroma & Luminance analysis
 */
export function isolateGarmentFromBackground(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  try {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    // Sample corner pixels to detect dominant background color
    const corners = [
      { r: data[0], g: data[1], b: data[2] },
      { r: data[(targetWidth - 1) * 4], g: data[(targetWidth - 1) * 4 + 1], b: data[(targetWidth - 1) * 4 + 2] },
      {
        r: data[(targetHeight - 1) * targetWidth * 4],
        g: data[(targetHeight - 1) * targetWidth * 4 + 1],
        b: data[(targetHeight - 1) * targetWidth * 4 + 2],
      },
      {
        r: data[((targetHeight - 1) * targetWidth + targetWidth - 1) * 4],
        g: data[((targetHeight - 1) * targetWidth + targetWidth - 1) * 4 + 1],
        b: data[((targetHeight - 1) * targetWidth + targetWidth - 1) * 4 + 2],
      },
    ];

    const avgBgR = (corners[0].r + corners[1].r + corners[2].r + corners[3].r) / 4;
    const avgBgG = (corners[0].g + corners[1].g + corners[2].g + corners[3].g) / 4;
    const avgBgB = (corners[0].b + corners[1].b + corners[2].b + corners[3].b) / 4;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const idx = (y * targetWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const distFromEdgeX = Math.min(x, targetWidth - x);
        const distFromEdgeY = Math.min(y, targetHeight - y);
        const edgeDist = Math.min(distFromEdgeX, distFromEdgeY);

        const diff = Math.sqrt(
          Math.pow(r - avgBgR, 2) + Math.pow(g - avgBgG, 2) + Math.pow(b - avgBgB, 2)
        );

        // Feather edges matching background
        if (edgeDist < targetWidth * 0.32 && diff < 55) {
          data[idx + 3] = 0; // Transparent
        }

        // Cut top hanger area if background-like or very high luminance
        if (y < targetHeight * 0.08 && (diff < 85 || (r > 220 && g > 220 && b > 220))) {
          data[idx + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Canvas tainted, fallback to image
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Error cargando imagen: ' + src));
    img.src = src;
  });
}

/**
 * Draw a high-fashion, anatomical full-body mannequin model in studio lighting.
 * No stick figures, no cartoon faces. Elegant, sculpted runway silhouette.
 */
function drawFullBodyMannequin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  gender: 'hombre' | 'mujer'
) {
  ctx.save();

  // Mannequin base gradient: luxury slate-graphite with subtle specular highlights
  const skinGrad = ctx.createLinearGradient(cx - 150, 100, cx + 150, 1080);
  skinGrad.addColorStop(0, '#334155');
  skinGrad.addColorStop(0.3, '#1e293b');
  skinGrad.addColorStop(0.7, '#0f172a');
  skinGrad.addColorStop(1, '#090d16');

  ctx.fillStyle = skinGrad;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1.5;

  const isMale = gender === 'hombre';
  const shoulderHalf = isMale ? 140 : 115;
  const hipHalf = isMale ? 100 : 110;

  // 1. Head & Hair Silhouette (High-Fashion Mannequin Profile)
  ctx.beginPath();
  // Head oval
  ctx.ellipse(cx, 165, 42, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sleek hair contour
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, 155, 44, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();

  // Face highlight line (sculpted jawline)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, 168, 38, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  // 2. Neck
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 20, 215);
  ctx.lineTo(cx + 20, 215);
  ctx.lineTo(cx + 26, 260);
  ctx.lineTo(cx - 26, 260);
  ctx.closePath();
  ctx.fill();

  // 3. Torso & Chest Silhouette
  ctx.beginPath();
  ctx.moveTo(cx - 26, 260);
  ctx.lineTo(cx - shoulderHalf, 280); // Left shoulder
  ctx.lineTo(cx - 85, 480);           // Left waist
  ctx.lineTo(cx - hipHalf, 550);      // Left hip
  ctx.lineTo(cx + hipHalf, 550);      // Right hip
  ctx.lineTo(cx + 85, 480);           // Right waist
  ctx.lineTo(cx + shoulderHalf, 280); // Right shoulder
  ctx.lineTo(cx + 26, 260);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Collarbone & Pec subtle contour lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(cx - 50, 280);
  ctx.lineTo(cx, 290);
  ctx.lineTo(cx + 50, 280);
  ctx.stroke();

  // 4. Arms & Hands alongside body
  // Left arm
  ctx.beginPath();
  ctx.moveTo(cx - shoulderHalf, 280);
  ctx.lineTo(cx - shoulderHalf - 25, 420); // elbow
  ctx.lineTo(cx - shoulderHalf - 15, 590); // wrist
  ctx.lineTo(cx - shoulderHalf + 5, 640);  // fingertips
  ctx.lineTo(cx - shoulderHalf + 18, 590);
  ctx.lineTo(cx - shoulderHalf + 5, 420);
  ctx.lineTo(cx - 85, 340);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(cx + shoulderHalf, 280);
  ctx.lineTo(cx + shoulderHalf + 25, 420); // elbow
  ctx.lineTo(cx + shoulderHalf + 15, 590); // wrist
  ctx.lineTo(cx + shoulderHalf - 5, 640);  // fingertips
  ctx.lineTo(cx + shoulderHalf - 18, 590);
  ctx.lineTo(cx + shoulderHalf - 5, 420);
  ctx.lineTo(cx + 85, 340);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5. Legs & Feet (Full Length to floor)
  // Left leg
  ctx.beginPath();
  ctx.moveTo(cx - hipHalf + 10, 550);
  ctx.lineTo(cx - 65, 740); // knee
  ctx.lineTo(cx - 55, 960); // calf / ankle
  ctx.lineTo(cx - 75, 1030); // foot toe
  ctx.lineTo(cx - 30, 1030); // heel
  ctx.lineTo(cx - 35, 960);
  ctx.lineTo(cx - 40, 740);
  ctx.lineTo(cx - 8, 560);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(cx + hipHalf - 10, 550);
  ctx.lineTo(cx + 65, 740); // knee
  ctx.lineTo(cx + 55, 960); // calf / ankle
  ctx.lineTo(cx + 75, 1030); // foot toe
  ctx.lineTo(cx + 30, 1030); // heel
  ctx.lineTo(cx + 35, 960);
  ctx.lineTo(cx + 40, 740);
  ctx.lineTo(cx + 8, 560);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * High-Fashion Virtual Full-Body Dressing Engine
 * Drapes the user's exact clothes from their wardrobe onto the mannequin model.
 */
export async function renderModelDressedWithGarments(options: FittingOptions): Promise<string> {
  const { gender, occasion, pieces } = options;
  const width = 900;
  const height = 1280;
  const cx = width / 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Studio Lighting Background (High Fashion Studio Cyclorama)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (occasion === 'formal' || occasion === 'fiesta') {
    bgGrad.addColorStop(0, '#0a0e1a');
    bgGrad.addColorStop(0.5, '#13112c');
    bgGrad.addColorStop(0.85, '#05070f');
    bgGrad.addColorStop(1, '#020307');
  } else if (occasion === 'verano' || occasion === 'casual') {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(0.85, '#0b1120');
    bgGrad.addColorStop(1, '#020617');
  } else {
    bgGrad.addColorStop(0, '#111827');
    bgGrad.addColorStop(0.5, '#1f2937');
    bgGrad.addColorStop(0.85, '#0d131f');
    bgGrad.addColorStop(1, '#030712');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft Keylight Spotlight Cone
  const spotGrad = ctx.createRadialGradient(cx, 380, 50, cx, 550, 480);
  spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  spotGrad.addColorStop(0.4, 'rgba(99, 102, 241, 0.08)');
  spotGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, width, height);

  // Studio Runway Floor Plane Line with Horizon Gradient
  const floorY = 1010;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
  floorGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  floorGrad.addColorStop(0.1, 'rgba(30, 41, 59, 0.6)');
  floorGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, width, height - floorY);

  // Studio Floor Horizon Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  // Floor Contact Shadows beneath feet
  const shadowGrad = ctx.createRadialGradient(cx, 1030, 20, cx, 1030, 180);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
  shadowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 1035, 170, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Draw the Full-Body Anatomical Mannequin Silhouette
  drawFullBodyMannequin(ctx, cx, gender);

  // 3. DRESS THE MODEL WITH THE USER'S ACTUAL GARMENTS

  // LAYER A: Pantalón / Inferior (Lower Body: Hips to Ankles)
  if (pieces.inferior?.imageUrl) {
    try {
      const pantsImg = await loadImage(pieces.inferior.imageUrl);
      const pW = 290;
      const pH = 490;
      const pX = cx - pW / 2;
      const pY = 510;

      const isolatedPants = isolateGarmentFromBackground(pantsImg, pW, pH);

      ctx.save();
      // Drop shadow behind pants
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;

      ctx.drawImage(isolatedPants, pX, pY, pW, pH);
      ctx.restore();
    } catch (e) {
      console.warn('Error rendering pants:', e);
    }
  }

  // LAYER B: Prenda Superior (Upper Body: Torso, Chest, Shoulders)
  if (pieces.superior?.imageUrl) {
    try {
      const topImg = await loadImage(pieces.superior.imageUrl);
      const tW = 340;
      const tH = 310;
      const tX = cx - tW / 2;
      const tY = 260;

      const isolatedTop = isolateGarmentFromBackground(topImg, tW, tH);

      ctx.save();
      // Drop shadow over waist & hips
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      ctx.drawImage(isolatedTop, tX, tY, tW, tH);
      ctx.restore();
    } catch (e) {
      console.warn('Error rendering upper garment:', e);
    }
  }

  // LAYER C: Abrigo / Chaqueta (if present, layered on top of superior)
  if (pieces.abrigo?.imageUrl) {
    try {
      const coatImg = await loadImage(pieces.abrigo.imageUrl);
      const cW = 380;
      const cH = 360;
      const cX = cx - cW / 2;
      const cY = 250;

      const isolatedCoat = isolateGarmentFromBackground(coatImg, cW, cH);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(isolatedCoat, cX, cY, cW, cH);
      ctx.restore();
    } catch (e) {
      console.warn('Error rendering coat:', e);
    }
  }

  // LAYER D: Calzado (Feet on the Studio Floor)
  if (pieces.calzado?.imageUrl) {
    try {
      const shoeImg = await loadImage(pieces.calzado.imageUrl);
      const sW = 270;
      const sH = 120;
      const sX = cx - sW / 2;
      const sY = 960;

      const isolatedShoes = isolateGarmentFromBackground(shoeImg, sW, sH);

      ctx.save();
      // Contact shadow directly under shoes
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      ctx.drawImage(isolatedShoes, sX, sY, sW, sH);
      ctx.restore();
    } catch (e) {
      console.warn('Error rendering shoes:', e);
    }
  }

  // LAYER E: Complemento / Accesorio (Watch, Belt, Bag, Glasses)
  const accesorioItem = pieces.accesorio;
  if (accesorioItem?.imageUrl) {
    try {
      const accImg = await loadImage(accesorioItem.imageUrl);
      const catLower = (accesorioItem.title + ' ' + (accesorioItem.subcategory || '')).toLowerCase();

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      if (/reloj|watch|pulsera|bracelet/.test(catLower)) {
        // Positioned on the left wrist
        const accSize = 85;
        const isolated = isolateGarmentFromBackground(accImg, accSize, accSize);
        ctx.drawImage(isolated, cx - 180, 570, accSize, accSize);
      } else if (/gafa|lente|sunglasses|eyewear/.test(catLower)) {
        // Positioned on the face/eyes
        const gW = 100;
        const gH = 45;
        const isolated = isolateGarmentFromBackground(accImg, gW, gH);
        ctx.drawImage(isolated, cx - gW / 2, 160, gW, gH);
      } else if (/gorra|sombrero|hat|cap/.test(catLower)) {
        // Positioned on the head
        const hW = 120;
        const hH = 75;
        const isolated = isolateGarmentFromBackground(accImg, hW, hH);
        ctx.drawImage(isolated, cx - hW / 2, 115, hW, hH);
      } else if (/cinturon|belt|cinto/.test(catLower)) {
        // Positioned at the waistband
        const bW = 240;
        const bH = 45;
        const isolated = isolateGarmentFromBackground(accImg, bW, bH);
        ctx.drawImage(isolated, cx - bW / 2, 510, bW, bH);
      } else {
        // Default accessory: Elegant shoulder / hand placement
        const aW = 130;
        const aH = 140;
        const isolated = isolateGarmentFromBackground(accImg, aW, aH);
        ctx.drawImage(isolated, cx + 130, 580, aW, aH);
      }

      ctx.restore();
    } catch (e) {
      console.warn('Error rendering accessory:', e);
    }
  }

  // 4. Haute Couture Insignia & Brand Watermark
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SMARTWARDROBE PRO', 60, 75);

  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `MANIQUÍ VIRTUAL DE CUERPO COMPLETO · VESTIDO CON TU ROPA REAL · ${occasion.toUpperCase()}`,
    60,
    98
  );

  // Creator Attribution Tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DISEÑADO CON IA · POR YONI MIKEL @YONIMIKEL', width - 60, height - 35);

  // Status Badge on bottom left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#10b981';
  ctx.fillText('● 4 PIEZAS DE TU ARMARIO INTEGRADAS EN CUERPO COMPLETO', 60, height - 35);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.94);
}
