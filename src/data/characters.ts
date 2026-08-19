import { Character } from '../types';

export const PRESET_CHARACTERS: Character[] = [
  {
    id: 'hasu_default',
    name: 'Hasu Boy',
    svgType: 'hasu_boy',
    imageUrl: 'https://res.cloudinary.com/cwrroxz3/image/upload/v1786554565/IMG_4136_tnxtak.png',
    cost: 0,
    speedBonus: 1.0,
    jumpPower: 1.0,
    description: 'The iconic hero of Hasu Appa! Agile, swift, and beloved runner.',
    color: '#ffbd7f', // Warm Amber
  },
  {
    id: 'hero_alom',
    name: 'Hero Alom',
    imageUrl: 'https://res.cloudinary.com/cwrroxz3/image/upload/v1786956676/IMG_4550_nlq7ay.png',
    cost: 2999,
    speedBonus: 1.2,
    jumpPower: 1.25,
    description: 'Superstar Hero Alom! High-energy runner with custom voice & style.',
    color: '#EC4899', // Pink / Star
  }
];

export function getCharacterById(id: string, customList: Character[] = []): Character {
  const foundCustom = customList.find(c => c.id === id);
  if (foundCustom) return foundCustom;

  const foundPreset = PRESET_CHARACTERS.find(c => c.id === id);
  if (foundPreset) return foundPreset;

  return PRESET_CHARACTERS[0];
}
