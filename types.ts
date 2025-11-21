
export enum SegmentType {
  VALUE = 'VALUE',
  BANKRUPT = 'BANKRUPT',
  LOSE_TURN = 'LOSE_TURN',
  EXTRA_SPIN = 'EXTRA_SPIN',
  MYSTERY = 'MYSTERY',
}

export interface WheelSegment {
  text: string;
  value: number;
  type: SegmentType;
  color: string;
  textColor: string;
}

export interface Player {
  id: number;
  name: string;
  roundScore: number; // Current score in the active round (at risk)
  totalScore: number; // Banked score from won rounds
  hasExtraSpin: boolean;
  color: string;
  roundsWon: number;
}

export interface Puzzle {
  category: string;
  text: string;
}

export enum GameState {
  GAME_CONFIG,         // New: Setup options
  SETUP,
  ROUND_START,
  SPIN_OR_SOLVE,
  SPINNING,
  GUESSING_CONSONANT,
  BUYING_VOWEL,
  SOLVING,
  ROUND_END,
  BONUS_ROUND_INTRO,
  BONUS_WHEEL_SPIN,      // New: Spinning for prize
  BONUS_ROUND_SELECTION, // Picking letters
  BONUS_ROUND_SOLVE,     // Trying to solve
  EXTRA_SPIN_PROMPT,     // Asking player to use extra spin
  GAME_OVER
}

// German Vowels including Umlauts
export const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Ü'];
export const CONSONANTS = [
  'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 
  'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z', 'ß'
];
export const ALPHABET = [...VOWELS, ...CONSONANTS].sort();

export const VOWEL_COST = 300; // DM
