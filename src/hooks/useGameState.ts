import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Obstacle, Particle, Character } from '@/types/game';
import { characters } from '@/data/characters';
import { getDifficultyConfig, getDifficultyForTime } from '@/data/difficulty';
import { toast } from 'sonner';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 180;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerY: CANVAS_HEIGHT / 2,
    playerVelocity: 0,
    obstacles: [],
    score: 0,
    highScore: parseInt(localStorage.getItem('flappyHighScore') || '0'),
    isPlaying: false,
    isGameOver: false,
    showCharacterSelect: true,
    selectedCharacter: characters[0],
    difficulty: 'easy',
    gameStartTime: 0,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const gameLoopRef = useRef<number>();
  const lastObstacleX = useRef(CANVAS_WIDTH);
  const lastDifficultyChange = useRef(0);

  const createObstacle = useCallback((difficulty: 'easy' | 'medium' | 'hard'): Obstacle => {
    const config = getDifficultyConfig(difficulty);
    const gapStart = Math.random() * (CANVAS_HEIGHT - config.gapSize - 100) + 50;
    
    console.log(`Creating obstacle with difficulty: ${difficulty}, gap size: ${config.gapSize}`);
    
    return {
      x: CANVAS_WIDTH,
      topHeight: gapStart,
      bottomHeight: CANVAS_HEIGHT - gapStart - config.gapSize,
      passed: false,
    };
  }, []);

  const createParticle = useCallback((x: number, y: number, color: string): Particle => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    life: 1,
    maxLife: 1,
    color,
  }), []);

  const updateDifficulty = useCallback(() => {
    if (!gameState.isPlaying || gameState.gameStartTime === 0) return;

    const currentTime = Date.now() - gameState.gameStartTime;
    const newDifficulty = getDifficultyForTime(currentTime);
    
    if (newDifficulty !== gameState.difficulty) {
      console.log(`Difficulty changed from ${gameState.difficulty} to ${newDifficulty}`);
      
      setGameState(prev => ({ ...prev, difficulty: newDifficulty }));
      
      // Show toast notification
      const difficultyNames = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
      toast.success(`Difficulty increased to ${difficultyNames[newDifficulty]}!`, {
        duration: 2000,
      });
      
      lastDifficultyChange.current = currentTime;
    }
  }, [gameState.difficulty, gameState.isPlaying, gameState.gameStartTime]);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    
    console.log('Player jumping');
    setGameState(prev => ({
      ...prev,
      playerVelocity: -8, // Reduced from -12 to -8 for more controlled jumps
    }));

    // Create jump particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push(createParticle(
        120,
        gameState.playerY + 20,
        gameState.selectedCharacter.trailColor
      ));
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.playerY, gameState.selectedCharacter.trailColor, createParticle]);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying || prev.isGameOver) return prev;

      const newState = { ...prev };
      const config = getDifficultyConfig(prev.difficulty);

      // Apply gravity (reduced for better control)
      newState.playerVelocity += 0.5; // Reduced from 0.8 to 0.5 for gentler gravity
      newState.playerY += newState.playerVelocity;

      // Check boundaries
      if (newState.playerY < 0 || newState.playerY > CANVAS_HEIGHT - PLAYER_SIZE) {
        console.log('Player hit boundary');
        newState.isGameOver = true;
        return newState;
      }

      // Update obstacles
      newState.obstacles = prev.obstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - config.obstacleSpeed,
      })).filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

      // Add new obstacles
      if (lastObstacleX.current <= CANVAS_WIDTH - config.obstacleSpacing) {
        newState.obstacles.push(createObstacle(prev.difficulty));
        lastObstacleX.current = CANVAS_WIDTH;
      } else {
        lastObstacleX.current -= config.obstacleSpeed;
      }

      // Check collisions
      for (const obstacle of newState.obstacles) {
        if (
          120 + PLAYER_SIZE > obstacle.x &&
          120 < obstacle.x + OBSTACLE_WIDTH &&
          (newState.playerY < obstacle.topHeight ||
            newState.playerY + PLAYER_SIZE > CANVAS_HEIGHT - obstacle.bottomHeight)
        ) {
          console.log('Collision detected');
          newState.isGameOver = true;
          break;
        }

        // Score when passing obstacle
        if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < 120) {
          obstacle.passed = true;
          newState.score += 1;
          console.log('Score increased to:', newState.score);
        }
      }

      return newState;
    });

    // Update particles
    setParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      life: particle.life - 0.02,
    })).filter(particle => particle.life > 0));

    // Update difficulty
    updateDifficulty();

    if (gameState.isPlaying && !gameState.isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.isPlaying, gameState.isGameOver, createObstacle, updateDifficulty]);

  const startGame = useCallback(() => {
    console.log('Starting new game');
    setGameState(prev => ({
      ...prev,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      score: 0,
      isPlaying: true,
      isGameOver: false,
      showCharacterSelect: false,
      difficulty: 'easy',
      gameStartTime: Date.now(),
    }));
    setParticles([]);
    lastObstacleX.current = CANVAS_WIDTH;
    lastDifficultyChange.current = 0;
  }, []);

  const gameOver = useCallback(() => {
    console.log('Game over triggered');
    setGameState(prev => {
      const newHighScore = Math.max(prev.score, prev.highScore);
      if (newHighScore > prev.highScore) {
        localStorage.setItem('flappyHighScore', newHighScore.toString());
        console.log('New high score:', newHighScore);
      }
      
      return {
        ...prev,
        isPlaying: false,
        highScore: newHighScore,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    console.log('Resetting game to character select');
    setGameState(prev => ({
      ...prev,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      score: 0,
      isPlaying: false,
      isGameOver: false,
      showCharacterSelect: true,
      difficulty: 'easy',
      gameStartTime: 0,
    }));
    setParticles([]);
    lastObstacleX.current = CANVAS_WIDTH;
    lastDifficultyChange.current = 0;
  }, []);

  const selectCharacter = useCallback((character: Character) => {
    console.log('Character selected:', character.name);
    setGameState(prev => ({
      ...prev,
      selectedCharacter: character,
    }));
  }, []);

  return {
    gameState,
    particles,
    startGame,
    jump,
    gameOver,
    resetGame,
    selectCharacter,
    gameLoop,
    gameLoopRef,
  };
};