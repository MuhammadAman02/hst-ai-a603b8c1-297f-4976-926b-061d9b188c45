import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onBackToMenu: () => void;
}

const GameOverModal = ({ score, highScore, onRestart, onBackToMenu }: GameOverModalProps) => {
  console.log('Game over modal displayed. Score:', score, 'High Score:', highScore);
  
  const isNewHighScore = score === highScore && score > 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-400 max-w-md w-full glow-animation">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">
            {isNewHighScore ? '🎉' : '💥'}
          </div>
          <CardTitle className="text-3xl text-white mb-2">
            {isNewHighScore ? 'New High Score!' : 'Game Over'}
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            {isNewHighScore ? 'Congratulations on your achievement!' : 'Better luck next time!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4">
              <div className="text-4xl font-bold text-white mb-1">{score}</div>
              <div className="text-gray-300">Final Score</div>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-yellow-400">
              <Trophy className="w-5 h-5" />
              <span className="text-lg">Best: {highScore}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onRestart}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 text-lg font-semibold pulse-glow-animation"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
            
            <Button
              onClick={onBackToMenu}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOverModal;