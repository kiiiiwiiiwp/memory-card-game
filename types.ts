
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
  { id: 1, rows: 2, cols: 3, baseTime: 30 }, // 6张卡，3对
  { id: 2, rows: 3, cols: 4, baseTime: 45 }, // 12张卡，6对
  { id: 3, rows: 4, cols: 5, baseTime: 60 }, // 20张卡，10对
];

// 图标与其对应的鲜艳颜色映射
export const CARD_DATA = [
  { icon: 'fa-atom', color: '#a855f7' },      // Purple
  { icon: 'fa-brain', color: '#ec4899' },     // Pink
  { icon: 'fa-bug', color: '#ef4444' },       // Red
  { icon: 'fa-cat', color: '#f97316' },       // Orange
  { icon: 'fa-chess-knight', color: '#eab308' }, // Yellow
  { icon: 'fa-code', color: '#22c55e' },      // Green
  { icon: 'fa-dna', color: '#06b6d4' },       // Cyan
  { icon: 'fa-dragon', color: '#3b82f6' },    // Blue
  { icon: 'fa-eye', color: '#6366f1' },       // Indigo
  { icon: 'fa-fish', color: '#14b8a6' },      // Teal
  { icon: 'fa-ghost', color: '#f8fafc' },     // White
  { icon: 'fa-hippo', color: '#94a3b8' },     // Slate
  { icon: 'fa-key', color: '#fbbf24' },       // Amber
  { icon: 'fa-meteor', color: '#f43f5e' },    // Rose
  { icon: 'fa-robot', color: '#84cc16' },     // Lime
  { icon: 'fa-microchip', color: '#4ade80' },  // Light Green
  { icon: 'fa-otter', color: '#78350f' },     // Brown
  { icon: 'fa-mask', color: '#c084fc' }       // Light Purple
];
