
export enum SegmentType {
  VALUE = 'VALUE',
  BANKRUPT = 'BANKRUPT',
  LOSE_TURN = 'LOSE_TURN',
  EXTRA_SPIN = 'EXTRA_SPIN',
  MYSTERY = 'MYSTERY',
  JACKPOT = 'JACKPOT',
  FREE_PLAY = 'FREE_PLAY',
  GIFT = 'GIFT',
  RISK = 'RISK'
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
  avatar: string; // Emoji
  inventory: string[]; // Collected Gift Tags
}

export interface Puzzle {
  category: string;
  text: string;
}

export interface GameConfig {
  mysteryRound: number; // 0=None, 1-3=Round, 4=Extra, 5=All Rounds
  enableTossUp: boolean;
  enableJackpot: boolean;
  enableGiftTags: boolean;
  enableFreePlay: boolean;
  enableTTS: boolean; // Text to Speech
  enableAvatars: boolean;
  categoryTheme: string; // 'ALL', '80s', 'KIDS', etc.
  riskMode: number; // 0=Off, 1-3=Round, 4=All Rounds
}

export enum GameState {
  GAME_CONFIG,         // New: Setup options
  WELCOME,             // Start screen
  SETUP,
  TOSS_UP,             // New: Fast reveal round
  ROUND_START,
  SPIN_OR_SOLVE,
  SPINNING,
  MYSTERY_DECISION,    // New: Player decides to flip mystery or not
  RISK_DECISION,       // New: Player decides to risk score or play safe
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
