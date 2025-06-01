import { useState, useRef, useCallback } from 'react';
import { GameState, Character, Obstacle, Particle } from '@/types/game';
import { characters } from '@/data/characters';
import { getDifficultyConfig, getDifficultyForTime } from '@/data/difficulty';
import { toast } from 'sonner';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    showCharacterSelect: true,
    score: 0,
    highScore: parseInt(localStorage.getItem('flappyHighScore') || '0'),
    playerY: CANVAS_HEIGHT / 2,
    playerVelocity: 0,
    obstacles: [],
    selectedCharacter: characters[0],
    difficulty: 'easy',
    gameStartTime: 0,
    lastObstacleSpawn: 0,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const gameLoopRef = useRef<number>();
  const lastDifficultyRef = useRef<string>('easy');

  const createObstacle = useCallback((x: number, difficulty: string): Obstacle => {
    const config = getDifficultyConfig(difficulty as any);
    const gapY = Math.random() * (CANVAS_HEIGHT - config.gapSize - 100) + 50;
    
    console.log('Creating obstacle with gap:', {
      gapY,
      gapSize: config.gapSize,
      topHeight: gapY,
      bottomHeight: CANVAS_HEIGHT - (gapY + config.gapSize)
    });
    
    return {
      x,
      topHeight: gapY,
      bottomHeight: CANVAS_HEIGHT - (gapY + config.gapSize),
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

  const checkCollision = useCallback((playerY: number, obstacles: Obstacle[]): boolean => {
    const playerX = 120;
    const playerSize = 20;

    // Check bounds
    if (playerY < 0 || playerY + playerSize > CANVAS_HEIGHT) {
      return true;
    }

    // Check obstacle collision
    for (const obstacle of obstacles) {
      if (
        playerX + playerSize > obstacle.x &&
        playerX < obstacle.x + 80 &&
        (playerY < obstacle.topHeight || playerY + playerSize > CANVAS_HEIGHT - obstacle.bottomHeight)
      ) {
        return true;
      }
    }

    return false;
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.isPlaying || prevState.isGameOver) {
        return prevState;
      }

      const currentTime = Date.now();
      const gameTime = currentTime - prevState.gameStartTime;
      const newDifficulty = getDifficultyForTime(gameTime);
      const config = getDifficultyConfig(newDifficulty);

      // Check for difficulty change
      if (newDifficulty !== lastDifficultyRef.current) {
        lastDifficultyRef.current = newDifficulty;
        toast.success(`Difficulty increased to ${newDifficulty.toUpperCase()}!`, {
          duration: 2000,
        });
      }

      // Update player physics
      const newVelocity = prevState.playerVelocity + GRAVITY;
      const newPlayerY = prevState.playerY + newVelocity;

      // Update obstacles
      let newObstacles = prevState.obstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - config.obstacleSpeed,
      }));

      // Remove off-screen obstacles
      newObstacles = newObstacles.filter(obstacle => obstacle.x > -100);

      // Spawn new obstacles
      if (currentTime - prevState.lastObstacleSpawn > config.spawnRate) {
        const lastObstacle = newObstacles[newObstacles.length - 1];
        const spawnX = lastObstacle ? Math.max(CANVAS_WIDTH, lastObstacle.x + config.obstacleSpacing) : CANVAS_WIDTH;
        newObstacles.push(createObstacle(spawnX, newDifficulty));
        
        return {
          ...prevState,
          lastObstacleSpawn: currentTime,
          obstacles: newObstacles,
          playerY: newPlayerY,
          playerVelocity: newVelocity,
          difficulty: newDifficulty,
        };
      }

      // Check for scoring
      let newScore = prevState.score;
      newObstacles.forEach(obstacle => {
        if (!obstacle.passed && obstacle.x + 80 < 120) {
          obstacle.passed = true;
          newScore++;
        }
      });

      // Check collision
      if (checkCollision(newPlayerY, newObstacles)) {
        console.log('Collision detected - game over');
        return {
          ...prevState,
          isGameOver: true,
          score: newScore,
          highScore: Math.max(newScore, prevState.highScore),
        };
      }

      return {
        ...prevState,
        playerY: newPlayerY,
        playerVelocity: newVelocity,
        obstacles: newObstacles,
        score: newScore,
        difficulty: newDifficulty,
      };
    });

    // Update particles
    setParticles(prevParticles => {
      return prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.02,
        }))
        .filter(particle => particle.life > 0);
    });

    if (gameLoopRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [createObstacle, checkCollision]);

  const jump = useCallback(() => {
    console.log('Jump triggered');
    setGameState(prevState => ({
      ...prevState,
      playerVelocity: JUMP_FORCE,
    }));

    // Add jump particles
    setParticles(prevParticles => [
      ...prevParticles,
      ...Array.from({ length: 5 }, () =>
        createParticle(120, gameState.playerY, gameState.selectedCharacter.trailColor)
      ),
    ]);
  }, [createParticle, gameState.playerY, gameState.selectedCharacter.trailColor]);

  const startGame = useCallback(() => {
    console.log('Starting game');
    const currentTime = Date.now();
    lastDifficultyRef.current = 'easy';
    
    setGameState(prevState => ({
      ...prevState,
      isPlaying: true,
      isGameOver: false,
      showCharacterSelect: false,
      score: 0,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [createObstacle(CANVAS_WIDTH, 'easy')],
      difficulty: 'easy',
      gameStartTime: currentTime,
      lastObstacleSpawn: currentTime,
    }));
    setParticles([]);
  }, [createObstacle]);

  const gameOver = useCallback(() => {
    console.log('Game over triggered');
    setGameState(prevState => {
      const newHighScore = Math.max(prevState.score, prevState.highScore);
      localStorage.setItem('flappyHighScore', newHighScore.toString());
      
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = undefined;
      }
      
      return {
        ...prevState,
        isPlaying: false,
        highScore: newHighScore,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    console.log('Resetting game to character select');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    }
    
    setGameState(prevState => ({
      ...prevState,
      isPlaying: false,
      isGameOver: false,
      showCharacterSelect: true,
      score: 0,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      difficulty: 'easy',
      gameStartTime: 0,
      lastObstacleSpawn: 0,
    }));
    setParticles([]);
  }, []);

  const selectCharacter = useCallback((character: Character) => {
    console.log('Character selected:', character.name);
    setGameState(prevState => ({
      ...prevState,
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