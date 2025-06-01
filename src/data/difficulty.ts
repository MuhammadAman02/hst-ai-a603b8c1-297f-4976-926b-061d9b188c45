export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  obstacleSpeed: number;
  obstacleSpacing: number;
  gapSize: number;
  spawnRate: number;
}

export const difficultyConfigs: Record<Difficulty, DifficultyConfig> = {
  easy: {
    obstacleSpeed: 2,
    obstacleSpacing: 300,
    gapSize: 200,
    spawnRate: 180
  },
  medium: {
    obstacleSpeed: 3,
    obstacleSpacing: 280,
    gapSize: 180,
    spawnRate: 160
  },
  hard: {
    obstacleSpeed: 4,
    obstacleSpacing: 250,
    gapSize: 160,
    spawnRate: 140
  }
};

export const getDifficultyConfig = (difficulty: Difficulty): DifficultyConfig => {
  return difficultyConfigs[difficulty];
};

export const getDifficultyForTime = (timeMs: number): Difficulty => {
  const timeSeconds = timeMs / 1000;
  if (timeSeconds < 60) return 'easy';
  if (timeSeconds < 120) return 'medium';
  return 'hard';
};

export const getDifficultyDisplayName = (difficulty: Difficulty): string => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export const getDifficultyColor = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'easy': return '#22c55e';
    case 'medium': return '#eab308';
    case 'hard': return '#ef4444';
    default: return '#ffffff';
  }
};