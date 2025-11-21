
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Wheel, { SEGMENTS, BONUS_SEGMENTS } from './components/Wheel';
import PuzzleBoard from './components/PuzzleBoard';
import Controls from './components/Controls';
import PlayerScoreboard from './components/PlayerScoreboard';
import { GameState, Player, Puzzle, VOWELS, VOWEL_COST, SegmentType, GameConfig } from './types';
import { geminiService } from './services/geminiService';
import { soundService } from './services/soundService';

const INITIAL_PLAYERS: Player[] = [
  { id: 0, name: 'Spieler 1', roundScore: 0, totalScore: 0, hasExtraSpin: false, color: 'red', roundsWon: 0, avatar: '', inventory: [] },
  { id: 1, name: 'Spieler 2', roundScore: 0, totalScore: 0, hasExtraSpin: false, color: 'green', roundsWon: 0, avatar: '', inventory: [] },
  { id: 2, name: 'Spieler 3', roundScore: 0, totalScore: 0, hasExtraSpin: false, color: 'blue', roundsWon: 0, avatar: '', inventory: [] },
];

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
      mysteryRound: 0, 
      enableTossUp: false, 
      enableJackpot: false, 
      enableGiftTags: false, 
      enableFreePlay: false,
      enableTTS: false,
      enableAvatars: false,
      categoryTheme: 'ALL',
      riskMode: 0
  });
  
  const [mysteryRevealed, setMysteryRevealed] = useState(false);
  
  // Feature Specific States
  const [jackpotValue, setJackpotValue] = useState(5000);
  const [isFreePlayTurn, setIsFreePlayTurn] = useState(false);
  const [isRiskTurn, setIsRiskTurn] = useState(false);
  const [tossUpInterval, setTossUpInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Bonus Round Vars
  const [bonusRoundSelection, setBonusRoundSelection] = useState<string[]>([]);
  const [bonusPrize, setBonusPrize] = useState<number>(0);

  const activePlayer = players[activePlayerIndex];

  const enterConfig = () => {
      setGameState(GameState.GAME_CONFIG);
  };

  const handleConfigStart = (config: GameConfig, p1Av: string, p2Av: string, p3Av: string) => {
      setGameConfig(config);
      
      // Set avatars
      if (config.enableAvatars) {
          setPlayers(prev => [
              {...prev[0], avatar: p1Av},
              {...prev[1], avatar: p2Av},
              {...prev[2], avatar: p3Av},
          ]);
      }

      startGame(config);
  };

  const startGame = (config: GameConfig) => {
    // Reset essential stats but keep avatars if set
    setPlayers(prev => prev.map(p => ({...p, roundScore: 0, totalScore: 0, hasExtraSpin: false, roundsWon: 0, inventory: []})));
    setCurrentRound(1);
    setActivePlayerIndex(0); 
    setJackpotValue(5000); // Reset Jackpot at start of game
    
    if (config.enableTossUp) {
        startTossUpRound(config);
    } else {
        startRound(1, 0, config);
    }
  };
  
  // Helper to automatically reveal special chars and digits
  const getInitialGuessedLetters = (text: string): Set<string> => {
      const initial = new Set<string>();
      const chars = text.replace(/ /g, '').split('');
      chars.forEach(c => {
          // Reveal hyphens and Digits (0-9)
          if (c === '-' || /[0-9]/.test(c)) {
              initial.add(c);
          }
      });
      return initial;
  }

  // --- TOSS UP LOGIC ---
  const startTossUpRound = async (config: GameConfig) => {
      setGameState(GameState.SETUP);
      setMessage("SCHNELLRATERUNDE! Gleich geht's los...");
      setGuessedLetters(new Set());
      
      try {
          const newPuzzle = (await geminiService.generatePuzzle('easy', [], config.categoryTheme)) as Puzzle;
          setPuzzle(newPuzzle);
          // Auto reveal digits/hyphens immediately
          const initialLetters = getInitialGuessedLetters(newPuzzle.text as string);
          setGuessedLetters(initialLetters);
          
          setGameState(GameState.TOSS_UP);
          
          // Start auto-reveal
          const allLetters = newPuzzle.text.replace(/[^A-ZÄÖÜß]/g, '').split('');
          const uniqueLetters = Array.from(new Set(allLetters));
          
          let revealStep = 0;
          const interval = setInterval(() => {
              if (revealStep >= uniqueLetters.length) {
                  clearInterval(interval);
                  return;
              }
              
              // Reveal a random unrevealed letter
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

  // --- MAIN ROUND LOGIC ---
  const startRound = async (roundNum: number, startPlayerIndex: number, config: GameConfig, starterCapital: number = 0) => {
    setGameState(GameState.SETUP);
    
    const isMystery = roundNum === config.mysteryRound;
    setMessage(isMystery ? `MYSTERY RUNDE ${roundNum}!` : `Runde ${roundNum} wird generiert...`);
    
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
    
    try {
      // If Round 4 exists, make it Hard too
      const difficulty: 'easy' | 'medium' | 'hard' = roundNum >= 3 ? 'hard' : (roundNum === 2 ? 'medium' : 'easy');
      const newPuzzle = (await geminiService.generatePuzzle(difficulty, usedCategories, config.categoryTheme)) as Puzzle;
      setPuzzle(newPuzzle);
      
      // Auto reveal digits/hyphens
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
    setActivePlayerIndex((prev) => (prev + 1) % 3);
    setIsFreePlayTurn(false);
    setIsRiskTurn(false);
    setGameState(GameState.SPIN_OR_SOLVE);
    setMessage('');
  }, [gameState]);

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
          // Safe option
          const val = 1000 * multiplier;
          setLastSpinResult(val);
          setMessage(`Sicher gespielt: 1.000er Wert.`);
          setGameState(GameState.GUESSING_CONSONANT);
      } else {
          // Risk option
          setMysteryRevealed(true);
          // 50/50
          const isGood = Math.random() > 0.5;
          if (isGood) {
             const val = 10000 * multiplier;
             setLastSpinResult(val);
             soundService.playCorrect();
             setMessage(`GLÜCKWUNSCH! 10.000er WERT!`);
             setTimeout(() => setGameState(GameState.GUESSING_CONSONANT), 1500);
          } else {
             soundService.playBankrupt();
             setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                return copy;
             });
             if (players[activePlayerIndex].hasExtraSpin) {
                 setGameState(GameState.EXTRA_SPIN_PROMPT);
             } else {
                 setMessage('BANKROTT! Risiko verloren.');
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
          // Play safe for 500
          setLastSpinResult(500 * multiplier);
          setMessage('Sicher gespielt für 500.');
          setGameState(GameState.GUESSING_CONSONANT);
      }
  };

  const hasUnrevealedConsonants = useCallback(() => {
    if (!puzzle) return true;
    const puzzleChars = new Set<string>(puzzle.text.replace(/[^A-ZÄÖÜß]/g, '').split(''));
    for (let char of puzzleChars) {
        if (!VOWELS.includes(char) && !guessedLetters.has(char)) {
            return true;
        }
    }
    return false;
  }, [puzzle, guessedLetters]);

  const hasUnrevealedVowels = useCallback(() => {
    if (!puzzle) return true;
    const puzzleChars = new Set<string>(puzzle.text.replace(/[^A-ZÄÖÜß]/g, '').split(''));
    for (let char of puzzleChars) {
        if (VOWELS.includes(char) && !guessedLetters.has(char)) {
            return true;
        }
    }
    return false;
  }, [puzzle, guessedLetters]);

  const handleSpinWrapper = () => {
    if (gameState === GameState.BONUS_WHEEL_SPIN) {
        handleBonusWheelSpin();
        return;
    }
    // Free Play allows vowels without buying, but standard spin needs consonants usually
    if (!hasUnrevealedConsonants() && !isFreePlayTurn) {
        soundService.playWarning();
        setMessage('Keine Konsonanten mehr! Bitte lösen.');
        return;
    }
    handleSpin();
  };

  const handleStartBuyingVowelWrapper = () => {
    if (!hasUnrevealedVowels()) {
        soundService.playWarning();
        setMessage('Keine Vokale mehr!');
        return;
    }
    
    // If Free Play, skip check
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
      
      const spinAmount = 1080 + Math.floor(Math.random() * 720);
      const newRotation = wheelRotation + spinAmount;
      setWheelRotation(newRotation);
      
      setTimeout(() => {
          setIsSpinning(false);
          // Prize is determined!
          const prizes = [10000, 20000, 30000, 40000, 50000, 75000, 100000, 1000000]; 
          const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
          setBonusPrize(wonPrize);
          
          setMessage('Preis ermittelt!');
          setTimeout(() => {
              setGameState(GameState.BONUS_ROUND_SELECTION);
          }, 1500);
      }, 4000);
  };

  const calculateSpinResult = (finalRotation: number) => {
    // Stopper Positions
    const stopperAngles = [0, 120, 240];
    const currentStopperAngle = stopperAngles[activePlayerIndex];

    const rotationMod = finalRotation % 360;
    const hitAngle = (currentStopperAngle - rotationMod + 360) % 360;
    
    // Determine which segment list we are using for calculation
    let currentSegments = [...SEGMENTS];
    
    // Apply Config Overrides for Logical Calculation
    if (gameConfig.enableJackpot) {
         currentSegments[1] = { text: 'JACKPOT', value: jackpotValue, type: SegmentType.JACKPOT, color: '#B91C1C', textColor: '#fff' };
    }
    if (gameConfig.enableFreePlay) {
         currentSegments[14] = { text: 'FREE', value: 0, type: SegmentType.FREE_PLAY, color: '#4C1D95', textColor: '#fff' };
    }
    if (gameConfig.enableGiftTags) {
         currentSegments[23] = { text: 'GESCHENK', value: 1000, type: SegmentType.GIFT, color: '#EC4899', textColor: '#fff' };
    }

    // Risk Mode Override
    if (gameConfig.riskMode === 4 || gameConfig.riskMode === currentRound) {
         currentSegments[4] = { text: 'RISIKO', value: 0, type: SegmentType.RISK, color: '#000000', textColor: '#F97316' };
    }

    if (currentRound === gameConfig.mysteryRound) {
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
    
    // Apply Multiplier
    const multiplier = Math.pow(2, currentRound - 1);
    let calculatedValue = segment.value * multiplier;
    
    // Update Jackpot if it's a Value spin (and not bankrupt/lose turn)
    // Only updates if enabled
    if (gameConfig.enableJackpot && segment.type === SegmentType.VALUE && calculatedValue > 0) {
        setJackpotValue(prev => prev + calculatedValue);
    }
    
    // Special Case Handling
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
                copy[activePlayerIndex].inventory = []; // Lose inventory on Bankrupt? Usually yes
                return copy;
            });
            
            if (players[activePlayerIndex].hasExtraSpin) {
                 setGameState(GameState.EXTRA_SPIN_PROMPT);
            } else {
                 setMessage('BANKROTT!');
                 setTimeout(nextTurn, 2000);
            }
        } else if (segment.type === SegmentType.LOSE_TURN) {
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
             setMessage('EXTRA DREH GEWONNEN! NOCHMAL DREHEN!');
             setGameState(GameState.SPIN_OR_SOLVE);
        } else if (segment.type === SegmentType.FREE_PLAY) {
             setMessage('FREISPIEL! Vokal oder Konsonant ohne Risiko.');
             setIsFreePlayTurn(true);
             setGameState(GameState.GUESSING_CONSONANT); // Or Vowel, but standard UI path start
        } else if (segment.type === SegmentType.JACKPOT) {
             setMessage(`JACKPOT CHANCE! (${jackpotValue} DM)`);
             // Treated as normal value guess, but marks possible win if solved later
             setGameState(GameState.GUESSING_CONSONANT);
        } else if (segment.type === SegmentType.GIFT) {
             // Explicit items list as requested
             const gifts = ['AUTO', 'REISE', 'HAUS', 'MOTORRAD', 'ROLLER', 'BIKE', 'E-BIKE', 'KREUZFAHRT'];
             const wonGift = gifts[Math.floor(Math.random() * gifts.length)];
             setMessage(`GESCHENK AUFGEDECKT: ${wonGift}!`);
             setPlayers(prev => {
                 const copy = [...prev];
                 copy[activePlayerIndex].inventory.push(wonGift);
                 return copy;
             });
             setGameState(GameState.GUESSING_CONSONANT);
        } else {
             // Standard Value
             setGameState(GameState.GUESSING_CONSONANT);
        }
    }, 500);
  };

  const handleGuessConsonant = (char: string) => {
    if (!puzzle) return;
    const count = puzzle.text.split(char).length - 1;
    setGuessedLetters(prev => new Set(prev).add(char));

    if (count > 0) {
        soundService.playReveal();
        
        if (isRiskTurn) {
            // RISK MODE LOGIC: Double or Nothing
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore *= 2; // Double the score
                return copy;
            });
            setMessage(`RISIKO GEWONNEN! ${count}x ${char}. Score verdoppelt!`);
            setIsRiskTurn(false);
        } else {
            // STANDARD LOGIC
            let value = (lastSpinResult || 0);
            const totalAdd = value * count;
            
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore += totalAdd;
                return copy;
            });
            setMessage(`${count}x ${char}! (+${totalAdd} DM)`);
        }
        
        setRevealingLetters(new Set([char]));
        setTimeout(() => setRevealingLetters(new Set()), 1000);
        
        // Free Play allows continued turn
        setGameState(GameState.SPIN_OR_SOLVE);
    } else {
        soundService.playWrong();
        
        if (isRiskTurn) {
            // RISK LOST: All Money Gone
            setPlayers(prev => {
                const copy = [...prev];
                copy[activePlayerIndex].roundScore = 0;
                return copy;
            });
            setMessage(`RISIKO VERLOREN! Kein ${char}. Alles weg.`);
            setIsRiskTurn(false);
            setTimeout(nextTurn, 2000);
        } else if (isFreePlayTurn) {
            setMessage(`Kein ${char}. (Freispiel - Kein Verlust)`);
            setTimeout(() => setGameState(GameState.SPIN_OR_SOLVE), 1500); // Keep turn
        } else if (players[activePlayerIndex].hasExtraSpin) {
             setMessage(`Leider kein ${char}.`);
             setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
        } else {
             setMessage(`Leider kein ${char}.`);
             setTimeout(nextTurn, 1500);
        }
    }
  };

  const handleBuyVowel = (char: string) => {
     // Free play vowel is free
     if (!isFreePlayTurn) {
        setPlayers(prev => {
            const copy = [...prev];
            copy[activePlayerIndex].roundScore -= VOWEL_COST;
            return copy;
        });
     }
     
     setGuessedLetters(prev => new Set(prev).add(char));
     const count = puzzle.text.split(char).length - 1;
     
     if (count > 0) {
         soundService.playReveal();
         setMessage(isFreePlayTurn ? `${count}x ${char} (Gratis).` : `${count}x ${char} gekauft.`);
         setRevealingLetters(new Set([char]));
         setTimeout(() => setRevealingLetters(new Set()), 1000);
         setGameState(GameState.SPIN_OR_SOLVE);
     } else {
         soundService.playWrong();
         if (isFreePlayTurn) {
             setMessage(`Kein ${char}. (Freispiel - Kein Verlust)`);
             setTimeout(() => setGameState(GameState.SPIN_OR_SOLVE), 1500);
         } else if (players[activePlayerIndex].hasExtraSpin) {
            setMessage(`Kein ${char}.`);
            setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
         } else {
            setMessage(`Kein ${char}.`);
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
        
        if (gameState === GameState.BONUS_ROUND_SOLVE) {
             handleBonusWin();
        } else if (gameState === GameState.TOSS_UP) { // If in toss up
             endTossUp(activePlayerIndex);
        } else {
             endRound(activePlayerIndex);
        }
    } else {
        soundService.playWrong();
        if (gameState === GameState.TOSS_UP) {
            setMessage("Falsch!");
            // Penalty: Next player gets control to buzz?
            // In our simple TossUp, we just let anyone buzz again.
            // But we need to exit Solving state
            setGameState(GameState.TOSS_UP);
            // Restart Interval?
            if (tossUpInterval) {
               // We should technically restart interval here if we stopped it
               // But for simplicity, let's just let them buzz again without more reveals for a moment
            }
        } else if (players[activePlayerIndex].hasExtraSpin && gameState !== GameState.BONUS_ROUND_SOLVE) {
            setMessage('Falsch.');
            setTimeout(() => setGameState(GameState.EXTRA_SPIN_PROMPT), 1500);
        } else {
            setMessage('Das war falsch.');
            if (gameState === GameState.BONUS_ROUND_SOLVE) {
                handleGameOver();
            } else {
                setTimeout(nextTurn, 2000);
            }
        }
    }
  };

  const endTossUp = (winnerIndex: number) => {
      setMessage(`SCHNELLRUNDE GEWONNEN! (+1000 DM Startkapital)`);
      // The prize is 1000 DM Startkapital for Round 1.
      // We do NOT bank it immediately into totalScore, because it is 'Startkapital' (at risk in Round 1).
      
      const text = puzzle ? puzzle.text : '';
      const allChars = new Set<string>(text.replace(/ /g, '').split(''));
      setGuessedLetters(allChars);
      
      setTimeout(() => {
          // Start Round 1, winner starts, with 1000 Startkapital for the round
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
        copy[winnerIndex].inventory = []; // Clear inventory (cashed out or prizes awarded)
        return copy;
    });
    
    setMessage(`Runde vorbei! ${players[winnerIndex].name} gewinnt ${winAmount} DM.`);
    const text = puzzle ? puzzle.text : '';
    const allChars = new Set<string>(text.replace(/ /g, '').split(''));
    setGuessedLetters(allChars);
    
    const totalRounds = gameConfig.mysteryRound === 4 ? 4 : 3;

    setTimeout(() => {
        if (currentRound < totalRounds) {
            const nextRound = currentRound + 1;
            setCurrentRound(nextRound);
            startRound(nextRound, (nextRound - 1) % 3, gameConfig);
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
          
          // Auto reveal digits/hyphens
          const initialLetters = getInitialGuessedLetters(newPuzzle.text as string);
          setGuessedLetters(initialLetters);

          setGameState(GameState.BONUS_WHEEL_SPIN);
      } catch (e: any) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(errorMessage);
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
      setMessage(`BONUS GEWONNEN! +${bonusPrize} DM`);
      setTimeout(handleGameOver, 4000);
  };

  const handleGameOver = () => {
      setGameState(GameState.GAME_OVER);
      soundService.playSolve();
      if (puzzle) {
           setGuessedLetters(new Set(puzzle.text.replace(/ /g, '').split('')));
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-10 bg-gradient-to-b from-blue-900 via-purple-900 to-black text-white overflow-hidden font-sans selection:bg-yellow-500 selection:text-black">
      
      <header className="w-full p-4 bg-black/50 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-50 sticky top-0 shadow-lg">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-600 border-2 border-white shadow-inner animate-pulse"></div>
             <h1 className="text-2xl md:text-3xl font-display tracking-wider text-white drop-shadow-md">GLÜCKSRAD</h1>
        </div>
        <div className="text-xl font-bold text-yellow-400 flex gap-4">
            <span>
                {gameState === GameState.TOSS_UP ? 'SCHNELLRUNDE' : (
                    currentRound > (gameConfig.mysteryRound === 4 ? 4 : 3) ? 'BONUS' : `${currentRound} / ${gameConfig.mysteryRound === 4 ? 4 : 3}`
                )}
            </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl px-2 md:px-4 flex flex-col items-center mt-4 gap-4 md:gap-8">
        
        <div className="w-full transform transition-all">
            <PuzzleBoard 
                puzzle={puzzle} 
                guessedLetters={guessedLetters} 
                revealingLetters={revealingLetters}
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
                        isMysteryRound={currentRound === gameConfig.mysteryRound && gameConfig.mysteryRound !== 0}
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
        
        {/* Bonus Wheel Mode Display */}
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
                onTossUpBuzz={handleTossUpBuzz}
                gameConfig={gameConfig}
                jackpotValue={jackpotValue}
             />
        </div>
      </main>

      {/* Overlays */}
      
      {gameState === GameState.WELCOME && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center text-center p-4">
           <h1 className="text-7xl md:text-9xl font-display text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600 mb-8 drop-shadow-[0_0_35px_rgba(234,179,8,0.6)]">
               GLÜCKSRAD
           </h1>
           <p className="text-white text-xl mb-12 max-w-md leading-relaxed">
               Willkommen! 3 Spieler. Der Spieler mit den meisten gewonnenen Runden spielt im Finale um den Jackpot.
           </p>
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
                 {currentRound === gameConfig.mysteryRound ? 'MYSTERY RUNDE' : `RUNDE ${currentRound}`}
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

            <button 
                onClick={() => {
                    setGameState(GameState.WELCOME);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg"
            >
                NEUES SPIEL
            </button>
          </div>
      )}
    </div>
  );
}

export default App;
