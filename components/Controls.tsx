
import React, { useState, useEffect } from 'react';
import { ALPHABET, CONSONANTS, GameState, VOWELS, VOWEL_COST, GameConfig, SegmentType, WheelSegment } from '../types';
import { SEGMENTS } from './Wheel';

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
  onConfigStart: (config: GameConfig, avatars: string[]) => void;
  onMysteryDecision: (reveal: boolean) => void;
  onRiskDecision: (risk: boolean) => void;
  onExpressDecision: (board: boolean) => void;
  onTossUpBuzz: (playerIndex: number) => void;
  gameConfig: GameConfig;
  jackpotValue: number;
  focusedIndex: number; // From Gamepad
  isExpressRun: boolean;
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
  onBonusSelect: onBonusSelect,
  onBonusSubmit,
  onExtraSpinDecision,
  onConfigStart,
  onMysteryDecision,
  onRiskDecision,
  onExpressDecision,
  onTossUpBuzz,
  gameConfig,
  jackpotValue,
  focusedIndex,
  isExpressRun
}) => {
  const [solveInput, setSolveInput] = useState('');
  
  // Local Config State
  const [config, setConfig] = useState<GameConfig>({
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
      extraSpinMode: [1, 2, 3, 4], // Default on
      visualTheme: 'STANDARD',
      wheelColorTheme: 'STANDARD',
      enableGamepad: false,
      enableAudienceMode: false,
      playerCount: 3,
      playerNames: ['Spieler 1', 'Spieler 2', 'Spieler 3'],
      aiPlayers: [false, false, false],
      aiDifficulty: [100, 100, 100],
      enableCustomWheel: false,
      customSegments: [...SEGMENTS],
      host: 'NONE',
      assistant: 'NONE'
  });
  
  // Avatar Selection
  const AVATARS = ['😀', '😎', '🤠', '👽', '🤖', '🦊', '🦄', '🐯', '⚽', '👑', '🎩', '🚀', '🐶', '🐱', '🐭', '🐹', '🐰', '🐻'];
  const [playerAvatars, setPlayerAvatars] = useState<string[]>(['😀', '😎', '🤠', '👽', '🤖', '🦊']);

  const canBuyVowel = currentMoney >= VOWEL_COST;

  // Helper for gamepad visual focus
  const getFocusClass = (index: number) => {
      if (!gameConfig.enableGamepad) return '';
      return focusedIndex === index ? 'ring-4 ring-yellow-400 scale-110 z-10' : '';
  };
  
  const toggleRound = (field: keyof GameConfig, round: number) => {
      const current = config[field] as number[];
      let updated: number[];
      if (current.includes(round)) {
          updated = current.filter(r => r !== round);
      } else {
          updated = [...current, round].sort();
      }
      setConfig({...config, [field]: updated});
  };

  const handlePlayerCountChange = (count: number) => {
      const newNames = [...config.playerNames];
      const newAI = [...config.aiPlayers];
      const newDiff = [...config.aiDifficulty];
      const newAvatars = [...playerAvatars];

      // Resize arrays
      while (newNames.length < count) newNames.push(`Spieler ${newNames.length + 1}`);
      while (newAI.length < count) newAI.push(false);
      while (newDiff.length < count) newDiff.push(100);
      while (newAvatars.length < count) newAvatars.push(AVATARS[newAvatars.length % AVATARS.length]);

      setConfig({
          ...config,
          playerCount: count,
          playerNames: newNames.slice(0, count),
          aiPlayers: newAI.slice(0, count),
          aiDifficulty: newDiff.slice(0, count)
      });
      setPlayerAvatars(newAvatars.slice(0, count));
  };

  const renderRoundToggle = (label: string, field: keyof GameConfig, colorClass: string) => (
      <div className="mb-4">
          <label className="block text-white font-bold mb-2 text-sm md:text-base">{label}</label>
          <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => toggleRound(field, n)} 
                    className={`px-3 py-1 rounded text-sm font-bold transition-colors ${(config[field] as number[]).includes(n) ? colorClass : 'bg-gray-700 text-gray-400'}`}>
                    Runde {n}
                </button>
              ))}
          </div>
      </div>
  );
  
  // Game Config Screen
  if (gameState === GameState.GAME_CONFIG) {
      return (
          <div className="w-full max-w-6xl mx-auto mt-2 p-6 bg-blue-900/95 rounded-xl backdrop-blur-md border-2 border-blue-500 text-center shadow-2xl animate-fade-in h-[80vh] overflow-y-auto">
              <h1 className="text-4xl font-display text-white mb-4 drop-shadow-lg">SPIEL KONFIGURATION</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  
                  {/* Left Column: Core Modes */}
                  <div className="bg-black/30 p-4 rounded-lg">
                      <h3 className="text-xl text-yellow-400 font-bold mb-4 border-b border-gray-600 pb-2">SPIELMODUS</h3>
                      
                      {renderRoundToggle("Mystery Runde:", "mysteryRound", "bg-purple-600 text-white border border-white")}
                      {renderRoundToggle("Risiko Feld (50/50):", "riskMode", "bg-orange-600 text-white border border-white")}
                      {renderRoundToggle("Millionen Keil:", "millionWedgeMode", "bg-green-600 text-white border border-white")}
                      {renderRoundToggle("Express (Eisenbahn):", "expressMode", "bg-gray-300 text-black border border-white")}
                      {renderRoundToggle("Extra Dreh:", "extraSpinMode", "bg-pink-500 text-white border border-white")}

                      <div className="mb-4 mt-6">
                          <div className="flex justify-between items-center mb-2">
                              <label className="block text-white font-bold">Spieler Anzahl:</label>
                              <div className="flex gap-2">
                                  {[1,2,3,4,5,6].map(n => (
                                      <button 
                                        key={n} 
                                        onClick={() => handlePlayerCountChange(n)}
                                        className={`w-8 h-8 rounded font-bold ${config.playerCount === n ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                                      >
                                          {n}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex flex-col gap-4 mt-4">
                              {Array.from({ length: config.playerCount }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-2 bg-white/5 p-3 rounded border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold w-6">{i+1}.</span>
                                        <input 
                                            type="text" 
                                            value={config.playerNames[i]} 
                                            onChange={(e) => {
                                                const newNames = [...config.playerNames];
                                                newNames[i] = e.target.value;
                                                setConfig({...config, playerNames: newNames});
                                            }}
                                            className="bg-black/40 text-white px-2 py-1 rounded border border-gray-600 flex-1"
                                            placeholder={`Spieler ${i+1}`}
                                        />
                                        <label className="flex items-center gap-2 cursor-pointer bg-black/20 px-2 py-1 rounded">
                                            <input type="checkbox" 
                                                checked={config.aiPlayers[i]} 
                                                onChange={(e) => {
                                                    const newAI = [...config.aiPlayers];
                                                    newAI[i] = e.target.checked;
                                                    setConfig({...config, aiPlayers: newAI});
                                                }} 
                                                className="accent-red-500 w-4 h-4"
                                            />
                                            <span className="text-sm font-bold">KI</span>
                                        </label>
                                    </div>

                                    {/* Avatar Select */}
                                    {config.enableAvatars && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {AVATARS.slice(0, 12).map(a => (
                                                <button 
                                                    key={a} 
                                                    onClick={() => {
                                                        const newAvs = [...playerAvatars];
                                                        newAvs[i] = a;
                                                        setPlayerAvatars(newAvs);
                                                    }}
                                                    className={`p-1 rounded text-lg ${playerAvatars[i] === a ? 'bg-white/30' : 'hover:bg-white/10'}`}
                                                >
                                                    {a}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {config.aiPlayers[i] && (
                                        <div className="px-2 pt-1">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Stroh ({config.aiDifficulty[i]})</span>
                                                <span>Einstein</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="200" 
                                                value={config.aiDifficulty[i]} 
                                                onChange={(e) => {
                                                    const newDiff = [...config.aiDifficulty];
                                                    newDiff[i] = parseInt(e.target.value);
                                                    setConfig({...config, aiDifficulty: newDiff});
                                                }}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-blue-900"
                                            />
                                        </div>
                                    )}
                                </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Visuals & Extras */}
                  <div className="bg-black/30 p-4 rounded-lg">
                      <h3 className="text-xl text-yellow-400 font-bold mb-4 border-b border-gray-600 pb-2">EXTRAS & OPTIONEN</h3>
                      
                      <div className="mb-4">
                           <label className="block text-white font-bold mb-2">Design Thema (Skins):</label>
                           <div className="flex flex-wrap gap-2">
                               {['STANDARD', '80S', '90S', '2000S', 'CURVED', 'TV_STUDIO'].map(t => (
                                  <button key={t} onClick={() => setConfig({...config, visualTheme: t as any})} 
                                    className={`px-2 py-1 text-sm rounded flex items-center gap-1 ${config.visualTheme === t ? 'bg-blue-500 border border-white' : 'bg-gray-600'}`}>
                                    {t.replace('_', ' ')}
                                  </button>
                               ))}
                           </div>
                      </div>
                      
                      <div className="mb-4">
                           <label className="block text-white font-bold mb-2">Rad Farben:</label>
                           <div className="flex flex-wrap gap-2">
                               {['STANDARD', 'RAINBOW', 'PASTEL', 'GOLD'].map(t => (
                                  <button key={t} onClick={() => setConfig({...config, wheelColorTheme: t as any})} 
                                    className={`px-2 py-1 text-sm rounded ${config.wheelColorTheme === t ? 'bg-pink-500 border border-white' : 'bg-gray-600'}`}>
                                    {t}
                                  </button>
                               ))}
                           </div>
                      </div>

                      <div className="mb-4 border-t border-gray-600 pt-4">
                           <h4 className="text-yellow-400 font-bold mb-2">BESETZUNG</h4>
                           <div className="mb-2">
                               <label className="block text-white text-sm mb-1">Moderator:</label>
                               <div className="flex gap-2">
                                   {['NONE', 'FREDERIC', 'PETER'].map(h => (
                                       <button key={h} onClick={() => setConfig({...config, host: h as any})}
                                           className={`px-2 py-1 text-xs rounded ${config.host === h ? 'bg-green-600 border border-white' : 'bg-gray-600'}`}>
                                           {h === 'NONE' ? 'Aus' : h}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <label className="block text-white text-sm mb-1">Buchstabenfee:</label>
                               <div className="flex gap-2">
                                   {['NONE', 'MAREN', 'SONYA'].map(a => (
                                       <button key={a} onClick={() => setConfig({...config, assistant: a as any})}
                                           className={`px-2 py-1 text-xs rounded ${config.assistant === a ? 'bg-pink-600 border border-white' : 'bg-gray-600'}`}>
                                           {a === 'NONE' ? 'Aus' : a}
                                       </button>
                                   ))}
                               </div>
                           </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                              <input type="checkbox" checked={config.enableJackpot} onChange={(e) => setConfig({...config, enableJackpot: e.target.checked})} className="accent-green-500"/>
                              <span className="text-sm">Jackpot</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                              <input type="checkbox" checked={config.enableGiftTags} onChange={(e) => setConfig({...config, enableGiftTags: e.target.checked})} className="accent-green-500"/>
                              <span className="text-sm">Geschenke</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                              <input type="checkbox" checked={config.enableTTS} onChange={(e) => setConfig({...config, enableTTS: e.target.checked})} className="accent-green-500"/>
                              <span className="text-sm">Sprachausgabe</span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                              <input type="checkbox" checked={config.enableAvatars} onChange={(e) => setConfig({...config, enableAvatars: e.target.checked})} className="accent-green-500"/>
                              <span className="text-sm">Avatare</span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                              <input type="checkbox" checked={config.enableGamepad} onChange={(e) => setConfig({...config, enableGamepad: e.target.checked})} className="accent-green-500"/>
                              <span className="text-sm">Controller</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                              <input type="checkbox" checked={config.enableAudienceMode} onChange={(e) => setConfig({...config, enableAudienceMode: e.target.checked})} className="accent-green-500"/>
                              <span className="text-sm text-yellow-300">Audience Mode</span>
                          </label>
                      </div>
                  </div>
              </div>
              
              <div className="mt-8 flex flex-col items-center">
                  <button onClick={() => onConfigStart(config, playerAvatars)} className="bg-green-600 hover:bg-green-500 text-white text-2xl font-bold py-4 px-16 rounded-full shadow-[0_0_20px_rgba(22,163,74,0.6)] transition transform hover:scale-105">
                      SPIEL STARTEN
                  </button>
              </div>
          </div>
      )
  }
  
  // Audience Mode - Clean View (Hides Controls)
  if (gameConfig.enableAudienceMode && gameState !== GameState.GAME_OVER && gameState !== GameState.WELCOME) {
      return (
          <div className="w-full max-w-4xl mx-auto mt-6 text-center">
               <div className="inline-block bg-black/50 px-6 py-2 rounded-full backdrop-blur-md text-yellow-400/50 text-sm uppercase tracking-widest animate-pulse border border-white/10">
                   Zweiter Bildschirm (Audience Mode)
               </div>
          </div>
      );
  }

  // Toss Up UI
  if (gameState === GameState.TOSS_UP) {
      return (
          <div className="w-full max-w-3xl mx-auto mt-6 p-6 bg-red-900/90 rounded-xl backdrop-blur-sm border-2 border-red-500 text-center shadow-2xl">
              <h2 className="text-4xl font-display text-white mb-2 animate-pulse">SCHNELLRATERUNDE</h2>
              <p className="text-xl text-yellow-300 mb-8">Drücke den Buzzer, wenn du die Lösung weißt!</p>
              
              <div className="flex flex-wrap justify-center gap-6">
                  {Array.from({length: gameConfig.playerCount}).map((_, idx) => (
                      <button 
                         key={idx}
                         onClick={() => onTossUpBuzz(idx)}
                         className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-8 shadow-[0_10px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-2 text-white text-lg md:text-xl font-bold hover:opacity-90 transition-all flex items-center justify-center 
                             ${idx===0?'bg-red-600 border-red-800': idx===1?'bg-yellow-500 border-yellow-700 text-black': idx===2?'bg-blue-600 border-blue-800': 'bg-gray-600 border-gray-800'}
                             ${getFocusClass(idx)}
                         `}
                      >
                          {gameConfig.playerNames[idx] || `P${idx+1}`}
                      </button>
                  ))}
              </div>
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
                 className={`bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-10 rounded-lg shadow-lg text-xl ${getFocusClass(0)}`}
               >
                   JA, EINSETZEN
               </button>
               <button 
                 onClick={() => onExtraSpinDecision(false)} 
                 className={`bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-lg shadow-lg text-xl ${getFocusClass(1)}`}
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
           <div className="flex flex-wrap justify-center gap-6 mt-8">
               <button 
                 onClick={() => onMysteryDecision(true)} 
                 className={`bg-purple-700 text-white font-bold py-6 px-12 rounded-xl shadow-lg text-2xl border-2 border-yellow-400 ${getFocusClass(0)}`}
               >
                   AUFDECKEN (RISIKO)
               </button>
               <button 
                 onClick={() => onMysteryDecision(false)} 
                 className={`bg-gray-700 text-white font-bold py-6 px-12 rounded-xl shadow-lg text-2xl ${getFocusClass(1)}`}
               >
                   1.000 DM NEHMEN
               </button>
           </div>
        </div>
    );
  }

  // Risk Decision
  if (gameState === GameState.RISK_DECISION) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-6 p-6 bg-orange-900/90 rounded-xl backdrop-blur-sm border-2 border-orange-500 text-center shadow-2xl animate-fade-in">
           <h2 className="text-4xl font-display text-white mb-2 drop-shadow-lg">RISIKO FELD!</h2>
           <div className="flex flex-wrap justify-center gap-6 mt-8">
               <button 
                 onClick={() => onRiskDecision(true)} 
                 className={`bg-orange-700 text-white font-bold py-6 px-12 rounded-xl shadow-lg text-2xl border-2 border-white ${getFocusClass(0)}`}
               >
                   RISIKO EINGEHEN
               </button>
               <button 
                 onClick={() => onRiskDecision(false)} 
                 className={`bg-gray-700 text-white font-bold py-6 px-12 rounded-xl shadow-lg text-2xl ${getFocusClass(1)}`}
               >
                   500 DM (SICHER)
               </button>
           </div>
        </div>
    );
  }

  // Express Decision
  if (gameState === GameState.EXPRESS_DECISION) {
    return (
        <div className="w-full max-w-4xl mx-auto mt-6 p-6 bg-gray-300 rounded-xl border-4 border-gray-600 text-center shadow-2xl animate-fade-in">
           <h2 className="text-4xl font-display text-gray-900 mb-2 drop-shadow-sm uppercase">Express Fahrt?</h2>
           <p className="text-xl text-gray-700 mb-6">1.000 DM pro Buchstabe. Ein Fehler = Sofort Bankrott!</p>
           <div className="flex flex-wrap justify-center gap-6 mt-8">
               <button 
                 onClick={() => onExpressDecision(true)} 
                 className={`bg-gradient-to-r from-gray-700 to-black text-white font-bold py-6 px-12 rounded-xl shadow-lg text-2xl border-2 border-white ${getFocusClass(0)}`}
               >
                   🚂 EINSTEIGEN
               </button>
               <button 
                 onClick={() => onExpressDecision(false)} 
                 className={`bg-gray-500 text-white font-bold py-6 px-12 rounded-xl shadow-lg text-2xl ${getFocusClass(1)}`}
               >
                   PASSEN (NUR 1.000)
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
              <button
                onClick={onSpin}
                disabled={spinDisabled}
                className={`bg-yellow-600 text-black font-bold py-4 px-16 rounded-full shadow-lg text-2xl animate-pulse ${getFocusClass(0)}`}
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
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {ALPHABET.map((char, i) => {
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
                            className={`w-10 h-10 font-bold rounded ${isSelected ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-900 hover:bg-white'} disabled:opacity-30 transition-all ${getFocusClass(i)}`}
                        >
                            {char}
                        </button>
                      );
                  })}
              </div>
              
              {bonusRoundSelection.length === totalNeeded && (
                  <button onClick={onBonusSubmit} className={`bg-yellow-500 text-black font-bold py-3 px-12 rounded-full text-xl animate-pulse shadow-lg ${getFocusClass(ALPHABET.length)}`}>
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
      
      {isExpressRun && (
           <div className="absolute -top-12 left-0 animate-pulse flex items-center gap-2 bg-gray-200 px-4 py-1 rounded-r-lg border-2 border-black">
               <span className="text-2xl">🚂</span>
               <span className="font-bold text-black font-display text-xl">EXPRESS FAHRT</span>
           </div>
      )}

      {/* Jackpot Display */}
      {gameConfig.enableJackpot && (
          <div className="absolute -top-14 right-0 md:-right-12 bg-red-800 border-4 border-yellow-400 rounded-lg p-2 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse z-10">
              <div className="text-xs text-yellow-200 uppercase font-bold tracking-widest text-center">Jackpot</div>
              <div className="text-2xl font-display text-white">{jackpotValue}</div>
          </div>
      )}

      <div className="mt-6 text-center">
            <p className="text-gray-200 text-lg mb-4 font-medium">
                {gameState === GameState.SPIN_OR_SOLVE && (isExpressRun ? "Wähle den nächsten Buchstaben!" : "Was möchtest du tun?")}
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
          {!isExpressRun && (
              <button onClick={onSpin} disabled={spinDisabled} className={`bg-green-700 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-lg text-xl uppercase ${getFocusClass(0)}`}>
                Drehen
              </button>
          )}
          <button onClick={onStartBuyingVowel} disabled={!canBuyVowel} className={`bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-lg text-xl uppercase ${!canBuyVowel ? 'opacity-50' : ''} ${getFocusClass(1)}`}>
            Vokal kaufen
          </button>
          <button onClick={onStartSolving} className={`bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-10 rounded-lg text-xl uppercase ${getFocusClass(2)}`}>
            Lösen
          </button>
        </div>
      )}

      {/* Consonant Keyboard */}
      {gameState === GameState.GUESSING_CONSONANT && (
        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
          {CONSONANTS.map((char, i) => (
            <button
              key={char}
              onClick={() => onGuessConsonant(char)}
              disabled={guessedLetters.has(char)}
              className={`w-10 h-12 md:w-12 md:h-14 bg-white hover:bg-blue-100 text-blue-900 font-bold text-xl rounded border-b-4 border-gray-400 disabled:opacity-40 ${getFocusClass(i)}`}
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
            {VOWELS.map((char, i) => (
                <button
                key={char}
                onClick={() => onBuyVowel(char)}
                disabled={guessedLetters.has(char)}
                className={`w-12 h-14 bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold text-xl rounded border-b-4 border-pink-300 disabled:opacity-40 ${getFocusClass(i)}`}
                >
                {char}
                </button>
            ))}
            </div>
            <button onClick={onCancelAction} className={`text-red-400 uppercase font-bold text-sm ${getFocusClass(VOWELS.length)}`}>Abbrechen</button>
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
            autoFocus={!gameConfig.enableGamepad}
          />
          <div className="flex gap-4 w-full justify-center">
            <button onClick={() => onSolve(solveInput)} className={`bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded shadow-lg w-40 ${getFocusClass(0)}`}>
                OK
            </button>
            <button onClick={() => { setSolveInput(''); onCancelAction(); }} className={`bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded shadow-lg w-40 ${getFocusClass(1)}`}>
                ZURÜCK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
