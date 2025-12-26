
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, Card, LEVELS, CARD_DATA } from './types';
import MemoryCard from './components/MemoryCard';
import { getVictoryMessage } from './services/geminiService';

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
  const [levelTimesSpent, setLevelTimesSpent] = useState<number[]>([]);

  const timerRef = useRef<number | null>(null);
  const currentLevel = LEVELS[currentLevelIdx];

  const initLevel = useCallback((levelIdx: number, bonusTime: number = 0) => {
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
    const card1 = cards.find(c => c.id === id1);
    const card2 = cards.find(c => c.id === id2);

    if (card1?.value === card2?.value) {
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          (c.id === id1 || c.id === id2) ? { ...c, isMatched: true, isFlipped: false } : c
        ));
        setMatches(prev => prev + 1);
        setFlippedCards([]);
        setIsProcessing(false);
      }, 400);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          (c.id === id1 || c.id === id2) ? { ...c, isFlipped: false } : c
        ));
        setFlippedCards([]);
        setIsProcessing(false);
      }, 800);
    }
  };

  useEffect(() => {
    const totalPairs = Math.floor((currentLevel.rows * currentLevel.cols) / 2);
    if (matches === totalPairs && status === 'PLAYING') {
      const timeSpent = levelStartTime - timeLeft;
      setLevelTimesSpent(prev => [...prev, timeSpent]);

      if (currentLevelIdx === LEVELS.length - 1) {
        setStatus('VICTORY');
      } else {
        setStatus('LEVEL_WON');
      }
    }
  }, [matches, currentLevelIdx, currentLevel, status, timeLeft, levelStartTime]);

  useEffect(() => {
    if (status === 'PLAYING' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
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
  }, [status, timeLeft]);

  useEffect(() => {
    if (status === 'VICTORY') {
      const totalTime = levelTimesSpent.reduce((a, b) => a + b, 0);
      getVictoryMessage(totalTime, currentLevelIdx + 1).then(msg => setVictoryMessage(msg));
    }
  }, [status, levelTimesSpent, currentLevelIdx]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative overflow-hidden">
      {/* 胜利背景特效 */}
      {status === 'VICTORY' && Array.from({ length: 20 }).map((_, i) => (
        <div 
          key={i} 
          className="particle" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 4}s`,
            background: i % 2 === 0 ? '#22d3ee' : '#fbbf24'
          }}
        />
      ))}

      <header className="w-full max-w-4xl flex justify-between items-center mb-8 sticky top-4 z-50 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-orbitron font-bold text-cyan-400 tracking-tighter uppercase">Chronos Quest</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Memory Sync Terminal</p>
        </div>
        <div className="flex gap-4 md:gap-8 items-center">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Sector</div>
            <div className="text-xl font-orbitron text-white leading-none">{currentLevelIdx + 1}/3</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Time Buffer</div>
            <div className={`text-xl font-orbitron leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl flex items-center justify-center">
        {status === 'START' && (
          <div className="text-center p-8 md:p-12 bg-slate-900/80 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-xl max-w-lg">
            <div className="relative inline-block mb-6">
              <i className="fas fa-brain text-cyan-400 text-6xl animate-pulse"></i>
              <div className="absolute inset-0 blur-xl bg-cyan-400/20"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 text-white">INITIALIZE SYSTEM</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Sync the neural patterns to clear the sector. 
              <span className="block mt-2 text-cyan-500 font-bold uppercase text-xs tracking-widest">Efficiency is Key: Time saved is energy for the next tier.</span>
            </p>
            <button 
              onClick={startGame}
              className="w-full py-4 bg-transparent text-cyan-400 font-bold rounded-xl border-2 border-cyan-400 transition-all hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95"
            >
              ENGAGE MISSION
            </button>
          </div>
        )}

        {status === 'PLAYING' && (
          <div 
            className="grid gap-2 md:gap-4 w-full place-items-center"
            style={{ 
              gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
              maxWidth: '100%' 
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
          <div className="text-center p-10 bg-emerald-900/20 rounded-3xl border border-emerald-500/50 backdrop-blur-xl max-w-md w-full shadow-2xl">
            <i className="fas fa-check-double text-emerald-400 text-6xl mb-6"></i>
            <h2 className="text-3xl font-orbitron font-bold mb-2 text-white">SECTOR SYNCED</h2>
            
            <div className="my-6 space-y-2">
              <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-emerald-500/10">
                <span className="text-slate-400 text-xs uppercase font-bold">Time Consumed</span>
                <span className="text-emerald-400 font-orbitron text-lg">{levelTimesSpent[levelTimesSpent.length - 1]}s</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-cyan-500/10">
                <span className="text-slate-400 text-xs uppercase font-bold">Bonus carryover</span>
                <span className="text-cyan-400 font-orbitron text-lg">+{timeLeft}s</span>
              </div>
            </div>

            <button 
              onClick={nextLevel}
              className="w-full px-10 py-4 bg-emerald-500 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              PROCEED TO NEXT SECTOR
            </button>
          </div>
        )}

        {status === 'GAME_OVER' && (
          <div className="text-center p-12 bg-red-950/40 rounded-3xl border border-red-500/50 backdrop-blur-xl max-w-md w-full">
            <i className="fas fa-exclamation-triangle text-red-500 text-6xl mb-6 animate-bounce"></i>
            <h2 className="text-3xl font-orbitron font-bold mb-4 text-white uppercase">Sync Failed</h2>
            <p className="text-slate-400 mb-8">Data corruption detected. Neural link severed due to timeout.</p>
            <button 
              onClick={startGame}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              RESTART SYNC
            </button>
          </div>
        )}

        {status === 'VICTORY' && (
          <div className="text-center p-10 md:p-12 bg-slate-900/60 rounded-3xl border border-cyan-400/50 backdrop-blur-2xl max-w-xl w-full shadow-[0_0_60px_rgba(34,211,238,0.2)] z-10">
            <div className="relative inline-block mb-6">
              <i className="fas fa-trophy text-yellow-400 text-7xl drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 text-white tracking-widest uppercase">Mission Complete</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              {levelTimesSpent.map((time, idx) => (
                <div key={idx} className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Sector {idx + 1}</div>
                  <div className="text-cyan-400 font-orbitron">{time}s</div>
                </div>
              ))}
            </div>

            <div className="mb-10 p-6 bg-cyan-400/5 rounded-2xl border-2 border-cyan-400/20 relative overflow-hidden">
               <div className="relative z-10">
                 <div className="text-[10px] text-cyan-500 uppercase font-black tracking-widest mb-2">Game Master Log</div>
                 <p className="text-white italic text-lg leading-relaxed">
                   "{victoryMessage || "Decoding final success protocols..."}"
                 </p>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <i className="fas fa-quote-right text-4xl text-cyan-400"></i>
               </div>
            </div>
            
            <button 
              onClick={startGame}
              className="w-full py-5 bg-cyan-400 text-black font-black rounded-xl transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] uppercase tracking-widest"
            >
              New Simulation
            </button>
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-12 py-6 border-t border-slate-800/50 text-slate-600 text-[9px] flex justify-between uppercase tracking-[0.2em] font-bold">
        <span>EST. 2024 // CHRONOS_OS</span>
        <div className="flex gap-4">
          <span className="animate-pulse text-cyan-900/50">Connection: SECURE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
