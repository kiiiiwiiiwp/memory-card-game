
export type GameStatus = 'START' | 'PLAYING' | 'LEVEL_WON' | 'GAME_OVER' | 'VICTORY';

export interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  icon: string;
  color: string;
}

export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  baseTime: number;
}

export const LEVELS: LevelConfig[] = [
  { id: 1, rows: 2, cols: 3, baseTime: 30 },
  { id: 2, rows: 3, cols: 4, baseTime: 45 },
  { id: 3, rows: 4, cols: 5, baseTime: 60 },
];

export const CARD_DATA = [
  { icon: 'fa-atom', color: '#a855f7' },
  { icon: 'fa-brain', color: '#ec4899' },
  { icon: 'fa-bug', color: '#ef4444' },
  { icon: 'fa-cat', color: '#f97316' },
  { icon: 'fa-chess-knight', color: '#eab308' },
  { icon: 'fa-code', color: '#22c55e' },
  { icon: 'fa-dna', color: '#06b6d4' },
  { icon: 'fa-dragon', color: '#3b82f6' },
  { icon: 'fa-eye', color: '#6366f1' },
  { icon: 'fa-fish', color: '#14b8a6' },
  { icon: 'fa-ghost', color: '#f8fafc' },
  { icon: 'fa-robot', color: '#84cc16' },
  { icon: 'fa-microchip', color: '#4ade80' },
  { icon: 'fa-meteor', color: '#f43f5e' }
];
