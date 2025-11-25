
import React, { useEffect, useState } from 'react';
import { SegmentType, WheelSegment, GameConfig, WheelColorTheme } from '../types';

// 24 Segments 
export const SEGMENTS: WheelSegment[] = [
  { text: '1000', value: 1000, type: SegmentType.VALUE, color: '#FACC15', textColor: '#000' }, // Yellow
  { text: '200', value: 200, type: SegmentType.VALUE, color: '#4ADE80', textColor: '#000' },  // Green
  { text: '300', value: 300, type: SegmentType.VALUE, color: '#22C55E', textColor: '#fff' },  // Dark Green
  { text: '400', value: 400, type: SegmentType.VALUE, color: '#FB923C', textColor: '#000' },  // Orange
  { text: '500', value: 500, type: SegmentType.VALUE, color: '#F59E0B', textColor: '#fff' },  // Amber
  { text: '1000', value: 1000, type: SegmentType.VALUE, color: '#FACC15', textColor: '#000' }, // Yellow
  { text: '200', value: 200, type: SegmentType.VALUE, color: '#F87171', textColor: '#fff' },  // Red
  { text: '300', value: 300, type: SegmentType.VALUE, color: '#EF4444', textColor: '#fff' },  // Dark Red
  { text: '800', value: 800, type: SegmentType.VALUE, color: '#0EA5E9', textColor: '#fff' },  // Sky Blue
  { text: '750', value: 750, type: SegmentType.VALUE, color: '#0284C7', textColor: '#fff' },  // Blue
  { text: '350', value: 350, type: SegmentType.VALUE, color: '#A855F7', textColor: '#fff' },  // Purple
  { text: 'EXTRA', value: 0, type: SegmentType.EXTRA_SPIN, color: '#D946EF', textColor: '#fff' }, // Fuchsia (Index 11)
  { text: '700', value: 700, type: SegmentType.VALUE, color: '#E879F9', textColor: '#fff' },  // Pink
  { text: 'BANKROTT', value: 0, type: SegmentType.BANKRUPT, color: '#1F2937', textColor: '#F87171' }, // Black/Red
  { text: '250', value: 250, type: SegmentType.VALUE, color: '#FDE047', textColor: '#000' },  // Light Yellow
  { text: '600', value: 600, type: SegmentType.VALUE, color: '#DC2626', textColor: '#fff' },  // Red
  { text: '400', value: 400, type: SegmentType.VALUE, color: '#F97316', textColor: '#fff' },  // Orange
  { text: '150', value: 150, type: SegmentType.VALUE, color: '#FDBA74', textColor: '#000' },  // Light Orange
  { text: '450', value: 450, type: SegmentType.VALUE, color: '#06B6D4', textColor: '#fff' },  // Cyan
  { text: 'AUSSETZEN', value: 0, type: SegmentType.LOSE_TURN, color: '#84CC16', textColor: '#fff' }, // Lime
  { text: '400', value: 400, type: SegmentType.VALUE, color: '#A3E635', textColor: '#000' },  // Lime Green
  { text: '250', value: 250, type: SegmentType.VALUE, color: '#60A5FA', textColor: '#fff' },  // Blue
  { text: '900', value: 900, type: SegmentType.VALUE, color: '#EAB308', textColor: '#fff' },  // Gold
  { text: '150', value: 150, type: SegmentType.VALUE, color: '#FAFAFA', textColor: '#000' },  // White
];

export const BONUS_SEGMENTS: WheelSegment[] = [
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#FACC15', textColor: '#000' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#EF4444', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#3B82F6', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#A855F7', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#10B981', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#F97316', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#EC4899', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#6366F1', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#84CC16', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#14B8A6', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#EAB308', textColor: '#fff' },
    { text: '?', value: 0, type: SegmentType.VALUE, color: '#64748B', textColor: '#fff' },
];

interface WheelProps {
  rotation: number;
  activePlayerIndex: number; 
  currentRound: number;
  isBonusWheelMode: boolean;
  isMysteryRound: boolean;
  mysteryRevealed: boolean;
  config: GameConfig;
  jackpotValue: number;
}

const Wheel: React.FC<WheelProps> = ({ 
  rotation, 
  activePlayerIndex, 
  currentRound, 
  isBonusWheelMode, 
  isMysteryRound, 
  mysteryRevealed,
  config,
  jackpotValue
}) => {
  
  // Select Base Segments: Bonus, Custom (if enabled), or Standard
  let segments: WheelSegment[];

  if (isBonusWheelMode) {
      segments = BONUS_SEGMENTS;
  } else if (config.enableCustomWheel && config.customSegments && config.customSegments.length === 24) {
      segments = [...config.customSegments];
  } else {
      segments = [...SEGMENTS];
  }
  
  // Apply Color Theme
  if (!isBonusWheelMode && config.wheelColorTheme !== 'STANDARD') {
      const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      const pastelColors = ['#FCA5A5', '#FDBA74', '#FDE047', '#86EFAC', '#93C5FD', '#A5B4FC', '#D8B4FE'];
      const goldColors = ['#CA8A04', '#EAB308', '#FACC15', '#FEF08A', '#78350F', '#92400E', '#B45309'];
      
      let palette = rainbowColors;
      if (config.wheelColorTheme === 'PASTEL') palette = pastelColors;
      if (config.wheelColorTheme === 'GOLD') palette = goldColors;

      segments = segments.map((seg, i) => ({
          ...seg,
          color: palette[i % palette.length],
          textColor: config.wheelColorTheme === 'PASTEL' || config.wheelColorTheme === 'GOLD' ? '#000' : '#fff'
      }));
  }

  // Apply Configurable Extras (Only on Normal Wheel, even with Custom segments we inject logic features if selected)
  if (!isBonusWheelMode) {
      
      // SINGLE PLAYER OVERRIDE: Remove LOSE_TURN
      if (config.playerCount === 1) {
          if (segments[19].type === SegmentType.LOSE_TURN) {
              segments[19] = { text: '500', value: 500, type: SegmentType.VALUE, color: '#A3E635', textColor: '#000' };
          }
      }

      // CHECK IF EXTRA SPIN IS DISABLED FOR THIS ROUND
      if (!config.extraSpinMode.includes(currentRound)) {
          // Replace default EXTRA segment (Index 11) if it exists as EXTRA_SPIN
          if (segments[11].type === SegmentType.EXTRA_SPIN) {
              segments[11] = { text: '500', value: 500, type: SegmentType.VALUE, color: '#A855F7', textColor: '#fff' };
          }
      }

      // JACKPOT: Replaces Index 1 (200 Green)
      if (config.enableJackpot) {
          segments[1] = { text: 'JACKPOT', value: jackpotValue, type: SegmentType.JACKPOT, color: '#B91C1C', textColor: '#fff' };
      }
      
      // FREE PLAY: Replaces Index 14 (250 Light Yellow)
      if (config.enableFreePlay) {
          segments[14] = { text: 'FREE', value: 0, type: SegmentType.FREE_PLAY, color: '#4C1D95', textColor: '#fff' };
      }

      // GIFT TAG: Replaces Index 23 (150 White)
      if (config.enableGiftTags) {
          segments[23] = { text: 'GESCHENK', value: 1000, type: SegmentType.GIFT, color: '#EC4899', textColor: '#fff' };
      }

      // RISK MODE (50/50): Replaces Index 4 (500 Amber)
      if (config.riskMode.includes(currentRound)) {
          segments[4] = { text: 'RISIKO', value: 0, type: SegmentType.RISK, color: '#000000', textColor: '#F97316' };
      }

      // EXPRESS MODE: Replaces Index 8 (800 Sky Blue)
      if (config.expressMode.includes(currentRound)) {
          segments[8] = { text: 'EXPRESS', value: 1000, type: SegmentType.EXPRESS, color: '#94A3B8', textColor: '#000' };
      }

      // MILLION WEDGE (Sandwiched between Bankrupts)
      // Target Index 12 (Replacing 700 Pink)
      // Neighbors 11 and 13 become Bankrupt
      if (config.millionWedgeMode.includes(currentRound)) {
          segments[11] = { text: 'BANKROTT', value: 0, type: SegmentType.BANKRUPT, color: '#000000', textColor: '#EF4444' };
          segments[12] = { text: '1 MILLION', value: 0, type: SegmentType.MILLION, color: '#10B981', textColor: '#fff' };
          segments[13] = { text: 'BANKROTT', value: 0, type: SegmentType.BANKRUPT, color: '#000000', textColor: '#EF4444' };
      }

      // Mystery Round Logic (Overwrites standard segments if it's mystery round)
      if (isMysteryRound) {
          if (!mysteryRevealed) {
            segments[6] = { text: '?', value: 0, type: SegmentType.MYSTERY, color: '#7E22CE', textColor: '#fff' }; 
            segments[17] = { text: '?', value: 0, type: SegmentType.MYSTERY, color: '#7E22CE', textColor: '#fff' }; 
          } else {
            segments[6] = { text: '1000', value: 1000, type: SegmentType.VALUE, color: '#9333EA', textColor: '#fff' }; 
            segments[17] = { text: '1000', value: 1000, type: SegmentType.VALUE, color: '#9333EA', textColor: '#fff' }; 
          }
      }
  }

  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments; 
  const radius = 50;
  const center = 50;
  const multiplier = Math.pow(2, currentRound - 1);

  const [lightFrame, setLightFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLightFrame(prev => (prev + 1) % 2);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  // Determine stoppers based on player count
  // 3 players: 0, 120, 240
  // 1 player: 0
  // 2 players: 0, 180
  // 4 players: 0, 90, 180, 270
  // 5 players: 0, 72, 144, 216, 288
  // 6 players: 0, 60, 120, 180, 240, 300
  const getStopperAngles = (count: number) => {
      const angles = [];
      const step = 360 / count;
      for (let i = 0; i < count; i++) {
          angles.push(i * step);
      }
      return angles;
  };
  
  const stopperAngles = getStopperAngles(config.playerCount);
  const playerColors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] mx-auto my-4">
      
      <div className="absolute inset-[-20px] rounded-full border-[12px] border-gray-800 bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]"></div>
      
      {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10; 
          const isOn = i % 2 === lightFrame;
          const lightRad = 50 + 6; 
          const top = 50 + lightRad * Math.sin((angle - 90) * Math.PI / 180);
          const left = 50 + lightRad * Math.cos((angle - 90) * Math.PI / 180);
          
          return (
            <div 
                key={i}
                className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isOn ? 'bg-yellow-300 shadow-[0_0_10px_#FDE047]' : 'bg-yellow-900 opacity-30'}`}
                style={{ top: `${top}%`, left: `${left}%` }}
            />
          );
      })}

      <div
        className="absolute inset-0 rounded-full shadow-2xl border-[8px] border-gray-300 relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.1, 0.7, 0.1, 1)"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
        >
          {segments.map((seg, i) => {
            const startAngle = i * anglePerSegment;
            const endAngle = (i + 1) * anglePerSegment;
            
            const x1 = center + radius * Math.cos(toRad(startAngle));
            const y1 = center + radius * Math.sin(toRad(startAngle));
            const x2 = center + radius * Math.cos(toRad(endAngle));
            const y2 = center + radius * Math.sin(toRad(endAngle));

            const d = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;

            const midAngle = startAngle + anglePerSegment / 2;
            
            let displayText = seg.text;
            if (!isBonusWheelMode && seg.type === SegmentType.VALUE) {
                displayText = (seg.value * multiplier).toString();
            }
            if (seg.type === SegmentType.JACKPOT) displayText = "JACKPOT"; 
            if (seg.type === SegmentType.RISK) displayText = "RISIKO";
            if (seg.type === SegmentType.MILLION) displayText = "1 MILLION";
            if (seg.type === SegmentType.EXPRESS) displayText = "EXPRESS";
            
            const isMillion = seg.type === SegmentType.MILLION;
            const isExpress = seg.type === SegmentType.EXPRESS;
            
            const chars = displayText.split('');
            
            return (
              <g key={i}>
                <defs>
                    <pattern id="sparkle" patternUnits="userSpaceOnUse" width="10" height="10">
                        <rect width="10" height="10" fill="#10B981" />
                        <circle cx="2" cy="2" r="1" fill="#FFF" opacity="0.5" />
                        <circle cx="7" cy="8" r="1" fill="#FFF" opacity="0.5" />
                    </pattern>
                     <pattern id="metal" patternUnits="userSpaceOnUse" width="10" height="10">
                        <rect width="10" height="10" fill="#94A3B8" />
                        <line x1="0" y1="0" x2="10" y2="10" stroke="#CBD5E1" strokeWidth="1" />
                    </pattern>
                </defs>
                
                <path 
                    d={d} 
                    fill={isMillion ? '#10B981' : (isExpress ? '#94A3B8' : seg.color)} 
                    stroke="#fff" 
                    strokeWidth="0.3" 
                />
                
                {seg.type === SegmentType.GIFT && (
                    <text x={center + 35 * Math.cos(toRad(midAngle))} y={center + 35 * Math.sin(toRad(midAngle))} 
                          textAnchor="middle" dominantBaseline="central" fontSize="5" transform={`rotate(${midAngle}, ${center + 35 * Math.cos(toRad(midAngle))}, ${center + 35 * Math.sin(toRad(midAngle))})`}>
                        🎁
                    </text>
                )}
                
                {isMillion && (
                     <text x={center + 25 * Math.cos(toRad(midAngle))} y={center + 25 * Math.sin(toRad(midAngle))} 
                          textAnchor="middle" dominantBaseline="central" fontSize="3" fill="white" transform={`rotate(${midAngle}, ${center + 25 * Math.cos(toRad(midAngle))}, ${center + 25 * Math.sin(toRad(midAngle))})`}>
                        ✨
                    </text>
                )}

                {isExpress && (
                     <text x={center + 25 * Math.cos(toRad(midAngle))} y={center + 25 * Math.sin(toRad(midAngle))} 
                          textAnchor="middle" dominantBaseline="central" fontSize="3" fill="black" transform={`rotate(${midAngle}, ${center + 25 * Math.cos(toRad(midAngle))}, ${center + 25 * Math.sin(toRad(midAngle))})`}>
                        🚂
                    </text>
                )}

                {chars.map((char, idx) => {
                   const isLong = displayText.length > 6;
                   const startDist = isLong ? 46 : 44; 
                   const step = isLong ? 3 : 4;
                   const charDist = startDist - (idx * step);
                   
                   const cx = center + charDist * Math.cos(toRad(midAngle));
                   const cy = center + charDist * Math.sin(toRad(midAngle));

                   return (
                       <text
                            key={idx}
                            x={cx}
                            y={cy}
                            transform={`rotate(${midAngle}, ${cx}, ${cy})`}
                            fill={seg.textColor}
                            fontSize={isLong ? "2.2" : "3.2"}
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="font-display select-none"
                            style={{ textShadow: seg.textColor === '#fff' ? '0px 0px 1px rgba(0,0,0,0.8)' : 'none' }}
                       >
                           {char}
                       </text>
                   );
                })}
              </g>
            );
          })}
        </svg>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center z-10">
            <div className="text-[8px] md:text-[10px] font-black text-white drop-shadow-md text-center leading-none font-display tracking-wider">
                {isBonusWheelMode ? 'BONUS' : (isMysteryRound ? 'MYSTERY' : 'GLÜCKS')}<br/>RAD
            </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-30">
        {stopperAngles.map((angle, idx) => {
             const colorClass = idx === 0 ? 'bg-red-600 border-red-500' :
                                idx === 1 ? 'bg-green-600 border-green-500' :
                                idx === 2 ? 'bg-blue-600 border-blue-500' :
                                idx === 3 ? 'bg-yellow-500 border-yellow-400' :
                                idx === 4 ? 'bg-purple-600 border-purple-500' : 'bg-orange-600 border-orange-500';

             // Only show stopper for active player or show all? 
             // Usually all stoppers are visible.
             // Active one pops out.
             
             const isActive = activePlayerIndex === idx;

             return (
                 <div key={idx} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${angle}deg)` }}>
                     <div className={`absolute -top-3 flex flex-col items-center transition-all duration-300 origin-bottom ${isActive ? 'scale-110 z-40' : 'opacity-60 grayscale z-30'}`}>
                         <div className={`text-[10px] font-bold ${colorClass.split(' ')[0]} text-white px-2 py-0.5 rounded mb-0.5 shadow border border-white/20 whitespace-nowrap`} style={{ transform: `rotate(-${angle}deg)` }}>
                             {config.playerNames[idx] || `P${idx+1}`}
                         </div>
                         <div className={`w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-${playerColors[idx]}-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]`}></div>
                     </div>
                 </div>
             );
        })}
      </div>
    </div>
  );
};

export default Wheel;
