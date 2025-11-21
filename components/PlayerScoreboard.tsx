
import React from 'react';
import { Player } from '../types';

interface PlayerScoreboardProps {
  players: Player[];
  activePlayerId: number;
}

const PlayerScoreboard: React.FC<PlayerScoreboardProps> = ({ players, activePlayerId }) => {
  
  const getGiftIcon = (name: string) => {
      if (name.includes('AUTO')) return '🚗';
      if (name.includes('REISE') || name.includes('KREUZFAHRT')) return '✈️';
      if (name.includes('HAUS')) return '🏠';
      if (name.includes('MOTORRAD') || name.includes('ROLLER') || name.includes('BIKE')) return '🏍️';
      if (name.includes('TECHNIK') || name.includes('LAPTOP')) return '💻';
      return '🎁';
  };

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 w-full max-w-4xl mx-auto mt-4">
      {players.map((player) => {
        const isActive = player.id === activePlayerId;
        return (
          <div
            key={player.id}
            className={`relative flex flex-col items-center p-2 md:p-4 rounded-xl border-2 transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-b from-blue-600 to-blue-900 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105 z-10'
                : 'bg-gray-900/80 border-gray-700 grayscale-[0.5]'
            }`}
          >
             {/* Player Name Badge */}
            <div className={`absolute -top-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex gap-1 items-center ${isActive ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                <span className="text-base">{player.avatar}</span> {player.name}
            </div>

            <div className="mt-2 text-center w-full">
                <div className="text-xs text-gray-400 mb-1">Runde</div>
                <div className="text-2xl md:text-4xl font-display text-white tabular-nums tracking-tighter">
                    {player.roundScore}
                </div>
            </div>

            <div className="w-full h-px bg-white/20 my-2"></div>

            <div className="flex justify-between w-full px-2 text-xs md:text-sm">
                <span className="text-gray-400">Bank:</span>
                <span className="text-yellow-400 font-bold">{player.totalScore}</span>
            </div>
            
            {/* Inventory & Status Icons */}
            <div className="absolute -bottom-2 flex gap-1 flex-wrap justify-center">
                {player.hasExtraSpin && (
                    <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-purple-400 animate-bounce">
                        EXTRA
                    </div>
                )}
                {player.inventory.length > 0 && player.inventory.map((item, idx) => (
                    <div key={idx} className="bg-pink-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-pink-400 flex items-center gap-1" title={item}>
                        <span>{getGiftIcon(item)}</span>
                        <span className="hidden md:inline">{item}</span>
                    </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerScoreboard;
