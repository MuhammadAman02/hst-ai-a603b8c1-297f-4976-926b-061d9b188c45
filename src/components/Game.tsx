import { useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import CharacterSelect from './CharacterSelect';
import GameCanvas from './GameCanvas';
import GameOverModal from './GameOverModal';

const Game = () => {
  const {
    gameState,
    particles,
    startGame,
    jump,
    gameOver,
    resetGame,
    selectCharacter,
    gameLoop,
    gameLoopRef,
  } = useGameState();

  useEffect(() => {
    console.log('Game state changed:', {
      isPlaying: gameState.isPlaying,
      isGameOver: gameState.isGameOver,
      showCharacterSelect: gameState.showCharacterSelect
    });

    if (gameState.isPlaying && !gameState.isGameOver) {
      console.log('Starting game loop');
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameLoop, gameLoopRef]);

  useEffect(() => {
    if (gameState.isGameOver) {
      console.log('Game over detected, calling gameOver function');
      gameOver();
    }
  }, [gameState.isGameOver, gameOver]);

  if (gameState.showCharacterSelect) {
    return (
      <CharacterSelect
        selectedCharacter={gameState.selectedCharacter}
        onSelectCharacter={selectCharacter}
        onStartGame={startGame}
      />
    );
  }

  return (
    <div className="relative">
      <GameCanvas
        gameState={gameState}
        particles={particles}
        onJump={jump}
      />
      
      {gameState.isGameOver && (
        <GameOverModal
          score={gameState.score}
          highScore={gameState.highScore}
          onRestart={startGame}
          onBackToMenu={resetGame}
        />
      )}
    </div>
  );
};

export default Game;