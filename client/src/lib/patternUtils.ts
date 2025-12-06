/**
 * Client-side seamless pattern generation utilities
 * Implements multiple tiling algorithms for AOP (All-Over Print) designs
 */

export interface PatternVariation {
  id: string;
  name: string;
  description: string;
  url: string;
  isRecommended: boolean;
}

/**
 * Creates an off-screen canvas for pattern manipulation
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Loads an image from a data URL or regular URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Offset & Blend - Classic seamless tiling with edge blending
 * Splits the image into quarters and rearranges them so edges meet in the center
 * Then applies color-based gradient blending at the seams (not alpha)
 */
export async function generateOffsetBlend(imageSrc: string): Promise<string> {
  const img = await loadImage(imageSrc);
  const size = Math.min(img.width, img.height);
  const halfSize = size / 2;
  
  // Create the offset canvas with swapped quadrants
  const offsetCanvas = createCanvas(size, size);
  const offsetCtx = offsetCanvas.getContext('2d')!;
  
  // Draw original image cropped to square
  const sourceX = (img.width - size) / 2;
  const sourceY = (img.height - size) / 2;
  
  // Quarter offsets - swap quadrants so edges meet in center
  offsetCtx.drawImage(img, sourceX + halfSize, sourceY + halfSize, halfSize, halfSize, 0, 0, halfSize, halfSize);
  offsetCtx.drawImage(img, sourceX, sourceY + halfSize, halfSize, halfSize, halfSize, 0, halfSize, halfSize);
  offsetCtx.drawImage(img, sourceX + halfSize, sourceY, halfSize, halfSize, 0, halfSize, halfSize, halfSize);
  offsetCtx.drawImage(img, sourceX, sourceY, halfSize, halfSize, halfSize, halfSize, halfSize, halfSize);
  
  // Get the offset image data for color blending
  const offsetData = offsetCtx.getImageData(0, 0, size, size);
  const data = offsetData.data;
  
  // Blend width for the center cross (15% of size for smoother transition)
  const blendWidth = Math.floor(size * 0.15);
  
  // Create a copy of original data for sampling during blend
  const originalData = new Uint8ClampedArray(data);
  
  // Apply color-based blending at horizontal center seam (blend top/bottom)
  for (let y = Math.floor(halfSize - blendWidth); y < Math.floor(halfSize + blendWidth); y++) {
    // Calculate blend factor: 0 at edges of blend zone, 1 at center
    const distFromCenter = Math.abs(y - halfSize);
    const blendFactor = 1 - (distFromCenter / blendWidth);
    
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Sample from corresponding position on opposite side of seam
      const oppositeY = y < halfSize ? y + halfSize : y - halfSize;
      const oppositeIdx = (oppositeY * size + x) * 4;
      
      // Blend RGB channels (keep alpha at 255 for opaque output)
      data[idx] = Math.floor(originalData[idx] * (1 - blendFactor * 0.5) + originalData[oppositeIdx] * blendFactor * 0.5);
      data[idx + 1] = Math.floor(originalData[idx + 1] * (1 - blendFactor * 0.5) + originalData[oppositeIdx + 1] * blendFactor * 0.5);
      data[idx + 2] = Math.floor(originalData[idx + 2] * (1 - blendFactor * 0.5) + originalData[oppositeIdx + 2] * blendFactor * 0.5);
      data[idx + 3] = 255; // Ensure full opacity
    }
  }
  
  // Update original data with horizontal blend results
  for (let i = 0; i < data.length; i++) {
    originalData[i] = data[i];
  }
  
  // Apply color-based blending at vertical center seam (blend left/right)
  for (let x = Math.floor(halfSize - blendWidth); x < Math.floor(halfSize + blendWidth); x++) {
    const distFromCenter = Math.abs(x - halfSize);
    const blendFactor = 1 - (distFromCenter / blendWidth);
    
    for (let y = 0; y < size; y++) {
      const idx = (y * size + x) * 4;
      
      // Sample from corresponding position on opposite side of seam
      const oppositeX = x < halfSize ? x + halfSize : x - halfSize;
      const oppositeIdx = (y * size + oppositeX) * 4;
      
      // Blend RGB channels
      data[idx] = Math.floor(originalData[idx] * (1 - blendFactor * 0.5) + originalData[oppositeIdx] * blendFactor * 0.5);
      data[idx + 1] = Math.floor(originalData[idx + 1] * (1 - blendFactor * 0.5) + originalData[oppositeIdx + 1] * blendFactor * 0.5);
      data[idx + 2] = Math.floor(originalData[idx + 2] * (1 - blendFactor * 0.5) + originalData[oppositeIdx + 2] * blendFactor * 0.5);
      data[idx + 3] = 255; // Ensure full opacity
    }
  }
  
  offsetCtx.putImageData(offsetData, 0, 0);
  
  return offsetCanvas.toDataURL('image/png');
}

/**
 * Mirror Symmetry - Creates kaleidoscopic pattern through mirroring
 * Takes one quadrant and mirrors it in all 4 directions
 */
export async function generateMirrorSymmetry(imageSrc: string): Promise<string> {
  const img = await loadImage(imageSrc);
  const size = Math.min(img.width, img.height);
  const halfSize = size / 2;
  
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  
  // Source quadrant (top-left of original)
  const sourceX = (img.width - size) / 2;
  const sourceY = (img.height - size) / 2;
  
  // Top-left: normal
  ctx.drawImage(img, sourceX, sourceY, halfSize, halfSize, 0, 0, halfSize, halfSize);
  
  // Top-right: flip horizontal
  ctx.save();
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, sourceX, sourceY, halfSize, halfSize, 0, 0, halfSize, halfSize);
  ctx.restore();
  
  // Bottom-left: flip vertical
  ctx.save();
  ctx.translate(0, size);
  ctx.scale(1, -1);
  ctx.drawImage(img, sourceX, sourceY, halfSize, halfSize, 0, 0, halfSize, halfSize);
  ctx.restore();
  
  // Bottom-right: flip both
  ctx.save();
  ctx.translate(size, size);
  ctx.scale(-1, -1);
  ctx.drawImage(img, sourceX, sourceY, halfSize, halfSize, 0, 0, halfSize, halfSize);
  ctx.restore();
  
  return canvas.toDataURL('image/png');
}

/**
 * Graph-Cut - Simulates texture synthesis by sampling and blending patches
 * Creates a seamless tile by intelligently combining image regions
 */
export async function generateGraphCut(imageSrc: string): Promise<string> {
  const img = await loadImage(imageSrc);
  const size = Math.min(img.width, img.height);
  
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  
  // Draw base image centered
  const sourceX = (img.width - size) / 2;
  const sourceY = (img.height - size) / 2;
  ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, size, size);
  
  // Create overlapping patches for seamless edges
  const patchSize = size * 0.3;
  const overlap = patchSize * 0.5;
  
  // Blend edges with opposite side patches
  ctx.globalAlpha = 0.5;
  
  // Right edge blends with left
  ctx.drawImage(canvas, 0, 0, patchSize, size, size - overlap, 0, patchSize, size);
  
  // Bottom edge blends with top
  ctx.drawImage(canvas, 0, 0, size, patchSize, 0, size - overlap, size, patchSize);
  
  ctx.globalAlpha = 1.0;
  
  // Apply edge gradient for smoother transitions
  const gradient = ctx.createLinearGradient(size - patchSize, 0, size, 0);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillRect(size - patchSize, 0, patchSize, size);
  ctx.globalCompositeOperation = 'source-over';
  
  return canvas.toDataURL('image/png');
}

/**
 * Edge Average - Blends edges by averaging pixel colors at boundaries
 * Creates smooth transitions by gradually blending edge pixels
 */
export async function generateEdgeAverage(imageSrc: string): Promise<string> {
  const img = await loadImage(imageSrc);
  const size = Math.min(img.width, img.height);
  
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  
  // Draw base image
  const sourceX = (img.width - size) / 2;
  const sourceY = (img.height - size) / 2;
  ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, size, size);
  
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  const blendZone = Math.floor(size * 0.15);
  
  // Average left and right edges
  for (let y = 0; y < size; y++) {
    for (let i = 0; i < blendZone; i++) {
      const leftIdx = (y * size + i) * 4;
      const rightIdx = (y * size + (size - 1 - i)) * 4;
      const factor = i / blendZone;
      
      // Blend towards the average
      const avgR = (data[leftIdx] + data[rightIdx]) / 2;
      const avgG = (data[leftIdx + 1] + data[rightIdx + 1]) / 2;
      const avgB = (data[leftIdx + 2] + data[rightIdx + 2]) / 2;
      
      data[leftIdx] = Math.floor(data[leftIdx] * factor + avgR * (1 - factor));
      data[leftIdx + 1] = Math.floor(data[leftIdx + 1] * factor + avgG * (1 - factor));
      data[leftIdx + 2] = Math.floor(data[leftIdx + 2] * factor + avgB * (1 - factor));
      
      data[rightIdx] = Math.floor(data[rightIdx] * factor + avgR * (1 - factor));
      data[rightIdx + 1] = Math.floor(data[rightIdx + 1] * factor + avgG * (1 - factor));
      data[rightIdx + 2] = Math.floor(data[rightIdx + 2] * factor + avgB * (1 - factor));
    }
  }
  
  // Average top and bottom edges
  for (let x = 0; x < size; x++) {
    for (let i = 0; i < blendZone; i++) {
      const topIdx = (i * size + x) * 4;
      const bottomIdx = ((size - 1 - i) * size + x) * 4;
      const factor = i / blendZone;
      
      const avgR = (data[topIdx] + data[bottomIdx]) / 2;
      const avgG = (data[topIdx + 1] + data[bottomIdx + 1]) / 2;
      const avgB = (data[topIdx + 2] + data[bottomIdx + 2]) / 2;
      
      data[topIdx] = Math.floor(data[topIdx] * factor + avgR * (1 - factor));
      data[topIdx + 1] = Math.floor(data[topIdx + 1] * factor + avgG * (1 - factor));
      data[topIdx + 2] = Math.floor(data[topIdx + 2] * factor + avgB * (1 - factor));
      
      data[bottomIdx] = Math.floor(data[bottomIdx] * factor + avgR * (1 - factor));
      data[bottomIdx + 1] = Math.floor(data[bottomIdx + 1] * factor + avgG * (1 - factor));
      data[bottomIdx + 2] = Math.floor(data[bottomIdx + 2] * factor + avgB * (1 - factor));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL('image/png');
}

/**
 * Generate all pattern variations from an uploaded image
 */
export async function generateAllPatternVariations(imageSrc: string): Promise<PatternVariation[]> {
  try {
    const [offsetBlend, mirror, graphCut, edgeAverage] = await Promise.all([
      generateOffsetBlend(imageSrc),
      generateMirrorSymmetry(imageSrc),
      generateGraphCut(imageSrc),
      generateEdgeAverage(imageSrc)
    ]);
    
    return [
      { 
        id: 'offset_blend', 
        name: 'Offset & Blend', 
        description: 'Classic seamless tile', 
        url: offsetBlend, 
        isRecommended: true 
      },
      { 
        id: 'mirror', 
        name: 'Mirror Symmetry', 
        description: 'Kaleidoscopic effect', 
        url: mirror, 
        isRecommended: false 
      },
      { 
        id: 'graph_cut', 
        name: 'Graph-Cut', 
        description: 'Advanced texture synthesis', 
        url: graphCut, 
        isRecommended: false 
      },
      { 
        id: 'edge_average', 
        name: 'Edge Average', 
        description: 'Smooth edge blending', 
        url: edgeAverage, 
        isRecommended: false 
      },
      { 
        id: 'ai_enhanced', 
        name: 'AI Enhanced', 
        description: 'Creative AI-generated pattern (slower)', 
        url: '', 
        isRecommended: false 
      }
    ];
  } catch (error) {
    console.error('Failed to generate pattern variations:', error);
    throw error;
  }
}

/**
 * Download a pattern as a texture file
 */
export function downloadTexture(
  patternUrl: string, 
  scale: number, 
  filename: string = 'seamless-texture.png'
): void {
  const link = document.createElement('a');
  link.href = patternUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Create a tiled preview canvas at a specific scale
 */
export async function createTiledPreview(
  patternUrl: string,
  scale: number,
  outputSize: number = 512
): Promise<string> {
  const img = await loadImage(patternUrl);
  const canvas = createCanvas(outputSize, outputSize);
  const ctx = canvas.getContext('2d')!;
  
  // Scale determines tile size (1-100, where 100 = largest tiles)
  const tileSize = (scale / 100) * outputSize * 0.5 + outputSize * 0.1;
  const tilesX = Math.ceil(outputSize / tileSize);
  const tilesY = Math.ceil(outputSize / tileSize);
  
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
  
  return canvas.toDataURL('image/png');
}
