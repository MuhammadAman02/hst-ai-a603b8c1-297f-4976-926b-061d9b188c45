import { useEffect, useRef } from 'react';
import { GameState, Particle } from '@/types/game';

interface GameCanvasProps {
  gameState: GameState;
  particles: Particle[];
  onJump: () => void;
}

const GameCanvas = ({ gameState, particles, onJump }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.5, '#312e81');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % canvas.width;
      const y = (i * 73.3) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      // Top obstacle
      const topGradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + 80, 0);
      topGradient.addColorStop(0, '#ef4444');
      topGradient.addColorStop(1, '#dc2626');
      ctx.fillStyle = topGradient;
      ctx.fillRect(obstacle.x, 0, 80, obstacle.topHeight);
      
      // Add glow effect
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.fillRect(obstacle.x, 0, 80, obstacle.topHeight);
      ctx.shadowBlur = 0;

      // Bottom obstacle
      const bottomGradient = ctx.createLinearGradient(obstacle.x, canvas.height - obstacle.bottomHeight, obstacle.x + 80, canvas.height);
      bottomGradient.addColorStop(0, '#ef4444');
      bottomGradient.addColorStop(1, '#dc2626');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(obstacle.x, canvas.height - obstacle.bottomHeight, 80, obstacle.bottomHeight);
      
      // Add glow effect
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.fillRect(obstacle.x, canvas.height - obstacle.bottomHeight, 80, obstacle.bottomHeight);
      ctx.shadowBlur = 0;
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color.replace('0.6', alpha.toString());
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add glow effect to player
    ctx.shadowColor = gameState.selectedCharacter.trailColor;
    ctx.shadowBlur = 15;
    ctx.fillText(gameState.selectedCharacter.icon, 120, gameState.playerY + 20);
    ctx.shadowBlur = 0;

    // Draw score
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 5;
    ctx.fillText(gameState.score.toString(), canvas.width / 2, 60);
    ctx.shadowBlur = 0;

  }, [gameState, particles]);

  const handleCanvasClick = () => {
    console.log('Canvas clicked - jumping');
    onJump();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      onJump();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onJump]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="border-4 border-blue-400 rounded-lg shadow-2xl cursor-pointer glow-animation"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <div className="absolute top-4 left-4 text-white">
          <p className="text-sm opacity-75">Click or press SPACE to jump</p>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;