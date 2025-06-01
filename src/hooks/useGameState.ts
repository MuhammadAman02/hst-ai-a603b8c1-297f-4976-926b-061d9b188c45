import { useState, useRef, useCallback } from 'react';
import { GameState, Character, Obstacle, Particle } from '@/types/game';
import { characters } from '@/data/characters';
import { getDifficultyConfig, getDifficultyForTime, type Difficulty } from '@/data/difficulty';
import { toast } from 'sonner';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_X = 120;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;

export const useGameState = () => {
  console.log('Initializing useGameState hook');
  
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
    difficulty: 'easy' as Difficulty,
    gameStartTime: 0,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const gameLoopRef = useRef<number>();
  const lastObstacleSpawn = useRef<number>(0);
  const lastDifficultyCheck = useRef<number>(0);

  const createObstacle = useCallback((x: number): Obstacle => {
    const config = getDifficultyConfig(gameState.difficulty);
    const gapY = Math.random() * (CANVAS_HEIGHT - config.gapSize - 100) + 50;
    
    return {
      x,
      topHeight: gapY,
      bottomHeight: CANVAS_HEIGHT - gapY - config.gapSize,
      passed: false,
    };
  }, [gameState.difficulty]);

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
    const playerRadius = 20;
    const playerCenterY = playerY + playerRadius;

    // Check bounds
    if (playerCenterY - playerRadius <= 0 || playerCenterY + playerRadius >= CANVAS_HEIGHT) {
      return true;
    }

    // Check obstacle collision
    for (const obstacle of obstacles) {
      if (
        PLAYER_X + playerRadius > obstacle.x &&
        PLAYER_X - playerRadius < obstacle.x + 80
      ) {
        if (
          playerCenterY - playerRadius < obstacle.topHeight ||
          playerCenterY + playerRadius > CANVAS_HEIGHT - obstacle.bottomHeight
        ) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const updateDifficulty = useCallback((currentTime: number) => {
    const gameTime = currentTime - gameState.gameStartTime;
    const newDifficulty = getDifficultyForTime(gameTime);
    
    if (newDifficulty !== gameState.difficulty) {
      console.log(`Difficulty changed from ${gameState.difficulty} to ${newDifficulty}`);
      
      setGameState(prev => ({
        ...prev,
        difficulty: newDifficulty,
      }));

      // Show toast notification
      const difficultyNames = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
      };
      
      toast.success(`Difficulty increased to ${difficultyNames[newDifficulty]}!`, {
        description: 'The game just got more challenging!',
        duration: 3000,
      });
    }
  }, [gameState.difficulty, gameState.gameStartTime]);

  const gameLoop = useCallback(() => {
    console.log('Game loop iteration');
    
    setGameState(prev => {
      if (!prev.isPlaying || prev.isGameOver) {
        console.log('Game not playing or game over, stopping loop');
        return prev;
      }

      const currentTime = Date.now();
      const config = getDifficultyConfig(prev.difficulty);
      
      // Update difficulty based on time
      if (currentTime - lastDifficultyCheck.current > 1000) {
        const gameTime = currentTime - prev.gameStartTime;
        const newDifficulty = getDifficultyForTime(gameTime);
        
        if (newDifficulty !== prev.difficulty) {
          console.log(`Difficulty changed from ${prev.difficulty} to ${newDifficulty}`);
          
          const difficultyNames = {
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard'
          };
          
          toast.success(`Difficulty increased to ${difficultyNames[newDifficulty]}!`, {
            description: 'The game just got more challenging!',
            duration: 3000,
          });
          
          lastDifficultyCheck.current = currentTime;
          
          return {
            ...prev,
            difficulty: newDifficulty,
          };
        }
        
        lastDifficultyCheck.current = currentTime;
      }

      // Update player physics
      const newVelocity = prev.playerVelocity + GRAVITY;
      const newPlayerY = Math.max(0, Math.min(CANVAS_HEIGHT - 40, prev.playerY + newVelocity));

      // Update obstacles
      const updatedObstacles = prev.obstacles
        .map(obstacle => ({
          ...obstacle,
          x: obstacle.x - config.obstacleSpeed,
        }))
        .filter(obstacle => obstacle.x > -80);

      // Spawn new obstacles
      if (currentTime - lastObstacleSpawn.current > config.spawnRate) {
        updatedObstacles.push(createObstacle(CANVAS_WIDTH));
        lastObstacleSpawn.current = currentTime;
      }

      // Update score
      let newScore = prev.score;
      updatedObstacles.forEach(obstacle => {
        if (!obstacle.passed && obstacle.x + 80 < PLAYER_X) {
          obstacle.passed = true;
          newScore++;
        }
      });

      // Check collision
      const collision = checkCollision(newPlayerY, updatedObstacles);

      if (collision) {
        console.log('Collision detected, game over');
        const finalScore = newScore;
        const newHighScore = Math.max(finalScore, prev.highScore);
        
        if (newHighScore > prev.highScore) {
          localStorage.setItem('flappyHighScore', newHighScore.toString());
        }

        return {
          ...prev,
          isGameOver: true,
          isPlaying: false,
          score: finalScore,
          highScore: newHighScore,
        };
      }

      return {
        ...prev,
        playerY: newPlayerY,
        playerVelocity: newVelocity,
        obstacles: updatedObstacles,
        score: newScore,
      };
    });

    // Update particles
    setParticles(prev => {
      const updatedParticles = prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.02,
        }))
        .filter(particle => particle.life > 0);

      // Add new particles for trail effect
      if (gameState.isPlaying && Math.random() < 0.3) {
        updatedParticles.push(
          createParticle(
            PLAYER_X,
            gameState.playerY + 20,
            gameState.selectedCharacter.trailColor
          )
        );
      }

      return updatedParticles;
    });

    if (gameState.isPlaying && !gameState.isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.isPlaying, gameState.isGameOver, gameState.playerY, gameState.selectedCharacter.trailColor, gameState.difficulty, gameState.gameStartTime, createObstacle, createParticle, checkCollision]);

  const startGame = useCallback(() => {
    console.log('Starting game');
    const startTime = Date.now();
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      showCharacterSelect: false,
      score: 0,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      difficulty: 'easy' as Difficulty,
      gameStartTime: startTime,
    }));
    
    setParticles([]);
    lastObstacleSpawn.current = startTime;
    lastDifficultyCheck.current = startTime;
    
    toast.success('Game started in Easy mode!', {
      description: 'Difficulty will increase every minute',
      duration: 2000,
    });
  }, []);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    
    console.log('Player jumping');
    setGameState(prev => ({
      ...prev,
      playerVelocity: JUMP_FORCE,
    }));

    // Add jump particles
    setParticles(prev => [
      ...prev,
      ...Array.from({ length: 5 }, () =>
        createParticle(
          PLAYER_X,
          gameState.playerY + 20,
          gameState.selectedCharacter.trailColor
        )
      ),
    ]);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.playerY, gameState.selectedCharacter.trailColor, createParticle]);

  const gameOver = useCallback(() => {
    console.log('Game over function called');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  }, []);

  const resetGame = useCallback(() => {
    console.log('Resetting game');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: false,
      showCharacterSelect: true,
      score: 0,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      difficulty: 'easy' as Difficulty,
      gameStartTime: 0,
    }));
    
    setParticles([]);
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