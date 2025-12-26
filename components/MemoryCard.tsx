
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
        {/* 正面（图标） */}
        <div className="card-front border-2 border-slate-800 bg-slate-900 flex flex-col items-center justify-center">
           <div 
             className="absolute w-12 h-12 rounded-full blur-2xl opacity-30"
             style={{ backgroundColor: card.color }}
           ></div>
           <i 
             className={`fas ${card.icon} text-3xl md:text-4xl relative z-10`}
             style={{ color: card.color, filter: `drop-shadow(0 0 8px ${card.color})` }}
           ></i>
           {card.isMatched && (
             <div className="absolute top-1 right-1">
               <i className="fas fa-check text-[10px] text-cyan-400"></i>
             </div>
           )}
        </div>
        
        {/* 背面（遮盖） */}
        <div className="card-back border-2 border-slate-700 bg-slate-800 flex items-center justify-center group overflow-hidden">
          <div className="w-full h-full border border-slate-600/30 m-1 rounded flex items-center justify-center relative">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/10 animate-scan"></div>
            <i className="fas fa-microchip text-slate-700 text-xl group-hover:text-cyan-500/40 transition-colors"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
