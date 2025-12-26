
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
  
  // 核心改动：记录每一关的耗时和起始时间
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
    setLevelStartTime(totalTime); // 记录本关开始时的总时长
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

  // 当关卡完成时计算耗时
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
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 sticky top-4 z-50 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-orbitron font-bold text-cyan-400 tracking-tighter">CHRONOS QUEST</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Memory Sync Active</p>
        </div>
        <div className="flex gap-4 md:gap-8 items-center">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Sector</div>
            <div className="text-xl font-orbitron text-white">{currentLevelIdx + 1}/3</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Time Left</div>
            <div className={`text-xl font-orbitron ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
              {timeLeft}s
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl flex items-center justify-center">
        {status === 'START' && (
          <div className="text-center p-12 bg-slate-900/80 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-xl">
            <i className="fas fa-brain text-cyan-400 text-6xl mb-6 animate-pulse"></i>
            <h2 className="text-4xl font-orbitron font-bold mb-4 text-white uppercase">Initialize System</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Scan the visual patterns. Link identical data blocks to clear the sector. 
              <span className="block mt-2 text-cyan-500 font-bold">Unused time is converted to energy for the next stage.</span>
            </p>
            <button 
              onClick={startGame}
              className="group relative px-10 py-4 bg-transparent text-cyan-400 font-bold rounded-xl border-2 border-cyan-400 transition-all hover:bg-cyan-400 hover:text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              START MISSION
            </button>
          </div>
        )}

        {status === 'PLAYING' && (
          <div 
            className="grid gap-3 md:gap-4 w-full place-items-center"
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
        )}

        {status === 'LEVEL_WON' && (
          <div className="text-center p-10 bg-emerald-900/30 rounded-3xl border border-emerald-500/50 backdrop-blur-xl max-w-md w-full">
            <i className="fas fa-microchip text-emerald-400 text-6xl mb-6"></i>
            <h2 className="text-3xl font-orbitron font-bold mb-2 text-white uppercase">Sector Synced</h2>
            
            <div className="my-6 p-4 bg-black/40 rounded-xl border border-emerald-500/20">
              <div className="flex justify-between text-sm uppercase tracking-widest mb-2">
                <span className="text-slate-400">Time Consumed</span>
                <span className="text-emerald-400 font-bold">{levelTimesSpent[levelTimesSpent.length - 1]}s</span>
              </div>
              <div className="flex justify-between text-sm uppercase tracking-widest">
                <span className="text-slate-400">Bonus Carryover</span>
                <span className="text-cyan-400 font-bold">+{timeLeft}s</span>
              </div>
            </div>

            <button 
              onClick={nextLevel}
              className="w-full px-10 py-4 bg-emerald-500 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              PROCEED TO NEXT SECTOR
            </button>
          </div>
        )}

        {status === 'GAME_OVER' && (
          <div className="text-center p-12 bg-red-950/40 rounded-3xl border border-red-500/50 backdrop-blur-xl">
            <i className="fas fa-skull text-red-500 text-6xl mb-6"></i>
            <h2 className="text-3xl font-orbitron font-bold mb-4 text-white uppercase">System Critical</h2>
            <p className="text-slate-400 mb-8">Memory bank corrupted. Time expired during synchronization.</p>
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-red-500 text-white font-bold rounded-xl transition-all hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              RESTART MISSION
            </button>
          </div>
        )}

        {status === 'VICTORY' && (
          <div className="text-center p-12 bg-cyan-900/30 rounded-3xl border border-cyan-400/50 backdrop-blur-xl max-w-xl w-full shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            <i className="fas fa-award text-yellow-400 text-7xl mb-6 shadow-glow"></i>
            <h2 className="text-4xl font-orbitron font-bold mb-4 text-white tracking-widest uppercase">Master Commander</h2>
            
            <div className="my-8 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Mission Report</h3>
              {levelTimesSpent.map((time, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-black/30 rounded-lg border border-cyan-500/10">
                  <span className="text-slate-400 text-xs font-bold uppercase">Sector {idx + 1}</span>
                  <span className="text-cyan-400 font-orbitron">{time}s</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-4 bg-cyan-400/10 rounded-lg border-2 border-cyan-400/30 mt-4">
                <span className="text-white text-sm font-bold uppercase">Total Sync Time</span>
                <span className="text-white font-orbitron text-xl">{levelTimesSpent.reduce((a, b) => a + b, 0)}s</span>
              </div>
            </div>

            <p className="text-cyan-300 italic mb-10 text-lg leading-relaxed px-4">
              "{victoryMessage || "Processing final victory logs..."}"
            </p>
            
            <button 
              onClick={startGame}
              className="w-full px-12 py-5 bg-cyan-400 text-black font-black rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              START NEW SIMULATION
            </button>
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-12 py-6 border-t border-slate-800/50 text-slate-600 text-[10px] flex justify-between uppercase tracking-widest">
        <span>© 2024 CHRONOS_LABS</span>
        <div className="flex gap-4">
          <span className="animate-pulse text-cyan-900">● SECURE_LINK_ESTABLISHED</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
