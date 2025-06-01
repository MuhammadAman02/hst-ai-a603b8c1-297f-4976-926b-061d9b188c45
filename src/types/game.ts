export interface Character {
  id: string;
  name: string;
  icon: string;
  color: string;
  trailColor: string;
  description: string;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  playerY: number;
  playerVelocity: number;
  obstacles: Obstacle[];
  selectedCharacter: Character;
  showCharacterSelect: boolean;
}

export interface Obstacle {
  id: string;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}