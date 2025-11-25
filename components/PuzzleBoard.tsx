
import React from 'react';
import { Puzzle, VisualTheme } from '../types';

interface PuzzleBoardProps {
  puzzle: Puzzle | null;
  guessedLetters: Set<string>;
  revealingLetters: Set<string>; // Letters currently being animated
  visualTheme: VisualTheme;
}

const ROWS = 4;
const COLS = 13;

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ puzzle, guessedLetters, revealingLetters, visualTheme }) => {
  
  const getGridData = (): string[][] => {
    const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));
    if (!puzzle) return grid;

    const rawText = puzzle.text.replace(/-/g, '- '); 
    const words = rawText.split(' ').filter(w => w.length > 0);
    
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        const needsSpace = currentLine.length > 0 && !currentLine.endsWith('-');
        const spaceLen = needsSpace ? 1 : 0;

        if (currentLine.length + spaceLen + word.length <= COLS) {
            currentLine += (needsSpace ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    const startRow = Math.floor((ROWS - lines.length) / 2);
    
    lines.forEach((line, rowIndex) => {
        const startCol = Math.floor((COLS - line.length) / 2);
        for (let i = 0; i < line.length; i++) {
            if (startRow + rowIndex < ROWS) {
                grid[startRow + rowIndex][startCol + i] = line[i];
            }
        }
    });

    return grid;
  };

  const gridData = getGridData();

  // Theme Styles
  const getContainerStyle = () => {
      switch(visualTheme) {
          case 'TV_STUDIO': return 'relative py-12 px-8'; // SVG will handle borders
          case 'CURVED': return 'rounded-[50px] border-[12px] border-yellow-600 shadow-2xl bg-blue-900/50';
          case '80S': return 'rounded-none border-[4px] border-pink-500 shadow-[0_0_20px_#ec4899] bg-black';
          case '90S': return 'rounded-xl border-[6px] border-purple-600 border-dashed bg-indigo-900';
          case '2000S': return 'rounded-xl border-[2px] border-gray-400 bg-gradient-to-b from-gray-200 to-gray-400 shadow-2xl';
          default: return 'rounded-xl border-[6px] border-yellow-600 shadow-2xl bg-blue-900/50';
      }
  };
  
  const getCellStyle = (isSpace: boolean, isRevealed: boolean) => {
      if (isSpace) {
          if (visualTheme === 'TV_STUDIO') return 'bg-green-900/40 border border-green-800 opacity-30';
          if (visualTheme === '80S') return 'bg-gray-900 border border-gray-800';
          if (visualTheme === '90S') return 'bg-indigo-800 border border-indigo-700 opacity-50';
          if (visualTheme === '2000S') return 'bg-gray-300 border border-gray-400 opacity-40';
          return 'bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-900 shadow-inner opacity-50';
      }
      
      // Active Card Back (Hidden)
      if (!isRevealed) {
          if (visualTheme === 'TV_STUDIO') return 'bg-gradient-to-br from-green-600 to-green-800 border-2 border-green-500 shadow-lg';
          if (visualTheme === '80S') return 'bg-gradient-to-br from-pink-600 to-purple-700 border-2 border-pink-400 shadow-[0_0_10px_#ec4899]';
          if (visualTheme === '90S') return 'bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
          if (visualTheme === '2000S') return 'bg-gradient-to-br from-blue-100 to-white border border-blue-200 shadow-md';
          return 'bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600 shadow-lg';
      }
      
      // Active Card Front (Revealed)
      if (visualTheme === 'TV_STUDIO') return 'bg-white border-2 border-gray-300 shadow-lg text-black';
      if (visualTheme === '80S') return 'bg-black border-2 border-cyan-400 shadow-[inset_0_0_10px_#22d3ee] text-cyan-400';
      if (visualTheme === '90S') return 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black';
      if (visualTheme === '2000S') return 'bg-white border border-gray-300 shadow-inner text-gray-800';
      return 'bg-white border-2 border-gray-300 shadow-lg text-black';
  };

  return (
    <div className={`p-2 md:p-4 overflow-x-auto transition-all duration-500 ${getContainerStyle()}`}>
      
      {/* TV Studio SVG Background */}
      {visualTheme === 'TV_STUDIO' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 800 400">
                <defs>
                    <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#FDE047" />
                        <stop offset="100%" stopColor="#CA8A04" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                {/* Main Frame shape - rounded stadium */}
                <rect x="20" y="20" width="760" height="360" rx="100" ry="100" fill="url(#goldGradient)" stroke="#B45309" strokeWidth="5" />
                
                {/* Inner dark green background */}
                <rect x="50" y="50" width="700" height="300" rx="80" ry="80" fill="#14532D" stroke="#000" strokeWidth="2" />

                {/* Decorative Rays/Lights could be added here simplistically via patterns or circles */}
                {Array.from({ length: 30 }).map((_, i) => {
                    // Simple light bulbs around the perimeter
                    const angle = (i / 30) * Math.PI * 2;
                    const rx = 380; // half width
                    const ry = 180; // half height
                    const cx = 400 + rx * Math.cos(angle) * 0.95; // slightly inset
                    const cy = 200 + ry * Math.sin(angle) * 0.9;
                    
                    return (
                        <circle key={i} cx={cx} cy={cy} r="6" fill="#FEF3C7" stroke="#B45309" strokeWidth="1">
                            <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1 + Math.random()}s`} repeatCount="indefinite" />
                        </circle>
                    )
                })}
            </svg>
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-1.5 md:gap-2 min-w-fit mx-auto">
        {gridData.map((row, rIndex) => (
          <div key={rIndex} className="flex gap-1.5 md:gap-2 justify-center">
            {row.map((char, cIndex) => {
              const isSpace = char === '' || char === ' ';
              const isHyphen = char === '-';
              const isRevealed = !isSpace && (guessedLetters.has(char) || isHyphen);
              const key = `${rIndex}-${cIndex}`;

              return (
                <div
                  key={key}
                  className="relative w-7 h-10 sm:w-9 sm:h-12 md:w-12 md:h-16 lg:w-14 lg:h-20 perspective-1000"
                >
                  {isSpace ? (
                    <div className={`w-full h-full rounded ${getCellStyle(true, false)}`}></div>
                  ) : (
                    <div
                        className={`w-full h-full relative transform-style-3d transition-transform duration-700 ${
                        isRevealed ? 'rotate-y-180' : ''
                        }`}
                    >
                        {/* Front: Hidden */}
                        <div className={`absolute w-full h-full backface-hidden rounded flex items-center justify-center ${getCellStyle(false, false)}`}></div>

                        {/* Back: Revealed */}
                        <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded ${getCellStyle(false, true)}`}>
                        <span className={`font-display font-bold text-xl sm:text-2xl md:text-4xl ${visualTheme === '80S' ? 'drop-shadow-[0_0_5px_#22d3ee]' : ''}`}>
                            {char}
                        </span>
                        </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center relative z-10">
         <div className={`inline-block px-8 py-2 rounded-lg text-lg md:text-2xl font-display uppercase tracking-widest shadow-lg border-2 
             ${visualTheme === '80S' ? 'bg-black border-cyan-400 text-cyan-400 shadow-[0_0_15px_#22d3ee]' : 
               visualTheme === '90S' ? 'bg-yellow-400 border-black text-black shadow-[4px_4px_0_0_#000]' :
               visualTheme === '2000S' ? 'bg-gradient-to-r from-gray-100 to-gray-300 border-gray-400 text-gray-700' :
               visualTheme === 'TV_STUDIO' ? 'bg-gradient-to-r from-blue-600 to-blue-800 border-white text-white shadow-xl' :
               'bg-gradient-to-r from-blue-600 to-blue-800 border-blue-400 text-white'
             }`}>
            {puzzle ? puzzle.category : '...'}
         </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;