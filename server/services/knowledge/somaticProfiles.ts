import { AgeGroup, Sex, Ethnicity, Size, SomaticProfile } from '../../../shared/mockupTypes';

const HEIGHT_BASE: Record<Sex, Record<Ethnicity, number>> = {
  'Male': {
    'White': 70,
    'Black': 70,
    'Hispanic': 67,
    'Asian': 67,
    'Indian': 66,
    'Southeast Asian': 65,
    'Middle Eastern': 68,
    'Indigenous': 68,
    'Diverse': 68
  },
  'Female': {
    'White': 65,
    'Black': 64,
    'Hispanic': 62,
    'Asian': 62,
    'Indian': 61,
    'Southeast Asian': 60,
    'Middle Eastern': 63,
    'Indigenous': 63,
    'Diverse': 63
  }
};

const SIZE_HEIGHT_MODIFIER: Record<Size, number> = {
  'XS': -2,
  'S': -1,
  'M': 0,
  'L': 1,
  'XL': 2,
  'XXL': 2,
  'XXXL': 2
};

const SIZE_WEIGHT_MULTIPLIER: Record<Size, { min: number; max: number }> = {
  'XS': { min: 0.75, max: 0.85 },
  'S': { min: 0.85, max: 0.95 },
  'M': { min: 0.95, max: 1.05 },
  'L': { min: 1.05, max: 1.20 },
  'XL': { min: 1.20, max: 1.40 },
  'XXL': { min: 1.40, max: 1.60 },
  'XXXL': { min: 1.60, max: 1.85 }
};

const SIZE_BUILD: Record<Size, string> = {
  'XS': 'very slender, petite frame',
  'S': 'slender, lean build',
  'M': 'athletic, average build',
  'L': 'solid, sturdy build',
  'XL': 'stocky, fuller build',
  'XXL': 'heavyset, broad frame',
  'XXXL': 'plus-size, very broad frame'
};

const AGE_MODIFIERS: Record<AgeGroup, { heightMod: number; weightMod: number; buildNote: string }> = {
  'Baby': { heightMod: -45, weightMod: 0.08, buildNote: 'large head (1:4 body ratio), chubby cheeks, rounded belly, short limbs' },
  'Toddler': { heightMod: -35, weightMod: 0.15, buildNote: 'head 1:5 of body, round face, protruding belly, developing limbs' },
  'Kids': { heightMod: -20, weightMod: 0.45, buildNote: 'lean active, longer limbs, losing baby fat, energetic appearance' },
  'Teen': { heightMod: -3, weightMod: 0.80, buildNote: 'developing proportions, gangly limbs, maturing features' },
  'Young Adult': { heightMod: 0, weightMod: 1.0, buildNote: 'peak physical form, developed musculature' },
  'Adult': { heightMod: 0, weightMod: 1.05, buildNote: 'mature proportions, settled physique' },
  'Senior': { heightMod: -1, weightMod: 0.95, buildNote: 'mature proportions, possible slight posture changes' }
};

const ETHNICITY_DESCRIPTIONS: Record<Ethnicity, string> = {
  'White': 'light skin, varied eye colors',
  'Black': 'brown to dark skin, dark eyes',
  'Hispanic': 'tan to light brown skin, dark eyes',
  'Asian': 'light to medium skin, dark eyes',
  'Indian': 'light brown to brown skin, dark eyes',
  'Southeast Asian': 'tan skin, dark eyes',
  'Middle Eastern': 'olive to light brown skin, dark eyes or hazel, prominent features',
  'Indigenous': 'medium brown skin, dark eyes, prominent cheekbones',
  'Diverse': 'blended skin tones, varied eye colors'
};

function inchesToFeetString(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = Math.round(inches % 12);
  return `${feet}'${remainingInches}"`;
}

function calculateWeight(heightInches: number, sex: Sex, sizeMultiplier: { min: number; max: number }): { min: number; max: number } {
  const baseWeight = sex === 'Male' 
    ? (heightInches - 60) * 5 + 140 
    : (heightInches - 60) * 4.5 + 110;
  
  return {
    min: Math.round(baseWeight * sizeMultiplier.min),
    max: Math.round(baseWeight * sizeMultiplier.max)
  };
}

export function getSomaticProfile(age: AgeGroup, sex: Sex, ethnicity: Ethnicity, size: Size): SomaticProfile {
  const ageMod = AGE_MODIFIERS[age];
  const baseHeight = HEIGHT_BASE[sex][ethnicity];
  const sizeHeightMod = SIZE_HEIGHT_MODIFIER[size];
  
  const heightInches = baseHeight + sizeHeightMod + ageMod.heightMod;
  const heightRange = {
    min: heightInches - 1,
    max: heightInches + 1
  };
  
  const heightString = age === 'Baby' || age === 'Toddler'
    ? `${Math.round(heightInches * 2.54)}cm (${Math.round(heightInches)}")`
    : `${inchesToFeetString(heightRange.min)}–${inchesToFeetString(heightRange.max)}`;
  
  const sizeWeightMult = SIZE_WEIGHT_MULTIPLIER[size];
  const adjustedWeightMult = {
    min: sizeWeightMult.min * ageMod.weightMod,
    max: sizeWeightMult.max * ageMod.weightMod
  };
  const weight = calculateWeight(heightInches, sex, adjustedWeightMult);
  
  const weightString = age === 'Baby' || age === 'Toddler'
    ? `${Math.round(weight.min * 0.453592)}-${Math.round(weight.max * 0.453592)}kg (${weight.min}-${weight.max}lbs)`
    : `${weight.min}-${weight.max} lbs`;
  
  let buildDescription: string;
  if (age === 'Baby' || age === 'Toddler' || age === 'Kids') {
    buildDescription = ageMod.buildNote;
  } else {
    buildDescription = `${SIZE_BUILD[size]}, ${ageMod.buildNote}`;
  }
  
  const ethnicDesc = ETHNICITY_DESCRIPTIONS[ethnicity];
  const description = `${sex} ${age.toLowerCase()} with ${buildDescription}. ${ethnicDesc}.`;
  
  return {
    height: heightString,
    weight: weightString,
    build: buildDescription,
    description
  };
}

export function getSomaticProfilePrompt(age: AgeGroup, sex: Sex, ethnicity: Ethnicity, size: Size): string {
  const profile = getSomaticProfile(age, sex, ethnicity, size);
  return `${profile.description} Height: ${profile.height}, Weight: ${profile.weight}, Build: ${profile.build}.`;
}

export const SOMATIC_PROFILE_SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const SOMATIC_PROFILE_AGE_GROUPS: AgeGroup[] = ['Baby', 'Toddler', 'Kids', 'Teen', 'Young Adult', 'Adult', 'Senior'];
export const SOMATIC_PROFILE_SEXES: Sex[] = ['Male', 'Female'];
export const SOMATIC_PROFILE_ETHNICITIES: Ethnicity[] = ['White', 'Black', 'Hispanic', 'Asian', 'Indian', 'Southeast Asian', 'Middle Eastern', 'Indigenous', 'Diverse'];
