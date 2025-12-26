
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Card, LEVELS, CARD_DATA } from './types';
import MemoryCard from './components/MemoryCard';
import { getVictoryMessage } from './services/geminiService';

console.log("App.tsx: Module loaded.");

const App: React.FC = () => {
  console.log("App.tsx: Component function called.");

  const [status, setStatus] = useState<GameStatus>('START');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [victoryMessage, setVictoryMessage] = useState<string>('');
  const [levelStartTime, setLevelStartTime] = useState(0);
  const [levelTimesSpent, setLevelTimesSpent] = useState<number[]>([]);

  const timerRef = useRef<number | null>(null);
  const currentLevel = LEVELS[currentLevelIdx];

  const initLevel = useCallback((levelIdx: number, bonusTime: number = 0) => {
    console.log(`App.tsx: Initializing Level ${levelIdx + 1} with bonus ${bonusTime}s`);
    const level = LEVELS[levelIdx];
    const pairCount = Math.floor((level.rows * level.cols) / 2);
    const selectedData = [...CARD_DATA].sort(() => Math.random() - 0.5).slice(0, pairCount);
    
    const newCards: Card[] = [];
    selectedData.forEach((data, index) => {
      const cardBase = { value: data.icon, icon: data.icon, color: data.color, isFlipped: false, isMatched: false };
      newCards.push({ ...cardBase, id: index * 2 });
      newCards.push({ ...cardBase, id: index * 2 + 1 });
    });

    const totalTime = level.baseTime + bonusTime;
    setCards(newCards.sort(() => Math.random() - 0.5));
    setTimeLeft(totalTime);
    setLevelStartTime(totalTime);
    setMatches(0);
    setFlippedCards([]);
    setIsProcessing(false);
    setStatus('PLAYING');
  }, []);

  const startGame = () => {
    console.log("App.tsx: Game started.");
    setCurrentLevelIdx(0);
    setLevelTimesSpent([]);
    initLevel(0, 0);
  };

  const nextLevel = () => {
    const bonus = timeLeft;
    const nextIdx = currentLevelIdx + 1;
    setCurrentLevelIdx(nextIdx);
    initLevel(nextIdx, bonus);
  };

  const handleCardClick = (id: number) => {
    if (isProcessing || flippedCards.length === 2) return;

    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      checkMatch(newFlipped);
    }
  };

  const checkMatch = (flipped: number[]) => {
    setIsProcessing(true);
    const [id1, id2] = flipped;
    const card1 = cards.find(c => c.id === id1)!;
    const card2 = cards.find(c => c.id === id2)!;

    if (card1.value === card2.value) {
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          (c.id === id1 || c.id === id2) ? { ...c, isMatched: true } : c
        ));
        
        setMatches(m => {
          const newMatches = m + 1;
          const pairCount = Math.floor((currentLevel.rows * currentLevel.cols) / 2);
          if (newMatches === pairCount) {
            handleLevelWon();
          }
          return newMatches;
        });
        setFlippedCards([]);
        setIsProcessing(false);
      }, 500);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          (c.id === id1 || c.id === id2) ? { ...c, isFlipped: false } : c
        ));
        setFlippedCards([]);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleLevelWon = () => {
    const timeSpent = levelStartTime - timeLeft;
    setLevelTimesSpent(prev => [...prev, timeSpent]);

    if (currentLevelIdx === LEVELS.length - 1) {
      setStatus('VICTORY');
      generateVictory(timeLeft);
    } else {
      setStatus('LEVEL_WON');
    }
  };

  const generateVictory = async (totalTime: number) => {
    try {
      const msg = await getVictoryMessage(totalTime, currentLevelIdx + 1);
      setVictoryMessage(msg);
    } catch (error) {
      console.error("Victory Message Generation Error:", error);
      setVictoryMessage("Cognitive synchronization complete. You have achieved peak mental efficiency.");
    }
  };

  useEffect(() => {
    if (status === 'PLAYING') {
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
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 font-mono overflow-x-hidden">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent tracking-tighter">
            CHRONOS QUEST
          </h1>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Neural Synchrony v2.5</span>
        </div>
        
        {status === 'PLAYING' && (
          <div className="flex gap-4 md:gap-8 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-cyan-400 uppercase">Sector</span>
              <span className="text-xl font-bold">{currentLevelIdx + 1} / {LEVELS.length}</span>
            </div>
            <div className="flex flex-col items-end min-w-[80px] md:min-w-[100px]">
              <span className="text-[10px] text-rose-500 uppercase">Time</span>
              <span className={`text-xl font-bold ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-4xl flex-grow flex flex-col items-center justify-center">
        {status === 'START' && (
          <div className="text-center space-y-8">
            <div className="relative inline-block">
               <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full"></div>
               <i className="fas fa-microchip text-8xl text-cyan-400 relative"></i>
            </div>
            <div className="max-w-md">
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                Welcome, Initiate. Your cognitive patterns will be tested through three levels of increasing complexity. Synchronize the data nodes before the system purge.
              </p>
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(8,145,178,0.4)] border border-cyan-400"
              >
                INITIALIZE COGNITIVE LINK
              </button>
            </div>
          </div>
        )}

        {status === 'PLAYING' && (
          <div 
            className="grid gap-3 md:gap-4 w-full justify-items-center"
            style={{ 
              gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
              maxWidth: currentLevel.cols * 120
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
        )}

        {status === 'LEVEL_WON' && (
          <div className="text-center space-y-6 max-w-sm">
            <h2 className="text-4xl font-black text-cyan-400">LEVEL SYNCED</h2>
            <p className="text-slate-400 text-sm">Core sequence complete. Remaining time will be transferred to next sector.</p>
            <div className="bg-slate-900/50 p-6 border border-slate-800 rounded-xl">
              <span className="text-slate-500 text-[10px] block mb-2 uppercase tracking-widest">Time Bonus Transferred</span>
              <span className="text-3xl font-bold text-green-400">+{timeLeft}s</span>
            </div>
            <button 
              onClick={nextLevel}
              className="w-full px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)]"
            >
              ADVANCE TO NEXT SECTOR
            </button>
          </div>
        )}

        {status === 'VICTORY' && (
          <div className="text-center space-y-8 max-w-xl px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full animate-pulse"></div>
              <i className="fas fa-trophy text-8xl text-yellow-400 mb-4 relative drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]"></i>
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">MISSION SUCCESS</h2>
            
            <div className="bg-slate-900/80 p-6 md:p-8 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
               <p className="italic text-base md:text-lg text-slate-200 leading-relaxed">
                 "{victoryMessage || 'Processing mission debrief...'}"
               </p>
               <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 uppercase block tracking-tighter">Time Remaining</span>
                    <span className="text-2xl font-bold text-cyan-400">{timeLeft}s</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 uppercase block tracking-tighter">Sync Score</span>
                    <span className="text-2xl font-bold text-cyan-400">{Math.floor(timeLeft * 100)}</span>
                  </div>
               </div>
            </div>

            <button 
              onClick={startGame}
              className="px-8 py-4 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white font-bold rounded-lg transition-all"
            >
              RESTART SIMULATION
            </button>
          </div>
        )}

        {status === 'GAME_OVER' && (
          <div className="text-center space-y-8">
            <i className="fas fa-exclamation-triangle text-8xl text-rose-500 animate-pulse"></i>
            <h2 className="text-4xl font-black text-rose-500">SYSTEM PURGE</h2>
            <p className="text-slate-400">Cognitive link severed. Memory buffers exhausted.</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)]"
            >
              REINITIALIZE SYSTEM
            </button>
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-8 pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-widest">
        <div>Link Status: {status === 'PLAYING' ? <span className="text-green-500">Active</span> : 'Standby'}</div>
        <div>Sector: 0x{currentLevelIdx + 1}7F</div>
        <div>Encryption: AES-2048</div>
      </footer>
    </div>
  );
};

export default App;
