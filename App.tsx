
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Wheel, { SEGMENTS, BONUS_SEGMENTS } from './components/Wheel';
import PuzzleBoard from './components/PuzzleBoard';
import Controls from './components/Controls';
import PlayerScoreboard from './components/PlayerScoreboard';
import { GameState, Player, Puzzle, VOWELS, VOWEL_COST, SegmentType, GameConfig, HostName, AssistantName, CONSONANTS, ALPHABET } from './types';
import { geminiService } from './services/geminiService';
import { soundService } from './services/soundService';

const INITIAL_PLAYERS: Player[] = [
  { id: 0, name: 'Spieler 1', roundScore: 0, totalScore: 0, hasExtraSpin: false, color: 'red', roundsWon: 0, avatar: '', inventory: [], hasMillionWedge: false, isAI: false },
  { id: 1, name: 'Spieler 2', roundScore: 0, totalScore: 0, hasExtraSpin: false, color: 'green', roundsWon: 0, avatar: '', inventory: [], hasMillionWedge: false, isAI: false },
  { id: 2, name: 'Spieler 3', roundScore: 0, totalScore: 0, hasExtraSpin: false, color: 'blue', roundsWon: 0, avatar: '', inventory: [], hasMillionWedge: false, isAI: false },
];

const HOST_QUOTES = {
  FREDERIC: {
    WELCOME: ["Willkommen beim Glücksrad!", "Servus und Hallo!", "Schön, dass Sie dabei sind!"],
    SPIN: ["Das Rad läuft!", "Eine gute Drehung!", "Schau ma mal!"],
    BANKRUPT: ["Oh weh, der Bankrott.", "Das tut mir leid.", "Pech im Spiel..."],
    SOLVE: ["Das ist absolut richtig!", "Fantastisch gelöst!", "Gratulation!"],
    JACKPOT: ["Der Jackpot greift!", "Wahnsinn, Jackpot!"],
    ERROR: ["Leider nein.", "Das war nichts.", "Schade."],
    INTRO: ["Jetzt wird's spannend!", "Auf geht's!"]
  },
  PETER: {
    WELCOME: ["Hallo liebe Leute!", "Auf geht's!", "Willkommen zur Show!"],
    SPIN: ["Gib alles!", "Dreh das Ding!", "Komm schon!"],
    BANKRUPT: ["Das ist bitter.", "Autsch, alles weg.", "Mist, Bankrott."],
    SOLVE: ["Treffer versenkt!", "Volltreffer!", "Richtig!"],
    JACKPOT: ["Jackpot Baby!", "Unglaublich!"],
    ERROR: ["Daneben.", "Falsch.", "Nee, leider nicht."],
    INTRO: ["Packen wir's an!", "Los geht's!"]
  }
};

const ASSISTANT_QUOTES = {
  MAREN: {
    REVEAL: ["Den dreh ich gerne um.", "Da ist er.", "Ein schöner Buchstabe."],
    NO_LETTER: ["Den haben wir leider nicht.", "Kommt nicht vor.", "Schade."]
  },
  SONYA: {
    REVEAL: ["Hier ist er!", "Bingo!", "Der passt!"],
    NO_LETTER: ["Nee, is nich da.", "Sorry, nicht dabei.", "Leider nein."]
  }
};

// Custom Hook for Gamepad Polling
const useGamepad = (enabled: boolean, gameState: GameState, callback: (input: string) => void) => {
    const lastButtonRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    
    useEffect(() => {
        if (!enabled) return;
        
        const poll = () => {
            const gamepads = navigator.getGamepads();
            if (!gamepads || !gamepads[0]) {
                requestAnimationFrame(poll);
                return;
            }
            
            const gp = gamepads[0];
            const now = Date.now();
            
            // Prevent super fast scrolling
            if (now - lastTimeRef.current < 150) {
                 requestAnimationFrame(poll);
                 return;
            }

            let input = '';
            
            // D-Pad / Stick Threshold
            if (gp.axes[1] < -0.5 || gp.buttons[12].pressed) input = 'UP';
            else if (gp.axes[1] > 0.5 || gp.buttons[13].pressed) input = 'DOWN';
            else if (gp.axes[0] < -0.5 || gp.buttons[14].pressed) input = 'LEFT';
            else if (gp.axes[0] > 0.5 || gp.buttons[15].pressed) input = 'RIGHT';
            
            // Buttons (A=0, B=1)
            else if (gp.buttons[0].pressed) input = 'A';
            else if (gp.buttons[1].pressed) input = 'B';

            if (input) {
                 callback(input);
                 lastTimeRef.current = now;
            }
            
            requestAnimationFrame(poll);
        };
        
        const loop = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(loop);
    }, [enabled, gameState, callback]);
};

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.WELCOME);
  const [currentRound, setCurrentRound] = useState(1);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [usedCategories, setUsedCategories] = useState<string[]>([]);

  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinResult, setLastSpinResult] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [revealingLetters, setRevealingLetters] = useState<Set<string>>(new Set());
  
  // Config State
  const [gameConfig, setGameConfig] = useState<GameConfig>({
      mysteryRound: [], 
      enableTossUp: false, 
      enableJackpot: false, 
      enableGiftTags: false, 
      enableFreePlay: false,
      enableTTS: false,
      enableAvatars: false,
      categoryTheme: 'ALL',
      riskMode: [],
      millionWedgeMode: [],
      expressMode: [],
      extraSpinMode: [1, 2, 3, 4],
      visualTheme: 'STANDARD',
      wheelColorTheme: 'STANDARD',
      enableGamepad: false,
      enableAudienceMode: false,
      enableCustomWheel: false,
      customSegments: [...SEGMENTS],
      playerCount: 3,
      playerNames: ['Spieler 1', 'Spieler 2', 'Spieler 3'],
      aiPlayers: [false, false, false],
      aiDifficulty: [100, 100, 100],
      host: 'NONE',
      assistant: 'NONE'
  });
  
  const [mysteryRevealed, setMysteryRevealed] = useState(false);
  const [jackpotValue, setJackpotValue] = useState(5000);
  const [isFreePlayTurn, setIsFreePlayTurn] = useState(false);
  const [isRiskTurn, setIsRiskTurn] = useState(false);
  const [isExpressRun, setIsExpressRun] = useState(false);
  const [tossUpInterval, setTossUpInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const [bonusRoundSelection, setBonusRoundSelection] = useState<string[]>([]);
  const [bonusPrize, setBonusPrize] = useState<number>(0);

  // Gamepad Focus State
  const [focusedIndex, setFocusedIndex] = useState(0);

  const activePlayer = players[activePlayerIndex];
  const PLAYER_COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];

  // Helper to get random item from array
  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Helper to get host comment and combine with message
  const getFlavorMessage = (baseMessage: string, type: 'WELCOME' | 'SPIN' | 'BANKRUPT' | 'SOLVE' | 'JACKPOT' | 'ERROR' | 'INTRO' | 'REVEAL' | 'NO_LETTER') => {
      let flavor = '';
      const { host, assistant } = gameConfig;
      let characterToSpeak = '';

      // Host Quotes
      if (host !== 'NONE' && HOST_QUOTES[host]) {
          const q = HOST_QUOTES[host];
          if (type === 'WELCOME' && q.WELCOME) { flavor = getRandom(q.WELCOME); characterToSpeak = host; }
          else if (type === 'SPIN' && q.SPIN) { flavor = getRandom(q.SPIN); characterToSpeak = host; }
          else if (type === 'BANKRUPT' && q.BANKRUPT) { flavor = getRandom(q.BANKRUPT); characterToSpeak = host; }
          else if (type === 'SOLVE' && q.SOLVE) { flavor = getRandom(q.SOLVE); characterToSpeak = host; }
          else if (type === 'JACKPOT' && q.JACKPOT) { flavor = getRandom(q.JACKPOT); characterToSpeak = host; }
          else if (type === 'ERROR' && q.ERROR) { flavor = getRandom(q.ERROR); characterToSpeak = host; }
          else if (type === 'INTRO' && q.INTRO) { flavor = getRandom(q.INTRO); characterToSpeak = host; }
      }

      // Assistant Quotes (for Reveal/No Letter)
      if (assistant !== 'NONE' && ASSISTANT_QUOTES[assistant]) {
          const a = ASSISTANT_QUOTES[assistant];
          if (type === 'REVEAL' && a.REVEAL) { flavor = getRandom(a.REVEAL); characterToSpeak = assistant; }
          else if (type === 'NO_LETTER' && a.NO_LETTER) { flavor = getRandom(a.NO_LETTER); characterToSpeak = assistant; }
      }

      if (flavor) {
          // Speak the quote using the correct voice profile
          if (characterToSpeak) {
             soundService.speakCharacter(flavor, characterToSpeak);
          }
          // Combine for visual display
          return baseMessage ? `${flavor} ${baseMessage}` : flavor;
      }
      return baseMessage;
  };

  // --- AI LOGIC LOOP ---
  useEffect(() => {
      const performAIAction = async () => {
          if (!activePlayer.isAI) return;
          if (isSpinning || gameState === GameState.ROUND_END || gameState === GameState.GAME_OVER || gameState === GameState.SETUP || gameState === GameState.ROUND_START) return;

          // Intelligence Level (0 - 200)
          const iq = gameConfig.aiDifficulty[activePlayerIndex];
          
          // Delay for realism (Faster if IQ is high, slower if dumb)
          const delay = Math.max(500, 2000 - (iq * 5));
          await new Promise(r => setTimeout(r, delay));

          // Check if turn has passed due to async issues
          if (players[activePlayerIndex].id !== activePlayer.id) return;

          // Helper: Common German Consonant Frequency
          const GERMAN_FREQ = ['E', 'N', 'I', 'R', 'S', 'T', 'A', 'H', 'D', 'U', 'L', 'C', 'G', 'M', 'O', 'B', 'W', 'F', 'K', 'Z', 'P', 'V', 'Ü', 'Ä', 'Ö', 'J', 'Y', 'X', 'Q'];
          
          // DECISION LOGIC
          if (gameState === GameState.SPIN_OR_SOLVE) {
               if (puzzle) {
                   const totalChars = puzzle.text.replace(/[^A-ZÄÖÜß]/g, '').length;
                   const knownChars = puzzle.text.replace(/[^A-ZÄÖÜß]/g, '').split('').filter(c => guessedLetters.has(c)).length;
                   const percent = knownChars / totalChars;
                   
                   // SOLVE DECISION
                   const requiredPercent = 0.95 - ((iq / 200) * 0.7); 
                   const geniusMove = iq > 150 && Math.random() > 0.8 && percent > 0.3;

                   if (percent > requiredPercent || geniusMove) {
                       setGameState(GameState.SOLVING);
                       return;
                   }
               }
               
               // In Express Run, we CANNOT spin.
               if (isExpressRun) {
                   // AI always chooses to guess consonant if running express, or solve
                   setGameState(GameState.GUESSING_CONSONANT);
                   return;
               }

               const hasMoney = activePlayer.roundScore >= VOWEL_COST;
               const shouldBuy = hasMoney && (iq > 100 ? Math.random() > 0.4 : Math.random() > 0.8);
               
               if (shouldBuy) {
                   handleStartBuyingVowelWrapper();
                   return;
               }
               handleSpinWrapper();
          } 
          else if (gameState === GameState.GUESSING_CONSONANT) {
              const available = CONSONANTS.filter(c => !guessedLetters.has(c));
              if (available.length > 0) {
                  let chosenChar = '';

                  if (iq < 50) {
                      chosenChar = available[Math.floor(Math.random() * available.length)];
                  } else if (iq < 150) {
                      const sorted = available.sort((a, b) => GERMAN_FREQ.indexOf(a) - GERMAN_FREQ.indexOf(b));
                      const topCandidates = sorted.slice(0, 5);
                      chosenChar = topCandidates[Math.floor(Math.random() * topCandidates.length)] || available[0];
                  } else {
                      const cheatChance = (iq - 100) / 100;
                      const correctAvailable = available.filter(c => puzzle?.text.includes(c));
                      if (Math.random() < cheatChance && correctAvailable.length > 0) {
                          chosenChar = correctAvailable[Math.floor(Math.random() * correctAvailable.length)];
                      } else {
                          const sorted = available.sort((a, b) => GERMAN_FREQ.indexOf(a) - GERMAN_FREQ.indexOf(b));
                          chosenChar = sorted[0];
                      }
                  }
                  handleGuessConsonant(chosenChar);
              }
          }
          else if (gameState === GameState.BUYING_VOWEL) {
              const available = VOWELS.filter(c => !guessedLetters.has(c));
              if (available.length > 0) {
                  const sorted = available.sort((a, b) => GERMAN_FREQ.indexOf(a) - GERMAN_FREQ.indexOf(b));
                  const randomChar = iq < 80 ? available[Math.floor(Math.random() * available.length)] : sorted[0];
                  handleBuyVowel(randomChar);
              } else {
                  setGameState(GameState.SPIN_OR_SOLVE);
              }
          }
          else if (gameState === GameState.SOLVING) {
               if (puzzle) {
                   const successChance = 0.1 + ((iq / 200) * 0.9);
                   if (Math.random() < successChance) {
                       handleSolve(puzzle.text);
                   } else {
                       handleSolve("FALSCHE ANTWORT");
                   }
               }
          }
          else if (gameState === GameState.EXTRA_SPIN_PROMPT) {
              handleExtraSpinDecision(true); 
          }
          else if (gameState === GameState.MYSTERY_DECISION) {
              if (iq > 120) handleMysteryDecision(activePlayer.roundScore < 2000);
              else handleMysteryDecision(Math.random() > 0.5);
          }
          else if (gameState === GameState.RISK_DECISION) {
              if (iq > 120) handleRiskDecision(activePlayer.roundScore < 1500);
              else handleRiskDecision(Math.random() > 0.5);
          }
          else if (gameState === GameState.EXPRESS_DECISION) {
              // AI is usually greedy in Express mode if IQ is decent
              handleExpressDecision(iq > 50);
          }
      };

      performAIAction();
  }, [gameState, activePlayerIndex, isSpinning, activePlayer, guessedLetters]);

  // GAMEPAD LOGIC HANDLER
  const handleGamepadInput = useCallback((input: string) => {
      if (!gameConfig.enableGamepad) return;
      
      const maxIdx = {
          [GameState.SPIN_OR_SOLVE]: 2,
          [GameState.GUESSING_CONSONANT]: CONSONANTS.length - 1,
          [GameState.BUYING_VOWEL]: VOWELS.length, // +1 for Cancel
          [GameState.SOLVING]: 1, // OK / Back
          [GameState.BONUS_ROUND_SELECTION]: ALPHABET.length, // +1 Submit
          [GameState.MYSTERY_DECISION]: 1,
          [GameState.RISK_DECISION]: 1,
          [GameState.EXTRA_SPIN_PROMPT]: 1,
          [GameState.EXPRESS_DECISION]: 1
      }[gameState] || 0;

      if (input === 'LEFT' || input === 'UP') {
          setFocusedIndex(prev => (prev - 1 + (maxIdx + 1)) % (maxIdx + 1));
          soundService.playClick();
      } else if (input === 'RIGHT' || input === 'DOWN') {
          setFocusedIndex(prev => (prev + 1) % (maxIdx + 1));
          soundService.playClick();
      } else if (input === 'A') {
          // Trigger Action based on focused element
          if (gameState === GameState.SPIN_OR_SOLVE) {
              if (focusedIndex === 0 && !isExpressRun) handleSpinWrapper();
              if (focusedIndex === 1) handleStartBuyingVowelWrapper();
              if (focusedIndex === 2) setGameState(GameState.SOLVING);
          }
          else if (gameState === GameState.GUESSING_CONSONANT) {
              handleGuessConsonant(CONSONANTS[focusedIndex]);
          }
          else if (gameState === GameState.BUYING_VOWEL) {
              if (focusedIndex < VOWELS.length) handleBuyVowel(VOWELS[focusedIndex]);
              else setGameState(GameState.SPIN_OR_SOLVE);
          }
          else if (gameState === GameState.MYSTERY_DECISION) {
               handleMysteryDecision(focusedIndex === 0);
          }
          else if (gameState === GameState.RISK_DECISION) {
               handleRiskDecision(focusedIndex === 0);
          }
          else if (gameState === GameState.EXPRESS_DECISION) {
               handleExpressDecision(focusedIndex === 0);
          }
          else if (gameState === GameState.EXTRA_SPIN_PROMPT) {
               handleExtraSpinDecision(focusedIndex === 0);
          }
          else if (gameState === GameState.BONUS_ROUND_SELECTION) {
              if (focusedIndex < ALPHABET.length) handleBonusSelect(ALPHABET[focusedIndex]);
              else handleBonusSubmit();
          }
      } else if (input === 'B') {
          if (gameState === GameState.GUESSING_CONSONANT || gameState === GameState.BUYING_VOWEL || gameState === GameState.SOLVING) {
              setGameState(GameState.SPIN_OR_SOLVE);
          }
      }
  }, [gameState, focusedIndex, gameConfig.enableGamepad, isExpressRun]);

  useGamepad(gameConfig.enableGamepad, gameState, handleGamepadInput);

  // Reset focus when state changes
  useEffect(() => {
      setFocusedIndex(0);
  }, [gameState]);

  const enterConfig = () => {
      setGameState(GameState.GAME_CONFIG);
  };

  const handleConfigStart = (config: GameConfig, avatars: string[]) => {
      setGameConfig(config);
      // Players are initialized in startGame now
      startGame(config, avatars);
  };

  const handleQuitGame = () => {
      if (tossUpInterval) clearInterval(tossUpInterval);
      setGameState(GameState.WELCOME);
  };

  const startGame = (config: GameConfig, avatars?: string[]) => {
    // Generate players dynamically
    const newPlayers: Player[] = Array.from({ length: config.playerCount }).map((_, i) => ({
        id: i,
        name: config.playerNames[i] || `Spieler ${i + 1}`,
        roundScore: 0,
        totalScore: 0,
        hasExtraSpin: false,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        roundsWon: 0,
        avatar: avatars ? avatars[i] : '',
        inventory: [],
        hasMillionWedge: false,
        isAI: config.aiPlayers[i]
    }));

    setPlayers(newPlayers);
    setCurrentRound(1);
    setActivePlayerIndex(0); 
    setJackpotValue(5000); 
    
    if (config.enableTossUp) {
        startTossUpRound(config);
    } else {
        startRound(1, 0, config);
    }
  };
  
  const getInitialGuessedLetters = (text: string): Set<string> => {
      const initial = new Set<string>();
      const chars = text.replace(/ /g, '').split('');
      chars.forEach(c => {
          if (c === '-' || /[0-9]/.test(c)) {
              initial.add(c);
          }
      });
      return initial;
  }

  const startTossUpRound = async (config: GameConfig) => {
      setGameState(GameState.SETUP);
      setMessage("SCHNELLRATERUNDE! Gleich geht's los...");
      setGuessedLetters(new Set());
      
      try {
          const newPuzzle = (await geminiService.generatePuzzle('easy', [], config.categoryTheme)) as Puzzle;
          setPuzzle(newPuzzle);
          setGuessedLetters(getInitialGuessedLetters(newPuzzle.text as string));
          setGameState(GameState.TOSS_UP);
          
          const allLetters = newPuzzle.text.replace(/[^A-ZÄÖÜß]/g, '').split('');
          const uniqueLetters = Array.from(new Set(allLetters));
          
          let revealStep = 0;
          const interval = setInterval(() => {
              if (revealStep >= uniqueLetters.length) {
                  clearInterval(interval);
                  return;
              }
              const charToReveal = uniqueLetters[revealStep] as string;
              setGuessedLetters(prev => new Set(prev).add(charToReveal));
              soundService.playReveal();
              revealStep++;
          }, 1200); 
          setTossUpInterval(interval);

      } catch (e: any) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(errorMessage);
          startRound(1, 0, config);
      }
  };

  const handleTossUpBuzz = (playerIndex: number) => {
      if (tossUpInterval) clearInterval(tossUpInterval);
      setActivePlayerIndex(playerIndex);
      setGameState(GameState.SOLVING);
  };

  const startRound = async (roundNum: number, startPlayerIndex: number, config: GameConfig, starterCapital: number = 0) => {
    setGameState(GameState.SETUP);
    const isMystery = config.mysteryRound.includes(roundNum);
    
    // Intro Message with Host Quote
    setMessage(getFlavorMessage(isMystery ? `MYSTERY RUNDE ${roundNum}!` : `Runde ${roundNum} wird generiert...`, 'INTRO'));
    
    setPlayers(prev => prev.map((p, idx) => ({ 
        ...p, 
        roundScore: idx === startPlayerIndex ? starterCapital : 0, 
        hasExtraSpin: false 
    })));
    
    setLastSpinResult(null);
    setActivePlayerIndex(startPlayerIndex);
    setMysteryRevealed(false);
    setIsFreePlayTurn(false);
    setIsRiskTurn(false);
    setIsExpressRun(false);
    
    try {
      const difficulty: 'easy' | 'medium' | 'hard' = roundNum >= 3 ? 'hard' : (roundNum === 2 ? 'medium' : 'easy');
      const newPuzzle = (await geminiService.generatePuzzle(difficulty, usedCategories, config.categoryTheme)) as Puzzle;
      setPuzzle(newPuzzle);
      setGuessedLetters(getInitialGuessedLetters(newPuzzle.text as string));
      setUsedCategories(prev => [...prev, newPuzzle.category]);
      setGameState(GameState.ROUND_START);
      setTimeout(() => setGameState(GameState.SPIN_OR_SOLVE), 2500);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Failed to start round", errorMessage);
    }
  };

  const nextTurn = useCallback(() => {
    if (gameState === GameState.BONUS_ROUND_SOLVE) {
         handleGameOver();
         return;
    }
    setActivePlayerIndex((prev) => (prev + 1) % gameConfig.playerCount);
    setIsFreePlayTurn(false);
    setIsRiskTurn(false);
    setIsExpressRun(false);
    setGameState(GameState.SPIN_OR_SOLVE);
    setMessage('');
  }, [gameState, gameConfig.playerCount]);

  const handleExtraSpinDecision = (useIt: boolean) => {
      if (useIt) {
          setPlayers(prev => {
              const copy = [...prev];
              copy[activePlayerIndex].hasExtraSpin = false;
              return copy;
          });
          setMessage('EXTRA DREH EINGESETZT! Du bist noch einmal dran.');
          setGameState(GameState.SPIN_OR_SOLVE);
      } else {
          setMessage('Kein Extra Dreh eingesetzt.');
          setTimeout(nextTurn, 1000);
      }
  };

  const handleMysteryDecision = (reveal: boolean) => {
      const multiplier = Math.pow(2, currentRound - 1);
      
      if (!reveal) {
          const val = 1000 * multiplier;
          setLastSpinResult(val);
          setMessage(`Sicher gespielt: 1.000er Wert.`);
          setGameState(GameState.GUESSING_CONSONANT);
      } else {
          setMysteryRevealed(true);
          const isGood = Math.random() > 0.5;
          if (isGood) {
             const val = 10000 * multiplier;
             setLastSpinResult(val);
             soundService.playCorrect();
             setMessage(getFlavorMessage(`10.000er WERT!`, 'JACKPOT'));
             setTimeout(() => setGameState(GameState.GUESSING_CONSONANT), 1500);
          } else {
             soundService.playBankrupt();
             setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                copy[activePlayerIndex].hasMillionWedge = false; 
                return copy;
             });
             if (players[activePlayerIndex].hasExtraSpin) {
                 setGameState(GameState.EXTRA_SPIN_PROMPT);
             } else {
                 setMessage(getFlavorMessage('BANKROTT! Risiko verloren.', 'BANKRUPT'));
                 setTimeout(nextTurn, 2000);
             }
          }
      }
  };

  const handleRiskDecision = (risk: boolean) => {
      const multiplier = Math.pow(2, currentRound - 1);
      if (risk) {
          setIsRiskTurn(true);
          setMessage('RISIKO! Alles oder Nichts.');
          setGameState(GameState.GUESSING_CONSONANT);
      } else {
          setLastSpinResult(500 * multiplier);
          setMessage('Sicher gespielt für 500.');
          setGameState(GameState.GUESSING_CONSONANT);
      }
  };

  const handleExpressDecision = (board: boolean) => {
       if (board) {
           setIsExpressRun(true);
           setLastSpinResult(1000); 
           setMessage('EXPRESS FAHRT! 1.000 DM pro Konsonant. Ein Fehler = Bankrott.');
           setGameState(GameState.GUESSING_CONSONANT);
       } else {
           setLastSpinResult(1000);
           setMessage('Normal weiter: 1.000 DM für diesen Zug.');
           setGameState(GameState.GUESSING_CONSONANT);
       }
  };

  const handleSpinWrapper = () => {
    if (gameState === GameState.BONUS_WHEEL_SPIN) {
        handleBonusWheelSpin();
        return;
    }
    if (!puzzle) return;
    
    let hasCons = false;
    for(const c of puzzle.text.replace(/[^A-ZÄÖÜß]/g, '').split('')) {
        if (!VOWELS.includes(c) && !guessedLetters.has(c)) {
            hasCons = true; break;
        }
    }

    if (!hasCons && !isFreePlayTurn) {
        soundService.playWarning();
        setMessage('Keine Konsonanten mehr! Bitte lösen.');
        return;
    }
    handleSpin();
  };

  const handleStartBuyingVowelWrapper = () => {
    if (isFreePlayTurn) {
         setGameState(GameState.BUYING_VOWEL);
         return;
    }
    if (activePlayer.roundScore < VOWEL_COST) {
        soundService.playWarning();
        return;
    }
    setGameState(GameState.BUYING_VOWEL);
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setGameState(GameState.SPINNING);
    setIsSpinning(true);
    soundService.playClick(); 
    
    setMessage(getFlavorMessage('', 'SPIN'));

    const spinAmount = 1080 + Math.floor(Math.random() * 720);
    const newRotation = wheelRotation + spinAmount;
    setWheelRotation(newRotation);
    setTimeout(() => {
      setIsSpinning(false);
      calculateSpinResult(newRotation);
    }, 4000);
  };
  
  const handleBonusWheelSpin = () => {
      if (isSpinning) return;
      setIsSpinning(true);
      soundService.playClick();
      setMessage(getFlavorMessage('Viel Glück für den Bonus!', 'SPIN'));

      const spinAmount = 1080 + Math.floor(Math.random() * 720);
      const newRotation = wheelRotation + spinAmount;
      setWheelRotation(newRotation);
      
      setTimeout(() => {
          setIsSpinning(false);
          let prizes = [10000, 20000, 30000, 40000, 50000, 75000, 100000, 100000]; 
          
          if (activePlayer.hasMillionWedge) {
              setMessage(getFlavorMessage('MILLIONEN CHANCE AKTIV!', 'JACKPOT'));
              prizes = [10000, 20000, 30000, 40000, 50000, 75000, 100000, 1000000]; 
          }
          
          const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
          setBonusPrize(wonPrize);
          
          setMessage('Preis ermittelt!');
          setTimeout(() => {
              setGameState(GameState.BONUS_ROUND_SELECTION);
          }, 2000);
      }, 4000);
  };

  const calculateSpinResult = (finalRotation: number) => {
    const stopperAngles = Array.from({length: gameConfig.playerCount}, (_, i) => i * (360 / gameConfig.playerCount));
    const currentStopperAngle = stopperAngles[activePlayerIndex];
    const rotationMod = finalRotation % 360;
    const hitAngle = (currentStopperAngle - rotationMod + 360) % 360;
    
    let currentSegments = [...SEGMENTS];
    if (gameConfig.enableCustomWheel && gameConfig.customSegments && gameConfig.customSegments.length === 24) {
        currentSegments = [...gameConfig.customSegments];
    }
    
    // Apply Config Overrides
    
    // Single Player Override
    if (gameConfig.playerCount === 1) {
         if (currentSegments[19].type === SegmentType.LOSE_TURN) {
              currentSegments[19] = { text: '500', value: 500, type: SegmentType.VALUE, color: '#A3E635', textColor: '#000' };
         }
    }

    if (!gameConfig.extraSpinMode.includes(currentRound)) {
        if (currentSegments[11].type === SegmentType.EXTRA_SPIN) {
             currentSegments[11] = { text: '500', value: 500, type: SegmentType.VALUE, color: '#A855F7', textColor: '#fff' };
        }
    }

    if (gameConfig.enableJackpot) currentSegments[1] = { text: 'JACKPOT', value: jackpotValue, type: SegmentType.JACKPOT, color: '#B91C1C', textColor: '#fff' };
    if (gameConfig.enableFreePlay) currentSegments[14] = { text: 'FREE', value: 0, type: SegmentType.FREE_PLAY, color: '#4C1D95', textColor: '#fff' };
    if (gameConfig.enableGiftTags) currentSegments[23] = { text: 'GESCHENK', value: 1000, type: SegmentType.GIFT, color: '#EC4899', textColor: '#fff' };
    
    if (gameConfig.riskMode.includes(currentRound)) {
        currentSegments[4] = { text: 'RISIKO', value: 0, type: SegmentType.RISK, color: '#000000', textColor: '#F97316' };
    }
    
    if (gameConfig.expressMode.includes(currentRound)) {
          currentSegments[8] = { text: 'EXPRESS', value: 1000, type: SegmentType.EXPRESS, color: '#94A3B8', textColor: '#000' };
    }

    if (gameConfig.millionWedgeMode.includes(currentRound)) {
        currentSegments[11] = { text: 'BANKROTT', value: 0, type: SegmentType.BANKRUPT, color: '#000000', textColor: '#EF4444' };
        currentSegments[12] = { text: '1 MILLION', value: 0, type: SegmentType.MILLION, color: '#10B981', textColor: '#fff' };
        currentSegments[13] = { text: 'BANKROTT', value: 0, type: SegmentType.BANKRUPT, color: '#000000', textColor: '#EF4444' };
    }

    const isMystery = gameConfig.mysteryRound.includes(currentRound);
    if (isMystery) {
        if (!mysteryRevealed) {
            currentSegments[6] = { text: '?', value: 0, type: SegmentType.MYSTERY, color: '#7E22CE', textColor: '#fff' };
            currentSegments[17] = { text: '?', value: 0, type: SegmentType.MYSTERY, color: '#7E22CE', textColor: '#fff' };
        } else {
            currentSegments[6] = { text: '1000', value: 1000, type: SegmentType.VALUE, color: '#9333EA', textColor: '#fff' };
            currentSegments[17] = { text: '1000', value: 1000, type: SegmentType.VALUE, color: '#9333EA', textColor: '#fff' };
        }
    }

    const segmentAngle = 360 / currentSegments.length; 
    const segmentIndex = Math.floor(hitAngle / segmentAngle);
    const safeIndex = (segmentIndex + currentSegments.length) % currentSegments.length;
    const segment = currentSegments[safeIndex];
    
    const multiplier = Math.pow(2, currentRound - 1);
    let calculatedValue = segment.value * multiplier;
    
    if (gameConfig.enableJackpot && segment.type === SegmentType.VALUE && calculatedValue > 0) {
        setJackpotValue(prev => prev + calculatedValue);
    }
    
    if (segment.type === SegmentType.MYSTERY) {
        setMessage("MYSTERY FELD! Risiko oder Sicherheit?");
        setGameState(GameState.MYSTERY_DECISION);
        return;
    }

    if (segment.type === SegmentType.RISK) {
        setMessage("RISIKO FELD! Willst du es wagen?");
        setGameState(GameState.RISK_DECISION);
        return;
    }
    
    if (segment.type === SegmentType.EXPRESS) {
        setMessage("EXPRESS! Einsteigen oder Passen?");
        setGameState(GameState.EXPRESS_DECISION);
        return;
    }

    setLastSpinResult(calculatedValue);
    processSegment(segment, calculatedValue);
  };

  const processSegment = (segment: any, actualValue: number) => {
    setTimeout(() => {
        if (segment.type === SegmentType.BANKRUPT) {
            soundService.playBankrupt();
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                copy[activePlayerIndex].inventory = []; 
                copy[activePlayerIndex].hasMillionWedge = false; 
                return copy;
            });
            if (players[activePlayerIndex].hasExtraSpin) {
                 setGameState(GameState.EXTRA_SPIN_PROMPT);
            } else {
                 setMessage(getFlavorMessage('BANKROTT!', 'BANKRUPT'));
                 setTimeout(nextTurn, 2000);
            }
        } else if (segment.type === SegmentType.LOSE_TURN) {
             // Logic handles replace for Single Player, so this case shouldn't hit for 1 player normally
             soundService.playWrong();
             setMessage('AUSSETZEN!');
             if (players[activePlayerIndex].hasExtraSpin) {
                 setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
             } else {
                 setTimeout(nextTurn, 2000);
             }
        } else if (segment.type === SegmentType.EXTRA_SPIN) {
             soundService.playCorrect();
             setPlayers(prev => {
                 const copy = [...prev];
                 copy[activePlayerIndex].hasExtraSpin = true;
                 return copy;
             });
             setMessage('EXTRA DREH GEWONNEN!');
             setGameState(GameState.SPIN_OR_SOLVE);
        } else if (segment.type === SegmentType.FREE_PLAY) {
             setMessage('FREISPIEL!');
             setIsFreePlayTurn(true);
             setGameState(GameState.GUESSING_CONSONANT); 
        } else if (segment.type === SegmentType.JACKPOT) {
             setMessage(`JACKPOT CHANCE!`);
             setGameState(GameState.GUESSING_CONSONANT);
        } else if (segment.type === SegmentType.GIFT) {
             const gifts = ['AUTO', 'REISE', 'HAUS', 'MOTORRAD', 'ROLLER', 'BIKE', 'E-BIKE', 'KREUZFAHRT'];
             const wonGift = gifts[Math.floor(Math.random() * gifts.length)];
             setMessage(`GESCHENK: ${wonGift}!`);
             setPlayers(prev => {
                 const copy = [...prev];
                 copy[activePlayerIndex].inventory.push(wonGift);
                 return copy;
             });
             setGameState(GameState.GUESSING_CONSONANT);
        } else if (segment.type === SegmentType.MILLION) {
             setMessage(`MILLIONEN KEIL AUFGEHOBEN!`);
             soundService.playCorrect();
             setPlayers(prev => {
                 const copy = [...prev];
                 copy[activePlayerIndex].hasMillionWedge = true;
                 return copy;
             });
             setGameState(GameState.GUESSING_CONSONANT);
        } else {
             setGameState(GameState.GUESSING_CONSONANT);
        }
    }, 500);
  };

  const handleGuessConsonant = (char: string) => {
    if (!puzzle) return;
    const count = puzzle.text.split(char).length - 1;
    setGuessedLetters(prev => new Set(prev).add(char));

    if (count > 0) {
        soundService.playReveal(count); 
        if (isRiskTurn) {
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore *= 2;
                return copy;
            });
            setMessage(`RISIKO GEWONNEN! Score verdoppelt!`);
            setIsRiskTurn(false);
        } else {
            let value = (lastSpinResult || 0);
            if (isExpressRun) value = 1000;
            
            const totalAdd = value * count;
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore += totalAdd;
                return copy;
            });
            setMessage(getFlavorMessage(`${count}x ${char}! (+${totalAdd} DM)`, 'REVEAL'));
        }
        setRevealingLetters(new Set([char]));
        setTimeout(() => setRevealingLetters(new Set()), 1000);
        setGameState(GameState.SPIN_OR_SOLVE);
    } else {
        soundService.playWrong();
        if (isRiskTurn) {
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                copy[activePlayerIndex].hasMillionWedge = false; 
                return copy;
            });
            setMessage(`RISIKO VERLOREN! Alles weg.`);
            setIsRiskTurn(false);
            setTimeout(nextTurn, 2000);
        } else if (isExpressRun) {
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                copy[activePlayerIndex].hasMillionWedge = false; 
                return copy;
            });
            setMessage(`EXPRESS FEHLER! BANKROTT!`);
            setTimeout(nextTurn, 2000);
        } else if (isFreePlayTurn) {
            setMessage(getFlavorMessage(`Kein ${char}. (Freispiel)`, 'NO_LETTER'));
            setTimeout(() => setGameState(GameState.SPIN_OR_SOLVE), 1500); 
        } else if (players[activePlayerIndex].hasExtraSpin) {
             setMessage(`Leider kein ${char}.`);
             setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
        } else {
             setMessage(getFlavorMessage(`Leider kein ${char}.`, 'NO_LETTER'));
             setTimeout(nextTurn, 1500);
        }
    }
  };

  const handleBuyVowel = (char: string) => {
     if (!isFreePlayTurn) {
        setPlayers(prev => {
            const copy = [...prev];
            copy[activePlayerIndex].roundScore -= VOWEL_COST;
            return copy;
        });
     }
     setGuessedLetters(prev => new Set(prev).add(char));
     const count = puzzle?.text.split(char).length || 0 - 1; 
     if (puzzle && puzzle.text.split(char).length - 1 > 0) {
         const foundCount = puzzle.text.split(char).length - 1;
         soundService.playReveal(foundCount);
         setMessage(getFlavorMessage(`${foundCount}x ${char} gekauft.`, 'REVEAL'));
         setRevealingLetters(new Set([char]));
         setTimeout(() => setRevealingLetters(new Set()), 1000);
         setGameState(GameState.SPIN_OR_SOLVE);
     } else {
         soundService.playWrong();
         if (isExpressRun) {
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                copy[activePlayerIndex].hasMillionWedge = false; 
                return copy;
            });
            setMessage(`EXPRESS FEHLER! BANKROTT!`);
            setTimeout(nextTurn, 2000);
         } else if (isFreePlayTurn) {
             setMessage(`Kein ${char}.`);
             setTimeout(() => setGameState(GameState.SPIN_OR_SOLVE), 1500);
         } else if (players[activePlayerIndex].hasExtraSpin) {
            setMessage(`Kein ${char}.`);
            setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
         } else {
            setMessage(getFlavorMessage(`Kein ${char}.`, 'NO_LETTER'));
            setTimeout(nextTurn, 1500);
         }
     }
  };
  
  const speakPuzzle = (text: string) => {
      if (!gameConfig.enableTTS) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      window.speechSynthesis.speak(utterance);
  };

  const handleSolve = (guess: string) => {
    if (!puzzle) return;
    const normalize = (s: string) => s.replace(/-/g, '').trim();
    if (normalize(guess) === normalize(puzzle.text)) {
        soundService.playSolve();
        speakPuzzle(puzzle.text);
        if (gameState === GameState.BONUS_ROUND_SOLVE) handleBonusWin();
        else if (gameState === GameState.TOSS_UP) endTossUp(activePlayerIndex);
        else endRound(activePlayerIndex);
    } else {
        soundService.playWrong();
        if (gameState === GameState.TOSS_UP) {
            setMessage("Falsch!");
            setGameState(GameState.TOSS_UP);
        } else if (isExpressRun) {
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                copy[activePlayerIndex].hasMillionWedge = false; 
                return copy;
            });
            setMessage(`EXPRESS FEHLER! BANKROTT!`);
            setTimeout(nextTurn, 2000);
        } else if (players[activePlayerIndex].hasExtraSpin && gameState !== GameState.BONUS_ROUND_SOLVE) {
            setMessage('Falsch.');
            setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
        } else {
            setMessage(getFlavorMessage('Falsch.', 'ERROR'));
            if (gameState === GameState.BONUS_ROUND_SOLVE) handleGameOver();
            else setTimeout(nextTurn, 2000);
        }
    }
  };

  const endTossUp = (winnerIndex: number) => {
      setMessage(`SCHNELLRUNDE GEWONNEN! (+1000 DM Start)`);
      const text = puzzle ? puzzle.text : '';
      setGuessedLetters(new Set(text.replace(/ /g, '').split('')));
      setTimeout(() => {
          startRound(1, winnerIndex, gameConfig, 1000);
      }, 3000);
  };

  const endRound = (winnerIndex: number) => {
    const currentPlayer = players[winnerIndex];
    let winAmount = currentPlayer.roundScore === 0 ? 200 : currentPlayer.roundScore;
    
    setPlayers(prev => {
        const copy = [...prev];
        copy[winnerIndex].roundScore = winAmount; 
        copy[winnerIndex].totalScore += winAmount;
        copy[winnerIndex].roundsWon += 1;
        copy[winnerIndex].inventory = []; 
        return copy;
    });
    
    setMessage(getFlavorMessage(`Runde vorbei! ${players[winnerIndex].name} gewinnt ${winAmount} DM.`, 'SOLVE'));
    const text = puzzle ? puzzle.text : '';
    setGuessedLetters(new Set(text.replace(/ /g, '').split('')));
    
    // Determine Max Rounds based on config
    const allModes = [
        ...gameConfig.mysteryRound,
        ...gameConfig.riskMode,
        ...gameConfig.millionWedgeMode,
        ...gameConfig.expressMode,
        ...gameConfig.extraSpinMode
    ];
    const maxRoundInConfig = Math.max(3, ...allModes);
    
    setTimeout(() => {
        if (currentRound < maxRoundInConfig) {
            setCurrentRound(prev => {
                const next = prev + 1;
                startRound(next, (next - 1) % gameConfig.playerCount, gameConfig);
                return next;
            });
        } else {
            prepareBonusRound();
        }
    }, 4000);
  };

  const prepareBonusRound = () => {
      const sorted = [...players].sort((a, b) => {
          if (b.roundsWon !== a.roundsWon) return b.roundsWon - a.roundsWon;
          return b.totalScore - a.totalScore;
      });
      const winner = sorted[0];
      setActivePlayerIndex(winner.id);
      setGameState(GameState.BONUS_ROUND_INTRO);
  };

  const startBonusRound = async () => {
      setGameState(GameState.SETUP);
      setMessage('Generiere Bonus Rätsel...');
      setGuessedLetters(new Set()); 
      try {
          const newPuzzle = (await geminiService.generatePuzzle('hard', usedCategories, gameConfig.categoryTheme)) as Puzzle;
          setPuzzle(newPuzzle);
          setBonusRoundSelection([]);
          setGuessedLetters(getInitialGuessedLetters(newPuzzle.text as string));
          setGameState(GameState.BONUS_WHEEL_SPIN);
      } catch (e: any) {
          console.error(e);
      }
  };

  const handleBonusSelect = (char: string) => {
      if (bonusRoundSelection.includes(char)) return;
      setBonusRoundSelection(prev => [...prev, char]);
  };

  const handleBonusSubmit = () => {
      setGuessedLetters(prev => {
          const next = new Set(prev);
          bonusRoundSelection.forEach(c => next.add(c));
          return next;
      });
      setGameState(GameState.BONUS_ROUND_SOLVE);
  };

  const handleBonusWin = () => {
      setPlayers(prev => {
          const copy = [...prev];
          copy[activePlayerIndex].totalScore += bonusPrize;
          return copy;
      });
      setMessage(getFlavorMessage(`BONUS GEWONNEN! +${bonusPrize} DM`, 'SOLVE'));
      
      if (puzzle) setGuessedLetters(new Set(puzzle.text.replace(/ /g, '').split('')));
      
      setTimeout(handleGameOver, 4000);
  };

  const handleGameOver = () => {
      setGameState(GameState.GAME_OVER);
      soundService.playSolve();
      if (puzzle) setGuessedLetters(new Set(puzzle.text.replace(/ /g, '').split('')));
      
      if (gameState === GameState.BONUS_ROUND_SOLVE && bonusPrize > 0) {
          setMessage(`Leider falsch! Der Preis wäre ${bonusPrize} DM gewesen.`);
          soundService.playBankrupt(); 
      }
  };

  // Apply Theme Background
  const getThemeBg = () => {
      switch(gameConfig.visualTheme) {
          case '80S': return 'bg-gradient-to-b from-purple-900 via-pink-900 to-black';
          case '90S': return 'bg-indigo-600'; 
          case '2000S': return 'bg-gradient-to-b from-gray-300 to-gray-500';
          default: return 'bg-gradient-to-b from-blue-900 via-purple-900 to-black';
      }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center pb-10 text-white overflow-hidden font-sans selection:bg-yellow-500 selection:text-black ${getThemeBg()}`}>
      
      <header className={`w-full p-4 border-b flex justify-between items-center z-50 sticky top-0 shadow-lg backdrop-blur-md ${
          gameConfig.visualTheme === '80S' ? 'bg-black/80 border-cyan-400' : 
          gameConfig.visualTheme === '90S' ? 'bg-yellow-400 border-black text-black' :
          gameConfig.visualTheme === '2000S' ? 'bg-white/80 border-gray-400 text-gray-800' :
          'bg-black/50 border-white/10'
      }`}>
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-600 border-2 border-white shadow-inner animate-pulse"></div>
             <h1 className={`text-2xl md:text-3xl font-display tracking-wider drop-shadow-md ${gameConfig.visualTheme === '80S' ? 'text-cyan-400' : ''}`}>GLÜCKSRAD</h1>
        </div>
        <div className={`text-xl font-bold flex gap-4 items-center ${gameConfig.visualTheme === '90S' ? 'text-black' : 'text-yellow-400'}`}>
            <span>
                {gameState === GameState.TOSS_UP ? 'SCHNELLRUNDE' : (
                    currentRound > Math.max(3, ...gameConfig.mysteryRound, ...gameConfig.riskMode, ...gameConfig.millionWedgeMode, ...gameConfig.expressMode, ...gameConfig.extraSpinMode) ? 'BONUS' : `${currentRound} / ${Math.max(3, ...gameConfig.mysteryRound, ...gameConfig.riskMode, ...gameConfig.millionWedgeMode, ...gameConfig.expressMode, ...gameConfig.extraSpinMode)}`
                )}
            </span>
            {(gameState !== GameState.WELCOME && gameState !== GameState.GAME_CONFIG && gameState !== GameState.SETUP) && (
                 <button 
                    onClick={handleQuitGame}
                    className="ml-2 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm px-3 py-1 rounded uppercase font-bold shadow border border-white/20 transition-colors"
                 >
                     Beenden
                 </button>
            )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl px-2 md:px-4 flex flex-col items-center mt-4 gap-4 md:gap-8">
        
        <div className="w-full transform transition-all">
            <PuzzleBoard 
                puzzle={puzzle} 
                guessedLetters={guessedLetters} 
                revealingLetters={revealingLetters}
                visualTheme={gameConfig.visualTheme}
            />
        </div>

        {(gameState !== GameState.BONUS_ROUND_INTRO && gameState !== GameState.BONUS_WHEEL_SPIN && gameState !== GameState.BONUS_ROUND_SELECTION && gameState !== GameState.BONUS_ROUND_SOLVE && gameState !== GameState.EXTRA_SPIN_PROMPT && gameState !== GameState.GAME_CONFIG && gameState !== GameState.SETUP && gameState !== GameState.WELCOME && gameState !== GameState.TOSS_UP) && (
            <div className="flex flex-col xl:flex-row w-full items-center justify-center gap-8">
                <div className="flex-shrink-0 scale-90 md:scale-100">
                    <Wheel 
                        rotation={wheelRotation} 
                        activePlayerIndex={activePlayerIndex}
                        currentRound={currentRound}
                        isBonusWheelMode={false}
                        isMysteryRound={gameConfig.mysteryRound.includes(currentRound)}
                        mysteryRevealed={mysteryRevealed}
                        config={gameConfig}
                        jackpotValue={jackpotValue}
                    />
                </div>

                <div className="flex-1 w-full flex flex-col gap-6 max-w-2xl">
                    <div className="h-24 flex items-center justify-center relative">
                        {message ? (
                            <div className="bg-black/80 backdrop-blur text-white px-8 py-3 rounded-xl text-xl md:text-2xl animate-fade-in border border-white/20 text-center shadow-2xl z-20">
                                {message}
                            </div>
                        ) : (
                            lastSpinResult !== null && lastSpinResult > 0 && !isSpinning && (
                                <div className="flex flex-col items-center animate-bounce z-20">
                                    <span className="text-sm uppercase text-gray-300 tracking-widest">Gedreht:</span>
                                    <div className="text-7xl font-display text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                                        {lastSpinResult}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    <PlayerScoreboard players={players} activePlayerId={activePlayerIndex} />
                </div>
            </div>
        )}
        
        {(gameState === GameState.BONUS_WHEEL_SPIN) && (
             <div className="scale-100 mb-8">
                 <Wheel 
                    rotation={wheelRotation} 
                    activePlayerIndex={activePlayerIndex}
                    currentRound={currentRound}
                    isBonusWheelMode={true}
                    isMysteryRound={false}
                    mysteryRevealed={false}
                    config={gameConfig}
                    jackpotValue={0}
                 />
             </div>
        )}

        <div className="w-full z-40 mb-4">
             <Controls 
                gameState={gameState}
                activePlayerName={activePlayer.name}
                currentMoney={activePlayer.roundScore}
                onSpin={handleSpinWrapper}
                onSolve={handleSolve}
                onGuessConsonant={handleGuessConsonant}
                onStartBuyingVowel={handleStartBuyingVowelWrapper}
                onBuyVowel={handleBuyVowel}
                onStartSolving={() => setGameState(GameState.SOLVING)}
                onCancelAction={() => setGameState(GameState.SPIN_OR_SOLVE)}
                guessedLetters={guessedLetters}
                spinDisabled={isSpinning}
                bonusRoundSelection={bonusRoundSelection}
                onBonusSelect={handleBonusSelect}
                onBonusSubmit={handleBonusSubmit}
                onExtraSpinDecision={handleExtraSpinDecision}
                onConfigStart={handleConfigStart}
                onMysteryDecision={handleMysteryDecision}
                onRiskDecision={handleRiskDecision}
                onExpressDecision={handleExpressDecision}
                onTossUpBuzz={handleTossUpBuzz}
                gameConfig={gameConfig}
                jackpotValue={jackpotValue}
                focusedIndex={focusedIndex}
                isExpressRun={isExpressRun}
             />
        </div>
      </main>

      {gameState === GameState.WELCOME && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center text-center p-4">
           <h1 className="text-7xl md:text-9xl font-display text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600 mb-8 drop-shadow-[0_0_35px_rgba(234,179,8,0.6)]">
               GLÜCKSRAD
           </h1>
           <button 
             onClick={enterConfig}
             className="bg-green-600 hover:bg-green-500 text-white text-3xl font-bold py-6 px-16 rounded-full shadow-[0_0_20px_rgba(22,163,74,0.6)] transition transform hover:scale-105 active:scale-95"
           >
               START
           </button>
        </div>
      )}

      {gameState === GameState.ROUND_START && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center">
             <div className="text-7xl font-display text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 animate-bounce drop-shadow-xl">
                 {gameConfig.mysteryRound.includes(currentRound) ? 'MYSTERY RUNDE' : `RUNDE ${currentRound}`}
             </div>
         </div>
      )}

      {gameState === GameState.BONUS_ROUND_INTRO && (
         <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center text-center">
             <h2 className="text-5xl text-yellow-400 font-display mb-4">FINALE!</h2>
             <p className="text-2xl text-white mb-8">{activePlayer.name} spielt um den Hauptpreis!</p>
             <button onClick={startBonusRound} className="bg-purple-600 hover:bg-purple-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-xl">
                 RÄTSEL STARTEN
             </button>
         </div>
      )}

      {gameState === GameState.GAME_OVER && (
          <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-5xl text-white mb-8 font-display">ERGEBNIS</h2>
            <div className="flex flex-col gap-4 w-full max-w-md mb-12">
                {players.sort((a, b) => b.totalScore - a.totalScore).map((p, i) => (
                    <div key={i} className={`flex justify-between items-center p-4 rounded-lg border ${i === 0 ? 'bg-yellow-900/50 border-yellow-500' : 'bg-gray-600 border-gray-500'}`}>
                        <span className={`text-xl font-bold ${i === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                            {p.avatar} {i+1}. {p.name}
                        </span>
                        <span className="text-2xl text-white font-display">{p.totalScore} DM</span>
                    </div>
                ))}
            </div>
            
            <div className="flex gap-4">
                <button onClick={() => setGameState(GameState.WELCOME)} className="bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg">
                    NEUES SPIEL
                </button>
            </div>
          </div>
      )}
    </div>
  );
}

export default App;
