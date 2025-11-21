
import React, { useState } from 'react';
import { ALPHABET, CONSONANTS, GameState, VOWELS, VOWEL_COST, GameConfig } from '../types';

interface ControlsProps {
  gameState: GameState;
  activePlayerName: string;
  currentMoney: number;
  onSpin: () => void;
  onSolve: (guess: string) => void;
  onGuessConsonant: (char: string) => void;
  onBuyVowel: (char: string) => void;
  onStartBuyingVowel: () => void;
  onStartSolving: () => void;
  onCancelAction: () => void;
  guessedLetters: Set<string>;
  spinDisabled: boolean;
  bonusRoundSelection: string[];
  onBonusSelect: (char: string) => void;
  onBonusSubmit: () => void;
  onExtraSpinDecision: (use: boolean) => void;
  onConfigStart: (config: GameConfig, p1Avatar: string, p2Avatar: string, p3Avatar: string) => void;
  onMysteryDecision: (reveal: boolean) => void;
  onTossUpBuzz: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  gameState,
  activePlayerName,
  currentMoney,
  onSpin,
  onSolve,
  onGuessConsonant,
  onBuyVowel,
  onStartBuyingVowel,
  onStartSolving,
  onCancelAction,
  guessedLetters,
  spinDisabled,
  bonusRoundSelection,
  onBonusSelect,
  onBonusSubmit,
  onExtraSpinDecision,
  onConfigStart,
  onMysteryDecision,
  onTossUpBuzz
}) => {
  const [solveInput, setSolveInput] = useState('');
  
  // Local Config State
  const [config, setConfig] = useState<GameConfig>({
      mysteryRound: 0,
      enableTossUp: false,
      enableJackpot: false,
      enableGiftTags: false,
      enableFreePlay: false,
      enableTTS: false,
      enableAvatars: false,
      categoryTheme: 'ALL'
  });
  
  // Avatar Selection
  const AVATARS = ['😀', '😎', '🤠', '👽', '🤖', '🦊', '🦄', '🐯', '⚽', '👑', '🎩', '🚀'];
  const [p1Avatar, setP1Avatar] = useState('😀');
  const [p2Avatar, setP2Avatar] = useState('😎');
  const [p3Avatar, setP3Avatar] = useState('🤠');

  const canBuyVowel = currentMoney >= VOWEL_COST;

  // Game Config Screen
  if (gameState === GameState.GAME_CONFIG) {
      return (
          <div className="w-full max-w-6xl mx-auto mt-2 p-6 bg-blue-900/95 rounded-xl backdrop-blur-md border-2 border-blue-500 text-center shadow-2xl animate-fade-in h-[80vh] overflow-y-auto">
              <h1 className="text-4xl font-display text-white mb-4 drop-shadow-lg">SPIEL KONFIGURATION</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  
                  {/* Left Column: Core Modes */}
                  <div className="bg-black/30 p-4 rounded-lg">
                      <h3 className="text-xl text-yellow-400 font-bold mb-4 border-b border-gray-600 pb-2">SPIELMODUS</h3>
                      
                      <div className="mb-4">
                          <label className="block text-white font-bold mb-2">Mystery Runde:</label>
                          <div className="flex flex-wrap gap-2">
                              <button onClick={() => setConfig({...config, mysteryRound: 0})} className={`px-3 py-1 rounded ${config.mysteryRound === 0 ? 'bg-green-600' : 'bg-gray-600'}`}>Aus</button>
                              <button onClick={() => setConfig({...config, mysteryRound: 1})} className={`px-3 py-1 rounded ${config.mysteryRound === 1 ? 'bg-purple-600' : 'bg-gray-600'}`}>Runde 1</button>
                              <button onClick={() => setConfig({...config, mysteryRound: 2})} className={`px-3 py-1 rounded ${config.mysteryRound === 2 ? 'bg-purple-600' : 'bg-gray-600'}`}>Runde 2</button>
                              <button onClick={() => setConfig({...config, mysteryRound: 3})} className={`px-3 py-1 rounded ${config.mysteryRound === 3 ? 'bg-purple-600' : 'bg-gray-600'}`}>Runde 3</button>
                              <button onClick={() => setConfig({...config, mysteryRound: 4})} className={`px-3 py-1 rounded ${config.mysteryRound === 4 ? 'bg-purple-600 border border-yellow-400' : 'bg-gray-600'}`}>Extra (4.)</button>
                          </div>
                      </div>

                      <div className="mb-4">
                          <label className="block text-white font-bold mb-2">Kategorie Thema:</label>
                          <select 
                            value={config.categoryTheme} 
                            onChange={(e) => setConfig({...config, categoryTheme: e.target.value})}
                            className="bg-gray-700 text-white p-2 rounded w-full"
                          >
                              <option value="ALL">Alles (Gemischt)</option>
                              <option value="80s">80er Jahre Spezial</option>
                              <option value="KIDS">Kinder Edition</option>
                              <option value="GEO">Geografie & Reisen</option>
                              <option value="MOVIES">Kino & Stars</option>
                          </select>
                      </div>
                  </div>

                  {/* Right Column: Extras */}
                  <div className="bg-black/30 p-4 rounded-lg">
                      <h3 className="text-xl text-yellow-400 font-bold mb-4 border-b border-gray-600 pb-2">EXTRAS & OPTIONEN</h3>
                      
                      <div className="grid grid-cols-1 gap-3">
                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input type="checkbox" checked={config.enableTossUp} onChange={(e) => setConfig({...config, enableTossUp: e.target.checked})} className="w-6 h-6 accent-green-500"/>
                              <div>
                                  <div className="font-bold text-white">Schnellraterunde (Toss-Up)</div>
                                  <div className="text-xs text-gray-300">Startet vor Runde 1. Wer buzzert, gewinnt 1000 DM.</div>
                              </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input type="checkbox" checked={config.enableJackpot} onChange={(e) => setConfig({...config, enableJackpot: e.target.checked})} className="w-6 h-6 accent-green-500"/>
                              <div>
                                  <div className="font-bold text-white">Progressiver Jackpot</div>
                                  <div className="text-xs text-gray-300">Ein Jackpot-Feld auf dem Rad, wächst jede Runde.</div>
                              </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input type="checkbox" checked={config.enableGiftTags} onChange={(e) => setConfig({...config, enableGiftTags: e.target.checked})} className="w-6 h-6 accent-green-500"/>
                              <div>
                                  <div className="font-bold text-white">Sachpreise (Geschenke)</div>
                                  <div className="text-xs text-gray-300">Sammelbare 'Geschenk'-Felder auf dem Rad.</div>
                              </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input type="checkbox" checked={config.enableFreePlay} onChange={(e) => setConfig({...config, enableFreePlay: e.target.checked})} className="w-6 h-6 accent-green-500"/>
                              <div>
                                  <div className="font-bold text-white">Freispiel (Free Play)</div>
                                  <div className="text-xs text-gray-300">Raten ohne Risiko (auch Vokale kostenlos).</div>
                              </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input type="checkbox" checked={config.enableTTS} onChange={(e) => setConfig({...config, enableTTS: e.target.checked})} className="w-6 h-6 accent-green-500"/>
                              <div>
                                  <div className="font-bold text-white">Sprachausgabe (TTS)</div>
                                  <div className="text-xs text-gray-300">Liest das gelöste Rätsel vor.</div>
                              </div>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded">
                              <input type="checkbox" checked={config.enableAvatars} onChange={(e) => setConfig({...config, enableAvatars: e.target.checked})} className="w-6 h-6 accent-green-500"/>
                              <div>
                                  <div className="font-bold text-white">Spieler Avatare</div>
                                  <div className="text-xs text-gray-300">Emojis wählen.</div>
                              </div>
                          </label>
                      </div>
                  </div>
              </div>

              {config.enableAvatars && (
                  <div className="bg-black/30 p-4 rounded-lg mt-4">
                       <h3 className="text-xl text-yellow-400 font-bold mb-2">AVATAR WAHL</h3>
                       <div className="flex justify-center gap-8">
                           <div className="text-center">
                               <div className="text-white text-sm mb-1">Spieler 1</div>
                               <div className="grid grid-cols-4 gap-1">
                                   {AVATARS.map(a => <button key={a} onClick={() => setP1Avatar(a)} className={`text-xl p-1 rounded ${p1Avatar === a ? 'bg-white/20' : ''}`}>{a}</button>)}
                               </div>
                           </div>
                           <div className="text-center">
                               <div className="text-white text-sm mb-1">Spieler 2</div>
                               <div className="grid grid-cols-4 gap-1">
                                   {AVATARS.map(a => <button key={a} onClick={() => setP2Avatar(a)} className={`text-xl p-1 rounded ${p2Avatar === a ? 'bg-white/20' : ''}`}>{a}</button>)}
                               </div>
                           </div>
                           <div className="text-center">
                               <div className="text-white text-sm mb-1">Spieler 3</div>
                               <div className="grid grid-cols-4 gap-1">
                                   {AVATARS.map(a => <button key={a} onClick={() => setP3Avatar(a)} className={`text-xl p-1 rounded ${p3Avatar === a ? 'bg-white/20' : ''}`}>{a}</button>)}
                               </div>
                           </div>
                       </div>
                  </div>
              )}

              <button onClick={() => onConfigStart(config, p1Avatar, p2Avatar, p3Avatar)} className="mt-8 bg-green-600 hover:bg-green-500 text-white text-2xl font-bold py-4 px-16 rounded-full shadow-[0_0_20px_rgba(22,163,74,0.6)] transition transform hover:scale-105">
                  SPIEL STARTEN
              </button>
          </div>
      )
  }
  
  // Toss Up UI
  if (gameState === GameState.TOSS_UP) {
      return (
          <div className="w-full max-w-3xl mx-auto mt-6 p-6 bg-red-900/90 rounded-xl backdrop-blur-sm border-2 border-red-500 text-center shadow-2xl">
              <h2 className="text-4xl font-display text-white mb-2 animate-pulse">SCHNELLRATERUNDE</h2>
              <p className="text-xl text-yellow-300 mb-8">Drücke den Buzzer, wenn du die Lösung weißt!</p>
              
              <button 
                 onClick={onTossUpBuzz}
                 className="w-48 h-48 rounded-full bg-red-600 border-8 border-red-800 shadow-[0_10px_0_rgb(153,27,27)] active:shadow-none active:translate-y-2 text-white text-3xl font-bold hover:bg-red-500 transition-all mx-auto flex items-center justify-center"
              >
                  BUZZER
              </button>
          </div>
      )
  }

  // Extra Spin Prompt
  if (gameState === GameState.EXTRA_SPIN_PROMPT) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-6 p-6 bg-purple-900/90 rounded-xl backdrop-blur-sm border-2 border-purple-500 text-center shadow-2xl animate-fade-in">
           <h2 className="text-3xl font-display text-white mb-2">EXTRA DREH VORHANDEN</h2>
           <p className="text-xl text-yellow-300 mb-6">Möchtest du deinen Extra Dreh einsetzen, um an der Reihe zu bleiben?</p>
           <div className="flex justify-center gap-6">
               <button 
                 onClick={() => onExtraSpinDecision(true)} 
                 className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-10 rounded-lg shadow-[0_4px_0_rgb(22,163,74)] active:shadow-none active:translate-y-1 transition-all text-xl"
               >
                   JA, EINSETZEN
               </button>
               <button 
                 onClick={() => onExtraSpinDecision(false)} 
                 className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-lg shadow-[0_4px_0_rgb(220,38,38)] active:shadow-none active:translate-y-1 transition-all text-xl"
               >
                   NEIN
               </button>
           </div>
        </div>
    );
  }

  // Mystery Decision
  if (gameState === GameState.MYSTERY_DECISION) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-6 p-6 bg-purple-900/90 rounded-xl backdrop-blur-sm border-2 border-purple-500 text-center shadow-2xl animate-fade-in">
           <h2 className="text-4xl font-display text-white mb-2 drop-shadow-lg">MYSTERY FELD!</h2>
           <p className="text-xl text-gray-200 mb-8 max-w-lg mx-auto">
               Du kannst das Feld aufdecken (Chance auf 10.000 DM oder BANKROTT) 
               oder sicher 1.000 DM nehmen.
           </p>
           <div className="flex flex-wrap justify-center gap-6">
               <button 
                 onClick={() => onMysteryDecision(true)} 
                 className="bg-gradient-to-b from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 transition-all text-2xl border-2 border-yellow-400"
               >
                   AUFDECKEN
                   <div className="text-sm font-normal mt-1 text-yellow-200">Risiko!</div>
               </button>
               <button 
                 onClick={() => onMysteryDecision(false)} 
                 className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-6 px-12 rounded-xl shadow-lg active:scale-95 transition-all text-2xl border border-gray-500"
               >
                   1.000 DM NEHMEN
                   <div className="text-sm font-normal mt-1 text-gray-300">Sicher</div>
               </button>
           </div>
        </div>
    );
  }

  // Bonus Wheel Spin
  if (gameState === GameState.BONUS_WHEEL_SPIN) {
      return (
          <div className="w-full max-w-2xl mx-auto mt-6 p-6 bg-black/60 rounded-xl backdrop-blur-md border border-yellow-500 text-center">
              <h2 className="text-3xl font-display text-white mb-4">BONUS PREIS ERMITTELN</h2>
              <p className="text-xl text-gray-200 mb-6">Drehe das Bonusrad, um deinen möglichen Gewinn zu bestimmen!</p>
              <button
                onClick={onSpin}
                disabled={spinDisabled}
                className="bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 text-black font-bold py-4 px-16 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.6)] text-2xl animate-pulse"
              >
                BONUS RAD DREHEN
              </button>
          </div>
      )
  }

  // Bonus Round Controls
  if (gameState === GameState.BONUS_ROUND_SELECTION) {
      const vowelCount = bonusRoundSelection.filter(c => VOWELS.includes(c)).length;
      const consCount = bonusRoundSelection.filter(c => !VOWELS.includes(c)).length;
      const neededCons = 5;
      const neededVowels = 1;
      const totalNeeded = neededCons + neededVowels;

      return (
          <div className="w-full max-w-4xl mx-auto mt-6 p-6 bg-purple-900/80 rounded-xl backdrop-blur-sm border-2 border-purple-500 text-center">
              <h2 className="text-3xl font-display text-white mb-4">BONUS RUNDE</h2>
              <p className="text-xl text-yellow-300 mb-2">Wähle deine Buchstaben selbst!</p>
              <p className="text-md text-gray-200 mb-4">({neededCons} Konsonanten + {neededVowels} Vokal)</p>
              
              <div className="flex justify-center gap-2 mb-6">
                  {bonusRoundSelection.map((char, i) => (
                      <div key={i} className="w-12 h-12 bg-white text-black font-bold text-2xl flex items-center justify-center rounded">
                          {char}
                      </div>
                  ))}
                  {[...Array(totalNeeded - bonusRoundSelection.length)].map((_, i) => (
                      <div key={i} className="w-12 h-12 bg-white/20 border-2 border-white/40 rounded"></div>
                  ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {ALPHABET.map(char => {
                      const isSelected = bonusRoundSelection.includes(char);
                      const isVowel = VOWELS.includes(char);
                      const disabled = isSelected || 
                                       (isVowel && vowelCount >= neededVowels) || 
                                       (!isVowel && consCount >= neededCons);
                      
                      return (
                        <button
                            key={char}
                            onClick={() => onBonusSelect(char)}
                            disabled={disabled && !isSelected} 
                            className={`w-10 h-10 font-bold rounded ${isSelected ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-900 hover:bg-white'} disabled:opacity-30 transition-all`}
                        >
                            {char}
                        </button>
                      );
                  })}
              </div>
              
              {bonusRoundSelection.length === totalNeeded && (
                  <button onClick={onBonusSubmit} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-12 rounded-full text-xl animate-pulse shadow-lg">
                      BUCHSTABEN NEHMEN
                  </button>
              )}
          </div>
      )
  }

  if (gameState === GameState.SETUP || gameState === GameState.ROUND_END || gameState === GameState.GAME_OVER || gameState === GameState.BONUS_ROUND_INTRO || gameState === GameState.WELCOME) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 p-4 bg-black/60 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl relative">
      
      {/* Active Player Indicator */}
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-8 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg border-2 border-white">
          {activePlayerName}
      </div>

      <div className="mt-6 text-center">
            <p className="text-gray-200 text-lg mb-4 font-medium">
                {gameState === GameState.SPIN_OR_SOLVE && "Was möchtest du tun?"}
                {gameState === GameState.SPINNING && "Viel Glück!"}
                {gameState === GameState.GUESSING_CONSONANT && "Wähle einen Konsonanten"}
                {gameState === GameState.BUYING_VOWEL && `Wähle einen Vokal (${VOWEL_COST} DM)`}
                {gameState === GameState.SOLVING && "Gib die Lösung ein"}
                {gameState === GameState.BONUS_ROUND_SOLVE && "LÖSE DAS RÄTSEL!"}
            </p>
      </div>

      {/* Main Action Buttons */}
      {(gameState === GameState.SPIN_OR_SOLVE) && (
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onSpin}
            disabled={spinDisabled}
            className="bg-gradient-to-b from-green-500 to-green-800 hover:from-green-400 hover:to-green-700 text-white font-bold py-4 px-10 rounded-lg shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all text-xl uppercase tracking-wide"
          >
            Drehen
          </button>
          <button
            onClick={onStartBuyingVowel}
            disabled={!canBuyVowel}
            className={`bg-gradient-to-b from-blue-500 to-blue-800 hover:from-blue-400 hover:to-blue-700 text-white font-bold py-4 px-10 rounded-lg shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1 transition-all text-xl uppercase tracking-wide ${!canBuyVowel ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
          >
            Vokal kaufen
          </button>
          <button
            onClick={onStartSolving}
            className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold py-4 px-10 rounded-lg shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all text-xl uppercase tracking-wide"
          >
            Lösen
          </button>
        </div>
      )}

      {/* Consonant Keyboard */}
      {gameState === GameState.GUESSING_CONSONANT && (
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
          {CONSONANTS.map(char => (
            <button
              key={char}
              onClick={() => onGuessConsonant(char)}
              disabled={guessedLetters.has(char)}
              className="w-10 h-12 md:w-12 md:h-14 bg-gradient-to-b from-white to-gray-200 hover:from-blue-100 hover:to-blue-200 text-blue-900 font-bold text-xl rounded border-b-4 border-gray-400 active:border-b-0 active:mt-1 disabled:opacity-40 disabled:border-none disabled:mt-1 transition-all"
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* Vowel Keyboard */}
      {gameState === GameState.BUYING_VOWEL && (
        <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
            {VOWELS.map(char => (
                <button
                key={char}
                onClick={() => onBuyVowel(char)}
                disabled={guessedLetters.has(char)}
                className="w-12 h-14 bg-gradient-to-b from-pink-100 to-pink-200 hover:from-pink-50 hover:to-pink-100 text-pink-900 font-bold text-xl rounded border-b-4 border-pink-300 active:border-b-0 active:mt-1 disabled:opacity-40 disabled:border-none disabled:mt-1 transition-all"
                >
                {char}
                </button>
            ))}
            </div>
            <button onClick={onCancelAction} className="text-red-400 hover:text-red-300 uppercase font-bold tracking-wider text-sm">Abbrechen</button>
        </div>
      )}

      {/* Solving Input */}
      {(gameState === GameState.SOLVING || gameState === GameState.BONUS_ROUND_SOLVE) && (
        <div className="flex flex-col items-center gap-4 w-full">
          <input
            type="text"
            value={solveInput}
            onChange={(e) => setSolveInput(e.target.value.toUpperCase())}
            placeholder="Lösung..."
            className="w-full max-w-2xl px-4 py-4 rounded bg-white text-black text-center font-display text-3xl uppercase tracking-widest border-4 border-yellow-500 focus:outline-none focus:border-yellow-300 shadow-inner"
            autoFocus
          />
          <div className="flex gap-4 w-full justify-center">
            <button
                onClick={() => onSolve(solveInput)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded shadow-lg w-40"
            >
                OK
            </button>
            <button onClick={() => { setSolveInput(''); onCancelAction(); }} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded shadow-lg w-40">
                ZURÜCK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
