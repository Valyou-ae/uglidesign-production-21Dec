import { Sex, Ethnicity } from '@shared/mockupTypes';

export const NAMES_BY_ETHNICITY_AND_SEX: Record<Sex, Record<Ethnicity, string[]>> = {
  'Female': {
    'White': ['Chloe', 'Isabelle', 'Emma', 'Olivia', 'Sophia', 'Ava', 'Mia'],
    'Black': ['Amara', 'Zoe', 'Nia', 'Maya', 'Aaliyah', 'Imani', 'Keisha'],
    'Hispanic': ['Sofia', 'Elena', 'Isabella', 'Valentina', 'Camila', 'Lucia', 'Maria'],
    'Asian': ['Mei', 'Hana', 'Yuki', 'Li Wei', 'Ji-won', 'Sakura', 'Aiko'],
    'Indian': ['Priya', 'Anjali', 'Kavya', 'Isha', 'Neha', 'Diya', 'Aisha'],
    'Southeast Asian': ['Linh', 'Mai', 'Anh', 'Siti', 'Dara', 'Putri', 'Mei Lin'],
    'Middle Eastern': ['Fatima', 'Layla', 'Yasmin', 'Noor', 'Salma', 'Zahra', 'Maryam'],
    'Indigenous': ['Kaya', 'Aiyana', 'Nizhoni', 'Chenoa', 'Takoda', 'Aponi', 'Winona'],
    'Diverse': ['Nia', 'Alex', 'Jordan', 'Casey', 'Riley', 'Avery', 'Sage']
  },
  'Male': {
    'White': ['Ethan', 'Noah', 'Liam', 'Mason', 'Lucas', 'James', 'Oliver'],
    'Black': ['Jamal', 'Marcus', 'Darius', 'Terrell', 'Isaiah', 'DeShawn', 'Andre'],
    'Hispanic': ['Diego', 'Carlos', 'Miguel', 'Alejandro', 'Luis', 'Fernando', 'Mateo'],
    'Asian': ['Kenji', 'Hiro', 'Jin', 'Tao', 'Wei', 'Ryu', 'Kai'],
    'Indian': ['Arjun', 'Rohan', 'Raj', 'Vikram', 'Aditya', 'Karan', 'Dev'],
    'Southeast Asian': ['Nguyen', 'Somchai', 'Dimas', 'Budi', 'Kiet', 'Ahmad', 'Tan'],
    'Middle Eastern': ['Omar', 'Hassan', 'Yusuf', 'Khalid', 'Tariq', 'Amir', 'Karim'],
    'Indigenous': ['Chayton', 'Kai', 'Ahanu', 'Tahoma', 'Dakota', 'Enapay', 'Makya'],
    'Diverse': ['River', 'Phoenix', 'Sage', 'Atlas', 'Canyon', 'Sterling', 'Cruz']
  }
};

export function getRandomName(sex: Sex, ethnicity: Ethnicity, seed?: number): string {
  const names = NAMES_BY_ETHNICITY_AND_SEX[sex]?.[ethnicity];
  
  if (!names || names.length === 0) {
    const fallbackNames = NAMES_BY_ETHNICITY_AND_SEX[sex]?.['Diverse'] || ['Alex'];
    const index = seed !== undefined 
      ? Math.abs(seed) % fallbackNames.length 
      : Math.floor(Math.random() * fallbackNames.length);
    return fallbackNames[index];
  }
  
  const index = seed !== undefined 
    ? Math.abs(seed) % names.length 
    : Math.floor(Math.random() * names.length);
  
  return names[index];
}
