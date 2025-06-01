export interface Character {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  trailColor: string;
}

export interface Obstacle {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultySettings {
  obstacleSpeed: number;
  obstacleSpacing: number;
  gapSize: number;
  spawnRate: number;
  gravity: number;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  showCharacterSelect: boolean;
  playerY: number;
  playerVelocity: number;
  obstacles: Obstacle[];
  score: number;
  highScore: number;
  selectedCharacter: Character;
  difficulty: DifficultyLevel;
  gameStartTime: number;
  lastDifficultyChange: number;
}