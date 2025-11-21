
import React, { useEffect, useState } from 'react';
import { SegmentType, WheelSegment } from '../types';

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
  { text: 'EXTRA', value: 0, type: SegmentType.EXTRA_SPIN, color: '#D946EF', textColor: '#fff' }, // Fuchsia
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

// Bonus Wheel Segments (12 Segments)
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
  activePlayerIndex: number; // 0, 1, or 2
  currentRound: number;
  isBonusWheelMode: boolean;
  isMysteryRound: boolean;
}

const Wheel: React.FC<WheelProps> = ({ rotation, activePlayerIndex, currentRound, isBonusWheelMode, isMysteryRound }) => {
  
  // If Mystery Round, replace two low value segments with MYSTERY segments
  let segments = isBonusWheelMode ? BONUS_SEGMENTS : SEGMENTS;
  
  if (isMysteryRound && !isBonusWheelMode) {
      // Clone segments to avoid mutating global constant
      segments = [...SEGMENTS];
      // Replace '150' and '200' at specific indices with Mystery
      // Index 6 (200 Red) and Index 17 (150 Light Orange)
      segments[6] = { text: '?', value: 0, type: SegmentType.MYSTERY, color: '#7E22CE', textColor: '#fff' }; // Purple
      segments[17] = { text: '?', value: 0, type: SegmentType.MYSTERY, color: '#7E22CE', textColor: '#fff' }; // Purple
  }

  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments; 
  const radius = 50;
  const center = 50;
  const multiplier = Math.pow(2, currentRound - 1);

  // LED Animation State
  const [lightFrame, setLightFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLightFrame(prev => (prev + 1) % 2);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] mx-auto my-4">
      
      {/* LED Lights Ring Background */}
      <div className="absolute inset-[-20px] rounded-full border-[12px] border-gray-800 bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]"></div>
      
      {/* Lights */}
      {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10; // 36 lights
          const isOn = i % 2 === lightFrame;
          const lightRad = 50 + 6; // Position outside wheel
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

      {/* The Wheel Container */}
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
            // Mystery text stays '?'
            
            const chars = displayText.split('');
            
            return (
              <g key={i}>
                <path d={d} fill={seg.color} stroke="#fff" strokeWidth="0.3" />
                
                {chars.map((char, idx) => {
                   const startDist = 44; 
                   const step = 4;
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
                            fontSize="3.2"
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
        
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-4 border-white flex items-center justify-center z-10">
            <div className="text-[8px] md:text-[10px] font-black text-white drop-shadow-md text-center leading-none font-display tracking-wider">
                {isBonusWheelMode ? 'BONUS' : (isMysteryRound ? 'MYSTERY' : 'GLÜCKS')}<br/>RAD
            </div>
        </div>
      </div>

      {/* Stoppers - Adjusted to be closer and perfectly aligned */}
      <div className="absolute inset-0 pointer-events-none z-30">
        
        {/* Player 1: Top (0 deg) - Red */}
        <div className="absolute inset-0 flex justify-center">
             <div className={`absolute -top-3 flex flex-col items-center transition-all duration-300 origin-bottom ${activePlayerIndex === 0 ? 'scale-110 z-40' : 'opacity-60 grayscale z-30'}`}>
                 <div className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded mb-0.5 shadow border border-white/20 whitespace-nowrap">SPIELER 1</div>
                 <div className={`w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent ${activePlayerIndex === 0 ? 'border-t-red-600 drop-shadow-[0_4px_4px_rgba(220,38,38,0.6)]' : 'border-t-gray-500'}`}></div>
             </div>
        </div>

        {/* Player 2: Bottom Right (120 deg) - Yellow */}
        <div className="absolute inset-0 flex justify-center rotate-[120deg]">
             <div className={`absolute -top-3 flex flex-col items-center transition-all duration-300 origin-bottom ${activePlayerIndex === 1 ? 'scale-110 z-40' : 'opacity-60 grayscale z-30'}`}>
                 <div className="text-[10px] font-bold bg-yellow-500 text-black px-2 py-0.5 rounded mb-0.5 shadow border border-white/20 whitespace-nowrap -rotate-[120deg]">SPIELER 2</div>
                 <div className={`w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent ${activePlayerIndex === 1 ? 'border-t-yellow-500 drop-shadow-[0_4px_4px_rgba(234,179,8,0.6)]' : 'border-t-gray-500'}`}></div>
             </div>
        </div>

        {/* Player 3: Bottom Left (240 deg) - Blue */}
        <div className="absolute inset-0 flex justify-center rotate-[240deg]">
             <div className={`absolute -top-3 flex flex-col items-center transition-all duration-300 origin-bottom ${activePlayerIndex === 2 ? 'scale-110 z-40' : 'opacity-60 grayscale z-30'}`}>
                 <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded mb-0.5 shadow border border-white/20 whitespace-nowrap -rotate-[240deg]">SPIELER 3</div>
                 <div className={`w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent ${activePlayerIndex === 2 ? 'border-t-blue-600 drop-shadow-[0_4px_4px_rgba(37,99,235,0.6)]' : 'border-t-gray-500'}`}></div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Wheel;
