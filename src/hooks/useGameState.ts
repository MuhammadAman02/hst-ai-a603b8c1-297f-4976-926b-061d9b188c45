import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Obstacle, Particle, DifficultyLevel } from '@/types/game';
import { characters } from '@/data/characters';
import { difficultySettings, getDifficultyForTime } from '@/data/difficulty';
import { toast } from '@/hooks/use-toast';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 80;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    showCharacterSelect: true,
    playerY: CANVAS_HEIGHT / 2,
    playerVelocity: 0,
    obstacles: [],
    score: 0,
    highScore: parseInt(localStorage.getItem('flappyHighScore') || '0'),
    selectedCharacter: characters[0],
    difficulty: 'easy',
    gameStartTime: 0,
    lastDifficultyChange: 0,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const gameLoopRef = useRef<number>();
  const frameCountRef = useRef(0);

  const createParticle = useCallback((x: number, y: number, color: string): Particle => {
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      maxLife: 1,
      color,
    };
  }, []);

  const updateParticles = useCallback(() => {
    setParticles(prev => 
      prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 0.02,
        }))
        .filter(particle => particle.life > 0)
    );
  }, []);

  const checkDifficultyProgression = useCallback((currentTime: number, currentDifficulty: DifficultyLevel) => {
    const newDifficulty = getDifficultyForTime(currentTime);
    
    if (newDifficulty !== currentDifficulty) {
      console.log(`Difficulty changed from ${currentDifficulty} to ${newDifficulty}`);
      
      // Show toast notification for difficulty change
      const difficultyNames = {
        easy: 'Easy Mode',
        medium: 'Medium Mode',
        hard: 'Hard Mode'
      };
      
      toast({
        title: `Difficulty Increased!`,
        description: `Now playing on ${difficultyNames[newDifficulty]}`,
        duration: 3000,
      });
      
      return newDifficulty;
    }
    
    return currentDifficulty;
  }, []);

  const createObstacle = useCallback((difficulty: DifficultyLevel): Obstacle => {
    const settings = difficultySettings[difficulty];
    const gapStart = Math.random() * (CANVAS_HEIGHT - settings.gapSize - 100) + 50;
    
    return {
      x: CANVAS_WIDTH,
      topHeight: gapStart,
      bottomHeight: CANVAS_HEIGHT - gapStart - settings.gapSize,
      passed: false,
    };
  }, []);

  const checkCollision = useCallback((playerY: number, obstacles: Obstacle[]): boolean => {
    // Check bounds
    if (playerY < 0 || playerY + PLAYER_SIZE > CANVAS_HEIGHT) {
      return true;
    }

    // Check obstacle collision
    for (const obstacle of obstacles) {
      if (obstacle.x < 120 + PLAYER_SIZE && obstacle.x + OBSTACLE_WIDTH > 120) {
        if (playerY < obstacle.topHeight || playerY + PLAYER_SIZE > CANVAS_HEIGHT - obstacle.bottomHeight) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.isPlaying || prevState.isGameOver) {
        return prevState;
      }

      const currentTime = Date.now() - prevState.gameStartTime;
      const newDifficulty = checkDifficultyProgression(currentTime, prevState.difficulty);
      const settings = difficultySettings[newDifficulty];

      // Update player physics
      const newPlayerVelocity = prevState.playerVelocity + settings.gravity;
      const newPlayerY = prevState.playerY + newPlayerVelocity;

      // Update obstacles
      let newObstacles = prevState.obstacles
        .map(obstacle => ({ ...obstacle, x: obstacle.x - settings.obstacleSpeed }))
        .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

      // Add new obstacles
      frameCountRef.current++;
      if (frameCountRef.current % settings.spawnRate === 0) {
        newObstacles.push(createObstacle(newDifficulty));
      }

      // Check for scoring
      let newScore = prevState.score;
      newObstacles = newObstacles.map(obstacle => {
        if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < 120) {
          newScore++;
          return { ...obstacle, passed: true };
        }
        return obstacle;
      });

      // Add trail particles
      if (frameCountRef.current % 3 === 0) {
        setParticles(prev => [
          ...prev,
          createParticle(120, newPlayerY + 20, prevState.selectedCharacter.trailColor),
        ]);
      }

      // Check collision
      const collision = checkCollision(newPlayerY, newObstacles);

      if (collision) {
        console.log('Collision detected - game over');
        const newHighScore = Math.max(newScore, prevState.highScore);
        localStorage.setItem('flappyHighScore', newHighScore.toString());
        
        return {
          ...prevState,
          isGameOver: true,
          score: newScore,
          highScore: newHighScore,
        };
      }

      return {
        ...prevState,
        playerY: newPlayerY,
        playerVelocity: newPlayerVelocity,
        obstacles: newObstacles,
        score: newScore,
        difficulty: newDifficulty,
      };
    });

    updateParticles();
    
    if (!gameState.isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.isGameOver, checkCollision, createObstacle, createParticle, updateParticles, checkDifficultyProgression]);

  const startGame = useCallback(() => {
    console.log('Starting game with easy difficulty');
    frameCountRef.current = 0;
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      showCharacterSelect: false,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      score: 0,
      difficulty: 'easy',
      gameStartTime: Date.now(),
      lastDifficultyChange: Date.now(),
    }));
    setParticles([]);
  }, []);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    
    console.log('Player jumped');
    setGameState(prev => ({
      ...prev,
      playerVelocity: -8,
    }));

    // Add jump particles
    setParticles(prev => [
      ...prev,
      ...Array.from({ length: 5 }, () => 
        createParticle(120, gameState.playerY + 20, gameState.selectedCharacter.trailColor)
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
    console.log('Resetting game to character select');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: false,
      showCharacterSelect: true,
      playerY: CANVAS_HEIGHT / 2,
      playerVelocity: 0,
      obstacles: [],
      score: 0,
      difficulty: 'easy',
      gameStartTime: 0,
      lastDifficultyChange: 0,
    }));
    setParticles([]);
  }, []);

  const selectCharacter = useCallback((character: typeof characters[0]) => {
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