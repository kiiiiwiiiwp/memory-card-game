
import React from 'react';
import { Card } from '../types';

interface MemoryCardProps {
  card: Card;
  onClick: () => void;
  disabled: boolean;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ card, onClick, disabled }) => {
  return (
    <div 
      className={`relative w-full aspect-square cursor-pointer perspective-1000 ${card.isFlipped || card.isMatched ? 'card-flipped' : ''}`}
      onClick={() => !disabled && !card.isFlipped && !card.isMatched && onClick()}
    >
      <div className="card-inner w-full h-full relative shadow-2xl">
        {/* 【翻开后的图案面】 - 在代码中标记为 card-front，它是配对的关键 */}
        <div className="card-front border-2 border-slate-700/50 overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
           {/* 核心霓虹底座 - 提供强烈的色彩视觉引导 */}
           <div 
             className="absolute w-16 h-16 rounded-full glow-bg opacity-60"
             style={{ backgroundColor: card.color }}
           ></div>
           
           {/* 背景辅助大图案 - 即使主图标加载慢也能辨认 */}
           <i 
             className={`fas ${card.icon} absolute text-6xl opacity-10`}
             style={{ color: card.color }}
           ></i>

           {/* 主配对图标 - 巨大且带有强发光效果 */}
           <div className="relative z-10 flex items-center justify-center">
             <i 
               className={`fas ${card.icon} text-4xl md:text-5xl drop-shadow-lg`}
               style={{ 
                 color: card.color, 
                 filter: `drop-shadow(0 0 15px ${card.color}) drop-shadow(0 0 5px white)` 
               }}
             ></i>
           </div>

           {/* 底部能量条 - 增强视觉统一感 */}
           <div 
             className="absolute bottom-0 left-0 right-0 h-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]"
             style={{ backgroundColor: card.color }}
           ></div>
        </div>
        
        {/* 【未翻开的背面】 - 用户点击前看到的覆盖层 */}
        <div className="card-back group">
          <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg p-2 border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors">
            <div className="w-full h-full border border-slate-600/30 rounded-md flex items-center justify-center overflow-hidden relative">
              {/* 装饰性扫描线 */}
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 animate-scan"></div>
              <i className="fas fa-fingerprint text-slate-600 text-2xl opacity-40 group-hover:opacity-80 transition-opacity"></i>
            </div>
          </div>
        </div>
      </div>
      
      {/* 匹配成功后的锁定特效 */}
      {card.isMatched && (
        <div className="absolute inset-0 bg-cyan-400/10 rounded-xl pointer-events-none flex items-center justify-center border-2 border-cyan-400/30 animate-pulse">
           <div className="absolute top-2 right-2">
             <i className="fas fa-check-circle text-cyan-400 text-xs shadow-glow"></i>
           </div>
        </div>
      )}
    </div>
  );
};

export default MemoryCard;
