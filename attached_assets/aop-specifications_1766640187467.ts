/**
 * ============================================================================
 * ALL-OVER PRINT (AOP) PRODUCT SPECIFICATIONS
 * ============================================================================
 * 
 * 10 AOP Products with complete technical specifications:
 * - Panel layouts & construction
 * - Seam alignment requirements
 * - Trim/accent color areas
 * - Pattern scale recommendations
 * - Print file dimensions
 * - DPI & bleed requirements
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AOPPanel {
  name: string;
  widthInches: number;
  heightInches: number;
  widthPixels: number;
  heightPixels: number;
  notes: string;
}

export interface SeamAlignment {
  location: string;
  requirement: 'critical' | 'recommended' | 'not_required';
  notes: string;
}

export interface TrimArea {
  name: string;
  defaultColor: string;
  colorSource: string;  // Where to pull the accent color from
  notes: string;
}

export interface PatternScale {
  recommendedTileSizeInches: { width: number; height: number };
  recommendedTileSizePixels: { width: number; height: number };
  minScale: string;
  maxScale: string;
  notes: string;
}

export interface AOPProduct {
  id: string;
  name: string;
  category: string;
  
  // Construction
  constructionType: 'cut_and_sew' | 'sublimation_on_blank' | 'panel_print';
  constructionNotes: string;
  
  // Panels
  panels: AOPPanel[];
  totalPrintFileSize: {
    widthPixels: number;
    heightPixels: number;
    widthInches: number;
    heightInches: number;
  };
  
  // Technical specs
  dpiRequirement: number;
  bleedInches: number;
  bleedPixels: number;
  colorMode: 'CMYK' | 'RGB' | 'sRGB';
  fileFormat: string[];
  maxFileSize: string;
  
  // Seam alignment
  seamAlignments: SeamAlignment[];
  
  // Trim areas
  trimAreas: TrimArea[];
  
  // Pattern recommendations
  patternScale: PatternScale;
  patternTips: string[];
  
  // Lifestyle reference
  lifestyleDescription: string;
  displayContext: string[];
  
  // Sizing
  availableSizes: string[];
  sizeNotes: string;
  
  // Production
  printfulId: string;
  productionTime: string;
}

// ============================================================================
// AOP PRODUCT CATALOG
// ============================================================================

export const AOP_PRODUCTS: Record<string, AOPProduct> = {

  // ==========================================================================
  // 1. AOP HOODIE (UNISEX)
  // ==========================================================================
  'aop-hoodie': {
    id: 'aop-hoodie',
    name: 'AOP Hoodie (Unisex)',
    category: 'apparel',
    
    constructionType: 'cut_and_sew',
    constructionNotes: 'Cut & sew construction. Fabric is printed first as flat panels, then cut and sewn together. Allows full coverage including hood interior and kangaroo pocket.',
    
    panels: [
      {
        name: 'Front Left Panel',
        widthInches: 14,
        heightInches: 28,
        widthPixels: 4200,
        heightPixels: 8400,
        notes: 'Includes half of kangaroo pocket'
      },
      {
        name: 'Front Right Panel',
        widthInches: 14,
        heightInches: 28,
        widthPixels: 4200,
        heightPixels: 8400,
        notes: 'Includes half of kangaroo pocket'
      },
      {
        name: 'Back Panel',
        widthInches: 22,
        heightInches: 28,
        widthPixels: 6600,
        heightPixels: 8400,
        notes: 'Full back coverage'
      },
      {
        name: 'Left Sleeve',
        widthInches: 22,
        heightInches: 10,
        widthPixels: 6600,
        heightPixels: 3000,
        notes: 'Full sleeve wrap'
      },
      {
        name: 'Right Sleeve',
        widthInches: 22,
        heightInches: 10,
        widthPixels: 6600,
        heightPixels: 3000,
        notes: 'Full sleeve wrap'
      },
      {
        name: 'Hood Outer',
        widthInches: 16,
        heightInches: 14,
        widthPixels: 4800,
        heightPixels: 4200,
        notes: 'Outer hood surface'
      },
      {
        name: 'Hood Inner (Optional)',
        widthInches: 16,
        heightInches: 14,
        widthPixels: 4800,
        heightPixels: 4200,
        notes: 'Inner hood lining - some suppliers print, some leave solid'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4500,
      heightPixels: 5400,
      widthInches: 15,
      heightInches: 18
    },
    
    dpiRequirement: 300,
    bleedInches: 0.25,
    bleedPixels: 75,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Center front (zipper line or center seam)',
        requirement: 'critical',
        notes: 'Pattern must align perfectly at center front for visual continuity'
      },
      {
        location: 'Side seams (body to sleeve)',
        requirement: 'critical',
        notes: 'Pattern flow from body to underarm/sleeve'
      },
      {
        location: 'Shoulder seams',
        requirement: 'recommended',
        notes: 'Pattern continuation from body to sleeve top'
      },
      {
        location: 'Hood attachment seam',
        requirement: 'recommended',
        notes: 'Hood to body transition'
      },
      {
        location: 'Pocket seams',
        requirement: 'critical',
        notes: 'Kangaroo pocket must align with body pattern'
      }
    ],
    
    trimAreas: [
      {
        name: 'Ribbed Cuffs',
        defaultColor: 'Pulled from pattern',
        colorSource: 'Dominant or accent color from the pattern design',
        notes: '2" ribbed cuffs at wrist, usually solid color'
      },
      {
        name: 'Ribbed Waistband',
        defaultColor: 'Pulled from pattern',
        colorSource: 'Match cuffs - dominant or accent color',
        notes: '2.5" ribbed waistband at hem'
      },
      {
        name: 'Drawstring',
        defaultColor: 'White or Black',
        colorSource: 'Contrasting to hood color or matching',
        notes: 'Hood drawstring cord'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 4, height: 4 },
      recommendedTileSizePixels: { width: 1200, height: 1200 },
      minScale: '2" × 2" tile (small intricate patterns)',
      maxScale: '8" × 8" tile (large bold patterns)',
      notes: 'Pattern should tile seamlessly. Test at multiple scales to ensure detail visibility on finished garment.'
    },
    
    patternTips: [
      'Use seamless/tileable patterns for best results',
      'Avoid placing focal elements near seam lines',
      'Consider how pattern will look when hood is up vs down',
      'Test pattern scale - 4" repeat is good starting point',
      'Darker patterns hide seams better than light patterns',
      'Account for pattern distortion at curved areas (hood, shoulders)'
    ],
    
    lifestyleDescription: 'Casual streetwear hoodie worn relaxed with jeans or joggers. Hood often down showing back panel. Popular for bold graphic patterns, galaxy prints, abstract art, nature scenes.',
    
    displayContext: [
      'Model standing casually, hands in pocket',
      'Three-quarter view showing front and side',
      'Back view highlighting full back panel',
      'Detail shot of hood interior/exterior',
      'Flat lay showing all panels spread'
    ],
    
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    sizeNotes: 'Unisex sizing. Pattern scales proportionally with size. Larger sizes have proportionally larger print areas.',
    
    printfulId: '483',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 2. AOP WOMEN'S LEGGINGS
  // ==========================================================================
  'aop-womens-leggings': {
    id: 'aop-womens-leggings',
    name: "AOP Women's Leggings",
    category: 'apparel',
    
    constructionType: 'cut_and_sew',
    constructionNotes: 'Cut & sew construction on 4-way stretch polyester/spandex. Printed flat, then cut and assembled. High waistband for comfort.',
    
    panels: [
      {
        name: 'Left Leg Front',
        widthInches: 12,
        heightInches: 38,
        widthPixels: 3600,
        heightPixels: 11400,
        notes: 'Front of left leg from waist to ankle'
      },
      {
        name: 'Left Leg Back',
        widthInches: 12,
        heightInches: 38,
        widthPixels: 3600,
        heightPixels: 11400,
        notes: 'Back of left leg from waist to ankle'
      },
      {
        name: 'Right Leg Front',
        widthInches: 12,
        heightInches: 38,
        widthPixels: 3600,
        heightPixels: 11400,
        notes: 'Front of right leg from waist to ankle'
      },
      {
        name: 'Right Leg Back',
        widthInches: 12,
        heightInches: 38,
        widthPixels: 3600,
        heightPixels: 11400,
        notes: 'Back of right leg from waist to ankle'
      },
      {
        name: 'Waistband',
        widthInches: 28,
        heightInches: 4,
        widthPixels: 8400,
        heightPixels: 1200,
        notes: 'High-rise waistband wrap'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4800,
      heightPixels: 8400,
      widthInches: 16,
      heightInches: 28
    },
    
    dpiRequirement: 300,
    bleedInches: 0.25,
    bleedPixels: 75,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Inner leg seam (inseam)',
        requirement: 'critical',
        notes: 'Front to back pattern alignment along inner leg'
      },
      {
        location: 'Outer leg seam',
        requirement: 'critical',
        notes: 'Side seam pattern continuity'
      },
      {
        location: 'Center front seam',
        requirement: 'critical',
        notes: 'Left and right leg meet at center - must align'
      },
      {
        location: 'Center back seam',
        requirement: 'critical',
        notes: 'Back panel alignment at seat'
      },
      {
        location: 'Waistband seam',
        requirement: 'recommended',
        notes: 'Waistband to leg transition'
      }
    ],
    
    trimAreas: [
      {
        name: 'Waistband Interior',
        defaultColor: 'Matching or solid black',
        colorSource: 'Dominant pattern color',
        notes: 'Inside of waistband, may be solid for comfort'
      },
      {
        name: 'Elastic Edge',
        defaultColor: 'Hidden/internal',
        colorSource: 'N/A',
        notes: 'Waistband elastic is internal, not visible'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 3, height: 3 },
      recommendedTileSizePixels: { width: 900, height: 900 },
      minScale: '1.5" × 1.5" tile (small detailed patterns)',
      maxScale: '6" × 6" tile (large statement patterns)',
      notes: 'Vertical patterns work well. Consider stretch - pattern will stretch 15-20% when worn.'
    },
    
    patternTips: [
      'Account for 15-20% stretch distortion in design',
      'Avoid horizontal stripes (can emphasize curves)',
      'Vertical or diagonal patterns are flattering',
      'Test pattern at actual wearing stretch',
      'Dark patterns are more forgiving and popular',
      'Avoid text or logos that will distort'
    ],
    
    lifestyleDescription: 'Athletic/athleisure leggings for yoga, gym, or casual wear. Form-fitting shows full pattern coverage. Popular patterns: galaxy, mandala, floral, abstract, geometric.',
    
    displayContext: [
      'Model in yoga pose showing leg stretch',
      'Standing front view, full length visible',
      'Side profile showing waistband and leg line',
      'Back view highlighting seat pattern',
      'Lifestyle shot in gym/yoga studio setting'
    ],
    
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    sizeNotes: "Women's sizing with high waistband. Pattern designed for size M, scales proportionally.",
    
    printfulId: '197',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 3. AOP MEN'S CUT & SEW TEE
  // ==========================================================================
  'aop-mens-tee': {
    id: 'aop-mens-tee',
    name: "AOP Men's Cut & Sew Tee",
    category: 'apparel',
    
    constructionType: 'cut_and_sew',
    constructionNotes: 'True cut & sew construction - fabric printed flat, then cut to pattern pieces and sewn. Full coverage including underarms and side panels.',
    
    panels: [
      {
        name: 'Front Panel',
        widthInches: 22,
        heightInches: 30,
        widthPixels: 6600,
        heightPixels: 9000,
        notes: 'Full front torso from shoulder to hem'
      },
      {
        name: 'Back Panel',
        widthInches: 22,
        heightInches: 30,
        widthPixels: 6600,
        heightPixels: 9000,
        notes: 'Full back torso from shoulder to hem'
      },
      {
        name: 'Left Sleeve',
        widthInches: 18,
        heightInches: 10,
        widthPixels: 5400,
        heightPixels: 3000,
        notes: 'Full sleeve from shoulder to cuff'
      },
      {
        name: 'Right Sleeve',
        widthInches: 18,
        heightInches: 10,
        widthPixels: 5400,
        heightPixels: 3000,
        notes: 'Full sleeve from shoulder to cuff'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4500,
      heightPixels: 5400,
      widthInches: 15,
      heightInches: 18
    },
    
    dpiRequirement: 300,
    bleedInches: 0.25,
    bleedPixels: 75,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Side seams',
        requirement: 'critical',
        notes: 'Front to back alignment at sides'
      },
      {
        location: 'Shoulder seams',
        requirement: 'critical',
        notes: 'Body to sleeve transition must align'
      },
      {
        location: 'Sleeve underarm',
        requirement: 'recommended',
        notes: 'Underarm gusset area pattern flow'
      }
    ],
    
    trimAreas: [
      {
        name: 'Crew Neck Ribbing',
        defaultColor: 'Pulled from pattern',
        colorSource: 'Dominant or accent color - usually dark',
        notes: '1" ribbed crew neck collar'
      },
      {
        name: 'Sleeve Hem',
        defaultColor: 'Printed/raw edge',
        colorSource: 'Pattern continues to edge',
        notes: 'Clean cut edge or small hem'
      },
      {
        name: 'Bottom Hem',
        defaultColor: 'Printed/raw edge',
        colorSource: 'Pattern continues to edge',
        notes: 'Straight or curved hem'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 4, height: 4 },
      recommendedTileSizePixels: { width: 1200, height: 1200 },
      minScale: '2" × 2" tile',
      maxScale: '8" × 8" tile',
      notes: 'Medium-scale patterns work best. Too small gets lost, too large gets cut off at seams.'
    },
    
    patternTips: [
      'Use seamless tileable patterns',
      'Center key design elements on front panel',
      'Consider pattern flow across shoulders to sleeves',
      'Test visibility of pattern details at arm distance',
      'Photographic prints work well on cut & sew',
      'Avoid patterns that create optical illusions'
    ],
    
    lifestyleDescription: "Men's casual crew neck tee with full AOP coverage. Streetwear aesthetic. Popular for bold graphics, camo, tropical, abstract, and photo prints.",
    
    displayContext: [
      'Model front view, relaxed stance',
      'Three-quarter view showing sleeve pattern',
      'Back view full coverage',
      'Detail of shoulder seam alignment',
      'Lifestyle urban/street setting'
    ],
    
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    sizeNotes: "Men's regular fit. Relaxed through body. Pattern scales with size.",
    
    printfulId: '279',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 4. AOP WOMEN'S TEE
  // ==========================================================================
  'aop-womens-tee': {
    id: 'aop-womens-tee',
    name: "AOP Women's Tee",
    category: 'apparel',
    
    constructionType: 'cut_and_sew',
    constructionNotes: "Cut & sew construction with women's fit - slightly tapered waist, shorter length, cap or short sleeves. Soft polyester fabric.",
    
    panels: [
      {
        name: 'Front Panel',
        widthInches: 18,
        heightInches: 26,
        widthPixels: 5400,
        heightPixels: 7800,
        notes: 'Front torso with feminine darting'
      },
      {
        name: 'Back Panel',
        widthInches: 18,
        heightInches: 26,
        widthPixels: 5400,
        heightPixels: 7800,
        notes: 'Back torso panel'
      },
      {
        name: 'Left Sleeve',
        widthInches: 14,
        heightInches: 8,
        widthPixels: 4200,
        heightPixels: 2400,
        notes: 'Short/cap sleeve'
      },
      {
        name: 'Right Sleeve',
        widthInches: 14,
        heightInches: 8,
        widthPixels: 4200,
        heightPixels: 2400,
        notes: 'Short/cap sleeve'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4500,
      heightPixels: 5400,
      widthInches: 15,
      heightInches: 18
    },
    
    dpiRequirement: 300,
    bleedInches: 0.25,
    bleedPixels: 75,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Side seams',
        requirement: 'critical',
        notes: 'Pattern must flow around curved feminine fit'
      },
      {
        location: 'Shoulder seams',
        requirement: 'critical',
        notes: 'Body to sleeve pattern continuity'
      },
      {
        location: 'Neckline',
        requirement: 'recommended',
        notes: 'Pattern flow around scoop or crew neck'
      }
    ],
    
    trimAreas: [
      {
        name: 'Neckline Binding',
        defaultColor: 'Self-fabric or accent',
        colorSource: 'Dominant pattern color',
        notes: 'Scoop neck or crew neck binding'
      },
      {
        name: 'Sleeve Hem',
        defaultColor: 'Raw edge/printed',
        colorSource: 'Pattern continues',
        notes: 'Cap sleeve with clean edge'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 3, height: 3 },
      recommendedTileSizePixels: { width: 900, height: 900 },
      minScale: '1.5" × 1.5" tile',
      maxScale: '6" × 6" tile',
      notes: 'Smaller patterns often more flattering on fitted silhouette.'
    },
    
    patternTips: [
      'Consider bust area - avoid placing elements that draw attention',
      'Smaller, denser patterns are often more flattering',
      'Vertical elements can elongate silhouette',
      'Dark backgrounds are universally flattering',
      'Floral, botanical, and abstract patterns are popular',
      'Test pattern at actual stretch percentage'
    ],
    
    lifestyleDescription: "Women's fitted tee for casual wear. Feminine cut with full pattern coverage. Popular patterns: florals, watercolor, botanical, celestial, abstract.",
    
    displayContext: [
      'Model front view, natural pose',
      'Side view showing fitted silhouette',
      'Three-quarter casual lifestyle',
      'Detail of neckline and shoulder',
      'Paired with jeans/skirt in lifestyle setting'
    ],
    
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    sizeNotes: "Women's fitted cut. Size M is baseline for pattern. Proportional scaling.",
    
    printfulId: '282',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 5. AOP SWEATSHIRT (UNISEX)
  // ==========================================================================
  'aop-sweatshirt': {
    id: 'aop-sweatshirt',
    name: 'AOP Sweatshirt (Unisex)',
    category: 'apparel',
    
    constructionType: 'cut_and_sew',
    constructionNotes: 'Cut & sew fleece-lined sweatshirt. Exterior printed, interior is soft brushed fleece (solid color). Crewneck style.',
    
    panels: [
      {
        name: 'Front Panel',
        widthInches: 24,
        heightInches: 28,
        widthPixels: 7200,
        heightPixels: 8400,
        notes: 'Full front torso'
      },
      {
        name: 'Back Panel',
        widthInches: 24,
        heightInches: 28,
        widthPixels: 7200,
        heightPixels: 8400,
        notes: 'Full back panel'
      },
      {
        name: 'Left Sleeve',
        widthInches: 24,
        heightInches: 10,
        widthPixels: 7200,
        heightPixels: 3000,
        notes: 'Full sleeve coverage'
      },
      {
        name: 'Right Sleeve',
        widthInches: 24,
        heightInches: 10,
        widthPixels: 7200,
        heightPixels: 3000,
        notes: 'Full sleeve coverage'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4500,
      heightPixels: 5400,
      widthInches: 15,
      heightInches: 18
    },
    
    dpiRequirement: 300,
    bleedInches: 0.25,
    bleedPixels: 75,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Side seams',
        requirement: 'critical',
        notes: 'Front to back pattern alignment'
      },
      {
        location: 'Shoulder seams',
        requirement: 'critical',
        notes: 'Body to sleeve transition'
      },
      {
        location: 'Sleeve underarm',
        requirement: 'recommended',
        notes: 'Pattern flow at underarm panel'
      }
    ],
    
    trimAreas: [
      {
        name: 'Ribbed Crew Neck',
        defaultColor: 'Solid accent color',
        colorSource: 'Dominant or secondary pattern color',
        notes: '1.5" ribbed collar'
      },
      {
        name: 'Ribbed Cuffs',
        defaultColor: 'Match neck',
        colorSource: 'Same as collar',
        notes: '2" ribbed wrist cuffs'
      },
      {
        name: 'Ribbed Waistband',
        defaultColor: 'Match neck and cuffs',
        colorSource: 'Same as collar',
        notes: '2.5" ribbed bottom band'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 4, height: 4 },
      recommendedTileSizePixels: { width: 1200, height: 1200 },
      minScale: '2" × 2" tile',
      maxScale: '8" × 8" tile',
      notes: 'Medium-large patterns work well on the relaxed silhouette.'
    },
    
    patternTips: [
      'Bold, high-contrast patterns stand out well',
      'Consider solid-colored trim as a design element',
      'Pattern should work as continuous from body to sleeves',
      'Geometric and abstract patterns are popular',
      'Nature scenes and galaxy prints are bestsellers',
      'Interior is not printed - consider this in design'
    ],
    
    lifestyleDescription: 'Casual crewneck sweatshirt for everyday wear. Relaxed fit with fleece interior. Popular patterns: vaporwave, retro, nature, abstract, artistic.',
    
    displayContext: [
      'Model casual standing, arms relaxed',
      'Three-quarter view showing sleeve detail',
      'Back view full pattern',
      'Detail of ribbed trim elements',
      'Lifestyle casual setting (coffee shop, outdoors)'
    ],
    
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    sizeNotes: 'Unisex relaxed fit. Oversized look is popular for this style.',
    
    printfulId: '345',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 6. AOP ONE-PIECE SWIMSUIT
  // ==========================================================================
  'aop-swimsuit': {
    id: 'aop-swimsuit',
    name: 'AOP One-Piece Swimsuit',
    category: 'apparel',
    
    constructionType: 'cut_and_sew',
    constructionNotes: 'Cut & sew on swimwear-grade fabric (82% polyester, 18% spandex). Chlorine resistant, UPF 38+. Full coverage one-piece style.',
    
    panels: [
      {
        name: 'Front Panel',
        widthInches: 16,
        heightInches: 28,
        widthPixels: 4800,
        heightPixels: 8400,
        notes: 'Front body from straps to bottom'
      },
      {
        name: 'Back Panel',
        widthInches: 16,
        heightInches: 28,
        widthPixels: 4800,
        heightPixels: 8400,
        notes: 'Back coverage - various back styles available'
      },
      {
        name: 'Gusset',
        widthInches: 4,
        heightInches: 6,
        widthPixels: 1200,
        heightPixels: 1800,
        notes: 'Interior gusset panel (lined)'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4958,
      heightPixels: 6448,
      widthInches: 16.5,
      heightInches: 21.5
    },
    
    dpiRequirement: 300,
    bleedInches: 0.125,
    bleedPixels: 38,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Side seams',
        requirement: 'critical',
        notes: 'Front to back pattern continuity at sides'
      },
      {
        location: 'Strap attachment',
        requirement: 'recommended',
        notes: 'Pattern flow onto straps'
      },
      {
        location: 'Leg openings',
        requirement: 'recommended',
        notes: 'Pattern termination at leg line'
      }
    ],
    
    trimAreas: [
      {
        name: 'Straps',
        defaultColor: 'Printed to match',
        colorSource: 'Continuous from body panel',
        notes: 'Adjustable straps with pattern'
      },
      {
        name: 'Leg Elastic Edge',
        defaultColor: 'Internal',
        colorSource: 'Hidden elastic',
        notes: 'Elastic edge is covered by fabric fold'
      },
      {
        name: 'Neckline Edge',
        defaultColor: 'Internal',
        colorSource: 'Hidden elastic',
        notes: 'Internal elastic, not visible'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 3, height: 3 },
      recommendedTileSizePixels: { width: 900, height: 900 },
      minScale: '1.5" × 1.5" tile',
      maxScale: '5" × 5" tile',
      notes: 'Medium-small patterns are most flattering. Large patterns can distort with body curves and stretch.'
    },
    
    patternTips: [
      'Account for significant stretch (up to 30%)',
      'Avoid horizontal stripes at midsection',
      'Dark colors and small patterns are slimming',
      'Tropical, floral, and abstract patterns are popular',
      'Consider pattern placement at bust area',
      'Test pattern at maximum stretch',
      'Symmetrical patterns work well front to back'
    ],
    
    lifestyleDescription: 'Stylish one-piece swimsuit for beach, pool, or resort wear. Full coverage with flattering cut. Popular patterns: tropical, palm leaves, ocean, floral, geometric.',
    
    displayContext: [
      'Model poolside or beach setting',
      'Front view showing full pattern',
      'Back view showing back panel',
      'Lifestyle resort/vacation aesthetic',
      'Detail of strap and neckline'
    ],
    
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    sizeNotes: "Women's swim sizing. Size chart differs from regular apparel.",
    
    printfulId: '476',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 7. AOP TOTE BAG
  // ==========================================================================
  'aop-tote': {
    id: 'aop-tote',
    name: 'AOP Tote Bag',
    category: 'accessories',
    
    constructionType: 'cut_and_sew',
    constructionNotes: 'Cut & sew polyester tote. Full AOP coverage on both sides. Reinforced handles and bottom. Interior unprinted.',
    
    panels: [
      {
        name: 'Front Panel',
        widthInches: 15,
        heightInches: 16,
        widthPixels: 4500,
        heightPixels: 4800,
        notes: 'Full front face of bag'
      },
      {
        name: 'Back Panel',
        widthInches: 15,
        heightInches: 16,
        widthPixels: 4500,
        heightPixels: 4800,
        notes: 'Full back face of bag'
      },
      {
        name: 'Bottom Gusset',
        widthInches: 15,
        heightInches: 4,
        widthPixels: 4500,
        heightPixels: 1200,
        notes: 'Bottom panel (if structured)'
      },
      {
        name: 'Handles (×2)',
        widthInches: 24,
        heightInches: 1.5,
        widthPixels: 7200,
        heightPixels: 450,
        notes: 'Shoulder-length handles - may be solid or printed'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4500,
      heightPixels: 4500,
      widthInches: 15,
      heightInches: 15
    },
    
    dpiRequirement: 300,
    bleedInches: 0.125,
    bleedPixels: 38,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '100MB',
    
    seamAlignments: [
      {
        location: 'Side seams',
        requirement: 'recommended',
        notes: 'Front to back pattern at edges'
      },
      {
        location: 'Bottom seam',
        requirement: 'recommended',
        notes: 'If gusseted, pattern flow to bottom'
      },
      {
        location: 'Handle attachment',
        requirement: 'not_required',
        notes: 'Handles often solid - no alignment needed'
      }
    ],
    
    trimAreas: [
      {
        name: 'Handles',
        defaultColor: 'Solid black or matching',
        colorSource: 'Dominant dark color or black',
        notes: 'Reinforced handles, usually solid for durability'
      },
      {
        name: 'Interior',
        defaultColor: 'Solid black/white',
        colorSource: 'N/A - not printed',
        notes: 'Interior lining is not printed'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 3, height: 3 },
      recommendedTileSizePixels: { width: 900, height: 900 },
      minScale: '1.5" × 1.5" tile',
      maxScale: '6" × 6" tile',
      notes: 'Pattern should look good when bag is both empty (flat) and full (rounded).'
    },
    
    patternTips: [
      'Both sides can have same or different designs',
      'Pattern will distort when bag is full/stretched',
      'Bold patterns read well from a distance',
      'Consider placing focal elements center of panels',
      'Avoid elements that look odd when upside down',
      'Test pattern on curved surface mockup'
    ],
    
    lifestyleDescription: 'Reusable tote bag for shopping, beach, or everyday use. Eye-catching patterns make great conversation pieces. Popular: artistic, pop art, geometric, nature.',
    
    displayContext: [
      'Carried over shoulder, casual street style',
      'Flat lay showing both sides',
      'Being carried with items inside',
      'Beach/shopping lifestyle context',
      'Detail of pattern and handle construction'
    ],
    
    availableSizes: ['One Size'],
    sizeNotes: 'Standard tote size: approximately 15" × 16" × 4"',
    
    printfulId: '440',
    productionTime: '4-6 business days'
  },

  // ==========================================================================
  // 8. AOP SQUARE PILLOW
  // ==========================================================================
  'aop-pillow': {
    id: 'aop-pillow',
    name: 'AOP Square Pillow',
    category: 'home',
    
    constructionType: 'sublimation_on_blank',
    constructionNotes: 'Dye-sublimation print on polyester pillow cover. Insert included (polyester fill). Hidden zipper on back. Front printed, back is solid white or printed.',
    
    panels: [
      {
        name: 'Front Panel',
        widthInches: 18,
        heightInches: 18,
        widthPixels: 5400,
        heightPixels: 5400,
        notes: 'Primary design panel - full coverage'
      },
      {
        name: 'Back Panel (Optional)',
        widthInches: 18,
        heightInches: 18,
        widthPixels: 5400,
        heightPixels: 5400,
        notes: 'Can be printed or solid white'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 5400,
      heightPixels: 5400,
      widthInches: 18,
      heightInches: 18
    },
    
    dpiRequirement: 300,
    bleedInches: 0.5,
    bleedPixels: 150,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '100MB',
    
    seamAlignments: [
      {
        location: 'Edge seams',
        requirement: 'not_required',
        notes: 'Pattern terminates at sewn edges'
      },
      {
        location: 'Zipper (back)',
        requirement: 'not_required',
        notes: 'Hidden zipper, not visible'
      }
    ],
    
    trimAreas: [
      {
        name: 'Sewn Edge',
        defaultColor: 'Self-fabric',
        colorSource: 'Pattern continues to edge',
        notes: 'Clean sewn edge, pattern bleeds to seam'
      },
      {
        name: 'Zipper',
        defaultColor: 'White or black',
        colorSource: 'Based on dominant color',
        notes: 'Hidden zipper on back panel'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 4, height: 4 },
      recommendedTileSizePixels: { width: 1200, height: 1200 },
      minScale: '2" × 2" tile',
      maxScale: 'Full 18" × 18" single design',
      notes: 'Can be seamless pattern or single centered artwork. Square format is ideal.'
    },
    
    patternTips: [
      'Square designs work perfectly',
      'Can do single artwork or repeating pattern',
      'Consider how it looks when placed on couch/bed',
      'Include 0.5" bleed beyond print area',
      'Account for pillow stuffing - corners will round',
      'Popular: artistic, photographic, geometric, mandala'
    ],
    
    lifestyleDescription: 'Decorative throw pillow for couch, bed, or accent seating. Statement piece in home decor. Popular patterns: mandala, abstract art, photography, botanical.',
    
    displayContext: [
      'On couch with other pillows',
      'On bed in bedroom setting',
      'Standalone product shot front view',
      'Lifestyle living room context',
      'Detail of corner stuffing and fabric'
    ],
    
    availableSizes: ['14" × 14"', '16" × 16"', '18" × 18"', '20" × 20"'],
    sizeNotes: 'Multiple sizes available. 18" × 18" is most popular. Pattern scales with size.',
    
    printfulId: '82',
    productionTime: '4-6 business days'
  },

  // ==========================================================================
  // 9. AOP FLEECE BLANKET
  // ==========================================================================
  'aop-blanket': {
    id: 'aop-blanket',
    name: 'AOP Fleece Blanket',
    category: 'home',
    
    constructionType: 'sublimation_on_blank',
    constructionNotes: 'Dye-sublimation on 100% polyester fleece. Printed side with design, back is solid white fleece. Soft plush finish.',
    
    panels: [
      {
        name: 'Full Blanket - Front',
        widthInches: 50,
        heightInches: 60,
        widthPixels: 7500,
        heightPixels: 9000,
        notes: 'Full front coverage - large seamless area'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 7500,
      heightPixels: 9000,
      widthInches: 50,
      heightInches: 60
    },
    
    dpiRequirement: 150,  // Lower DPI acceptable due to size and viewing distance
    bleedInches: 1,
    bleedPixels: 150,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '200MB',
    
    seamAlignments: [
      {
        location: 'Edge hem',
        requirement: 'not_required',
        notes: 'Pattern terminates at hemmed edge'
      }
    ],
    
    trimAreas: [
      {
        name: 'Hemmed Edges',
        defaultColor: 'Self-fabric',
        colorSource: 'Pattern continues to edge',
        notes: 'All edges are hemmed, pattern bleeds to hem'
      },
      {
        name: 'Back Side',
        defaultColor: 'Solid white',
        colorSource: 'N/A - not printed',
        notes: 'Back is unprinted white fleece'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 6, height: 6 },
      recommendedTileSizePixels: { width: 900, height: 900 },
      minScale: '4" × 4" tile',
      maxScale: 'Full single design (50" × 60")',
      notes: 'Larger patterns work well. This is a big canvas - details should be visible from viewing distance.'
    },
    
    patternTips: [
      'Large-scale patterns read well on big surface',
      'Consider viewing distance (couch distance)',
      'Can use single large artwork or seamless repeat',
      'Popular for photo collages and large art pieces',
      '150 DPI is acceptable due to size',
      'Test at actual print size before ordering'
    ],
    
    lifestyleDescription: 'Cozy throw blanket for couch, bed, or outdoor use. Large canvas for bold designs. Popular: photo collages, landscapes, pet photos, artistic designs, sports themes.',
    
    displayContext: [
      'Draped over couch in living room',
      'Spread on bed in bedroom',
      'Being used/wrapped around person',
      'Flat lay full spread showing design',
      'Folded at foot of bed'
    ],
    
    availableSizes: ['30" × 40"', '50" × 60"', '60" × 80"'],
    sizeNotes: '50" × 60" is standard throw size. 60" × 80" covers queen bed. Pattern scales proportionally.',
    
    printfulId: '339',
    productionTime: '5-7 business days'
  },

  // ==========================================================================
  // 10. AOP BEACH TOWEL
  // ==========================================================================
  'aop-beach-towel': {
    id: 'aop-beach-towel',
    name: 'AOP Beach Towel',
    category: 'home',
    
    constructionType: 'sublimation_on_blank',
    constructionNotes: 'Dye-sublimation on microfiber polyester top, cotton terry loop backing. Printed side is smooth, back is absorbent terry. Quick-dry properties.',
    
    panels: [
      {
        name: 'Full Towel - Front',
        widthInches: 30,
        heightInches: 60,
        widthPixels: 4500,
        heightPixels: 9000,
        notes: 'Full front surface - vertical orientation'
      }
    ],
    
    totalPrintFileSize: {
      widthPixels: 4500,
      heightPixels: 9000,
      widthInches: 30,
      heightInches: 60
    },
    
    dpiRequirement: 150,  // Lower DPI due to size
    bleedInches: 0.5,
    bleedPixels: 75,
    colorMode: 'sRGB',
    fileFormat: ['PNG', 'JPEG'],
    maxFileSize: '150MB',
    
    seamAlignments: [
      {
        location: 'Edge hem',
        requirement: 'not_required',
        notes: 'Pattern terminates at hemmed/serged edge'
      }
    ],
    
    trimAreas: [
      {
        name: 'Edges',
        defaultColor: 'Self-fabric',
        colorSource: 'Pattern continues to edge',
        notes: 'Serged or hemmed edges'
      },
      {
        name: 'Back (Terry)',
        defaultColor: 'Solid white',
        colorSource: 'N/A - cotton terry',
        notes: 'Back is absorbent white cotton terry'
      }
    ],
    
    patternScale: {
      recommendedTileSizeInches: { width: 6, height: 6 },
      recommendedTileSizePixels: { width: 900, height: 900 },
      minScale: '4" × 4" tile',
      maxScale: 'Full single design (30" × 60")',
      notes: 'Bold beach-appropriate designs. Consider vertical orientation when designing.'
    },
    
    patternTips: [
      'Design for vertical (portrait) orientation',
      'Towel is 2:1 ratio - design accordingly',
      'Bold, bright colors stand out on beach',
      'Consider how pattern looks when partially folded',
      'Popular: tropical, ocean, mandala, bold geometric',
      'Name/monogram designs are popular gifts'
    ],
    
    lifestyleDescription: 'Beach or pool towel with eye-catching design. Functional and fashionable. Popular patterns: tropical, palm leaves, waves, mandala, abstract, personalized.',
    
    displayContext: [
      'Laid flat on beach sand',
      'Draped over pool lounger',
      'Hanging from hook (showing full design)',
      'Rolled/folded for travel',
      'Model carrying on beach'
    ],
    
    availableSizes: ['30" × 60"'],
    sizeNotes: 'Standard beach towel size. Large enough for lounging.',
    
    printfulId: '462',
    productionTime: '5-7 business days'
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all AOP products
 */
export function getAllAOPProducts(): AOPProduct[] {
  return Object.values(AOP_PRODUCTS);
}

/**
 * Get AOP product by ID
 */
export function getAOPProduct(id: string): AOPProduct | undefined {
  return AOP_PRODUCTS[id];
}

/**
 * Get AOP products by category
 */
export function getAOPProductsByCategory(category: 'apparel' | 'accessories' | 'home'): AOPProduct[] {
  return Object.values(AOP_PRODUCTS).filter(p => p.category === category);
}

/**
 * Get print file dimensions for a product
 */
export function getAOPPrintDimensions(productId: string): { widthPixels: number; heightPixels: number; dpi: number } | null {
  const product = AOP_PRODUCTS[productId];
  if (!product) return null;
  
  return {
    widthPixels: product.totalPrintFileSize.widthPixels,
    heightPixels: product.totalPrintFileSize.heightPixels,
    dpi: product.dpiRequirement
  };
}

/**
 * Get all critical seam alignments for a product
 */
export function getCriticalSeams(productId: string): SeamAlignment[] {
  const product = AOP_PRODUCTS[productId];
  if (!product) return [];
  
  return product.seamAlignments.filter(s => s.requirement === 'critical');
}

/**
 * Get pattern scale recommendation
 */
export function getPatternScaleRecommendation(productId: string): PatternScale | null {
  const product = AOP_PRODUCTS[productId];
  return product?.patternScale || null;
}

// ============================================================================
// SUMMARY TABLE
// ============================================================================

export const AOP_SUMMARY = {
  totalProducts: Object.keys(AOP_PRODUCTS).length,
  byCategory: {
    apparel: getAOPProductsByCategory('apparel').length,
    accessories: getAOPProductsByCategory('accessories').length,
    home: getAOPProductsByCategory('home').length,
  },
  byConstruction: {
    cutAndSew: Object.values(AOP_PRODUCTS).filter(p => p.constructionType === 'cut_and_sew').length,
    sublimationOnBlank: Object.values(AOP_PRODUCTS).filter(p => p.constructionType === 'sublimation_on_blank').length,
  }
};

export default AOP_PRODUCTS;
