import { useState } from 'react';
import { MiniGame } from '@/types';
import { getSocket } from '@/lib/socket';
import { clsx } from 'clsx';
import { Zap } from 'lucide-react';

interface Props {
  game: MiniGame;
  sessionId: string;
}

export function MiniGamePanel({ game, sessionId }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const socket = getSocket();

  const handleAnswer = (option: string) => {
    if (selected || game.status === 'revealed') return;
    setSelected(option);
    socket.emit('minigame:answer', { gameId: game._id, answer: option });
  };

  const handleReveal = () => socket.emit('minigame:reveal', { gameId: game._id });

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={20} />
        <span className="font-semibold text-lg">Mini-jeu</span>
      </div>
      <p className="text-white/90 mb-4 text-lg">{game.question}</p>
      <div className="grid grid-cols-2 gap-3">
        {game.options.map(opt => {
          const isCorrect = game.status === 'revealed' && opt === game.correctAnswer;
          const isWrong = game.status === 'revealed' && selected === opt && opt !== game.correctAnswer;
          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={!!selected || game.status === 'revealed'}
              className={clsx(
                'px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border-2',
                isCorrect ? 'bg-green-500 border-green-400 text-white' :
                isWrong ? 'bg-red-500 border-red-400 text-white' :
                selected === opt ? 'bg-white/30 border-white' :
                'bg-white/20 border-transparent hover:bg-white/30 hover:border-white/50',
                (selected || game.status === 'revealed') && 'cursor-default'
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {game.status === 'revealed' && (
        <p className="mt-3 text-white/80 text-sm">
          Bonne réponse : <strong>{game.correctAnswer}</strong>
        </p>
      )}
    </div>
  );
}
