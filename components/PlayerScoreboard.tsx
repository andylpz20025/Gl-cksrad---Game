import React from 'react';
import { Player } from '../types';

interface PlayerScoreboardProps {
  players: Player[];
  activePlayerId: number;
}

const PlayerScoreboard: React.FC<PlayerScoreboardProps> = ({ players, activePlayerId }) => {
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
            <div className={`absolute -top-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                {player.name}
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
            
            {player.hasExtraSpin && (
                <div className="absolute -bottom-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-purple-400 animate-bounce">
                    EXTRA DREH
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerScoreboard;