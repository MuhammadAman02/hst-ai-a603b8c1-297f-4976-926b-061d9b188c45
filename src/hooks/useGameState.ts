import { useState, useCallback, useRef } from 'react';
import { GameState, Obstacle, Particle } from '@/types/game';
import { characters } from '@/data/characters';

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 3;

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('flappy-high-score') || '0'),
    playerY: 300,
    playerVelocity: 0,
    obstacles: [],
    selectedCharacter: characters[0],
    showCharacterSelect: true,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const gameLoopRef = useRef<number>();
  const obstacleCounterRef = useRef(0);

  const createObstacle = useCallback((): Obstacle => {
    const topHeight = Math.random() * 200 + 50;
    const bottomHeight = 600 - topHeight - OBSTACLE_GAP;
    
    return {
      id: `obstacle-${Date.now()}-${Math.random()}`,
      x: 800,
      topHeight,
      bottomHeight,
      passed: false,
    };
  }, []);

  const createParticle = useCallback((x: number, y: number, color: string): Particle => {
    return {
      id: `particle-${Date.now()}-${Math.random()}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30,
      maxLife: 30,
      color,
    };
  }, []);

  const checkCollision = useCallback((playerY: number, obstacles: Obstacle[]): boolean => {
    const playerX = 100;
    const playerSize = 40;

    // Check ground and ceiling collision
    if (playerY <= 0 || playerY >= 560) {
      return true;
    }

    // Check obstacle collision
    for (const obstacle of obstacles) {
      if (
        playerX + playerSize > obstacle.x &&
        playerX < obstacle.x + OBSTACLE_WIDTH
      ) {
        if (
          playerY < obstacle.topHeight ||
          playerY + playerSize > 600 - obstacle.bottomHeight
        ) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const startGame = useCallback(() => {
    console.log('Starting game with character:', gameState.selectedCharacter.name);
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      score: 0,
      playerY: 300,
      playerVelocity: 0,
      obstacles: [],
      showCharacterSelect: false,
    }));
    setParticles([]);
    obstacleCounterRef.current = 0;
  }, [gameState.selectedCharacter]);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    
    console.log('Player jumped');
    setGameState(prev => ({
      ...prev,
      playerVelocity: JUMP_FORCE,
    }));

    // Create jump particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push(createParticle(100, gameState.playerY, gameState.selectedCharacter.trailColor));
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.playerY, gameState.selectedCharacter, createParticle]);

  const gameOver = useCallback(() => {
    console.log('Game over! Final score:', gameState.score);
    const newHighScore = Math.max(gameState.score, gameState.highScore);
    localStorage.setItem('flappy-high-score', newHighScore.toString());
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: true,
      highScore: newHighScore,
    }));

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  }, [gameState.score, gameState.highScore]);

  const resetGame = useCallback(() => {
    console.log('Resetting game');
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: false,
      score: 0,
      playerY: 300,
      playerVelocity: 0,
      obstacles: [],
      showCharacterSelect: true,
    }));
    setParticles([]);
  }, []);

  const selectCharacter = useCallback((character: typeof characters[0]) => {
    console.log('Selected character:', character.name);
    setGameState(prev => ({
      ...prev,
      selectedCharacter: character,
    }));
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying || prev.isGameOver) return prev;

      let newPlayerY = prev.playerY + prev.playerVelocity;
      let newPlayerVelocity = prev.playerVelocity + GRAVITY;
      let newObstacles = [...prev.obstacles];
      let newScore = prev.score;

      // Update obstacles
      newObstacles = newObstacles
        .map(obstacle => ({ ...obstacle, x: obstacle.x - OBSTACLE_SPEED }))
        .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

      // Add new obstacles
      obstacleCounterRef.current++;
      if (obstacleCounterRef.current % 120 === 0) {
        newObstacles.push(createObstacle());
      }

      // Check for scoring
      newObstacles.forEach(obstacle => {
        if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH < 100) {
          obstacle.passed = true;
          newScore++;
        }
      });

      // Check collision
      if (checkCollision(newPlayerY, newObstacles)) {
        return { ...prev, isGameOver: true };
      }

      return {
        ...prev,
        playerY: newPlayerY,
        playerVelocity: newPlayerVelocity,
        obstacles: newObstacles,
        score: newScore,
      };
    });

    // Update particles
    setParticles(prev => 
      prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
        }))
        .filter(particle => particle.life > 0)
    );

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [createObstacle, checkCollision]);

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