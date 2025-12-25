import { Product, ProductColor, SizeChartEntry, PrintSpecification, ProductSize, AOPSpecification } from '../../../shared/mockupTypes';

export const STANDARD_SIZE_CHART: SizeChartEntry[] = [
  { size: 'XS', chest: 34, length: 27, sleeve: 8 },
  { size: 'S', chest: 36, length: 28, sleeve: 8.5 },
  { size: 'M', chest: 38, length: 29, sleeve: 9 },
  { size: 'L', chest: 42, length: 30, sleeve: 9.5 },
  { size: 'XL', chest: 46, length: 31, sleeve: 10 },
  { size: '2XL', chest: 50, length: 32, sleeve: 10.5 },
  { size: '3XL', chest: 54, length: 33, sleeve: 11 },
  { size: '4XL', chest: 58, length: 34, sleeve: 11.5 },
  { size: '5XL', chest: 62, length: 35, sleeve: 12 }
];

export const PRODUCT_SIZES: Record<string, ProductSize[]> = {
  WOMENS: [
    { code: 'XS', label: 'X-Small' },
    { code: 'S', label: 'Small' },
    { code: 'M', label: 'Medium' },
    { code: 'L', label: 'Large' },
    { code: 'XL', label: 'X-Large' },
    { code: '2XL', label: '2X-Large' },
  ],
  MENS: [
    { code: 'XS', label: 'X-Small' },
    { code: 'S', label: 'Small' },
    { code: 'M', label: 'Medium' },
    { code: 'L', label: 'Large' },
    { code: 'XL', label: 'X-Large' },
    { code: '2XL', label: '2X-Large' },
    { code: '3XL', label: '3X-Large' },
    { code: '4XL', label: '4X-Large' },
    { code: '5XL', label: '5X-Large' },
  ],
  KIDS: [
    { code: 'XS', label: 'X-Small (4-5)' },
    { code: 'S', label: 'Small (6-7)' },
    { code: 'M', label: 'Medium (8-10)' },
    { code: 'L', label: 'Large (12-14)' },
    { code: 'XL', label: 'X-Large (16)' },
  ],
  BABY: [
    { code: 'NB', label: 'Newborn' },
    { code: '3M', label: '3 Months' },
    { code: '6M', label: '6 Months' },
    { code: '12M', label: '12 Months' },
    { code: '18M', label: '18 Months' },
    { code: '24M', label: '24 Months' },
  ],
  KIDS_LEGGINGS: [
    { code: '2T', label: '2T' },
    { code: '3T', label: '3T' },
    { code: '4T', label: '4T' },
    { code: 'XS', label: 'XS (5-6)' },
    { code: 'S', label: 'S (7-8)' },
    { code: 'M', label: 'M (9-10)' },
    { code: 'L', label: 'L (11-12)' },
  ],
  LEGGINGS: [
    { code: 'XS', label: 'X-Small' },
    { code: 'S', label: 'Small' },
    { code: 'M', label: 'Medium' },
    { code: 'L', label: 'Large' },
    { code: 'XL', label: 'X-Large' },
    { code: '2XL', label: '2X-Large' },
  ],
  ONE_SIZE: [
    { code: 'OS', label: 'One Size' },
  ],
  YOUTH_HAT: [
    { code: 'Youth', label: 'Youth (adjustable)' },
  ],
  IPHONE_14: [
    { code: 'iPhone14', label: 'iPhone 14' },
    { code: 'iPhone14Plus', label: 'iPhone 14 Plus' },
    { code: 'iPhone14Pro', label: 'iPhone 14 Pro' },
    { code: 'iPhone14ProMax', label: 'iPhone 14 Pro Max' },
  ],
  IPHONE_15: [
    { code: 'iPhone15', label: 'iPhone 15' },
    { code: 'iPhone15Plus', label: 'iPhone 15 Plus' },
    { code: 'iPhone15Pro', label: 'iPhone 15 Pro' },
    { code: 'iPhone15ProMax', label: 'iPhone 15 Pro Max' },
  ],
  LAPTOP_13: [{ code: '13', label: '13 inch' }],
  LAPTOP_15: [{ code: '15', label: '15 inch' }],
  FLIP_FLOPS: [
    { code: 'S', label: 'Small (W 5-6 / M 4-5)' },
    { code: 'M', label: 'Medium (W 7-8 / M 6-7)' },
    { code: 'L', label: 'Large (W 9-10 / M 8-9)' },
    { code: 'XL', label: 'X-Large (W 11-12 / M 10-11)' },
  ],
  SOCKS: [
    { code: 'S', label: 'Small (W 5-7)' },
    { code: 'M', label: 'Medium (W 8-11 / M 6-9)' },
    { code: 'L', label: 'Large (M 10-13)' },
  ],
  MUG_11: [{ code: '11oz', label: '11 oz' }],
  MUG_15: [{ code: '15oz', label: '15 oz' }],
  TUMBLER: [{ code: '20oz', label: '20 oz' }],
  WATER_BOTTLE: [{ code: '17oz', label: '17 oz (500ml)' }],
  MOUSEPAD: [{ code: 'standard', label: '9.25" × 7.75"' }],
  FACE_MASK: [{ code: 'OS', label: 'One Size (adjustable)' }],
  DUFFLE: [{ code: 'OS', label: '22" × 11.5" × 11.5"' }],
  POSTER_18X24: [{ code: '18x24', label: '18" × 24"' }],
  POSTER_24X36: [{ code: '24x36', label: '24" × 36"' }],
  FRAMED_POSTER: [
    { code: '12x18', label: '12" × 18"' },
    { code: '18x24', label: '18" × 24"' },
    { code: '24x36', label: '24" × 36"' },
  ],
  CANVAS: [
    { code: '12x16', label: '12" × 16"' },
    { code: '16x20', label: '16" × 20"' },
    { code: '18x24', label: '18" × 24"' },
    { code: '24x36', label: '24" × 36"' },
  ],
  BLANKET: [
    { code: '50x60', label: '50" × 60"' },
    { code: '60x80', label: '60" × 80"' },
  ],
  PILLOW_CASE: [{ code: 'standard', label: 'Standard (20" × 30")' }],
  THROW_PILLOW: [
    { code: '14x14', label: '14" × 14"' },
    { code: '16x16', label: '16" × 16"' },
    { code: '18x18', label: '18" × 18"' },
    { code: '20x20', label: '20" × 20"' },
  ],
  BEACH_TOWEL: [{ code: '30x60', label: '30" × 60"' }],
  COASTERS: [{ code: 'set4', label: '3.75" × 3.75" (Set of 4)' }],
  NOTEBOOK: [{ code: '5.5x8.5', label: '5.5" × 8.5"' }],
  POSTCARD: [{ code: '4x6', label: '4" × 6"' }],
  STICKER_SHEET: [{ code: '8.5x11', label: '8.5" × 11"' }],
  MAGNET: [
    { code: '3x3', label: '3" × 3"' },
    { code: '4x4', label: '4" × 4"' },
  ],
};

const STANDARD_DTG_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
  { name: 'Royal Blue', hex: '#2E5090', category: 'dark' },
  { name: 'Carolina Blue', hex: '#7BAFD4', category: 'light' },
  { name: 'Red', hex: '#B22222', category: 'dark' },
  { name: 'Cardinal Red', hex: '#8C1515', category: 'dark' },
  { name: 'Maroon', hex: '#5D1A1A', category: 'dark' },
  { name: 'Forest Green', hex: '#228B22', category: 'dark' },
  { name: 'Irish Green', hex: '#009A44', category: 'dark' },
  { name: 'Military Green', hex: '#4B5320', category: 'dark' },
  { name: 'Charcoal', hex: '#36454F', category: 'dark' },
  { name: 'Sport Grey', hex: '#9EA1A1', category: 'neutral' },
  { name: 'Ash Grey', hex: '#C4C4C4', category: 'light' },
  { name: 'Sand', hex: '#C2B280', category: 'light' },
  { name: 'Natural', hex: '#F5F5DC', category: 'light' },
  { name: 'Light Pink', hex: '#FFB6C1', category: 'light' },
  { name: 'Heliconia', hex: '#E63E62', category: 'dark' },
  { name: 'Purple', hex: '#663399', category: 'dark' },
  { name: 'Orange', hex: '#FF6600', category: 'dark' },
  { name: 'Gold', hex: '#FFD700', category: 'light' },
  { name: 'Daisy', hex: '#FFEB3B', category: 'light' },
  { name: 'Sapphire', hex: '#0F52BA', category: 'dark' },
  { name: 'Brown', hex: '#654321', category: 'dark' }
];

const BELLA_CANVAS_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Vintage White', hex: '#FAF9F6', category: 'light' },
  { name: 'Soft Cream', hex: '#FFFDD0', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'Black Heather', hex: '#1C1C1C', category: 'dark' },
  { name: 'Dark Grey Heather', hex: '#4A4A4A', category: 'dark' },
  { name: 'Athletic Heather', hex: '#B5B5B5', category: 'neutral' },
  { name: 'Silver', hex: '#C0C0C0', category: 'light' },
  { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
  { name: 'True Royal', hex: '#2E5090', category: 'dark' },
  { name: 'Heather Deep Teal', hex: '#3A6A6A', category: 'dark' },
  { name: 'Red', hex: '#B22222', category: 'dark' },
  { name: 'Canvas Red', hex: '#CF1020', category: 'dark' },
  { name: 'Maroon', hex: '#5D1A1A', category: 'dark' },
  { name: 'Forest', hex: '#228B22', category: 'dark' },
  { name: 'Kelly Green', hex: '#4CBB17', category: 'dark' },
  { name: 'Army', hex: '#4B5320', category: 'dark' },
  { name: 'Heather Mauve', hex: '#C8A2C8', category: 'light' },
  { name: 'Heather Orchid', hex: '#DA70D6', category: 'light' },
  { name: 'Mustard', hex: '#FFDB58', category: 'light' },
  { name: 'Sunset', hex: '#FAD6A5', category: 'light' },
  { name: 'Peach', hex: '#FFE5B4', category: 'light' },
  { name: 'Burnt Orange', hex: '#CC5500', category: 'dark' },
  { name: 'Aqua', hex: '#00FFFF', category: 'light' }
];

const SWEATSHIRT_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
  { name: 'Sport Grey', hex: '#9EA1A1', category: 'neutral' },
  { name: 'Dark Heather', hex: '#4A4A4A', category: 'dark' },
  { name: 'Charcoal', hex: '#36454F', category: 'dark' },
  { name: 'Red', hex: '#B22222', category: 'dark' },
  { name: 'Maroon', hex: '#5D1A1A', category: 'dark' },
  { name: 'Forest Green', hex: '#228B22', category: 'dark' },
  { name: 'Military Green', hex: '#4B5320', category: 'dark' },
  { name: 'Royal', hex: '#2E5090', category: 'dark' },
  { name: 'Carolina Blue', hex: '#7BAFD4', category: 'light' },
  { name: 'Ash', hex: '#C4C4C4', category: 'light' },
  { name: 'Sand', hex: '#C2B280', category: 'light' },
  { name: 'Light Pink', hex: '#FFB6C1', category: 'light' },
  { name: 'Purple', hex: '#663399', category: 'dark' }
];

const AOP_BASE_COLORS: ProductColor[] = [
  { name: 'All-Over Print', hex: '#FFFFFF', category: 'light' }
];

const BAG_COLORS: ProductColor[] = [
  { name: 'Natural', hex: '#F5F5DC', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
  { name: 'Red', hex: '#B22222', category: 'dark' },
  { name: 'Royal Blue', hex: '#2E5090', category: 'dark' },
];

const PHONE_CASE_COLORS: ProductColor[] = [
  { name: 'Clear', hex: '#FFFFFF', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'White', hex: '#FFFFFF', category: 'light' },
];

const SOCK_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'Grey', hex: '#808080', category: 'neutral' },
];

const FLIP_FLOP_COLORS: ProductColor[] = [
  { name: 'Black', hex: '#000000', category: 'dark' },
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
];

const FACE_MASK_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
];

const MUG_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
  { name: 'Black', hex: '#000000', category: 'dark' },
];

const POSTER_COLORS: ProductColor[] = [
  { name: 'Matte', hex: '#FFFFFF', category: 'light' },
  { name: 'Glossy', hex: '#FFFFFF', category: 'light' },
];

const BLANKET_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
];

const PILLOW_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
];

const CANVAS_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
];

const STATIONERY_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
];

const COASTER_COLORS: ProductColor[] = [
  { name: 'White', hex: '#FFFFFF', category: 'light' },
];

export const PRODUCT_COLORS: Record<string, ProductColor[]> = {
  APPAREL_FULL: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Black', hex: '#000000', category: 'dark', isPopular: true },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark', isPopular: true },
    { name: 'Heather Grey', hex: '#9CA3AF', category: 'neutral', isPopular: true },
    { name: 'Red', hex: '#DC2626', category: 'dark' },
    { name: 'Royal Blue', hex: '#1D4ED8', category: 'dark' },
    { name: 'Forest Green', hex: '#166534', category: 'dark' },
    { name: 'Maroon', hex: '#7F1D1D', category: 'dark' },
    { name: 'Gold', hex: '#FBBF24', category: 'light' },
    { name: 'Orange', hex: '#EA580C', category: 'dark' },
    { name: 'Purple', hex: '#7C3AED', category: 'dark' },
    { name: 'Pink', hex: '#EC4899', category: 'light' },
    { name: 'Teal', hex: '#0D9488', category: 'dark' },
    { name: 'Charcoal', hex: '#374151', category: 'dark' },
    { name: 'Light Blue', hex: '#7DD3FC', category: 'light' },
    { name: 'Olive', hex: '#65A30D', category: 'dark' },
    { name: 'Burgundy', hex: '#881337', category: 'dark' },
    { name: 'Coral', hex: '#F97316', category: 'light' },
  ],
  WOMENS: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Black', hex: '#000000', category: 'dark', isPopular: true },
    { name: 'Blush Pink', hex: '#FBB6CE', category: 'light' },
    { name: 'Mauve', hex: '#C084FC', category: 'light' },
    { name: 'Sage Green', hex: '#86EFAC', category: 'light' },
    { name: 'Dusty Rose', hex: '#F9A8D4', category: 'light' },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
    { name: 'Burgundy', hex: '#881337', category: 'dark' },
    { name: 'Cream', hex: '#FFFBEB', category: 'light' },
    { name: 'Lavender', hex: '#C4B5FD', category: 'light' },
    { name: 'Terracotta', hex: '#C2410C', category: 'dark' },
    { name: 'Olive', hex: '#65A30D', category: 'dark' },
  ],
  KIDS: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Black', hex: '#000000', category: 'dark' },
    { name: 'Bright Pink', hex: '#EC4899', category: 'light', isPopular: true },
    { name: 'Sky Blue', hex: '#38BDF8', category: 'light', isPopular: true },
    { name: 'Lime Green', hex: '#84CC16', category: 'light' },
    { name: 'Sunny Yellow', hex: '#FACC15', category: 'light' },
    { name: 'Orange', hex: '#F97316', category: 'dark' },
    { name: 'Purple', hex: '#A855F7', category: 'light' },
    { name: 'Red', hex: '#EF4444', category: 'dark' },
    { name: 'Turquoise', hex: '#06B6D4', category: 'light' },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
    { name: 'Heather Grey', hex: '#9CA3AF', category: 'neutral' },
  ],
  BABY: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Heather Grey', hex: '#D1D5DB', category: 'neutral' },
    { name: 'Light Pink', hex: '#FBB6CE', category: 'light', isPopular: true },
    { name: 'Light Blue', hex: '#7DD3FC', category: 'light', isPopular: true },
    { name: 'Butter Yellow', hex: '#FEF08A', category: 'light' },
    { name: 'Mint', hex: '#86EFAC', category: 'light' },
  ],
  BASIC: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Black', hex: '#000000', category: 'dark', isPopular: true },
  ],
  DRINKWARE: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Black', hex: '#1F2937', category: 'dark' },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
    { name: 'Red', hex: '#DC2626', category: 'dark' },
    { name: 'Light Pink', hex: '#F9A8D4', category: 'light' },
    { name: 'Light Blue', hex: '#7DD3FC', category: 'light' },
    { name: 'Green', hex: '#16A34A', category: 'dark' },
    { name: 'Yellow', hex: '#FACC15', category: 'light' },
  ],
  AOP: [
    { name: 'White', hex: '#FFFFFF', category: 'light', isPopular: true },
  ],
  RAGLAN: [
    { name: 'White/Black', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'White/Navy', hex: '#FFFFFF', category: 'light' },
    { name: 'White/Red', hex: '#FFFFFF', category: 'light' },
    { name: 'Grey/Black', hex: '#9CA3AF', category: 'neutral' },
    { name: 'Grey/Navy', hex: '#9CA3AF', category: 'neutral' },
    { name: 'White/Charcoal', hex: '#FFFFFF', category: 'light' },
  ],
  KNITWEAR: [
    { name: 'Black', hex: '#000000', category: 'dark', isPopular: true },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark', isPopular: true },
    { name: 'Cream', hex: '#FFFBEB', category: 'light' },
    { name: 'Heather Grey', hex: '#9CA3AF', category: 'neutral' },
    { name: 'Burgundy', hex: '#881337', category: 'dark' },
    { name: 'Forest Green', hex: '#166534', category: 'dark' },
    { name: 'Camel', hex: '#D4A76A', category: 'light' },
  ],
  OUTERWEAR: [
    { name: 'Black', hex: '#000000', category: 'dark', isPopular: true },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark', isPopular: true },
    { name: 'Olive', hex: '#65A30D', category: 'dark' },
    { name: 'Charcoal', hex: '#374151', category: 'dark' },
    { name: 'Burgundy', hex: '#881337', category: 'dark' },
  ],
  FRAMES: [
    { name: 'Black Frame', hex: '#000000', category: 'dark', isPopular: true },
    { name: 'White Frame', hex: '#FFFFFF', category: 'light' },
    { name: 'Natural Wood', hex: '#D4A76A', category: 'light' },
  ],
  HATS: [
    { name: 'Black', hex: '#000000', category: 'dark', isPopular: true },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
    { name: 'White', hex: '#FFFFFF', category: 'light' },
    { name: 'Red', hex: '#EF4444', category: 'dark' },
    { name: 'Royal Blue', hex: '#1D4ED8', category: 'dark' },
  ],
  TOTE: [
    { name: 'Natural', hex: '#F5F0E1', category: 'light', isPopular: true },
    { name: 'Black', hex: '#1F2937', category: 'dark', isPopular: true },
    { name: 'Navy', hex: '#1E3A5F', category: 'dark' },
  ],
  FLIP_FLOPS: [
    { name: 'White Straps', hex: '#FFFFFF', category: 'light', isPopular: true },
    { name: 'Black Straps', hex: '#000000', category: 'dark', isPopular: true },
  ],
};

export const DTG_PRODUCTS: Product[] = [
  {
    id: 'gildan-5000',
    name: 'Gildan 5000 Classic T-Shirt',
    frontendName: 'T-Shirt',
    backendId: 'MENS_TSHIRT',
    printfulId: '71',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 16,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4800,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, horizontally centered between shoulder seams, vertically positioned 3-4 inches below collar',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Design should not extend to side seams or collar'
    }
  },
  {
    id: 'bella-3001',
    name: 'Bella+Canvas 3001 Unisex Jersey Tee',
    frontendName: 'Premium T-Shirt',
    backendId: 'UNISEX_TEE',
    printfulId: '145',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printAreas: [{ name: 'Front', widthInches: 12, heightInches: 16, widthPixels: 3600, heightPixels: 4800, position: 'Centered on chest' }],
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 16,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4800,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, horizontally centered between shoulder seams, vertically positioned 3-4 inches below collar',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Design should not extend to side seams or collar'
    }
  },
  {
    id: 'gildan-18000',
    name: 'Gildan 18000 Crewneck Sweatshirt',
    frontendName: 'Sweatshirt',
    backendId: 'MENS_SWEAT',
    printfulId: '148',
    category: 'Apparel',
    subcategory: 'Sweatshirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'center-chest-large',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 14,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4200,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, below the hood/collar area, avoid zipper area if applicable',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Consider fabric thickness and texture absorption'
    }
  },
  {
    id: 'gildan-18500',
    name: 'Gildan 18500 Pullover Hoodie',
    frontendName: 'Hoodie',
    backendId: 'MENS_HOODIE',
    printfulId: '146',
    category: 'Apparel',
    subcategory: 'Hoodies',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'above-pocket',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 14,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4200,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, below the hood/collar area, avoid zipper area if applicable',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Consider fabric thickness and texture absorption'
    }
  },
  // Women's Products
  {
    id: 'womens-crop-top',
    name: 'Crop tops',
    frontendName: 'Crop Top',
    backendId: 'WMNS_CROP',
    printfulId: '371',
    category: 'Apparel',
    subcategory: 'Crop Tops',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.WOMENS,
    defaultPlacement: 'center-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [{ name: 'Front', widthInches: 8, heightInches: 8, widthPixels: 2400, heightPixels: 2400, position: 'Centered on chest' }],
    sizeChart: [
      { size: 'XS', chest: 30, length: 16, sleeve: 6 },
      { size: 'S', chest: 32, length: 17, sleeve: 6.5 },
      { size: 'M', chest: 34, length: 18, sleeve: 7 },
      { size: 'L', chest: 36, length: 19, sleeve: 7.5 },
      { size: 'XL', chest: 38, length: 20, sleeve: 8 },
      { size: '2XL', chest: 40, length: 21, sleeve: 8.5 }
    ],
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 8,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 2400,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, cropped length garment with shorter torso',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Cropped silhouette, design should fit within smaller print area'
    },
    promptKeywords: ['crop top', 'cropped tee', 'midriff', 'trendy']
  },
  {
    id: 'womens-tank-top',
    name: 'Tank tops',
    frontendName: 'Tank Top',
    backendId: 'WMNS_TANK',
    printfulId: '167',
    category: 'Apparel',
    subcategory: 'Tank Tops',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.WOMENS,
    defaultPlacement: 'center-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [{ name: 'Front', widthInches: 9, heightInches: 11, widthPixels: 2700, heightPixels: 3300, position: 'Centered on chest' }],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 9,
      printAreaHeight: 11,
      printAreaWidthPixels: 2700,
      printAreaHeightPixels: 3300,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, sleeveless design with racerback or standard straps',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Sleeveless tank, wider armholes require smaller print width'
    },
    promptKeywords: ['tank top', 'sleeveless', 'flowy', 'summer']
  },
  {
    id: 'womens-polo',
    name: 'Polo shirts',
    frontendName: 'Polo Shirt',
    backendId: 'WMNS_POLO',
    printfulId: '200',
    category: 'Apparel',
    subcategory: 'Polo Shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'left-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [
      { name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest' },
      { name: 'Back', widthInches: 10, heightInches: 12, widthPixels: 3000, heightPixels: 3600, position: 'Upper back' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 4,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'left-chest',
      placementDescription: 'Left chest placement, 3-4 inches below shoulder seam, collar and button placket',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Traditional polo with collar, small logo placement preferred'
    },
    promptKeywords: ['polo', 'collared', 'professional', 'golf']
  },
  {
    id: 'womens-dress',
    name: 'Dresses',
    frontendName: 'Dress',
    backendId: 'WMNS_DRESS',
    printfulId: '486',
    category: 'Apparel',
    subcategory: 'Dresses',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.WOMENS,
    defaultPlacement: 'center-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [{ name: 'Front', widthInches: 10, heightInches: 14, widthPixels: 3000, heightPixels: 4200, position: 'Upper front (chest to waist)' }],
    sizeChart: [
      { size: 'XS', chest: 32, length: 34, sleeve: 0 },
      { size: 'S', chest: 34, length: 35, sleeve: 0 },
      { size: 'M', chest: 36, length: 36, sleeve: 0 },
      { size: 'L', chest: 38, length: 37, sleeve: 0 },
      { size: 'XL', chest: 40, length: 38, sleeve: 0 },
      { size: '2XL', chest: 42, length: 39, sleeve: 0 }
    ],
    printSpec: {
      printAreaWidth: 10,
      printAreaHeight: 14,
      printAreaWidthPixels: 3000,
      printAreaHeightPixels: 4200,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on bodice, feminine silhouette with flowing skirt',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'T-shirt dress style, design on upper bodice area'
    },
    promptKeywords: ['dress', 't-shirt dress', 'casual', 'comfortable']
  },
  {
    id: 'womens-34-sleeve',
    name: '3/4 sleeve shirts',
    frontendName: '3/4 Sleeve Shirt',
    backendId: 'WMNS_34SLV',
    printfulId: '242',
    category: 'Apparel',
    subcategory: '3/4 Sleeve Shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.RAGLAN,
    defaultPlacement: 'center-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [{ name: 'Front', widthInches: 10, heightInches: 12, widthPixels: 3000, heightPixels: 3600, position: 'Centered on chest' }],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 10,
      printAreaHeight: 12,
      printAreaWidthPixels: 3000,
      printAreaHeightPixels: 3600,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, 3/4 length sleeves ending at elbow',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Raglan or set-in sleeve with 3/4 length'
    },
    promptKeywords: ['3/4 sleeve', 'raglan', 'baseball tee']
  },
  {
    id: 'womens-long-sleeve',
    name: 'Long sleeve shirts',
    frontendName: 'Long Sleeve Shirt',
    backendId: 'WMNS_LS',
    printfulId: '246',
    category: 'Apparel',
    subcategory: 'Long Sleeve Shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.WOMENS,
    defaultPlacement: 'center-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [
      { name: 'Front', widthInches: 10, heightInches: 12, widthPixels: 3000, heightPixels: 3600, position: 'Centered on chest' },
      { name: 'Back', widthInches: 12, heightInches: 14, widthPixels: 3600, heightPixels: 4200, position: 'Upper back' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 10,
      printAreaHeight: 12,
      printAreaWidthPixels: 3000,
      printAreaHeightPixels: 3600,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, full length sleeves',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Long sleeve fitted or relaxed fit options'
    },
    promptKeywords: ['long sleeve', 'fitted', 'layering']
  },
  {
    id: 'womens-knitwear',
    name: 'Knitwear',
    frontendName: 'Knitwear (Sweater)',
    backendId: 'WMNS_KNIT',
    printfulId: '458',
    category: 'Apparel',
    subcategory: 'Knitwear',
    productType: 'dtg-apparel',
    printMethod: 'embroidery',
    isWearable: true,
    availableColors: PRODUCT_COLORS.KNITWEAR,
    defaultPlacement: 'left-chest',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [{ name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest embroidery' }],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 4,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'left-chest',
      placementDescription: 'Left chest embroidery placement',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Knit sweater or cardigan, embroidery recommended'
    },
    promptKeywords: ['sweater', 'knitwear', 'pullover', 'cozy']
  },
  {
    id: 'womens-jacket',
    name: 'Jackets',
    frontendName: 'Jacket',
    backendId: 'WMNS_JACKET',
    printfulId: '491',
    category: 'Apparel',
    subcategory: 'Jackets',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.OUTERWEAR,
    defaultPlacement: 'back-center',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    printAreas: [
      { name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest' },
      { name: 'Back', widthInches: 12, heightInches: 12, widthPixels: 3600, heightPixels: 3600, position: 'Upper back' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 12,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 3600,
      dpi: 300,
      placement: 'back-center',
      placementDescription: 'Centered on back panel, large print area',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Bomber or lightweight jacket with back print'
    },
    promptKeywords: ['jacket', 'windbreaker', 'outerwear']
  },
  // Men's Products
  {
    id: 'mens-tank-top',
    name: 'Tank tops',
    frontendName: 'Tank Top',
    backendId: 'MENS_TANK',
    printfulId: '163',
    category: 'Apparel',
    subcategory: 'Tank tops',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'center-chest',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [
      { name: 'Front', widthInches: 10, heightInches: 12, widthPixels: 3000, heightPixels: 3600, position: 'Centered on chest' },
      { name: 'Back', widthInches: 12, heightInches: 14, widthPixels: 3600, heightPixels: 4200, position: 'Upper back' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 10,
      printAreaHeight: 12,
      printAreaWidthPixels: 3000,
      printAreaHeightPixels: 3600,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, athletic cut sleeveless design',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Athletic tank top, wider shoulder straps'
    },
    promptKeywords: ['tank top', 'muscle tee', 'sleeveless', 'gym']
  },
  {
    id: 'mens-polo',
    name: 'Polo shirts',
    frontendName: 'Polo Shirt',
    backendId: 'MENS_POLO',
    printfulId: '144',
    category: 'Apparel',
    subcategory: 'Polo shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'left-chest',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [
      { name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest' },
      { name: 'Back', widthInches: 12, heightInches: 14, widthPixels: 3600, heightPixels: 4200, position: 'Upper back' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 4,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'left-chest',
      placementDescription: 'Left chest placement, traditional polo with collar and button placket',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Classic polo shirt, small logo or embroidery preferred'
    },
    promptKeywords: ['polo', 'collared', 'business casual', 'golf']
  },
  {
    id: 'mens-34-sleeve',
    name: '3/4 sleeve shirts',
    frontendName: '3/4 Sleeve Shirt',
    backendId: 'MENS_34SLV',
    printfulId: '242',
    category: 'Apparel',
    subcategory: '3/4 sleeve shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.RAGLAN,
    defaultPlacement: 'center-chest',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [{ name: 'Front', widthInches: 12, heightInches: 16, widthPixels: 3600, heightPixels: 4800, position: 'Centered on chest' }],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 16,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4800,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, raglan 3/4 sleeve baseball style',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Baseball raglan style with contrasting sleeves'
    },
    promptKeywords: ['3/4 sleeve', 'raglan', 'baseball tee', 'vintage']
  },
  {
    id: 'mens-long-sleeve',
    name: 'Long sleeve shirts',
    frontendName: 'Long Sleeve Shirt',
    backendId: 'MENS_LS',
    printfulId: '244',
    category: 'Apparel',
    subcategory: 'Long sleeve shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'center-chest',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [
      { name: 'Front', widthInches: 12, heightInches: 16, widthPixels: 3600, heightPixels: 4800, position: 'Centered' },
      { name: 'Back', widthInches: 12, heightInches: 14, widthPixels: 3600, heightPixels: 4200, position: 'Upper back' },
      { name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 16,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4800,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, full length sleeves',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Long sleeve tee, relaxed fit'
    },
    promptKeywords: ['long sleeve', 'crew neck', 'layering']
  },
  {
    id: 'mens-embroidered',
    name: 'Embroidered shirts',
    frontendName: 'Embroidered Shirt',
    backendId: 'MENS_EMBROI',
    printfulId: '71',
    category: 'Apparel',
    subcategory: 'Embroidered shirts',
    productType: 'dtg-apparel',
    printMethod: 'embroidery',
    isWearable: true,
    availableColors: PRODUCT_COLORS.APPAREL_FULL,
    defaultPlacement: 'left-chest',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [
      { name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest' },
      { name: 'Right Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Right chest' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 4,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'left-chest',
      placementDescription: 'Left chest embroidery placement, small detailed design',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Embroidered design, limited colors and detail'
    },
    promptKeywords: ['embroidered', 'stitched', 'logo', 'premium']
  },
  {
    id: 'mens-jacket-vest',
    name: 'Jackets & vests',
    frontendName: 'Jacket & Vest',
    backendId: 'MENS_JACKET',
    printfulId: '491',
    category: 'Apparel',
    subcategory: 'Jackets & vests',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.OUTERWEAR,
    defaultPlacement: 'back-center',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [
      { name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest' },
      { name: 'Back', widthInches: 14, heightInches: 14, widthPixels: 4200, heightPixels: 4200, position: 'Upper back' }
    ],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 14,
      printAreaHeight: 16,
      printAreaWidthPixels: 4200,
      printAreaHeightPixels: 4800,
      dpi: 300,
      placement: 'back-center',
      placementDescription: 'Centered on back panel, bomber or coach style jacket',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Bomber jacket or vest with large back print'
    },
    promptKeywords: ['jacket', 'vest', 'coach jacket', 'outerwear']
  },
  {
    id: 'mens-knitwear',
    name: 'Knitwear',
    frontendName: 'Knitwear',
    backendId: 'MENS_KNIT',
    printfulId: '459',
    category: 'Apparel',
    subcategory: 'Knitwear',
    productType: 'dtg-apparel',
    printMethod: 'embroidery',
    isWearable: true,
    availableColors: PRODUCT_COLORS.KNITWEAR,
    defaultPlacement: 'center-chest',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    printAreas: [{ name: 'Left Chest', widthInches: 4, heightInches: 4, widthPixels: 1200, heightPixels: 1200, position: 'Left chest embroidery' }],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 4,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'left-chest',
      placementDescription: 'Left chest embroidery, knit sweater texture',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Knit sweater, embroidery preferred for best results'
    },
    promptKeywords: ['sweater', 'knitwear', 'pullover']
  },
  {
    id: 'mens-leggings',
    name: 'Leggings',
    frontendName: 'Leggings',
    backendId: 'MENS_LEGG',
    printfulId: '197',
    category: 'Apparel',
    subcategory: 'Leggings',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: PRODUCT_COLORS.AOP,
    defaultPlacement: 'full-coverage',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.LEGGINGS,
    printAreas: [{ name: 'Full Coverage', widthInches: 0, heightInches: 0, widthPixels: 4800, heightPixels: 8400, position: 'Full leg coverage (AOP)' }],
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 16,
      printAreaHeight: 28,
      printAreaWidthPixels: 4800,
      printAreaHeightPixels: 8400,
      dpi: 300,
      placement: 'full-coverage',
      placementDescription: 'All-over print covering entire leggings',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'AOP compression leggings with full coverage print'
    },
    promptKeywords: ['leggings', 'compression', 'athletic', 'gym']
  },
  // Kids' Products
  {
    id: 'kids-tshirt',
    name: 'T-shirts',
    frontendName: 'T-Shirt',
    backendId: 'KIDS_TSHIRT',
    printfulId: '384',
    category: 'Apparel',
    subcategory: 'T-shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.KIDS,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.KIDS,
    printAreas: [{ name: 'Front', widthInches: 8, heightInches: 10, widthPixels: 2400, heightPixels: 3000, position: 'Centered on chest' }],
    sizeChart: [
      { size: 'XS (2-4)', chest: 22, length: 15, sleeve: 4 },
      { size: 'S (6-8)', chest: 26, length: 18, sleeve: 5 },
      { size: 'M (10-12)', chest: 30, length: 21, sleeve: 6 },
      { size: 'L (14-16)', chest: 34, length: 24, sleeve: 7 },
      { size: 'XL (18)', chest: 36, length: 26, sleeve: 7.5 }
    ],
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, scaled for youth sizes',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Youth sizing, smaller print area'
    },
    promptKeywords: ['kids', 'youth', 't-shirt', 'children']
  },
  {
    id: 'kids-hoodie',
    name: 'Hoodies',
    frontendName: 'Hoodie',
    backendId: 'KIDS_HOODIE',
    printfulId: '152',
    category: 'Apparel',
    subcategory: 'Hoodies',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.KIDS,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.KIDS,
    printAreas: [{ name: 'Front', widthInches: 8, heightInches: 10, widthPixels: 2400, heightPixels: 3000, position: 'Above kangaroo pocket' }],
    sizeChart: [
      { size: 'XS (2-4)', chest: 24, length: 16, sleeve: 14 },
      { size: 'S (6-8)', chest: 28, length: 19, sleeve: 17 },
      { size: 'M (10-12)', chest: 32, length: 22, sleeve: 20 },
      { size: 'L (14-16)', chest: 36, length: 25, sleeve: 23 },
      { size: 'XL (18)', chest: 38, length: 27, sleeve: 25 }
    ],
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, youth hoodie with kangaroo pocket',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Youth hoodie, above pocket placement'
    },
    promptKeywords: ['kids', 'youth', 'hoodie', 'children']
  },
  {
    id: 'kids-sweatshirt',
    name: 'Sweatshirts',
    frontendName: 'Sweatshirt',
    backendId: 'KIDS_SWEAT',
    printfulId: '154',
    category: 'Apparel',
    subcategory: 'Sweatshirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.KIDS,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.KIDS,
    printAreas: [{ name: 'Front', widthInches: 8, heightInches: 10, widthPixels: 2400, heightPixels: 3000, position: 'Centered on chest' }],
    sizeChart: [
      { size: 'XS (2-4)', chest: 24, length: 15, sleeve: 14 },
      { size: 'S (6-8)', chest: 28, length: 18, sleeve: 17 },
      { size: 'M (10-12)', chest: 32, length: 21, sleeve: 20 },
      { size: 'L (14-16)', chest: 36, length: 24, sleeve: 23 },
      { size: 'XL (18)', chest: 38, length: 26, sleeve: 25 }
    ],
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, youth crewneck sweatshirt',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Youth sweatshirt, crewneck style'
    },
    promptKeywords: ['kids', 'youth', 'sweatshirt', 'children']
  },
  {
    id: 'kids-long-sleeve',
    name: 'Long sleeve shirts',
    frontendName: 'Long Sleeve Shirt',
    backendId: 'KIDS_LS',
    printfulId: '386',
    category: 'Apparel',
    subcategory: 'Long sleeve shirts',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.KIDS,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.KIDS,
    printAreas: [{ name: 'Front', widthInches: 8, heightInches: 10, widthPixels: 2400, heightPixels: 3000, position: 'Centered on chest' }],
    sizeChart: [
      { size: 'XS (2-4)', chest: 22, length: 15, sleeve: 14 },
      { size: 'S (6-8)', chest: 26, length: 18, sleeve: 17 },
      { size: 'M (10-12)', chest: 30, length: 21, sleeve: 20 },
      { size: 'L (14-16)', chest: 34, length: 24, sleeve: 23 },
      { size: 'XL (18)', chest: 36, length: 26, sleeve: 25 }
    ],
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, youth long sleeve tee',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Youth long sleeve shirt'
    },
    promptKeywords: ['kids', 'youth', 'long sleeve', 'children']
  },
  {
    id: 'kids-leggings',
    name: 'Leggings',
    frontendName: 'Leggings',
    backendId: 'KIDS_LEGG',
    printfulId: '198',
    category: 'Apparel',
    subcategory: 'Leggings',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: PRODUCT_COLORS.AOP,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.KIDS_LEGGINGS,
    printAreas: [{ name: 'Full Coverage', widthInches: 0, heightInches: 0, widthPixels: 3600, heightPixels: 6300, position: 'Full leg coverage (AOP)' }],
    sizeChart: [
      { size: 'XS (2-4)', chest: 20, length: 18, sleeve: 0 },
      { size: 'S (6-8)', chest: 22, length: 22, sleeve: 0 },
      { size: 'M (10-12)', chest: 24, length: 26, sleeve: 0 },
      { size: 'L (14-16)', chest: 26, length: 30, sleeve: 0 }
    ],
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 21,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 6300,
      dpi: 300,
      placement: 'full-coverage',
      placementDescription: 'All-over print covering entire leggings, youth sizes',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Youth AOP leggings with full coverage print'
    },
    promptKeywords: ['kids', 'youth', 'leggings', 'children', 'athletic']
  },
  {
    id: 'baby-bodysuit',
    name: 'Baby bodysuits',
    frontendName: 'Baby Bodysuit',
    backendId: 'BABY_BODY',
    printfulId: '309',
    category: 'Apparel',
    subcategory: 'Baby bodysuits',
    productType: 'dtg-apparel',
    printMethod: 'dtg',
    isWearable: true,
    availableColors: PRODUCT_COLORS.BABY,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.BABY,
    printAreas: [{ name: 'Front', widthInches: 5, heightInches: 6, widthPixels: 1500, heightPixels: 1800, position: 'Centered on chest' }],
    sizeChart: [
      { size: '0-3M', chest: 16, length: 11, sleeve: 3 },
      { size: '3-6M', chest: 17, length: 12, sleeve: 3.5 },
      { size: '6-12M', chest: 18, length: 13, sleeve: 4 },
      { size: '12-18M', chest: 19, length: 14, sleeve: 4.5 },
      { size: '18-24M', chest: 20, length: 15, sleeve: 5 }
    ],
    printSpec: {
      printAreaWidth: 5,
      printAreaHeight: 6,
      printAreaWidthPixels: 1500,
      printAreaHeightPixels: 1800,
      dpi: 300,
      placement: 'center-chest',
      placementDescription: 'Centered on chest, infant onesie with snap closure',
      safeZone: 0.25,
      surfaceType: 'flexible',
      notes: 'Infant bodysuit, small print area'
    },
    promptKeywords: ['baby', 'infant', 'onesie', 'bodysuit']
  },
  {
    id: 'kids-hat',
    name: 'Hats',
    frontendName: 'Hat',
    backendId: 'KIDS_HAT',
    printfulId: '361',
    category: 'Accessories',
    subcategory: 'Hats',
    productType: 'accessory-hat',
    printMethod: 'embroidery',
    isWearable: true,
    availableColors: PRODUCT_COLORS.HATS,
    defaultPlacement: 'front-panel',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.YOUTH_HAT,
    printAreas: [{ name: 'Front Panel', widthInches: 4, heightInches: 2.5, widthPixels: 1200, heightPixels: 750, position: 'Front panel (embroidery)' }],
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 2.5,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 750,
      dpi: 300,
      placement: 'front-panel',
      placementDescription: 'Centered on front panel, youth baseball cap',
      safeZone: 0.125,
      surfaceType: 'flexible',
      notes: 'Youth baseball cap, embroidery or patch preferred'
    },
    promptKeywords: ['kids', 'youth', 'hat', 'cap', 'baseball cap']
  }
];

export const AOP_PRODUCTS: Product[] = [
  {
    id: 'aop-hoodie',
    name: 'Unisex AOP Hoodie',
    frontendName: 'AOP Hoodie',
    backendId: 'AOP_HOODIE',
    printfulId: '424',
    category: 'Apparel',
    subcategory: 'Hoodies',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage-panels',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 46,
      printAreaHeight: 52,
      printAreaWidthPixels: 13800,
      printAreaHeightPixels: 15600,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation covering entire garment including hood',
      bleed: 0.125,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: 'Pattern must align at hood seams and across panels. Full print layout includes all panels arranged for cut-and-sew.'
    },
    aopSpec: {
      constructionType: 'cut_and_sew',
      constructionNotes: 'Fabric printed flat, then cut into pattern pieces and sewn together. Allows true edge-to-edge coverage.',
      panels: [
        { name: 'Front Left Panel', widthInches: 12, heightInches: 26, widthPixels: 3600, heightPixels: 7800, notes: 'Includes partial hood attachment' },
        { name: 'Front Right Panel', widthInches: 12, heightInches: 26, widthPixels: 3600, heightPixels: 7800, notes: 'Mirror of front left' },
        { name: 'Back Panel', widthInches: 22, heightInches: 26, widthPixels: 6600, heightPixels: 7800, notes: 'Full back with shoulder seams' },
        { name: 'Left Sleeve', widthInches: 9, heightInches: 24, widthPixels: 2700, heightPixels: 7200, notes: 'Tubular construction' },
        { name: 'Right Sleeve', widthInches: 9, heightInches: 24, widthPixels: 2700, heightPixels: 7200, notes: 'Mirror of left sleeve' },
        { name: 'Hood Left', widthInches: 10, heightInches: 14, widthPixels: 3000, heightPixels: 4200, notes: 'Pattern must align at center seam' },
        { name: 'Hood Right', widthInches: 10, heightInches: 14, widthPixels: 3000, heightPixels: 4200, notes: 'Mirror of hood left' },
        { name: 'Kangaroo Pocket', widthInches: 16, heightInches: 8, widthPixels: 4800, heightPixels: 2400, notes: 'Optional pocket panel' }
      ],
      totalPrintFile: { widthPixels: 13800, heightPixels: 15600, widthInches: 46, heightInches: 52 },
      dpi: 300,
      bleedInches: 0.125,
      bleedPixels: 38,
      seamAlignments: [
        { location: 'Hood center seam', requirement: 'critical', notes: 'Pattern must match perfectly at center seam' },
        { location: 'Shoulder seams', requirement: 'critical', notes: 'Front panels must align with back panel' },
        { location: 'Sleeve attachment', requirement: 'recommended', notes: 'Armhole seams less visible due to construction' },
        { location: 'Side seams', requirement: 'recommended', notes: 'Front and back panels should align' }
      ],
      trimAreas: [
        { name: 'Cuffs', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Ribbed cuffs typically solid' },
        { name: 'Waistband', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Ribbed waistband solid' },
        { name: 'Drawstring', defaultColor: 'White or Black', colorSource: 'manual', notes: 'Hood drawstring contrast' }
      ],
      patternScale: {
        recommendedTileInches: { width: 4, height: 4 },
        recommendedTilePixels: { width: 1200, height: 1200 },
        minScale: '2" tile (small intricate patterns)',
        maxScale: '12" tile (large bold patterns)',
        notes: 'Medium patterns (4-6") work best for hoodies'
      },
      patternTips: [
        'Use seamless tileable patterns for best results',
        'Avoid placing focal elements at seam lines',
        'Consider pattern direction - should flow naturally',
        'Test pattern at multiple scales before final selection',
        'Hood area benefits from smaller pattern scales'
      ]
    }
  },
  {
    id: 'aop-womens-leggings',
    name: 'AOP Women\'s Leggings',
    frontendName: 'AOP Leggings',
    backendId: 'AOP_LEGG',
    printfulId: '427',
    category: 'Apparel',
    subcategory: 'Leggings',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: '360-coverage',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.LEGGINGS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 32,
      printAreaHeight: 42,
      printAreaWidthPixels: 9600,
      printAreaHeightPixels: 12600,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation covering entire garment',
      bleed: 0.125,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: 'Pattern must tile seamlessly across panels and seams; account for stretch distortion. Full print layout includes front and back panels side-by-side.'
    },
    aopSpec: {
      constructionType: 'cut_and_sew',
      constructionNotes: 'Two-panel construction (front/back). High-stretch fabric requires pattern compensation.',
      panels: [
        { name: 'Front Panel (both legs)', widthInches: 16, heightInches: 42, widthPixels: 4800, heightPixels: 12600, notes: 'Continuous front from waist to ankles' },
        { name: 'Back Panel (both legs)', widthInches: 16, heightInches: 42, widthPixels: 4800, heightPixels: 12600, notes: 'Continuous back from waist to ankles' }
      ],
      totalPrintFile: { widthPixels: 9600, heightPixels: 12600, widthInches: 32, heightInches: 42 },
      dpi: 300,
      bleedInches: 0.125,
      bleedPixels: 38,
      seamAlignments: [
        { location: 'Inner leg seam', requirement: 'critical', notes: 'Front and back panels meet here' },
        { location: 'Outer leg seam', requirement: 'critical', notes: 'Pattern must align when worn' },
        { location: 'Waistband', requirement: 'recommended', notes: 'Elastic waistband may obscure some pattern' },
        { location: 'Crotch gusset', requirement: 'not_required', notes: 'Small panel, alignment less critical' }
      ],
      trimAreas: [
        { name: 'Waistband', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Wide elastic waistband' },
        { name: 'Ankle hem', defaultColor: 'None (printed to edge)', colorSource: 'none', notes: 'Pattern extends to edge' }
      ],
      patternScale: {
        recommendedTileInches: { width: 3, height: 3 },
        recommendedTilePixels: { width: 900, height: 900 },
        minScale: '1.5" tile (fine textures)',
        maxScale: '6" tile (bold statements)',
        notes: 'Smaller patterns (2-4") work best due to body contours and stretch'
      },
      patternTips: [
        'Design at 85% vertical scale to compensate for stretch',
        'Avoid horizontal stripes (will distort at curves)',
        'Test pattern on curved surfaces before finalizing',
        'Consider how pattern looks at hip vs ankle width',
        'Organic patterns hide seams better than geometric'
      ],
      stretchDistortion: 'Vertical stretch 15-20% when worn. Design patterns slightly compressed vertically (85% scale) for accurate appearance when stretched on body.'
    }
  },
  {
    id: 'aop-mens-cut-sew-tee',
    name: 'AOP Men\'s Cut & Sew Tee',
    frontendName: 'AOP T-Shirt',
    backendId: 'AOP_TSHIRT',
    printfulId: '422',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'mens',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 44,
      printAreaHeight: 38,
      printAreaWidthPixels: 13200,
      printAreaHeightPixels: 11400,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge cut and sew sublimation with panel construction',
      bleed: 0.125,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: 'Cut and sew construction allows seamless pattern alignment across panels. Layout: Front+Back side-by-side (44×28"), sleeves below (20×10").'
    },
    aopSpec: {
      constructionType: 'cut_and_sew',
      constructionNotes: 'Four-panel construction (front, back, two sleeves). Fabric printed then cut and sewn.',
      panels: [
        { name: 'Front Panel', widthInches: 22, heightInches: 28, widthPixels: 6600, heightPixels: 8400, notes: 'Includes shoulder area' },
        { name: 'Back Panel', widthInches: 22, heightInches: 28, widthPixels: 6600, heightPixels: 8400, notes: 'Includes shoulder area' },
        { name: 'Left Sleeve', widthInches: 10, heightInches: 10, widthPixels: 3000, heightPixels: 3000, notes: 'Short sleeve' },
        { name: 'Right Sleeve', widthInches: 10, heightInches: 10, widthPixels: 3000, heightPixels: 3000, notes: 'Short sleeve' }
      ],
      totalPrintFile: { widthPixels: 13200, heightPixels: 11400, widthInches: 44, heightInches: 38 },
      dpi: 300,
      bleedInches: 0.125,
      bleedPixels: 38,
      seamAlignments: [
        { location: 'Shoulder seams', requirement: 'critical', notes: 'Front and back must align at shoulders' },
        { location: 'Side seams', requirement: 'critical', notes: 'Pattern continuity from front to back' },
        { location: 'Sleeve attachment', requirement: 'recommended', notes: 'Less critical due to armhole curve' }
      ],
      trimAreas: [
        { name: 'Collar', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Ribbed collar band' },
        { name: 'Hem', defaultColor: 'None (printed to edge)', colorSource: 'none', notes: 'Pattern extends to hem' }
      ],
      patternScale: {
        recommendedTileInches: { width: 4, height: 4 },
        recommendedTilePixels: { width: 1200, height: 1200 },
        minScale: '2" tile (detailed patterns)',
        maxScale: '8" tile (statement pieces)',
        notes: 'Medium patterns (3-5") work best for t-shirts'
      },
      patternTips: [
        'Consider chest as primary focal area',
        'Patterns should flow naturally across seams',
        'Test visibility of pattern details at different scales',
        'Account for garment movement when selecting pattern type'
      ]
    }
  },
  {
    id: 'aop-womens-tee',
    name: 'AOP Women\'s Tee',
    frontendName: 'AOP Crop Top',
    backendId: 'AOP_CROP',
    printfulId: '443',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'womens',
    sizes: PRODUCT_SIZES.WOMENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 36,
      printAreaHeight: 28,
      printAreaWidthPixels: 10800,
      printAreaHeightPixels: 8400,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation with fitted silhouette',
      bleed: 0.125,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: 'Fitted feminine silhouette with shorter sleeves. Layout: Front+Back side-by-side (36×20"), sleeves below (16×8").'
    },
    aopSpec: {
      constructionType: 'cut_and_sew',
      constructionNotes: 'Fitted cut with shorter body length. Four-panel construction.',
      panels: [
        { name: 'Front Panel', widthInches: 18, heightInches: 20, widthPixels: 5400, heightPixels: 6000, notes: 'Fitted front with darts' },
        { name: 'Back Panel', widthInches: 18, heightInches: 20, widthPixels: 5400, heightPixels: 6000, notes: 'Fitted back' },
        { name: 'Left Sleeve', widthInches: 8, heightInches: 8, widthPixels: 2400, heightPixels: 2400, notes: 'Cap sleeve' },
        { name: 'Right Sleeve', widthInches: 8, heightInches: 8, widthPixels: 2400, heightPixels: 2400, notes: 'Cap sleeve' }
      ],
      totalPrintFile: { widthPixels: 10800, heightPixels: 8400, widthInches: 36, heightInches: 28 },
      dpi: 300,
      bleedInches: 0.125,
      bleedPixels: 38,
      seamAlignments: [
        { location: 'Shoulder seams', requirement: 'critical', notes: 'Critical for fitted look' },
        { location: 'Side seams', requirement: 'critical', notes: 'Must align for body-conscious fit' },
        { location: 'Bust darts', requirement: 'recommended', notes: 'Pattern may need adjustment around darts' }
      ],
      trimAreas: [
        { name: 'Collar', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Ribbed neckline' },
        { name: 'Cropped hem', defaultColor: 'None (raw edge)', colorSource: 'none', notes: 'Cropped length' }
      ],
      patternScale: {
        recommendedTileInches: { width: 3, height: 3 },
        recommendedTilePixels: { width: 900, height: 900 },
        minScale: '1.5" tile (delicate patterns)',
        maxScale: '6" tile (bold statements)',
        notes: 'Smaller patterns (2-4") complement fitted silhouette'
      },
      patternTips: [
        'Consider bust area as primary focal point',
        'Smaller patterns work better with fitted cuts',
        'Account for body curves when selecting pattern',
        'Avoid busy patterns that may overwhelm smaller canvas'
      ]
    }
  },
  {
    id: 'aop-crewneck-sweatshirt',
    name: 'Unisex AOP Sweatshirt',
    frontendName: 'AOP Sweatshirt',
    backendId: 'AOP_SWEAT',
    printfulId: '431',
    category: 'Apparel',
    subcategory: 'Sweatshirts',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MENS,
    sizeChart: STANDARD_SIZE_CHART,
    printSpec: {
      printAreaWidth: 44,
      printAreaHeight: 50,
      printAreaWidthPixels: 13200,
      printAreaHeightPixels: 15000,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation covering entire garment',
      bleed: 0.125,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: 'Pattern must align at seams, solid color ribbing at collar, cuffs, and waistband. Layout: Front+Back side-by-side (44×26"), sleeves below (18×24").'
    },
    aopSpec: {
      constructionType: 'cut_and_sew',
      constructionNotes: 'Similar to hoodie without hood. Four main panels plus sleeves.',
      panels: [
        { name: 'Front Panel', widthInches: 22, heightInches: 26, widthPixels: 6600, heightPixels: 7800, notes: 'Full front torso' },
        { name: 'Back Panel', widthInches: 22, heightInches: 26, widthPixels: 6600, heightPixels: 7800, notes: 'Full back torso' },
        { name: 'Left Sleeve', widthInches: 9, heightInches: 24, widthPixels: 2700, heightPixels: 7200, notes: 'Long sleeve' },
        { name: 'Right Sleeve', widthInches: 9, heightInches: 24, widthPixels: 2700, heightPixels: 7200, notes: 'Long sleeve' }
      ],
      totalPrintFile: { widthPixels: 13200, heightPixels: 15000, widthInches: 44, heightInches: 50 },
      dpi: 300,
      bleedInches: 0.125,
      bleedPixels: 38,
      seamAlignments: [
        { location: 'Shoulder seams', requirement: 'critical', notes: 'Front and back panels must align' },
        { location: 'Side seams', requirement: 'critical', notes: 'Pattern continuity essential' },
        { location: 'Sleeve attachment', requirement: 'recommended', notes: 'Armhole construction allows some flexibility' }
      ],
      trimAreas: [
        { name: 'Collar ribbing', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Solid ribbed collar' },
        { name: 'Cuffs', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Solid ribbed cuffs' },
        { name: 'Waistband', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Solid ribbed waistband' }
      ],
      patternScale: {
        recommendedTileInches: { width: 4, height: 4 },
        recommendedTilePixels: { width: 1200, height: 1200 },
        minScale: '2" tile (intricate designs)',
        maxScale: '10" tile (bold graphics)',
        notes: 'Medium patterns (4-6") work best for sweatshirts'
      },
      patternTips: [
        'Larger canvas allows for bolder patterns',
        'Consider sleeve area when designing',
        'Ribbing color should complement pattern',
        'Patterns should work well with relaxed fit'
      ]
    }
  },
  {
    id: 'aop-swimsuit',
    name: 'AOP One-Piece Swimsuit',
    category: 'Apparel',
    subcategory: 'Swimwear',
    productType: 'aop-apparel',
    printMethod: 'aop',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'womens',
    sizeChart: [
      { size: 'XS', chest: 32, length: 24, sleeve: 0 },
      { size: 'S', chest: 34, length: 25, sleeve: 0 },
      { size: 'M', chest: 36, length: 26, sleeve: 0 },
      { size: 'L', chest: 38, length: 27, sleeve: 0 },
      { size: 'XL', chest: 40, length: 28, sleeve: 0 },
      { size: '2XL', chest: 42, length: 29, sleeve: 0 }
    ],
    printSpec: {
      printAreaWidth: 28,
      printAreaHeight: 36,
      printAreaWidthPixels: 8400,
      printAreaHeightPixels: 10800,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation on chlorine-resistant fabric',
      bleed: 0.125,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: '82% polyester/18% spandex blend, UPF 38+, four-way stretch. Layout: Front+Back side-by-side (28×24"), lining below (10×12").'
    },
    aopSpec: {
      constructionType: 'cut_and_sew',
      constructionNotes: 'High-stretch chlorine-resistant fabric. Pattern must account for significant stretch.',
      panels: [
        { name: 'Front Body', widthInches: 14, heightInches: 24, widthPixels: 4200, heightPixels: 7200, notes: 'Main front panel including straps' },
        { name: 'Back Body', widthInches: 14, heightInches: 24, widthPixels: 4200, heightPixels: 7200, notes: 'Main back panel' },
        { name: 'Lining', widthInches: 10, heightInches: 12, widthPixels: 3000, heightPixels: 3600, notes: 'Inner lining (solid color typically)' }
      ],
      totalPrintFile: { widthPixels: 8400, heightPixels: 10800, widthInches: 28, heightInches: 36 },
      dpi: 300,
      bleedInches: 0.125,
      bleedPixels: 38,
      seamAlignments: [
        { location: 'Side seams', requirement: 'critical', notes: 'Front and back must align at sides' },
        { location: 'Leg openings', requirement: 'recommended', notes: 'Pattern should flow naturally at leg cut' },
        { location: 'Neckline/straps', requirement: 'recommended', notes: 'Strap attachment points' }
      ],
      trimAreas: [
        { name: 'Lining', defaultColor: 'Matching dominant color', colorSource: 'auto', notes: 'Inner lining typically solid' },
        { name: 'Elastic edges', defaultColor: 'Clear/invisible', colorSource: 'none', notes: 'Elastic at leg and back' }
      ],
      patternScale: {
        recommendedTileInches: { width: 2, height: 2 },
        recommendedTilePixels: { width: 600, height: 600 },
        minScale: '1" tile (delicate prints)',
        maxScale: '4" tile (bold patterns)',
        notes: 'Smaller patterns (1.5-3") work best due to high stretch'
      },
      patternTips: [
        'Design at 80% scale to compensate for stretch',
        'Avoid geometric patterns that show stretch distortion',
        'Consider pattern visibility when wet',
        'Test chlorine resistance of color choices',
        'Organic/abstract patterns hide stretch best'
      ],
      stretchDistortion: 'Four-way stretch 20-25%. Design patterns compressed at 80% scale for accurate appearance when worn.'
    }
  },
  {
    id: 'aop-tote-bag',
    name: 'AOP Tote Bag',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'aop-accessory',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 16,
      printAreaHeight: 16,
      printAreaWidthPixels: 4800,
      printAreaHeightPixels: 4800,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation on both sides',
      bleed: 0.25,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: 'Pattern covers both front and back panels, solid color handles'
    },
    aopSpec: {
      constructionType: 'sublimation_on_blank',
      constructionNotes: 'Flat panels printed then assembled. Two main panels plus gusset.',
      panels: [
        { name: 'Front Panel', widthInches: 16, heightInches: 16, widthPixels: 4800, heightPixels: 4800, notes: 'Main front surface' },
        { name: 'Back Panel', widthInches: 16, heightInches: 16, widthPixels: 4800, heightPixels: 4800, notes: 'Main back surface (can mirror front)' },
        { name: 'Bottom Gusset', widthInches: 16, heightInches: 4, widthPixels: 4800, heightPixels: 1200, notes: 'Optional gusset panel' }
      ],
      totalPrintFile: { widthPixels: 4800, heightPixels: 4800, widthInches: 16, heightInches: 16 },
      dpi: 300,
      bleedInches: 0.25,
      bleedPixels: 75,
      seamAlignments: [
        { location: 'Side seams', requirement: 'recommended', notes: 'Front and back meet at sides' },
        { location: 'Bottom seam', requirement: 'not_required', notes: 'Bottom fold or gusset obscures pattern' },
        { location: 'Handle attachment', requirement: 'not_required', notes: 'Handle covers small area' }
      ],
      trimAreas: [
        { name: 'Handles', defaultColor: 'Black or White', colorSource: 'manual', notes: 'Solid color woven handles' },
        { name: 'Top hem', defaultColor: 'Matching pattern', colorSource: 'auto', notes: 'Folded and stitched edge' }
      ],
      patternScale: {
        recommendedTileInches: { width: 4, height: 4 },
        recommendedTilePixels: { width: 1200, height: 1200 },
        minScale: '2" tile (detailed patterns)',
        maxScale: '8" tile (bold statement)',
        notes: 'Medium patterns (3-5") work well for tote visibility'
      },
      patternTips: [
        'Consider pattern orientation (upright when bag carried)',
        'Bold patterns stand out in busy environments',
        'Pattern should work well mirrored on back',
        'Account for natural bag creases/folds'
      ]
    }
  },
  {
    id: 'aop-square-pillow',
    name: 'AOP Square Pillow',
    frontendName: 'Throw Pillow',
    backendId: 'AOP_PILLOW',
    printfulId: '436',
    category: 'Home & Living',
    subcategory: 'Pillows',
    productType: 'aop-home',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.THROW_PILLOW,
    printSpec: {
      printAreaWidth: 18,
      printAreaHeight: 18,
      printAreaWidthPixels: 5400,
      printAreaHeightPixels: 5400,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation on pillow cover',
      bleed: 0.5,
      wrapAround: true,
      surfaceType: 'flexible',
      notes: '100% polyester cover, hidden zipper, pillow insert included'
    },
    aopSpec: {
      constructionType: 'sublimation_on_blank',
      constructionNotes: 'Square or rectangular panels printed flat. Hidden zipper closure.',
      panels: [
        { name: 'Front Face', widthInches: 18, heightInches: 18, widthPixels: 5400, heightPixels: 5400, notes: 'Main display surface' },
        { name: 'Back Face', widthInches: 18, heightInches: 18, widthPixels: 5400, heightPixels: 5400, notes: 'Back panel (optional print)' }
      ],
      totalPrintFile: { widthPixels: 5400, heightPixels: 5400, widthInches: 18, heightInches: 18 },
      dpi: 300,
      bleedInches: 0.5,
      bleedPixels: 150,
      seamAlignments: [
        { location: 'Edge seams', requirement: 'not_required', notes: 'Seams at pillow edges, not visible from front' },
        { location: 'Zipper line', requirement: 'not_required', notes: 'Hidden zipper on back' }
      ],
      trimAreas: [
        { name: 'Zipper', defaultColor: 'Matching fabric', colorSource: 'auto', notes: 'Hidden zipper on back panel' }
      ],
      patternScale: {
        recommendedTileInches: { width: 4.5, height: 4.5 },
        recommendedTilePixels: { width: 1350, height: 1350 },
        minScale: '2" tile (intricate patterns)',
        maxScale: '9" tile (single focal element)',
        notes: 'Quarter of pillow size creates balanced repeat'
      },
      patternTips: [
        'Center focal elements on front face',
        'Consider how pattern looks when pillow is fluffed',
        'Symmetrical patterns work well for pillows',
        'Account for 0.5" bleed wrapping to sides'
      ]
    }
  },
  {
    id: 'aop-fleece-blanket',
    name: 'AOP Fleece Blanket',
    category: 'Home & Living',
    subcategory: 'Blankets',
    productType: 'aop-home',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.BLANKET,
    printSpec: {
      printAreaWidth: 60,
      printAreaHeight: 80,
      printAreaWidthPixels: 9000,
      printAreaHeightPixels: 12000,
      dpi: 150,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation on ultra-soft fleece',
      bleed: 0.5,
      wrapAround: false,
      surfaceType: 'flexible',
      notes: '100% polyester fleece, printed top with solid sherpa back, hemmed edges'
    },
    aopSpec: {
      constructionType: 'sublimation_on_blank',
      constructionNotes: 'Large format single-panel print. Printed polyester top with solid sherpa back.',
      panels: [
        { name: 'Top Surface', widthInches: 60, heightInches: 80, widthPixels: 9000, heightPixels: 12000, notes: 'Full printed surface (60x80 throw size)' }
      ],
      totalPrintFile: { widthPixels: 9000, heightPixels: 12000, widthInches: 60, heightInches: 80 },
      dpi: 150,
      bleedInches: 0.5,
      bleedPixels: 75,
      seamAlignments: [
        { location: 'None', requirement: 'not_required', notes: 'Single panel construction' }
      ],
      trimAreas: [
        { name: 'Edge binding', defaultColor: 'White or matching', colorSource: 'auto', notes: 'Hemmed or serged edges' },
        { name: 'Sherpa back', defaultColor: 'White or cream', colorSource: 'manual', notes: 'Solid sherpa fleece backing' }
      ],
      patternScale: {
        recommendedTileInches: { width: 10, height: 10 },
        recommendedTilePixels: { width: 1500, height: 1500 },
        minScale: '5" tile (detailed repeats)',
        maxScale: '30" tile (large statements)',
        notes: 'Large patterns (8-15") work well for blanket scale'
      },
      patternTips: [
        'Consider how blanket looks folded on couch',
        'Pattern should work at both full and folded view',
        'Photo blankets: center image, add border',
        'Repeating patterns: ensure even tiling at 60x80"'
      ]
    }
  },
  {
    id: 'aop-beach-towel',
    name: 'AOP Beach Towel',
    frontendName: 'Beach Towel',
    backendId: 'AOP_TOWEL',
    printfulId: '411',
    category: 'Home & Living',
    subcategory: 'Towels',
    productType: 'aop-home',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.BEACH_TOWEL,
    printSpec: {
      printAreaWidth: 30,
      printAreaHeight: 60,
      printAreaWidthPixels: 9000,
      printAreaHeightPixels: 18000,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge seamless sublimation on microfiber towel',
      bleed: 0.5,
      wrapAround: false,
      surfaceType: 'flexible',
      notes: '100% polyester microfiber, quick-dry, lightweight and absorbent'
    },
    aopSpec: {
      constructionType: 'sublimation_on_blank',
      constructionNotes: 'Single-panel microfiber construction. Printed top surface, terry loop back.',
      panels: [
        { name: 'Top Surface', widthInches: 30, heightInches: 60, widthPixels: 9000, heightPixels: 18000, notes: 'Full printed surface' }
      ],
      totalPrintFile: { widthPixels: 9000, heightPixels: 18000, widthInches: 30, heightInches: 60 },
      dpi: 300,
      bleedInches: 0.5,
      bleedPixels: 150,
      seamAlignments: [
        { location: 'None', requirement: 'not_required', notes: 'Single panel construction' }
      ],
      trimAreas: [
        { name: 'Edge hem', defaultColor: 'Matching pattern', colorSource: 'auto', notes: 'Double-stitched hem' },
        { name: 'Back loops', defaultColor: 'White', colorSource: 'none', notes: 'Terry loop absorbent backing' }
      ],
      patternScale: {
        recommendedTileInches: { width: 6, height: 6 },
        recommendedTilePixels: { width: 1800, height: 1800 },
        minScale: '3" tile (detailed patterns)',
        maxScale: '15" tile (bold beach designs)',
        notes: 'Medium-large patterns (5-10") work well for beach visibility'
      },
      patternTips: [
        'Consider pattern orientation when towel laid flat',
        'Bold, bright colors show best on beach',
        'Pattern should be identifiable from distance',
        'Account for 2:1 aspect ratio in design'
      ]
    }
  }
];

export const ACCESSORY_PRODUCTS: Product[] = [
  {
    id: 'tote-bag',
    name: 'Tote Bag',
    frontendName: 'Tote Bag',
    backendId: 'ACC_TOTE',
    printfulId: '185',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: PRODUCT_COLORS.TOTE,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.ONE_SIZE,
    printSpec: {
      printAreaWidth: 15,
      printAreaHeight: 15,
      printAreaWidthPixels: 4500,
      printAreaHeightPixels: 4500,
      dpi: 300,
      placement: 'front-center',
      placementDescription: 'Centered on front panel of bag',
      safeZone: 0.5,
      surfaceType: 'flexible',
      notes: 'Canvas material, design should be at least 1 inch from edges'
    }
  },
  {
    id: 'drawstring-bag',
    name: 'Drawstring Bag',
    frontendName: 'Drawstring Bag',
    backendId: 'ACC_DRAWSTRING',
    printfulId: '93',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.ONE_SIZE,
    printSpec: {
      printAreaWidth: 13,
      printAreaHeight: 17,
      printAreaWidthPixels: 3900,
      printAreaHeightPixels: 5100,
      dpi: 300,
      placement: 'front-center',
      placementDescription: 'Centered on front of bag',
      safeZone: 0.5,
      surfaceType: 'flexible'
    }
  },
  {
    id: 'backpack',
    name: 'Backpack',
    frontendName: 'Backpack',
    backendId: 'ACC_BACKPACK',
    printfulId: '268',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-pocket',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.ONE_SIZE,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 15,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 4500,
      dpi: 300,
      placement: 'front-pocket',
      placementDescription: 'Centered on front pocket panel',
      safeZone: 0.5,
      surfaceType: 'flexible'
    }
  },
  {
    id: 'duffle-bag',
    name: 'Duffle Bag',
    frontendName: 'Duffle Bag',
    backendId: 'ACC_DUFFLE',
    printfulId: '267',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'side-panel',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.DUFFLE,
    printSpec: {
      printAreaWidth: 14,
      printAreaHeight: 10,
      printAreaWidthPixels: 4200,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'side-panel',
      placementDescription: 'Centered on side panel of bag',
      safeZone: 0.5,
      surfaceType: 'flexible'
    }
  },
  {
    id: 'phone-case-iphone-14',
    name: 'Phone Case (iPhone 14)',
    frontendName: 'iPhone 14 Case',
    backendId: 'ACC_IPHONE14',
    printfulId: '359',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PHONE_CASE_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.IPHONE_14,
    printSpec: {
      printAreaWidth: 2.5,
      printAreaHeight: 5,
      printAreaWidthPixels: 750,
      printAreaHeightPixels: 1500,
      dpi: 300,
      placement: 'back-full',
      placementDescription: 'Full back cover, avoid camera cutout area',
      bleed: 0.125,
      surfaceType: 'rigid',
      notes: 'Design wraps around edges slightly'
    }
  },
  {
    id: 'phone-case-iphone-15',
    name: 'Phone Case (iPhone 15)',
    frontendName: 'iPhone 15 Case',
    backendId: 'ACC_IPHONE15',
    printfulId: '571',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PHONE_CASE_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.IPHONE_15,
    printSpec: {
      printAreaWidth: 2.5,
      printAreaHeight: 5,
      printAreaWidthPixels: 750,
      printAreaHeightPixels: 1500,
      dpi: 300,
      placement: 'back-full',
      placementDescription: 'Full back cover, avoid camera cutout area',
      bleed: 0.125,
      surfaceType: 'rigid',
      notes: 'Design wraps around edges slightly'
    }
  },
  {
    id: 'laptop-sleeve-13',
    name: 'Laptop Sleeve (13")',
    frontendName: 'Laptop Sleeve 13"',
    backendId: 'ACC_LAPTOP13',
    printfulId: '218',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.LAPTOP_13,
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 8,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 2400,
      dpi: 300,
      placement: 'front-center',
      placementDescription: 'Centered on front panel of sleeve',
      surfaceType: 'flexible'
    }
  },
  {
    id: 'laptop-sleeve-15',
    name: 'Laptop Sleeve (15")',
    frontendName: 'Laptop Sleeve 15"',
    backendId: 'ACC_LAPTOP15',
    printfulId: '219',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.LAPTOP_15,
    printSpec: {
      printAreaWidth: 14,
      printAreaHeight: 9,
      printAreaWidthPixels: 4200,
      printAreaHeightPixels: 2700,
      dpi: 300,
      placement: 'front-center',
      placementDescription: 'Centered on front panel of sleeve',
      surfaceType: 'flexible'
    }
  },
  {
    id: 'mouse-pad',
    name: 'Mouse Pad (Standard)',
    frontendName: 'Mouse Pad',
    backendId: 'ACC_MOUSEPAD',
    printfulId: '19',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: [{ name: 'Black', hex: '#000000', category: 'dark' }],
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MOUSEPAD,
    printSpec: {
      printAreaWidth: 9.25,
      printAreaHeight: 7.75,
      printAreaWidthPixels: 2775,
      printAreaHeightPixels: 2325,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge print on top surface',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'flip-flops',
    name: 'Flip Flops',
    frontendName: 'Flip Flops',
    backendId: 'ACC_FLIPFLOPS',
    printfulId: '266',
    category: 'Accessories',
    subcategory: 'Footwear',
    productType: 'accessory-footwear',
    printMethod: 'sublimation',
    isWearable: true,
    availableColors: PRODUCT_COLORS.FLIP_FLOPS,
    defaultPlacement: 'strap-wrap',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.FLIP_FLOPS,
    printSpec: {
      printAreaWidth: 3,
      printAreaHeight: 8,
      printAreaWidthPixels: 900,
      printAreaHeightPixels: 2400,
      dpi: 300,
      placement: 'strap-top',
      placementDescription: 'Print on top of each strap',
      surfaceType: 'curved'
    }
  },
  {
    id: 'socks',
    name: 'Socks',
    frontendName: 'Socks',
    backendId: 'ACC_SOCKS',
    printfulId: '299',
    category: 'Accessories',
    subcategory: 'Footwear',
    productType: 'accessory-footwear',
    printMethod: 'sublimation',
    isWearable: true,
    availableColors: SOCK_COLORS,
    defaultPlacement: 'shin-area',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.SOCKS,
    printSpec: {
      printAreaWidth: 3.5,
      printAreaHeight: 6,
      printAreaWidthPixels: 1050,
      printAreaHeightPixels: 1800,
      dpi: 300,
      placement: 'shin-area',
      placementDescription: 'Print on outer shin area of sock',
      surfaceType: 'flexible'
    }
  },
  {
    id: 'face-mask',
    name: 'Face Mask',
    frontendName: 'Face Mask',
    backendId: 'ACC_MASK',
    printfulId: '394',
    category: 'Accessories',
    subcategory: 'Other',
    productType: 'accessory-footwear',
    printMethod: 'sublimation',
    isWearable: true,
    availableColors: FACE_MASK_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.FACE_MASK,
    printSpec: {
      printAreaWidth: 7,
      printAreaHeight: 4.5,
      printAreaWidthPixels: 2100,
      printAreaHeightPixels: 1350,
      dpi: 300,
      placement: 'front-full',
      placementDescription: 'Full front panel coverage',
      surfaceType: 'flexible'
    }
  }
];

export const HOME_LIVING_PRODUCTS: Product[] = [
  {
    id: 'mug-11oz',
    name: 'Mug 11oz',
    frontendName: 'Mug 11oz',
    backendId: 'HOME_MUG11',
    printfulId: '19',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PRODUCT_COLORS.DRINKWARE,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MUG_11,
    printSpec: {
      printAreaWidth: 8.25,
      printAreaHeight: 3.5,
      printAreaWidthPixels: 2475,
      printAreaHeightPixels: 1050,
      dpi: 300,
      placement: 'wrap-around',
      placementDescription: 'Continuous wrap-around print from handle to handle',
      wrapAround: true,
      surfaceType: 'curved',
      notes: 'Design wraps around cylindrical surface'
    }
  },
  {
    id: 'mug-15oz',
    name: 'Mug 15oz',
    frontendName: 'Mug 15oz',
    backendId: 'HOME_MUG15',
    printfulId: '440',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PRODUCT_COLORS.DRINKWARE,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MUG_15,
    printSpec: {
      printAreaWidth: 8.5,
      printAreaHeight: 4,
      printAreaWidthPixels: 2550,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'wrap-around',
      placementDescription: 'Continuous wrap-around print from handle to handle',
      wrapAround: true,
      surfaceType: 'curved'
    }
  },
  {
    id: 'tumbler-20oz',
    name: 'Tumbler 20oz',
    frontendName: 'Tumbler',
    backendId: 'HOME_TUMBLER',
    printfulId: '558',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PRODUCT_COLORS.DRINKWARE,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.TUMBLER,
    printSpec: {
      printAreaWidth: 9,
      printAreaHeight: 7,
      printAreaWidthPixels: 2700,
      printAreaHeightPixels: 2100,
      dpi: 300,
      placement: 'wrap-around',
      placementDescription: '360-degree wrap-around print',
      wrapAround: true,
      surfaceType: 'curved'
    }
  },
  {
    id: 'water-bottle',
    name: 'Water Bottle',
    frontendName: 'Water Bottle',
    backendId: 'HOME_BOTTLE',
    printfulId: '446',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PRODUCT_COLORS.DRINKWARE,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.WATER_BOTTLE,
    printSpec: {
      printAreaWidth: 7,
      printAreaHeight: 8,
      printAreaWidthPixels: 2100,
      printAreaHeightPixels: 2400,
      dpi: 300,
      placement: 'wrap-around',
      placementDescription: 'Wrap-around print on bottle body',
      wrapAround: true,
      surfaceType: 'curved'
    }
  },
  {
    id: 'poster-8x10',
    name: 'Poster 8x10"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'poster-11x14',
    name: 'Poster 11x14"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 11,
      printAreaHeight: 14,
      printAreaWidthPixels: 3300,
      printAreaHeightPixels: 4200,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'poster-16x20',
    name: 'Poster 16x20"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 16,
      printAreaHeight: 20,
      printAreaWidthPixels: 4800,
      printAreaHeightPixels: 6000,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'poster-18x24',
    name: 'Poster 18x24"',
    frontendName: 'Poster 18×24"',
    backendId: 'HOME_POSTER18',
    printfulId: '1',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.POSTER_18X24,
    printSpec: {
      printAreaWidth: 18,
      printAreaHeight: 24,
      printAreaWidthPixels: 2700,
      printAreaHeightPixels: 3600,
      dpi: 150,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'poster-24x36',
    name: 'Poster 24x36"',
    frontendName: 'Poster 24×36"',
    backendId: 'HOME_POSTER24',
    printfulId: '2',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.POSTER_24X36,
    printSpec: {
      printAreaWidth: 24,
      printAreaHeight: 36,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 5400,
      dpi: 150,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'framed-poster-8x10',
    name: 'Framed Poster 8x10"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat',
      notes: 'Frame adds 1" border around print'
    }
  },
  {
    id: 'framed-poster-11x14',
    name: 'Framed Poster 11x14"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 11,
      printAreaHeight: 14,
      printAreaWidthPixels: 3300,
      printAreaHeightPixels: 4200,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat',
      notes: 'Frame adds 1" border around print'
    }
  },
  {
    id: 'framed-poster-16x20',
    name: 'Framed Poster 16x20"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 16,
      printAreaHeight: 20,
      printAreaWidthPixels: 4800,
      printAreaHeightPixels: 6000,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat',
      notes: 'Frame adds 1" border around print'
    }
  },
  {
    id: 'framed-poster-12x18',
    name: 'Framed Poster 12x18"',
    frontendName: 'Framed Poster 12×18"',
    backendId: 'HOME_FRAMED12',
    printfulId: '10',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: PRODUCT_COLORS.FRAMES,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: [{ code: '12x18', label: '12"×18"' }],
    printSpec: {
      printAreaWidth: 12,
      printAreaHeight: 18,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 5400,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat',
      notes: 'Frame adds 1" border around print'
    }
  },
  {
    id: 'framed-poster-18x24',
    name: 'Framed Poster 18x24"',
    frontendName: 'Framed Poster 18×24"',
    backendId: 'HOME_FRAMED18',
    printfulId: '11',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: PRODUCT_COLORS.FRAMES,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: [{ code: '18x24', label: '18"×24"' }],
    printSpec: {
      printAreaWidth: 18,
      printAreaHeight: 24,
      printAreaWidthPixels: 2700,
      printAreaHeightPixels: 3600,
      dpi: 150,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat',
      notes: 'Frame adds 1" border around print'
    }
  },
  {
    id: 'framed-poster-24x36',
    name: 'Framed Poster 24x36"',
    frontendName: 'Framed Poster 24×36"',
    backendId: 'HOME_FRAMED24',
    printfulId: '12',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: PRODUCT_COLORS.FRAMES,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: [{ code: '24x36', label: '24"×36"' }],
    printSpec: {
      printAreaWidth: 24,
      printAreaHeight: 36,
      printAreaWidthPixels: 3600,
      printAreaHeightPixels: 5400,
      dpi: 150,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with 0.125" bleed',
      bleed: 0.125,
      surfaceType: 'flat',
      notes: 'Frame adds 1" border around print'
    }
  },
  {
    id: 'canvas-8x10',
    name: 'Canvas Print 8x10"',
    frontendName: 'Canvas 8×10"',
    backendId: 'HOME_CANVAS8',
    printfulId: '45',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: CANVAS_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: [{ code: '8x10', label: '8"×10"' }],
    printSpec: {
      printAreaWidth: 8,
      printAreaHeight: 10,
      printAreaWidthPixels: 2400,
      printAreaHeightPixels: 3000,
      dpi: 300,
      placement: 'gallery-wrap',
      placementDescription: 'Image wraps around 1.5" deep canvas edges',
      bleed: 1.5,
      wrapAround: true,
      surfaceType: 'flexible'
    }
  },
  {
    id: 'blanket-50x60',
    name: 'Blanket 50x60"',
    frontendName: 'Blanket',
    backendId: 'HOME_BLANKET',
    printfulId: '392',
    category: 'Home & Living',
    subcategory: 'Textiles',
    productType: 'home-decor-textile',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: BLANKET_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.BLANKET,
    printSpec: {
      printAreaWidth: 50,
      printAreaHeight: 60,
      printAreaWidthPixels: 7500,
      printAreaHeightPixels: 9000,
      dpi: 150,
      placement: 'full-surface',
      placementDescription: 'Edge-to-edge sublimation print',
      bleed: 0.5,
      surfaceType: 'flexible'
    }
  },
  {
    id: 'pillow-case-18x18',
    name: 'Pillow Case 18x18"',
    frontendName: 'Pillow Case',
    backendId: 'HOME_PILLOW',
    printfulId: '436',
    category: 'Home & Living',
    subcategory: 'Textiles',
    productType: 'home-decor-textile',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: PILLOW_COLORS,
    defaultPlacement: 'front-only',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.THROW_PILLOW,
    printSpec: {
      printAreaWidth: 18,
      printAreaHeight: 18,
      printAreaWidthPixels: 5400,
      printAreaHeightPixels: 5400,
      dpi: 300,
      placement: 'front-full',
      placementDescription: 'Full front panel print',
      surfaceType: 'flexible'
    }
  },
  {
    id: 'pillow-case-20x12',
    name: 'Pillow Case 20x12" (Lumbar)',
    category: 'Home & Living',
    subcategory: 'Textiles',
    productType: 'home-decor-textile',
    isWearable: false,
    availableColors: PILLOW_COLORS,
    defaultPlacement: 'front-only',
    genderTarget: 'unisex',
    printSpec: {
      printAreaWidth: 20,
      printAreaHeight: 12,
      printAreaWidthPixels: 6000,
      printAreaHeightPixels: 3600,
      dpi: 300,
      placement: 'front-full',
      placementDescription: 'Full front panel print',
      surfaceType: 'flexible'
    }
  },
  {
    id: 'notebook-a5',
    name: 'Notebook A5',
    frontendName: 'Notebook',
    backendId: 'HOME_NOTEBOOK',
    printfulId: '474',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'cover-front',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.NOTEBOOK,
    printSpec: {
      printAreaWidth: 5.8,
      printAreaHeight: 8.3,
      printAreaWidthPixels: 1740,
      printAreaHeightPixels: 2490,
      dpi: 300,
      placement: 'front-cover',
      placementDescription: 'Full front cover print',
      surfaceType: 'flat'
    }
  },
  {
    id: 'postcard-4x6',
    name: 'Postcard 4x6"',
    frontendName: 'Postcard',
    backendId: 'HOME_POSTCARD',
    printfulId: '472',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.POSTCARD,
    printSpec: {
      printAreaWidth: 4,
      printAreaHeight: 6,
      printAreaWidthPixels: 1200,
      printAreaHeightPixels: 1800,
      dpi: 300,
      placement: 'full-bleed',
      placementDescription: 'Edge-to-edge print with bleed',
      bleed: 0.125,
      surfaceType: 'flat'
    }
  },
  {
    id: 'sticker-sheet',
    name: 'Sticker Sheet',
    frontendName: 'Sticker Sheet',
    backendId: 'HOME_STICKER',
    printfulId: '476',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.STICKER_SHEET,
    printSpec: {
      printAreaWidth: 6,
      printAreaHeight: 4,
      printAreaWidthPixels: 1800,
      printAreaHeightPixels: 1200,
      dpi: 300,
      placement: 'die-cut',
      placementDescription: 'Individual die-cut shapes on sheet',
      surfaceType: 'flat'
    }
  },
  {
    id: 'magnet-3x3',
    name: 'Magnet 3x3"',
    frontendName: 'Magnet',
    backendId: 'HOME_MAGNET',
    printfulId: '475',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    printMethod: 'dtg',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.MAGNET,
    printSpec: {
      printAreaWidth: 3,
      printAreaHeight: 3,
      printAreaWidthPixels: 900,
      printAreaHeightPixels: 900,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Full surface print',
      surfaceType: 'flat'
    }
  },
  {
    id: 'coaster',
    name: 'Coaster',
    frontendName: 'Coaster',
    backendId: 'HOME_COASTER',
    printfulId: '468',
    category: 'Home & Living',
    subcategory: 'Tableware',
    productType: 'home-decor-tableware',
    printMethod: 'sublimation',
    isWearable: false,
    availableColors: COASTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex',
    sizes: PRODUCT_SIZES.COASTERS,
    printSpec: {
      printAreaWidth: 3.75,
      printAreaHeight: 3.75,
      printAreaWidthPixels: 1125,
      printAreaHeightPixels: 1125,
      dpi: 300,
      placement: 'full-surface',
      placementDescription: 'Full top surface print',
      surfaceType: 'flat',
      notes: 'Cork backing, waterproof coating applied'
    }
  }
];

const ALL_PRODUCTS: Product[] = [...DTG_PRODUCTS, ...AOP_PRODUCTS, ...ACCESSORY_PRODUCTS, ...HOME_LIVING_PRODUCTS];

// Direct mapping from frontend product names to backend product IDs
// This ensures exact matching regardless of case, pluralization, or wording differences
export const PRODUCT_NAME_MAP: Record<string, string> = {
  // Women's Products
  'crop tops': 'womens-crop-top',
  'crop top': 'womens-crop-top',
  'tank tops': 'womens-tank-top',
  'tank top': 'womens-tank-top',
  'polo shirts': 'womens-polo',
  'polo shirt': 'womens-polo',
  'dresses': 'womens-dress',
  'dress': 'womens-dress',
  '3/4 sleeve shirts': 'womens-34-sleeve',
  '3/4 sleeve': 'womens-34-sleeve',
  'long sleeve shirts': 'womens-long-sleeve',
  'long sleeve': 'womens-long-sleeve',
  'knitwear': 'womens-knitwear',
  'sweater': 'womens-knitwear',
  'jackets': 'womens-jacket',
  'jacket': 'womens-jacket',
  // Men's Products
  'embroidered shirts': 'mens-embroidered',
  'embroidered shirt': 'mens-embroidered',
  'jackets & vests': 'mens-jacket-vest',
  'jacket & vest': 'mens-jacket-vest',
  'leggings': 'mens-leggings',
  // Kids' Products
  'baby bodysuits': 'baby-bodysuit',
  'baby bodysuit': 'baby-bodysuit',
  'onesies': 'baby-bodysuit',
  'onesie': 'baby-bodysuit',
  // T-Shirts (generic mapping based on context)
  't-shirts': 'bella-3001',
  't-shirt': 'bella-3001',
  'tee': 'bella-3001',
  'tees': 'bella-3001',
  // Hoodies
  'hoodies': 'gildan-18500',
  'hoodie': 'gildan-18500',
  'pullover hoodie': 'gildan-18500',
  // Sweatshirts
  'sweatshirts': 'gildan-18000',
  'sweatshirt': 'gildan-18000',
  'crewneck': 'gildan-18000',
  // Bags
  'tote bags': 'tote-bag',
  'tote bag': 'tote-bag',
  'drawstring bags': 'drawstring-bag',
  'drawstring bag': 'drawstring-bag',
  'backpacks': 'backpack',
  'backpack': 'backpack',
  'duffle bags': 'duffle-bag',
  'duffle bag': 'duffle-bag',
  'handbags': 'tote-bag',
  'handbag': 'tote-bag',
  // Footwear
  'flip flops': 'flip-flops',
  'flip-flops': 'flip-flops',
  'socks': 'socks',
  'sock': 'socks',
  'shoes': 'flip-flops',
  // Tech Accessories
  'phone cases': 'phone-case-iphone-15',
  'phone case': 'phone-case-iphone-15',
  'laptop cases': 'laptop-sleeve-15',
  'laptop case': 'laptop-sleeve-15',
  'laptop sleeve': 'laptop-sleeve-15',
  'mouse pads': 'mouse-pad',
  'mouse pad': 'mouse-pad',
  'mousepad': 'mouse-pad',
  // Other Accessories
  'face masks': 'face-mask',
  'face mask': 'face-mask',
  'hats': 'kids-hat',
  'hat': 'kids-hat',
  'caps': 'kids-hat',
  'cap': 'kids-hat',
  // Drinkware
  'mugs': 'mug-11oz',
  'mug': 'mug-11oz',
  'coffee mug': 'mug-11oz',
  'tumblers': 'tumbler-20oz',
  'tumbler': 'tumbler-20oz',
  'water bottles': 'water-bottle',
  'water bottle': 'water-bottle',
  'bottle': 'water-bottle',
  // Wall Art
  'wall art': 'canvas-8x10',
  'canvas': 'canvas-8x10',
  'canvas print': 'canvas-8x10',
  'posters': 'poster-18x24',
  'poster': 'poster-18x24',
  'framed posters': 'framed-poster-18x24',
  'framed poster': 'framed-poster-18x24',
  // Home Textiles
  'blankets': 'blanket-50x60',
  'blanket': 'blanket-50x60',
  'throw blanket': 'blanket-50x60',
  'pillow cases': 'pillow-case-18x18',
  'pillow case': 'pillow-case-18x18',
  'pillowcase': 'pillow-case-18x18',
  'pillows': 'aop-square-pillow',
  'pillow': 'aop-square-pillow',
  'throw pillow': 'aop-square-pillow',
  'towels': 'aop-beach-towel',
  'towel': 'aop-beach-towel',
  'beach towel': 'aop-beach-towel',
  // Tableware
  'coasters': 'coaster',
  'coaster': 'coaster',
  'tableware': 'coaster',
  // Stationery
  'magnets': 'magnet-3x3',
  'magnet': 'magnet-3x3',
  'postcards': 'postcard-4x6',
  'postcard': 'postcard-4x6',
  'notebooks': 'notebook-a5',
  'notebook': 'notebook-a5',
  'stickers': 'sticker-sheet',
  'sticker': 'sticker-sheet',
  // Apparel Extras
  'aprons': 'tote-bag',
  'apron': 'tote-bag',
  // All-Over Print
  'all-over print shirts': 'aop-mens-cut-sew-tee',
  'all-over print shirt': 'aop-mens-cut-sew-tee',
  'aop shirt': 'aop-mens-cut-sew-tee',
  'aop t-shirt': 'aop-mens-cut-sew-tee',
  'all-over shirts': 'aop-mens-cut-sew-tee',
  'all-over hoodie': 'aop-hoodie',
  'aop hoodie': 'aop-hoodie',
  'aop leggings': 'aop-womens-leggings',
  'all-over leggings': 'aop-womens-leggings',
};

// Normalize product name for matching (lowercase, trim, remove extra spaces)
function normalizeProductName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Get product by frontend name using direct mapping
export function getProductByFrontendName(frontendName: string): Product | undefined {
  const normalized = normalizeProductName(frontendName);
  const productId = PRODUCT_NAME_MAP[normalized];
  
  if (productId) {
    return ALL_PRODUCTS.find(p => p.id === productId);
  }
  
  // Fallback: try exact name match
  const exactMatch = ALL_PRODUCTS.find(p => normalizeProductName(p.name) === normalized);
  if (exactMatch) return exactMatch;
  
  // Fallback: try subcategory match
  const subcategoryMatch = ALL_PRODUCTS.find(p => normalizeProductName(p.subcategory) === normalized);
  if (subcategoryMatch) return subcategoryMatch;
  
  // Fallback: try partial name match
  const partialMatch = ALL_PRODUCTS.find(p => 
    normalizeProductName(p.name).includes(normalized) || 
    normalized.includes(normalizeProductName(p.name))
  );
  if (partialMatch) return partialMatch;
  
  return undefined;
}

export function getProduct(id: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.id === id);
}

export function getProductSizes(productId: string): ProductSize[] | undefined {
  const product = getProduct(productId);
  if (product?.sizes) {
    return product.sizes;
  }
  return undefined;
}

export function getAllProducts(): Product[] {
  return [...ALL_PRODUCTS];
}

export function getDTGProducts(): Product[] {
  return [...DTG_PRODUCTS];
}

export function getAOPProducts(): Product[] {
  return [...AOP_PRODUCTS];
}

export function getAccessoryProducts(): Product[] {
  return [...ACCESSORY_PRODUCTS];
}

export function getHomeLivingProducts(): Product[] {
  return [...HOME_LIVING_PRODUCTS];
}

export function getProductsByCategory(category: string): Product[] {
  return ALL_PRODUCTS.filter(p => p.category === category);
}

export function getProductsBySubcategory(subcategory: string): Product[] {
  return ALL_PRODUCTS.filter(p => p.subcategory === subcategory);
}

export interface GarmentBlueprint {
  fit: string;
  hem: string;
  collarType: string;
  sleeveType: string;
  extraFeatures?: string;
  aopConstruction?: string;
}

export function getGarmentBlueprint(product: Product): GarmentBlueprint {
  const name = product.name.toLowerCase();
  const isAop = product.productType === 'aop-apparel';

  if (name.includes('leggings')) {
    return {
      fit: 'Form-fitting, high-waisted',
      hem: 'Flatlock seams at ankles',
      collarType: 'N/A - Wide elastic waistband (3-4 inches)',
      sleeveType: 'N/A - Full-length legs tapering to ankle',
      extraFeatures: '82% Polyester/18% Spandex blend, flatlock seams for comfort',
      aopConstruction: isAop ? 'Solid color waistband using dominant accent color from pattern' : undefined
    };
  }

  if (name.includes('joggers')) {
    return {
      fit: 'Relaxed fit with tapered leg',
      hem: 'Ribbed ankle cuffs',
      collarType: 'N/A - Elastic waistband with drawstring',
      sleeveType: 'N/A - Full-length legs with side seam pockets',
      extraFeatures: 'Side seam pockets, elastic waistband',
      aopConstruction: isAop ? 'Side panels may require pattern alignment consideration' : undefined
    };
  }

  if (name.includes('hoodie')) {
    return {
      fit: 'Regular fit',
      hem: 'Ribbed waistband',
      collarType: 'Hood with drawstrings, attached to crewneck base',
      sleeveType: 'Set-in long sleeves with ribbed cuffs',
      extraFeatures: 'Kangaroo pocket on front',
      aopConstruction: isAop ? 'Panel construction, hood separate panel, solid color ribbing using accent color' : undefined
    };
  }

  if (name.includes('sweatshirt') || name.includes('crewneck')) {
    return {
      fit: 'Regular fit',
      hem: 'Ribbed waistband',
      collarType: 'Ribbed crewneck',
      sleeveType: 'Set-in long sleeves with ribbed cuffs',
      aopConstruction: isAop ? 'Solid color collar and cuffs using dominant accent color' : undefined
    };
  }

  if (name.includes('swimsuit') || name.includes('swimwear')) {
    return {
      fit: 'Form-fitting, athletic cut',
      hem: 'Serged edges with elastic leg openings',
      collarType: 'Scoop neckline with hidden elastic',
      sleeveType: 'N/A - Sleeveless with wide straps',
      extraFeatures: '82% polyester/18% spandex, UPF 38+, chlorine-resistant, four-way stretch',
      aopConstruction: isAop ? 'Full panel sublimation, pattern continuous across front and back, no solid trim areas' : undefined
    };
  }

  if (name.includes('cut') && name.includes('sew')) {
    return {
      fit: 'Regular fit with athletic cut',
      hem: 'Straight hem with no side slits',
      collarType: 'Ribbed crewneck',
      sleeveType: 'Set-in short sleeves',
      extraFeatures: 'Cut and sew construction for seamless pattern alignment',
      aopConstruction: isAop ? 'Pattern aligns seamlessly across all panels, solid color collar using accent color' : undefined
    };
  }

  if (name.includes('women') && name.includes('tee')) {
    return {
      fit: 'Fitted feminine silhouette',
      hem: 'Curved hem',
      collarType: 'Ribbed crewneck, slightly scooped',
      sleeveType: 'Set-in short sleeves, cap style',
      extraFeatures: 'Tailored fit with shorter sleeves',
      aopConstruction: isAop ? 'Solid color collar and sleeve hems using dominant accent color' : undefined
    };
  }

  return {
    fit: 'Regular fit (not slim, not oversized)',
    hem: 'Straight hem with no side slits',
    collarType: 'Ribbed crewneck (rounded collar, no buttons, no placket)',
    sleeveType: 'Set-in short sleeves',
    aopConstruction: isAop ? 'Solid color collar and sleeve hems using dominant accent color' : undefined
  };
}

export function getGarmentBlueprintPrompt(product: Product): string {
  const blueprint = getGarmentBlueprint(product);
  let prompt = `Garment Construction: ${blueprint.fit}. ${blueprint.collarType}. ${blueprint.sleeveType}. ${blueprint.hem}.`;
  
  if (blueprint.extraFeatures) {
    prompt += ` Features: ${blueprint.extraFeatures}.`;
  }
  
  if (blueprint.aopConstruction) {
    prompt += ` AOP: ${blueprint.aopConstruction}.`;
  }
  
  return prompt;
}

export interface AccessoryBlueprint {
  printArea: {
    width: string;
    height: string;
    unit: 'inches';
  };
  material: string;
  construction: string;
  printMethod: string;
  extraFeatures?: string;
}

export function getProductBlueprint(product: Product): AccessoryBlueprint | null {
  const id = product.id.toLowerCase();
  const productType = product.productType;
  
  const validProductTypes = [
    'accessory-bag', 
    'accessory-tech', 
    'accessory-footwear',
    'hard-good-drinkware',
    'home-decor-wall-art',
    'home-decor-textile',
    'home-decor-stationery',
    'home-decor-tableware',
    'aop-accessory',
    'aop-home'
  ];
  
  if (!validProductTypes.includes(productType as string)) {
    return null;
  }

  if (id === 'aop-tote-bag') {
    return {
      printArea: { width: '16', height: '16', unit: 'inches' },
      material: '100% polyester canvas, sturdy construction',
      construction: 'Full sublimation on front and back panels, solid color handles and seams',
      printMethod: 'Edge-to-edge sublimation, 4800 x 4800 px at 300dpi',
      extraFeatures: 'Pattern covers both sides, handles in accent color from pattern'
    };
  }

  if (id === 'aop-square-pillow') {
    return {
      printArea: { width: '18', height: '18', unit: 'inches' },
      material: '100% polyester cover, soft and durable',
      construction: 'Full sublimation cover with hidden zipper, polyester fill insert',
      printMethod: 'Edge-to-edge sublimation, 5400 x 5400 px at 300dpi',
      extraFeatures: 'Pattern on front side, solid white back, machine washable'
    };
  }

  if (id === 'aop-fleece-blanket') {
    return {
      printArea: { width: '60', height: '80', unit: 'inches' },
      material: '100% polyester fleece, ultra-soft plush texture',
      construction: 'Full sublimation print, hemmed edges all around',
      printMethod: 'Edge-to-edge sublimation, 6000 x 8000 px at 100dpi',
      extraFeatures: 'Double-sided print available, lightweight and cozy'
    };
  }

  if (id === 'aop-beach-towel') {
    return {
      printArea: { width: '30', height: '60', unit: 'inches' },
      material: '100% polyester microfiber, quick-dry technology',
      construction: 'Full sublimation print, hemmed edges',
      printMethod: 'Edge-to-edge sublimation, 4500 x 9000 px at 150dpi',
      extraFeatures: 'Sand-resistant, lightweight, absorbent, folds compact'
    };
  }

  if (id === 'mug-11oz') {
    return {
      printArea: { width: '8.25', height: '3.5', unit: 'inches' },
      material: 'Ceramic, 11oz capacity, dishwasher and microwave safe',
      construction: 'Standard C-handle mug with wrap-around print area',
      printMethod: 'Sublimation dye transfer, 2475 x 1050 px at 300dpi recommended',
      extraFeatures: 'Glossy finish, fade-resistant print, standard lip thickness'
    };
  }

  if (id === 'mug-15oz') {
    return {
      printArea: { width: '8.5', height: '4', unit: 'inches' },
      material: 'Ceramic, 15oz capacity, dishwasher and microwave safe',
      construction: 'Large C-handle mug with wrap-around print area',
      printMethod: 'Sublimation dye transfer, 2550 x 1200 px at 300dpi recommended',
      extraFeatures: 'Glossy finish, fade-resistant print, larger grip handle'
    };
  }

  if (id === 'tumbler-20oz') {
    return {
      printArea: { width: '9', height: '7', unit: 'inches' },
      material: 'Stainless steel double-wall vacuum insulated, 20oz capacity',
      construction: 'Cylindrical tumbler with slide lid, 360-degree wrap-around print',
      printMethod: 'Sublimation on polymer coating, 2700 x 2100 px at 300dpi recommended',
      extraFeatures: 'BPA-free lid, keeps drinks hot 6hrs/cold 12hrs, sweat-proof exterior'
    };
  }

  if (id === 'water-bottle') {
    return {
      printArea: { width: '7', height: '8', unit: 'inches' },
      material: 'Stainless steel, 20oz capacity, double-wall insulated',
      construction: 'Sport bottle with screw-top lid, wrap-around print area',
      printMethod: 'Sublimation on polymer coating, 2100 x 2400 px at 300dpi recommended',
      extraFeatures: 'Leak-proof lid, carabiner clip, narrow mouth for drinking'
    };
  }

  if (id === 'poster-8x10') {
    return {
      printArea: { width: '8', height: '10', unit: 'inches' },
      material: 'Premium matte or glossy photo paper, 200gsm weight',
      construction: 'Full bleed edge-to-edge print, no border',
      printMethod: 'Giclée inkjet printing, 2400 x 3000 px at 300dpi recommended',
      extraFeatures: 'Archival quality inks, color-accurate reproduction'
    };
  }

  if (id === 'poster-11x14') {
    return {
      printArea: { width: '11', height: '14', unit: 'inches' },
      material: 'Premium matte or glossy photo paper, 200gsm weight',
      construction: 'Full bleed edge-to-edge print, no border',
      printMethod: 'Giclée inkjet printing, 3300 x 4200 px at 300dpi recommended',
      extraFeatures: 'Archival quality inks, color-accurate reproduction'
    };
  }

  if (id === 'poster-16x20') {
    return {
      printArea: { width: '16', height: '20', unit: 'inches' },
      material: 'Premium matte or glossy photo paper, 200gsm weight',
      construction: 'Full bleed edge-to-edge print, no border',
      printMethod: 'Giclée inkjet printing, 4800 x 6000 px at 300dpi recommended',
      extraFeatures: 'Archival quality inks, color-accurate reproduction'
    };
  }

  if (id === 'poster-18x24') {
    return {
      printArea: { width: '18', height: '24', unit: 'inches' },
      material: 'Premium matte or glossy photo paper, 200gsm weight',
      construction: 'Full bleed edge-to-edge print, no border',
      printMethod: 'Giclée inkjet printing, 5400 x 7200 px at 300dpi recommended',
      extraFeatures: 'Archival quality inks, color-accurate reproduction'
    };
  }

  if (id === 'poster-24x36') {
    return {
      printArea: { width: '24', height: '36', unit: 'inches' },
      material: 'Premium matte or glossy photo paper, 200gsm weight',
      construction: 'Full bleed edge-to-edge print, no border',
      printMethod: 'Giclée inkjet printing, 7200 x 10800 px at 300dpi recommended',
      extraFeatures: 'Archival quality inks, color-accurate reproduction, museum quality'
    };
  }

  if (id === 'framed-poster-8x10') {
    return {
      printArea: { width: '8', height: '10', unit: 'inches' },
      material: 'Premium photo paper with wood or metal frame, 1" border',
      construction: 'Float-mounted print with protective acrylic glazing',
      printMethod: 'Giclée inkjet printing, 2400 x 3000 px at 300dpi recommended',
      extraFeatures: 'Ready to hang, sawtooth hanger included, dust cover backing'
    };
  }

  if (id === 'framed-poster-11x14') {
    return {
      printArea: { width: '11', height: '14', unit: 'inches' },
      material: 'Premium photo paper with wood or metal frame, 1" border',
      construction: 'Float-mounted print with protective acrylic glazing',
      printMethod: 'Giclée inkjet printing, 3300 x 4200 px at 300dpi recommended',
      extraFeatures: 'Ready to hang, sawtooth hanger included, dust cover backing'
    };
  }

  if (id === 'framed-poster-16x20') {
    return {
      printArea: { width: '16', height: '20', unit: 'inches' },
      material: 'Premium photo paper with wood or metal frame, 1" border',
      construction: 'Float-mounted print with protective acrylic glazing',
      printMethod: 'Giclée inkjet printing, 4800 x 6000 px at 300dpi recommended',
      extraFeatures: 'Ready to hang, D-ring hangers included, dust cover backing'
    };
  }

  if (id === 'framed-poster-18x24') {
    return {
      printArea: { width: '18', height: '24', unit: 'inches' },
      material: 'Premium photo paper with wood or metal frame, 1" border',
      construction: 'Float-mounted print with protective acrylic glazing',
      printMethod: 'Giclée inkjet printing, 5400 x 7200 px at 300dpi recommended',
      extraFeatures: 'Ready to hang, D-ring hangers included, dust cover backing'
    };
  }

  if (id === 'framed-poster-24x36') {
    return {
      printArea: { width: '24', height: '36', unit: 'inches' },
      material: 'Premium photo paper with wood or metal frame, 1" border',
      construction: 'Float-mounted print with protective acrylic glazing',
      printMethod: 'Giclée inkjet printing, 7200 x 10800 px at 300dpi recommended',
      extraFeatures: 'Ready to hang, wire hanger system, dust cover backing'
    };
  }

  if (id === 'canvas-8x10') {
    return {
      printArea: { width: '8', height: '10', unit: 'inches' },
      material: 'Poly-cotton blend canvas, 350gsm weight, archival grade',
      construction: 'Gallery wrapped on 1.5" wooden stretcher bars, mirrored edges',
      printMethod: 'Giclée inkjet printing, 2400 x 3000 px at 300dpi with bleed for wrap',
      extraFeatures: 'Ready to hang, hardware included, UV-resistant coating'
    };
  }

  if (id === 'blanket-50x60') {
    return {
      printArea: { width: '50', height: '60', unit: 'inches' },
      material: 'Plush polyester fleece, 300gsm weight',
      construction: 'Edge-to-edge sublimation print, hemmed edges',
      printMethod: 'Dye sublimation, 15000 x 18000 px at 300dpi recommended',
      extraFeatures: 'Machine washable, ultra-soft plush texture, vibrant color reproduction'
    };
  }

  if (id === 'pillow-case-18x18') {
    return {
      printArea: { width: '18', height: '18', unit: 'inches' },
      material: 'Polyester peach skin fabric front, solid white back',
      construction: 'Front print only, hidden zipper closure',
      printMethod: 'Dye sublimation on front panel, 5400 x 5400 px at 300dpi recommended',
      extraFeatures: 'Insert not included, machine washable, double-stitched seams'
    };
  }

  if (id === 'pillow-case-20x12') {
    return {
      printArea: { width: '20', height: '12', unit: 'inches' },
      material: 'Polyester peach skin fabric front, solid white back',
      construction: 'Lumbar shape, front print only, hidden zipper closure',
      printMethod: 'Dye sublimation on front panel, 6000 x 3600 px at 300dpi recommended',
      extraFeatures: 'Insert not included, machine washable, double-stitched seams'
    };
  }

  if (id === 'notebook-a5') {
    return {
      printArea: { width: '5.8', height: '8.3', unit: 'inches' },
      material: 'Hardcover with laminated print, 80 sheets lined paper',
      construction: 'Case-bound spine, cover print with protective lamination',
      printMethod: 'UV printing on laminated cover, 1740 x 2490 px at 300dpi recommended',
      extraFeatures: 'Ribbon bookmark, elastic band closure, lay-flat binding'
    };
  }

  if (id === 'postcard-4x6') {
    return {
      printArea: { width: '4', height: '6', unit: 'inches' },
      material: 'Heavy cardstock, 350gsm, matte or glossy finish',
      construction: 'Full bleed front print, blank or pre-printed back',
      printMethod: 'Offset or digital printing, 1200 x 1800 px at 300dpi recommended',
      extraFeatures: 'Rounded corners optional, writeable back surface'
    };
  }

  if (id === 'sticker-sheet') {
    return {
      printArea: { width: '8.5', height: '11', unit: 'inches' },
      material: 'Vinyl or paper sticker material, kiss-cut die-cut',
      construction: 'Multiple stickers per sheet, various sizes, peel-and-stick backing',
      printMethod: 'Digital printing with die-cut, 2550 x 3300 px at 300dpi for full sheet',
      extraFeatures: 'Weather-resistant vinyl option, matte or glossy laminate finish'
    };
  }

  if (id === 'magnet-3x3') {
    return {
      printArea: { width: '3', height: '3', unit: 'inches' },
      material: 'Flexible magnetic backing with printed vinyl surface',
      construction: 'Full surface print, rounded corners optional',
      printMethod: 'Digital printing on vinyl, 900 x 900 px at 300dpi recommended',
      extraFeatures: 'Strong magnetic hold, UV-resistant surface, indoor/outdoor use'
    };
  }

  if (id === 'coaster') {
    return {
      printArea: { width: '3.75', height: '3.75', unit: 'inches' },
      material: 'Hardboard top with cork backing, heat-resistant coating',
      construction: 'Full surface print, square shape with rounded corners',
      printMethod: 'Sublimation or UV printing, 1125 x 1125 px at 300dpi recommended',
      extraFeatures: 'Cork back prevents scratching, water-resistant surface, heat resistant to 200°F'
    };
  }

  if (id === 'tote-bag') {
    return {
      printArea: { width: '15', height: '15', unit: 'inches' },
      material: 'Canvas, 100% cotton, 12oz weight',
      construction: 'Flat canvas bag with reinforced handles, self-fabric handles 22" length',
      printMethod: 'DTG or screen print on flat surface',
      extraFeatures: 'Interior pocket optional, cotton web handles'
    };
  }

  if (id === 'drawstring-bag') {
    return {
      printArea: { width: '13', height: '17', unit: 'inches' },
      material: '100% Polyester, lightweight ripstop',
      construction: 'Cinch-top closure with polyester drawstring cords, reinforced corners',
      printMethod: 'Sublimation on polyester surface',
      extraFeatures: 'Double polyester drawstrings serve as shoulder straps'
    };
  }

  if (id === 'backpack') {
    return {
      printArea: { width: '12', height: '15', unit: 'inches' },
      material: 'Polyester/nylon blend with padded back panel',
      construction: 'Front pocket print area, main compartment with zipper, padded shoulder straps',
      printMethod: 'Sublimation or embroidery on front pocket panel',
      extraFeatures: 'Adjustable padded straps, laptop sleeve interior, multiple compartments'
    };
  }

  if (id === 'duffle-bag') {
    return {
      printArea: { width: '18', height: '10', unit: 'inches' },
      material: 'Heavy-duty polyester or canvas',
      construction: 'Barrel-style construction with side panel print area, reinforced handles and shoulder strap',
      printMethod: 'Sublimation on side panels or embroidery',
      extraFeatures: 'Detachable shoulder strap, end pockets, heavy-duty zipper'
    };
  }

  if (id === 'phone-case-iphone-14') {
    return {
      printArea: { width: '2.5', height: '5', unit: 'inches' },
      material: 'Hard plastic shell with TPU (thermoplastic polyurethane) bumper',
      construction: 'Snap-on case with raised edges for screen protection',
      printMethod: 'UV printing directly on case surface',
      extraFeatures: 'Precise camera cutouts, wireless charging compatible, scratch-resistant coating'
    };
  }

  if (id === 'phone-case-iphone-15') {
    return {
      printArea: { width: '2.6', height: '5.2', unit: 'inches' },
      material: 'Hard plastic shell with TPU (thermoplastic polyurethane) bumper',
      construction: 'Snap-on case with raised edges for screen and camera protection',
      printMethod: 'UV printing directly on case surface',
      extraFeatures: 'Action button compatible, precise camera cutouts, wireless charging compatible'
    };
  }

  if (id === 'laptop-sleeve-13') {
    return {
      printArea: { width: '12', height: '8', unit: 'inches' },
      material: 'Neoprene with polyester outer shell, soft fleece interior lining',
      construction: 'Padded sleeve with top-loading zipper closure',
      printMethod: 'Sublimation on polyester outer surface',
      extraFeatures: 'Fits 13" laptops and tablets, 4mm foam padding, YKK zipper'
    };
  }

  if (id === 'laptop-sleeve-15') {
    return {
      printArea: { width: '14', height: '9', unit: 'inches' },
      material: 'Neoprene with polyester outer shell, soft fleece interior lining',
      construction: 'Padded sleeve with top-loading zipper closure',
      printMethod: 'Sublimation on polyester outer surface',
      extraFeatures: 'Fits 15" laptops, 4mm foam padding, YKK zipper'
    };
  }

  if (id === 'mouse-pad') {
    return {
      printArea: { width: '9.25', height: '7.75', unit: 'inches' },
      material: 'Polyester surface with 3mm natural rubber base',
      construction: 'Flat rectangular pad with non-slip rubber backing, stitched edges',
      printMethod: 'Sublimation on polyester top surface',
      extraFeatures: 'Non-slip rubber base, water-resistant surface, smooth glide surface for optical mice'
    };
  }

  if (id === 'flip-flops') {
    return {
      printArea: { width: '3', height: '8', unit: 'inches' },
      material: 'EVA foam sole with polyester fabric straps',
      construction: 'Contoured footbed with V-strap thong design',
      printMethod: 'Sublimation on fabric strap surface (per strap)',
      extraFeatures: 'Lightweight EVA construction, textured footbed for grip'
    };
  }

  if (id === 'socks') {
    return {
      printArea: { width: '3.5', height: '6', unit: 'inches' },
      material: 'Polyester/cotton/spandex blend (typically 85%/10%/5%)',
      construction: 'Crew-length knit construction with reinforced heel and toe',
      printMethod: 'Sublimation on shin area (visible when worn)',
      extraFeatures: 'Elastic arch support, cushioned sole, seamless toe construction'
    };
  }

  if (id === 'face-mask') {
    return {
      printArea: { width: '7', height: '4.5', unit: 'inches' },
      material: '2-ply polyester/cotton blend with filter pocket',
      construction: 'Contoured face-fitting design with elastic ear loops',
      printMethod: 'Sublimation on outer polyester layer',
      extraFeatures: 'Adjustable nose wire, elastic ear loops, reusable and washable'
    };
  }

  return null;
}

export function getProductBlueprintPrompt(product: Product): string | null {
  const blueprint = getProductBlueprint(product);
  if (!blueprint) {
    return null;
  }
  
  let prompt = `Product Construction: ${blueprint.material}. ${blueprint.construction}. Print Area: ${blueprint.printArea.width}" x ${blueprint.printArea.height}". Print Method: ${blueprint.printMethod}.`;
  
  if (blueprint.extraFeatures) {
    prompt += ` Features: ${blueprint.extraFeatures}.`;
  }
  
  return prompt;
}

// ============================================================================
// AOP PATTERN SCALE QUICK REFERENCE
// ============================================================================

export interface AOPPatternScaleGuide {
  productCategory: string;
  products: string[];
  recommendedTileSize: string;
  minTileSize: string;
  maxTileSize: string;
  notes: string;
}

export const AOP_PATTERN_SCALE_GUIDE: AOPPatternScaleGuide[] = [
  {
    productCategory: 'Fitted Apparel',
    products: ['Leggings', 'Swimsuit', 'Crop Top'],
    recommendedTileSize: '2-3 inches',
    minTileSize: '1 inch',
    maxTileSize: '4-6 inches',
    notes: 'Smaller patterns compensate for stretch distortion. Avoid geometric patterns that reveal stretching.'
  },
  {
    productCategory: 'Relaxed Apparel',
    products: ['Hoodie', 'Sweatshirt', 'T-Shirt'],
    recommendedTileSize: '4-6 inches',
    minTileSize: '2 inches',
    maxTileSize: '8-12 inches',
    notes: 'Medium patterns work well for casual wear. Consider seam alignment at shoulder/side.'
  },
  {
    productCategory: 'Accessories',
    products: ['Tote Bag', 'Backpack'],
    recommendedTileSize: '3-5 inches',
    minTileSize: '2 inches',
    maxTileSize: '8 inches',
    notes: 'Pattern should be visible and distinctive. Consider orientation when carried.'
  },
  {
    productCategory: 'Home Textiles (Small)',
    products: ['Throw Pillow', 'Coasters'],
    recommendedTileSize: '3-4 inches',
    minTileSize: '2 inches',
    maxTileSize: '6-9 inches',
    notes: 'Quarter of product size creates balanced repeat. Center focal elements.'
  },
  {
    productCategory: 'Home Textiles (Large)',
    products: ['Blanket', 'Beach Towel', 'Curtains'],
    recommendedTileSize: '8-12 inches',
    minTileSize: '5 inches',
    maxTileSize: '24-30 inches',
    notes: 'Large patterns work well at room scale. Consider folded/displayed views.'
  }
];

export interface AOPConstructionGuide {
  type: 'cut_and_sew' | 'sublimation_on_blank';
  description: string;
  advantages: string[];
  considerations: string[];
  typicalProducts: string[];
}

export const AOP_CONSTRUCTION_TYPES: AOPConstructionGuide[] = [
  {
    type: 'cut_and_sew',
    description: 'Fabric is printed flat in large sheets, then cut into pattern pieces and sewn together. Creates true edge-to-edge coverage.',
    advantages: [
      'True all-over coverage including seams',
      'Pattern can extend to every edge',
      'Higher quality sublimation saturation',
      'Better color vibrancy and detail'
    ],
    considerations: [
      'Requires careful seam alignment planning',
      'Pattern matching at seams is critical',
      'Slightly higher production cost',
      'Longer production time'
    ],
    typicalProducts: ['Hoodie', 'T-Shirt', 'Sweatshirt', 'Leggings', 'Swimsuit']
  },
  {
    type: 'sublimation_on_blank',
    description: 'Pre-constructed blank garment/product is printed directly. Simpler process but may have limitations at seams.',
    advantages: [
      'Faster production time',
      'Lower production cost',
      'Good for flat items',
      'Consistent sizing'
    ],
    considerations: [
      'Seams may show white lines',
      'Pattern may not reach all edges',
      'Less suitable for complex garments',
      'Print may not cover under seams'
    ],
    typicalProducts: ['Pillow', 'Blanket', 'Beach Towel', 'Tote Bag', 'Mousepad']
  }
];

export function getAOPScaleGuide(productName: string): AOPPatternScaleGuide | undefined {
  const name = productName.toLowerCase();
  return AOP_PATTERN_SCALE_GUIDE.find(guide => 
    guide.products.some(p => name.includes(p.toLowerCase()))
  );
}

export function getAOPConstructionGuide(constructionType: 'cut_and_sew' | 'sublimation_on_blank'): AOPConstructionGuide | undefined {
  return AOP_CONSTRUCTION_TYPES.find(guide => guide.type === constructionType);
}
