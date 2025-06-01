import { Character } from '@/types/game';

export const characters: Character[] = [
  {
    id: 'bird',
    name: 'Cyber Bird',
    icon: '🐦',
    color: 'from-blue-400 to-blue-600',
    trailColor: 'rgba(59, 130, 246, 0.6)',
    description: 'Classic flyer with electric blue trails'
  },
  {
    id: 'rocket',
    name: 'Neon Rocket',
    icon: '🚀',
    color: 'from-purple-400 to-pink-600',
    trailColor: 'rgba(168, 85, 247, 0.6)',
    description: 'High-tech rocket with purple plasma trails'
  },
  {
    id: 'butterfly',
    name: 'Quantum Butterfly',
    icon: '🦋',
    color: 'from-emerald-400 to-teal-600',
    trailColor: 'rgba(16, 185, 129, 0.6)',
    description: 'Graceful butterfly with shimmering green aura'
  }
];