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
    spawnRate: 150,
  },
  medium: {
    obstacleSpeed: 3,
    obstacleSpacing: 280,
    gapSize: 180,
    spawnRate: 130,
  },
  hard: {
    obstacleSpeed: 4,
    obstacleSpacing: 250,
    gapSize: 160,
    spawnRate: 110,
  },
};

export const getDifficultyConfig = (difficulty: Difficulty): DifficultyConfig => {
  return difficultyConfigs[difficulty];
};

export const getDifficultyForTime = (gameTime: number): Difficulty => {
  if (gameTime < 60000) return 'easy';
  if (gameTime < 120000) return 'medium';
  return 'hard';
};

export const getDifficultyDisplayName = (difficulty: Difficulty): string => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export const getDifficultyColor = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'easy':
      return '#22c55e'; // green
    case 'medium':
      return '#eab308'; // yellow
    case 'hard':
      return '#ef4444'; // red
    default:
      return '#ffffff';
  }
};