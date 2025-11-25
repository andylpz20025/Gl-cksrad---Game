
export enum SegmentType {
  VALUE = 'VALUE',
  BANKRUPT = 'BANKRUPT',
  LOSE_TURN = 'LOSE_TURN',
  EXTRA_SPIN = 'EXTRA_SPIN',
  MYSTERY = 'MYSTERY',
  JACKPOT = 'JACKPOT',
  FREE_PLAY = 'FREE_PLAY',
  GIFT = 'GIFT',
  RISK = 'RISK',
  MILLION = 'MILLION',
  EXPRESS = 'EXPRESS'
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
  hasMillionWedge: boolean; // New: collected the 1M wedge
  isAI: boolean; // New: Computer player
}

export interface Puzzle {
  category: string;
  text: string;
}

export type VisualTheme = 'STANDARD' | '80S' | '90S' | '2000S' | 'CURVED' | 'TV_STUDIO';
export type WheelColorTheme = 'STANDARD' | 'RAINBOW' | 'PASTEL' | 'GOLD';

export type HostName = 'FREDERIC' | 'PETER' | 'NONE';
export type AssistantName = 'MAREN' | 'SONYA' | 'NONE';

export interface GameConfig {
  mysteryRound: number[]; // e.g. [1, 3]
  enableTossUp: boolean;
  enableJackpot: boolean;
  enableGiftTags: boolean;
  enableFreePlay: boolean;
  enableTTS: boolean; // Text to Speech
  enableAvatars: boolean;
  categoryTheme: string; // 'ALL', '80s', 'KIDS', etc.
  riskMode: number[]; // e.g. [2]
  millionWedgeMode: number[]; // e.g. [1, 2, 3, 4]
  expressMode: number[]; // e.g. [3]
  extraSpinMode: number[]; // e.g. [1, 2, 3, 4]
  visualTheme: VisualTheme;
  wheelColorTheme: WheelColorTheme;
  enableGamepad: boolean;
  
  // New Features
  enableAudienceMode: boolean; // Hides controls for TV view
  
  playerCount: number; // 1-6
  playerNames: string[]; // Names for players
  
  aiPlayers: boolean[]; // [false, true, true, ...]
  aiDifficulty: number[]; // [100, 100, 100, ...] -> IQ 0-200 per player

  enableCustomWheel: boolean;
  customSegments?: WheelSegment[];
  
  // Cast
  host: HostName;
  assistant: AssistantName;
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
  EXPRESS_DECISION,    // New: Player decides to board the Express
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
