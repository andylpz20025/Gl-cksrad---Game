
import React from 'react';
import { Puzzle } from '../types';

interface PuzzleBoardProps {
  puzzle: Puzzle | null;
  guessedLetters: Set<string>;
  revealingLetters: Set<string>; // Letters currently being animated
}

const ROWS = 4;
const COLS = 13;

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ puzzle, guessedLetters, revealingLetters }) => {
  
  const getGridData = (): string[][] => {
    const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(''));
    if (!puzzle) return grid;

    // Prepare text: 
    // If we have a hyphen in a long word, we ensure it acts as a split point.
    // We replace '-' with '- ' (hyphen space) to allow the splitter to see it as a breakable chunk.
    // However, we want the hyphen to stay with the first part.
    // "AUTOBAHN-AUSFAHRT" -> "AUTOBAHN-" "AUSFAHRT"
    const rawText = puzzle.text.replace(/-/g, '- '); 
    const words = rawText.split(' ').filter(w => w.length > 0);
    
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        
        // Check if adding this word fits on the current line
        // +1 for space if currentLine is not empty
        // However, if the previous word ended with '-', we don't strictly need a space visually, 
        // but logically usually there is no space after hyphen in the grid unless we force it.
        // For simplicity in this grid logic, we assume standard spacing rules.
        
        const needsSpace = currentLine.length > 0 && !currentLine.endsWith('-');
        const spaceLen = needsSpace ? 1 : 0;

        if (currentLine.length + spaceLen + word.length <= COLS) {
            currentLine += (needsSpace ? ' ' : '') + word;
        } else {
            // If the word itself is > COLS, we are in trouble regardless, 
            // but the fallback list and prompt instructions prevent this.
            // Push current line and start new one
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    // Center vertically
    const startRow = Math.floor((ROWS - lines.length) / 2);
    
    lines.forEach((line, rowIndex) => {
        // Center horizontally
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

  return (
    <div className="bg-black p-2 md:p-4 rounded-xl border-[6px] border-yellow-600 shadow-2xl overflow-x-auto">
      <div className="flex flex-col gap-1.5 md:gap-2 min-w-fit mx-auto">
        {gridData.map((row, rIndex) => (
          <div key={rIndex} className="flex gap-1.5 md:gap-2 justify-center">
            {row.map((char, cIndex) => {
              const isSpace = char === '' || char === ' ';
              const isHyphen = char === '-';
              // Automatically reveal if it's a hyphen
              const isRevealed = !isSpace && (guessedLetters.has(char) || isHyphen);
              const key = `${rIndex}-${cIndex}`;

              return (
                <div
                  key={key}
                  className="relative w-7 h-10 sm:w-9 sm:h-12 md:w-12 md:h-16 lg:w-14 lg:h-20 perspective-1000"
                >
                  {/* Inactive Field: Gold */}
                  {isSpace ? (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-900 rounded shadow-inner opacity-50"></div>
                  ) : (
                    // Active Field: Flip Card
                    <div
                        className={`w-full h-full relative transform-style-3d transition-transform duration-700 ${
                        isRevealed ? 'rotate-y-180' : ''
                        }`}
                    >
                        {/* Front: Grey (Not Revealed) */}
                        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600 rounded shadow-lg"></div>

                        {/* Back: White (Revealed) */}
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white border-2 border-gray-300 flex items-center justify-center rounded shadow-lg">
                        <span className="font-display text-black font-bold text-xl sm:text-2xl md:text-4xl">
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
      
      <div className="mt-6 text-center">
         <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-2 rounded-lg text-lg md:text-2xl font-display uppercase tracking-widest shadow-lg border-2 border-blue-400">
            {puzzle ? puzzle.category : '...'}
         </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;
