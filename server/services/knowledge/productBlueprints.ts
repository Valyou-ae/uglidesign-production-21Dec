import { Product, ProductColor, SizeChartEntry } from '../../../shared/mockupTypes';

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

export const DTG_PRODUCTS: Product[] = [
  {
    id: 'gildan-5000',
    name: 'Gildan 5000 Classic T-Shirt',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'dtg-apparel',
    isWearable: true,
    availableColors: STANDARD_DTG_COLORS,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  },
  {
    id: 'bella-3001',
    name: 'Bella+Canvas 3001 Unisex Jersey Tee',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'dtg-apparel',
    isWearable: true,
    availableColors: BELLA_CANVAS_COLORS,
    defaultPlacement: 'center-chest',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  },
  {
    id: 'gildan-18000',
    name: 'Gildan 18000 Crewneck Sweatshirt',
    category: 'Apparel',
    subcategory: 'Sweatshirts',
    productType: 'dtg-apparel',
    isWearable: true,
    availableColors: SWEATSHIRT_COLORS,
    defaultPlacement: 'center-chest-large',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  },
  {
    id: 'gildan-18500',
    name: 'Gildan 18500 Pullover Hoodie',
    category: 'Apparel',
    subcategory: 'Hoodies',
    productType: 'dtg-apparel',
    isWearable: true,
    availableColors: SWEATSHIRT_COLORS,
    defaultPlacement: 'above-pocket',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  }
];

export const AOP_PRODUCTS: Product[] = [
  {
    id: 'aop-tshirt',
    name: 'All-Over Print T-Shirt',
    category: 'Apparel',
    subcategory: 'T-Shirts',
    productType: 'aop-apparel',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  },
  {
    id: 'aop-hoodie',
    name: 'All-Over Print Hoodie',
    category: 'Apparel',
    subcategory: 'Hoodies',
    productType: 'aop-apparel',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage-panels',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  },
  {
    id: 'aop-leggings',
    name: 'All-Over Print Leggings',
    category: 'Apparel',
    subcategory: 'Leggings',
    productType: 'aop-apparel',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: '360-coverage',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  },
  {
    id: 'aop-joggers',
    name: 'All-Over Print Joggers',
    category: 'Apparel',
    subcategory: 'Joggers',
    productType: 'aop-apparel',
    isWearable: true,
    availableColors: AOP_BASE_COLORS,
    defaultPlacement: 'full-coverage-side-panel',
    genderTarget: 'unisex',
    sizeChart: STANDARD_SIZE_CHART
  }
];

export const ACCESSORY_PRODUCTS: Product[] = [
  {
    id: 'tote-bag',
    name: 'Tote Bag',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex'
  },
  {
    id: 'drawstring-bag',
    name: 'Drawstring Bag',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex'
  },
  {
    id: 'backpack',
    name: 'Backpack',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-pocket',
    genderTarget: 'unisex'
  },
  {
    id: 'duffle-bag',
    name: 'Duffle Bag',
    category: 'Accessories',
    subcategory: 'Bags',
    productType: 'accessory-bag',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'side-panel',
    genderTarget: 'unisex'
  },
  {
    id: 'phone-case-iphone-14',
    name: 'Phone Case (iPhone 14)',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    isWearable: false,
    availableColors: PHONE_CASE_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'phone-case-iphone-15',
    name: 'Phone Case (iPhone 15)',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    isWearable: false,
    availableColors: PHONE_CASE_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'laptop-sleeve-13',
    name: 'Laptop Sleeve (13")',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex'
  },
  {
    id: 'laptop-sleeve-15',
    name: 'Laptop Sleeve (15")',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    isWearable: false,
    availableColors: BAG_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex'
  },
  {
    id: 'mouse-pad',
    name: 'Mouse Pad (Standard)',
    category: 'Accessories',
    subcategory: 'Tech Accessories',
    productType: 'accessory-tech',
    isWearable: false,
    availableColors: [{ name: 'Black', hex: '#000000', category: 'dark' }],
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'flip-flops',
    name: 'Flip Flops',
    category: 'Accessories',
    subcategory: 'Footwear',
    productType: 'accessory-footwear',
    isWearable: true,
    availableColors: FLIP_FLOP_COLORS,
    defaultPlacement: 'strap-wrap',
    genderTarget: 'unisex'
  },
  {
    id: 'socks',
    name: 'Socks',
    category: 'Accessories',
    subcategory: 'Footwear',
    productType: 'accessory-footwear',
    isWearable: true,
    availableColors: SOCK_COLORS,
    defaultPlacement: 'shin-area',
    genderTarget: 'unisex'
  },
  {
    id: 'face-mask',
    name: 'Face Mask',
    category: 'Accessories',
    subcategory: 'Other',
    productType: 'accessory-footwear',
    isWearable: true,
    availableColors: FACE_MASK_COLORS,
    defaultPlacement: 'front-center',
    genderTarget: 'unisex'
  }
];

export const HOME_LIVING_PRODUCTS: Product[] = [
  {
    id: 'mug-11oz',
    name: 'Mug 11oz',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    isWearable: false,
    availableColors: MUG_COLORS,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex'
  },
  {
    id: 'mug-15oz',
    name: 'Mug 15oz',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    isWearable: false,
    availableColors: MUG_COLORS,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex'
  },
  {
    id: 'tumbler-20oz',
    name: 'Tumbler 20oz',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    isWearable: false,
    availableColors: MUG_COLORS,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex'
  },
  {
    id: 'water-bottle',
    name: 'Water Bottle',
    category: 'Home & Living',
    subcategory: 'Drinkware',
    productType: 'hard-good-drinkware',
    isWearable: false,
    availableColors: MUG_COLORS,
    defaultPlacement: 'wrap-around',
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
  },
  {
    id: 'poster-18x24',
    name: 'Poster 18x24"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'poster-24x36',
    name: 'Poster 24x36"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
  },
  {
    id: 'framed-poster-18x24',
    name: 'Framed Poster 18x24"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'framed-poster-24x36',
    name: 'Framed Poster 24x36"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: POSTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'canvas-8x10',
    name: 'Canvas Print 8x10"',
    category: 'Home & Living',
    subcategory: 'Wall Art',
    productType: 'home-decor-wall-art',
    isWearable: false,
    availableColors: CANVAS_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'blanket-50x60',
    name: 'Blanket 50x60"',
    category: 'Home & Living',
    subcategory: 'Textiles',
    productType: 'home-decor-textile',
    isWearable: false,
    availableColors: BLANKET_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'pillow-case-18x18',
    name: 'Pillow Case 18x18"',
    category: 'Home & Living',
    subcategory: 'Textiles',
    productType: 'home-decor-textile',
    isWearable: false,
    availableColors: PILLOW_COLORS,
    defaultPlacement: 'front-only',
    genderTarget: 'unisex'
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
    genderTarget: 'unisex'
  },
  {
    id: 'notebook-a5',
    name: 'Notebook A5',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'cover-front',
    genderTarget: 'unisex'
  },
  {
    id: 'postcard-4x6',
    name: 'Postcard 4x6"',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'sticker-sheet',
    name: 'Sticker Sheet',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'magnet-3x3',
    name: 'Magnet 3x3"',
    category: 'Home & Living',
    subcategory: 'Stationery',
    productType: 'home-decor-stationery',
    isWearable: false,
    availableColors: STATIONERY_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  },
  {
    id: 'coaster',
    name: 'Coaster',
    category: 'Home & Living',
    subcategory: 'Tableware',
    productType: 'home-decor-tableware',
    isWearable: false,
    availableColors: COASTER_COLORS,
    defaultPlacement: 'full-surface',
    genderTarget: 'unisex'
  }
];

const ALL_PRODUCTS: Product[] = [...DTG_PRODUCTS, ...AOP_PRODUCTS, ...ACCESSORY_PRODUCTS, ...HOME_LIVING_PRODUCTS];

export function getProduct(id: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.id === id);
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

export function getAllProducts(): Product[] {
  return [...ALL_PRODUCTS];
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
    'home-decor-tableware'
  ];
  
  if (!validProductTypes.includes(productType as string)) {
    return null;
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
