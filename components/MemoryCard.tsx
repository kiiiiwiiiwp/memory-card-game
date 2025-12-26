import React from 'react';
import { Card } from '../types';

interface MemoryCardProps {
  card: Card;
  onClick: () => void;
  disabled: boolean;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ card, onClick, disabled }) => {
  const isFlipped = card.isFlipped || card.isMatched;

  return (
    <div 
      className={`relative w-full aspect-square cursor-pointer perspective-1000 ${isFlipped ? 'card-flipped' : ''}`}
      onClick={() => !disabled && onClick()}
    >
      <div className="card-inner w-full h-full relative duration-500 shadow-xl">
        {/* Front Side (Icon Side) */}
        <div className="card-front border-2 border-slate-800/80 overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
           {/* Ambient Glow */}
           <div 
             className="absolute w-12 h-12 rounded-full blur-2xl opacity-40 animate-pulse"
             style={{ backgroundColor: card.color }}
           ></div>
           
           <div className="relative z-10 flex items-center justify-center">
             <i 
               className={`fas ${card.icon} text-3xl md:text-5xl`}
               style={{ 
                 color: card.color, 
                 filter: `drop-shadow(0 0 10px ${card.color})` 
               }}
             ></i>
           </div>

           {/* Matched Indicator */}
           {card.isMatched && (
             <div className="absolute top-1 right-1">
               <i className="fas fa-check-double text-[8px] text-cyan-400 shadow-[0_0_5px_cyan]"></i>
             </div>
           )}

           {/* Aesthetic footer stripe */}
           <div 
             className="absolute bottom-0 left-0 right-0 h-1"
             style={{ backgroundColor: card.color }}
           ></div>
        </div>
        
        {/* Back Side (Pattern Side) */}
        <div className="card-back group">
          <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg p-1.5 border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors">
            <div className="w-full h-full border border-slate-600/20 rounded flex items-center justify-center overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/10 animate-scan"></div>
              <i className="fas fa-shield-halved text-slate-700 text-xl opacity-30 group-hover:text-cyan-500/30 group-hover:scale-110 transition-all duration-300"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
