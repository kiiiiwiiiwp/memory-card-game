
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
  const [victoryMessage, setVictoryMessage] = useState('');
  const [isLoadingVictory, setIsLoadingVictory] = useState(false);

  const timerRef = useRef<number | null>(null);
  const currentLevel = LEVELS[currentLevelIdx];

  const initLevel = useCallback((levelIdx: number, bonusTime: number = 0) => {
    const level = LEVELS[levelIdx];
    if (!level) return;

    const pairCount = Math.floor((level.rows * level.cols) / 2);
    const selectedIcons = [...CARD_DATA].sort(() => Math.random() - 0.5).slice(0, pairCount);
    
    const newCards: Card[] = [];
    selectedIcons.forEach((data, index) => {
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

    setCards(newCards.sort(() => Math.random() - 0.5));
    setTimeLeft(level.baseTime + bonusTime);
    setMatches(0);
    setFlippedCards([]);
    setIsProcessing(false);
    setStatus('PLAYING');
  }, []);

  const startGame = () => {
    setCurrentLevelIdx(0);
    setVictoryMessage('');
    initLevel(0, 0);
  };

  const nextLevel = () => {
    const bonus = timeLeft;
    const nextIdx = currentLevelIdx + 1;
    setCurrentLevelIdx(nextIdx);
    initLevel(nextIdx, bonus);
  };

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, timeLeft]);

  useEffect(() => {
    if (flippedCards.length === 2 && !isProcessing) {
      const [id1, id2] = flippedCards;
      const card1 = cards.find(c => c.id === id1);
      const card2 = cards.find(c => c.id === id2);
      if (!card1 || !card2) return;

      setIsProcessing(true);
      if (card1.value === card2.value) {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, isMatched: true } : c));
          setMatches(m => {
            const nextMatches = m + 1;
            const totalPairs = Math.floor((currentLevel.rows * currentLevel.cols) / 2);
            if (nextMatches === totalPairs) {
              if (currentLevelIdx === LEVELS.length - 1) {
                handleVictory();
              } else {
                setStatus('LEVEL_WON');
              }
            }
            return nextMatches;
          });
          setFlippedCards([]);
          setIsProcessing(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === id1 || c.id === id2) ? { ...c, isFlipped: false } : c));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 800);
      }
    }
  }, [flippedCards, cards, currentLevel, isProcessing, currentLevelIdx]);

  const handleVictory = async () => {
    setStatus('VICTORY');
    setIsLoadingVictory(true);
    const msg = await getVictoryMessage(timeLeft);
    setVictoryMessage(msg);
    setIsLoadingVictory(false);
  };

  const handleCardClick = (id: number) => {
    if (isProcessing || flippedCards.length >= 2 || status !== 'PLAYING') return;
    const target = cards.find(c => c.id === id);
    if (!target || target.isFlipped || target.isMatched) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedCards(prev => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-100 flex flex-col items-center justify-center p-4 font-mono">
      {status === 'START' && (
        <div className="text-center space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-600 font-orbitron">
              CHRONOS
            </h1>
            <p className="text-cyan-500/60 uppercase tracking-[0.4em] text-xs font-bold">Memory Archiving Interface</p>
          </div>
          <button onClick={startGame} className="group relative px-12 py-5 bg-transparent border border-cyan-500/50 text-cyan-400 font-bold tracking-widest hover:text-white transition-all duration-300">
            <span className="relative z-10">INITIALIZE</span>
            <div className="absolute inset-0 w-0 bg-cyan-600 transition-all duration-300 group-hover:w-full"></div>
          </button>
        </div>
      )}

      {status === 'PLAYING' && (
        <div className="w-full max-w-4xl space-y-8 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div className="space-y-2">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Sector Protocol 0{currentLevelIdx + 1}</p>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.floor(currentLevel.rows * currentLevel.cols / 2) }).map((_, i) => (
                  <div key={i} className={`h-1.5 w-6 rounded-sm ${i < matches ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-slate-900 border border-slate-800'}`}></div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Temporal Buffer</p>
              <div className={`text-4xl font-black italic tracking-tighter font-orbitron ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                {timeLeft}S
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`, maxWidth: Math.min(currentLevel.cols * 140, 900) }}>
            {cards.map(card => <MemoryCard key={card.id} card={card} onClick={() => handleCardClick(card.id)} disabled={isProcessing} />)}
          </div>
        </div>
      )}

      {status === 'LEVEL_WON' && (
        <div className="text-center space-y-10 animate-in slide-in-from-bottom duration-500">
          <h2 className="text-6xl font-black italic text-cyan-400 font-orbitron">已同步</h2>
          <p className="text-slate-400">剩余时间 <span className="text-cyan-400 font-bold">{timeLeft}s</span> 已累加至下一扇区。</p>
          <button onClick={nextLevel} className="px-12 py-4 bg-cyan-500 text-slate-950 font-black tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]">进入下一扇区</button>
        </div>
      )}

      {status === 'GAME_OVER' && (
        <div className="text-center space-y-10 animate-in zoom-in">
          <h2 className="text-7xl font-black text-rose-600 italic font-orbitron">已断开</h2>
          <button onClick={startGame} className="px-10 py-4 border border-rose-600 text-rose-500 font-bold tracking-widest hover:bg-rose-600 hover:text-white transition-all">重启系统</button>
        </div>
      )}

      {status === 'VICTORY' && (
        <div className="max-w-xl text-center space-y-8 animate-in zoom-in-90 duration-700">
          <div className="p-10 bg-slate-900/40 border border-slate-800 rounded-sm backdrop-blur-xl relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
             <h2 className="text-5xl font-black text-white italic mb-6 font-orbitron">同步完成</h2>
             {isLoadingVictory ? <p className="animate-pulse text-cyan-500">正在生成评估报告...</p> : <p className="text-lg text-cyan-200 leading-relaxed italic mb-8">"{victoryMessage}"</p>}
             <div className="flex justify-center gap-12 border-t border-slate-800 pt-8">
                <div className="text-left">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">最终剩余时间</p>
                  <p className="text-4xl font-black text-cyan-400 font-orbitron">{timeLeft}S</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">认知评级</p>
                  <p className="text-4xl font-black text-cyan-400 font-orbitron">S-RANK</p>
                </div>
             </div>
          </div>
          <button onClick={startGame} className="px-12 py-4 bg-white text-slate-950 font-black tracking-widest hover:bg-cyan-50 transition-all">重新开始</button>
        </div>
      )}
    </div>
  );
};

export default App;
