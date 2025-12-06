import { Ethnicity } from '@shared/mockupTypes';

export interface EthnicFeatures {
  hairColors: string[];
  eyeColors: string[];
  hairStyles: string[];
}

export const ETHNIC_FEATURE_MAP: Record<Ethnicity, EthnicFeatures> = {
  'White': {
    hairColors: ['sandy blonde', 'golden blonde', 'ash brown', 'chestnut brown', 'auburn red', 'jet black'],
    eyeColors: ['bright blue', 'sky blue', 'emerald green', 'grey', 'hazel', 'light brown'],
    hairStyles: ['long and wavy', 'a short, chic bob', 'in a sleek ponytail', 'shoulder-length with soft layers', 'straight and fine']
  },
  'Black': {
    hairColors: ['jet black', 'dark brown', 'deep auburn', 'black with burgundy highlights'],
    eyeColors: ['deep brown', 'dark brown', 'amber', 'hazel'],
    hairStyles: ['natural afro curls', 'tightly coiled hair', 'braided cornrows', 'a stylish short crop', 'locs']
  },
  'Hispanic': {
    hairColors: ['jet black', 'dark brown', 'chestnut brown', 'caramel highlights'],
    eyeColors: ['deep brown', 'dark brown', 'hazel', 'honey brown'],
    hairStyles: ['long and wavy', 'thick and straight', 'in a voluminous ponytail', 'curly layers', 'a sleek blowout']
  },
  'Asian': {
    hairColors: ['jet black', 'darkest brown', 'natural black'],
    eyeColors: ['deep brown', 'dark brown', 'black'],
    hairStyles: ['long and straight', 'a short, sharp bob', 'in a sleek high ponytail', 'shoulder-length with blunt ends', 'soft waves']
  },
  'Indian': {
    hairColors: ['jet black', 'deep dark brown', 'natural black'],
    eyeColors: ['dark brown', 'deep brown', 'black'],
    hairStyles: ['long, thick, and wavy', 'in a traditional braid', 'voluminous and straight', 'soft, flowing layers']
  },
  'Southeast Asian': {
    hairColors: ['jet black', 'dark brown', 'natural black'],
    eyeColors: ['dark brown', 'deep brown', 'black'],
    hairStyles: ['long and straight', 'a simple ponytail', 'shoulder-length layers', 'a soft, natural look']
  },
  'Middle Eastern': {
    hairColors: ['jet black', 'dark brown', 'deep brown', 'black with subtle highlights'],
    eyeColors: ['deep brown', 'dark brown', 'hazel', 'amber', 'green'],
    hairStyles: ['long and thick', 'voluminous curls', 'shoulder-length waves', 'sleek and straight', 'in a stylish updo']
  },
  'Indigenous': {
    hairColors: ['jet black', 'dark brown', 'deep black'],
    eyeColors: ['deep brown', 'dark brown', 'black'],
    hairStyles: ['long and straight, often worn down or in braids', 'thick and full', 'natural and flowing']
  },
  'Diverse': {
    hairColors: ['dark brown', 'caramel blonde', 'jet black', 'auburn', 'brown with highlights'],
    eyeColors: ['hazel', 'light brown', 'deep brown', 'green', 'amber'],
    hairStyles: ['a mix of curly and wavy textures', 'voluminous curls', 'a unique, stylish cut', 'long layers', 'a fashionable bob']
  }
};

export function getEthnicFeatures(ethnicity: Ethnicity): EthnicFeatures {
  return ETHNIC_FEATURE_MAP[ethnicity] || ETHNIC_FEATURE_MAP['Diverse'];
}
