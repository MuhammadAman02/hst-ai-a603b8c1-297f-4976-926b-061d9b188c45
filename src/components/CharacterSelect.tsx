import { Character } from '@/types/game';
import { characters } from '@/data/characters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CharacterSelectProps {
  selectedCharacter: Character;
  onSelectCharacter: (character: Character) => void;
  onStartGame: () => void;
}

const CharacterSelect = ({ selectedCharacter, onSelectCharacter, onStartGame }: CharacterSelectProps) => {
  console.log('Rendering CharacterSelect component');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4 float-animation">
            Cyber Flappy
          </h1>
          <p className="text-xl text-gray-300">Choose your character and soar through the digital sky!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {characters.map((character) => (
            <Card
              key={character.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedCharacter.id === character.id
                  ? 'ring-4 ring-blue-400 bg-gradient-to-br from-blue-900/50 to-purple-900/50 glow-animation'
                  : 'bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50'
              }`}
              onClick={() => onSelectCharacter(character)}
            >
              <CardHeader className="text-center">
                <div className={`text-6xl mb-4 ${selectedCharacter.id === character.id ? 'float-animation' : ''}`}>
                  {character.icon}
                </div>
                <CardTitle className="text-white">{character.name}</CardTitle>
                <CardDescription className="text-gray-300">
                  {character.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`h-4 rounded-full bg-gradient-to-r ${character.color} opacity-80`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={onStartGame}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-xl font-bold rounded-xl glow-animation"
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;