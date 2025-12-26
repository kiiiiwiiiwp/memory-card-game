import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Card, LEVELS, CARD_DATA } from './types';
import MemoryCard from './components/MemoryCard';
import { getVictoryMessage } from './services/geminiService';

console.log("App.tsx: Module initiated.");

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('START');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [victoryMessage, setVictoryMessage] = useState<string>('');
  const [levelStartTime, setLevelStartTime] = useState(0);

  const timerRef = useRef<number | null>(null);
  const currentLevel = LEVELS[currentLevelIdx];

  // Initialize a specific level
  const initLevel = useCallback((levelIdx: number, bonusTime: number = 0) => {
    console.log(`[CHRONOS LOG] Level Initialization Phase: Index ${levelIdx}, Bonus: ${bonusTime}s`);
    
    const level = LEVELS[levelIdx];
    if (!level) {
      console.error("[CHRONOS LOG] FATAL: Level definition missing for index", levelIdx);
      return;
    }

    const pairCount = Math.floor((level.rows * level.cols) / 2);
    const selectedData = [...CARD_DATA].sort(() => Math.random() - 0.5).slice(0, pairCount);
    
    const newCards: Card[] = [];
    selectedData.forEach((data, index) => {
      const cardBase = { 
        value: data.icon, 
        icon: data.icon, 
        color: data.color, 
        isFlipped: false, 
        isMatched: false 
      };
      newCards.push({ ...cardBase, id: index * 2 });
      newCards.push({ ...cardBase, id: index * 2 + 1 });
    });

    const totalTime = level.baseTime + bonusTime;
    console.log(`[CHRONOS LOG] Timer set to ${totalTime}s (Base ${level.baseTime} + Bonus ${bonusTime})`);

    setCards(newCards.sort(() => Math.random() - 0.5));
    setTimeLeft(totalTime);
    setLevelStartTime(totalTime);
    setMatches(0);
    setFlippedCards([]);
    setIsProcessing(false);
    setStatus('PLAYING');
    console.log(`[CHRONOS LOG] Sector ${levelIdx + 1} synchronized.`);
  }, []);

  // Entry point: Start from Level 1
  const startGame = () => {
    console.log("[CHRONOS LOG] Simulation start requested.");
    setCurrentLevelIdx(0);
    initLevel(0, 0);
  };

  // Transition: Carry over time to next level
  const nextLevel = () => {
    const remainingTime = timeLeft;
    const nextIdx = currentLevelIdx + 1;
    console.log(`[CHRONOS LOG] Transitioning to Sector ${nextIdx + 1}. Carrying over ${remainingTime}s.`);
    setCurrentLevelIdx(nextIdx);
    initLevel(nextIdx, remainingTime);
  };

  // Timer countdown logic
  useEffect(() => {
    if (status === 'PLAYING' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setStatus('GAME_OVER');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  // Matching logic
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsProcessing(true);
      const [id1, id2] = flippedCards;
      const card1 = cards.find(c => c.id === id1);
      const card2 = cards.find(c => c.id === id2);

      if (card1 && card2 && card1.value === card2.value) {
        // Match detected
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === id1 || c.id === id2) ? { ...c, isMatched: true, isFlipped: true } : c
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            const totalPairs = (currentLevel.rows * currentLevel.cols) / 2;
            if (newMatches === totalPairs) {
              if (currentLevelIdx === LEVELS.length - 1) {
                setStatus('VICTORY');
                getVictoryMessage(timeLeft, currentLevelIdx + 1).then(msg => setVictoryMessage(msg));
              } else {
                setStatus('LEVEL_WON');
              }
            }
            return newMatches;
          });
          setFlippedCards([]);
          setIsProcessing(false);
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === id1 || c.id === id2) ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards, currentLevelIdx, currentLevel, timeLeft]);

  // Handle card click event
  const handleCardClick = (id: number) => {
    if (isProcessing || flippedCards.length === 2 || status !== 'PLAYING') return;

    const targetCard = cards.find(c => c.id === id);
    if (!targetCard || targetCard.isFlipped || targetCard.isMatched) return;

    console.log(`[CHRONOS LOG] Node activated: ${id}`);

    // Fix: Completed truncated logic and corrected shorthand property error
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedCards(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-mono overflow-hidden">
      {status === 'START' && (
        <div className="text-center space-y-12 max-w-lg w-full">
          <div className="space-y-4">
            <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 animate-pulse">
              CHRONOS
            </h1>
            <p className="text-slate-500 uppercase tracking-[0.6em] text-[10px] font-bold">Memory Archiving Protocol v3.1</p>
          </div>
          <button 
            onClick={startGame}
            className="group relative px-12 py-5 bg-transparent border border-cyan-500/50 text-cyan-400 font-bold tracking-widest hover:text-slate-950 transition-all duration-300"
          >
            <span className="relative z-10">INITIALIZE SEQUENCE</span>
            <div className="absolute inset-0 w-0 bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-500"></div>
          </button>
        </div>
      )}

      {status === 'PLAYING' && (
        <div className="w-full max-w-5xl space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800 pb-6">
            <div className="space-y-2">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Sector Protocol 0{currentLevelIdx + 1}</p>
              <div className="flex gap-2">
                {Array.from({ length: Math.floor(currentLevel.rows * currentLevel.cols / 2) }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-6 rounded-sm transition-all duration-500 ${i < matches ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 'bg-slate-800'}`}></div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Temporal Buffer</p>
              <div className={`text-5xl font-black tracking-tighter ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                {timeLeft}<span className="text-xl ml-1">S</span>
              </div>
            </div>
          </div>

          <div 
            className="grid gap-4 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
              maxWidth: currentLevel.cols * 150
            }}
          >
            {cards.map(card => (
              <MemoryCard 
                key={card.id} 
                card={card} 
                onClick={() => handleCardClick(card.id)}
                disabled={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {status === 'LEVEL_WON' && (
        <div className="text-center space-y-10">
          <div className="space-y-4">
            <div className="inline-block px-4 py-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold tracking-[0.3em] rounded-sm mb-4">SECTOR_STABILIZED</div>
            <h2 className="text-6xl font-black italic text-white tracking-tight">SUCCESS</h2>
            <p className="text-slate-400 text-sm">Temporal residue of {timeLeft}s integrated into next sequence.</p>
          </div>
          <button 
            onClick={nextLevel}
            className="px-12 py-4 bg-cyan-500 text-slate-950 font-black tracking-tighter hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          >
            PROCEED TO NEXT SECTOR
          </button>
        </div>
      )}

      {status === 'GAME_OVER' && (
        <div className="text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-7xl font-black text-rose-600 italic tracking-tighter">DE-SYNC</h2>
            <p className="text-slate-400 text-lg font-bold tracking-widest uppercase text-sm">Critical Memory Failure</p>
          </div>
          <button 
            onClick={startGame}
            className="px-12 py-4 border border-rose-600 text-rose-500 font-black tracking-widest hover:bg-rose-600 hover:text-white transition-all duration-300"
          >
            INITIATE SYSTEM RECOVERY
          </button>
        </div>
      )}

      {status === 'VICTORY' && (
        <div className="max-w-3xl text-center space-y-10">
          <div className="relative">
            <div className="absolute inset-0 blur-[120px] bg-cyan-500/30 rounded-full animate-pulse"></div>
            <div className="relative space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_cyan]">
                  <i className="fas fa-microchip text-4xl text-cyan-400"></i>
                </div>
              </div>
              <h2 className="text-7xl font-black text-white italic tracking-tighter">MASTER ARCHIVIST</h2>
              <div className="p-8 bg-slate-900/40 border border-slate-800/60 rounded-sm backdrop-blur-md">
                <p className="text-xl text-cyan-200 leading-relaxed font-medium italic">
                  "{victoryMessage || "Transmitting encrypted victory sequence..."}"
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-slate-100 text-slate-950 font-black tracking-widest hover:bg-white transition-all"
          >
            NEW PROTOCOL
          </button>
        </div>
      )}
    </div>
  );
};

// Fix: Added missing default export
export default App;
