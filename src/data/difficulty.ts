import { DifficultySettings, DifficultyLevel } from '@/types/game';

export const difficultySettings: Record<DifficultyLevel, DifficultySettings> = {
  easy: {
    obstacleSpeed: 2,
    obstacleSpacing: 300,
    gapSize: 200,
    spawnRate: 180, // frames between obstacles
    gravity: 0.4,
  },
  medium: {
    obstacleSpeed: 3.5,
    obstacleSpacing: 280,
    gapSize: 170,
    spawnRate: 150,
    gravity: 0.5,
  },
  hard: {
    obstacleSpeed: 5,
    obstacleSpacing: 250,
    gapSize: 140,
    spawnRate: 120,
    gravity: 0.6,
  },
};

export const getDifficultyForTime = (gameTimeMs: number): DifficultyLevel => {
  const gameTimeSeconds = gameTimeMs / 1000;
  
  if (gameTimeSeconds < 60) {
    return 'easy';
  } else if (gameTimeSeconds < 120) {
    return 'medium';
  } else {
    return 'hard';
  }
};

export const getDifficultyDisplayName = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 'easy':
      return 'Easy Mode';
    case 'medium':
      return 'Medium Mode';
    case 'hard':
      return 'Hard Mode';
    default:
      return 'Easy Mode';
  }
};

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 'easy':
      return '#10b981'; // green
    case 'medium':
      return '#f59e0b'; // yellow
    case 'hard':
      return '#ef4444'; // red
    default:
      return '#10b981';
  }
};