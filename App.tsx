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

  const timerRef = useRef<number | null>(null);
  const currentLevel = LEVELS[currentLevelIdx];

  // Initialize a specific level
  const initLevel = useCallback((levelIdx: number, bonusTime: number = 0) => {
    const level = LEVELS[levelIdx];
    if (!level) return;

    console.log(`[CHRONOS LOG] Initializing Sector ${levelIdx + 1}. Base: ${level.baseTime}s, Bonus: ${bonusTime}s`);

    const pairCount = Math.floor((level.rows * level.cols) / 2);
    // Shuffle and pick icons
    const selectedIcons = [...CARD_DATA].sort(() => Math.random() - 0.5).slice(0, pairCount);
    
    // Create pairs
    const newCards: Card[] = [];
    selectedIcons.forEach((data, index) => {
      const cardBase = { 
        value: data.icon, // This is what we compare
        icon: data.icon, 
        color: data.color, 
        isFlipped: false, 
        isMatched: false 
      };
      // Two identical cards with unique IDs
      newCards.push({ ...cardBase, id: index * 2 });
      newCards.push({ ...cardBase, id: index * 2 + 1 });
    });

    const totalTime = level.baseTime + bonusTime;
    
    setCards(newCards.sort(() => Math.random() - 0.5));
    setTimeLeft(totalTime);
    setMatches(0);
    setFlippedCards([]);
    setIsProcessing(false);
    setStatus('PLAYING');
  }, []);

  const startGame = () => {
    setCurrentLevelIdx(0);
    initLevel(0, 0);
  };

  const nextLevel = () => {
    const bonus = timeLeft;
    const nextIdx = currentLevelIdx + 1;
    setCurrentLevelIdx(nextIdx);
    initLevel(nextIdx, bonus);
  };

  // Timer logic
  useEffect(() => {
    if (status === 'PLAYING' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
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

  // Core Matching logic
  useEffect(() => {
    if (flippedCards.length === 2 && !isProcessing) {
      const [id1, id2] = flippedCards;
      const card1 = cards.find(c => c.id === id1);
      const card2 = cards.find(c => c.id === id2);

      if (!card1 || !card2) return;

      setIsProcessing(true);

      if (card1.value === card2.value) {
        // MATCH FOUND
        console.log(`[CHRONOS LOG] Sync Success: ${card1.value}`);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === id1 || c.id === id2) ? { ...c, isMatched: true, isFlipped: true } : c
          ));
          setMatches(m => {
            const nextMatches = m + 1;
            const totalPairs = Math.floor((currentLevel.rows * currentLevel.cols) / 2);
            if (nextMatches === totalPairs) {
              handleLevelComplete();
            }
            return nextMatches;
          });
          setFlippedCards([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // MATCH FAILED
        console.log(`[CHRONOS LOG] Sync Failed: ${card1.value} vs ${card2.value}`);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === id1 || c.id === id2) ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000); // Give user 1s to memorize
      }
    }
  }, [flippedCards, cards, isProcessing, currentLevel, currentLevelIdx]);

  const handleLevelComplete = async () => {
    if (currentLevelIdx === LEVELS.length - 1) {
      setStatus('VICTORY');
      const msg = await getVictoryMessage(timeLeft, 3);
      setVictoryMessage(msg);
    } else {
      setStatus('LEVEL_WON');
    }
  };

  const handleCardClick = (id: number) => {
    if (isProcessing || status !== 'PLAYING') return;
    
    const target = cards.find(c => c.id === id);
    if (!target || target.isFlipped || target.isMatched || flippedCards.includes(id)) return;

    // Flip the card immediately for UI responsiveness
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedCards(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-mono overflow-x-hidden">
      {status === 'START' && (
        <div className="text-center space-y-12 max-w-lg animate-in fade-in duration-700">
          <div className="space-y-4">
            <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 animate-pulse">
              CHRONOS
            </h1>
            <p className="text-slate-500 uppercase tracking-[0.5em] text-[10px] font-bold">Memory Archiving System</p>
          </div>
          <button 
            onClick={startGame}
            className="group relative px-12 py-5 bg-transparent border border-cyan-500/50 text-cyan-400 font-bold tracking-widest hover:text-slate-950 transition-all duration-300"
          >
            <span className="relative z-10">INITIALIZE SEQUENCE</span>
            <div className="absolute inset-0 w-0 bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
          </button>
        </div>
      )}

      {status === 'PLAYING' && (
        <div className="w-full max-w-4xl space-y-8 animate-in zoom-in duration-300">
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Sector 0{currentLevelIdx + 1}</p>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.floor(currentLevel.rows * currentLevel.cols / 2) }).map((_, i) => (
                  <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${i < matches ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-slate-800'}`}></div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Temporal Buffer</p>
              <div className={`text-4xl font-black italic ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                {timeLeft}S
              </div>
            </div>
          </div>

          <div 
            className="grid gap-3 md:gap-4 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
              maxWidth: Math.min(currentLevel.cols * 140, 800)
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
        <div className="text-center space-y-10 animate-in slide-in-from-bottom duration-500">
          <div className="space-y-4">
            <h2 className="text-6xl font-black italic text-cyan-400 tracking-tight">STABILIZED</h2>
            <p className="text-slate-400 text-sm">Residue of {timeLeft}s will be injected into Sector 0{currentLevelIdx + 2}.</p>
          </div>
          <button 
            onClick={nextLevel}
            className="px-12 py-4 bg-cyan-500 text-slate-950 font-black tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            ADVANCE
          </button>
        </div>
      )}

      {status === 'GAME_OVER' && (
        <div className="text-center space-y-10 animate-in fade-in zoom-in">
          <h2 className="text-7xl font-black text-rose-600 italic">PURGED</h2>
          <p className="text-slate-400 uppercase tracking-widest text-xs">Critical Buffer Overflow</p>
          <button 
            onClick={startGame}
            className="px-10 py-4 border border-rose-600 text-rose-500 font-bold tracking-widest hover:bg-rose-600 hover:text-white transition-all"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}

      {status === 'VICTORY' && (
        <div className="max-w-2xl text-center space-y-8 animate-in zoom-in duration-1000">
          <div className="relative p-10 bg-slate-900/50 border border-slate-800 rounded-sm backdrop-blur-xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
             <h2 className="text-5xl font-black text-white italic mb-6">ARCHIVE COMPLETE</h2>
             <p className="text-lg text-cyan-200 leading-relaxed italic mb-8">
               "{victoryMessage || "Transmitting success signals across all sectors..."}"
             </p>
             <div className="flex justify-center gap-12 border-t border-slate-800 pt-8">
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 uppercase">Residual Time</p>
                  <p className="text-3xl font-black text-cyan-400">{timeLeft}S</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 uppercase">Sync Rating</p>
                  <p className="text-3xl font-black text-cyan-400">S+</p>
                </div>
             </div>
          </div>
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-white text-slate-950 font-black tracking-widest hover:bg-cyan-100 transition-all"
          >
            NEW PROTOCOL
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
