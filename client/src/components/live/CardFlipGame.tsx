import { useSessionStore } from '@/store/sessionStore';
import { getSocket } from '@/lib/socket';
import { SectionOption } from '@/types';
import { clsx } from 'clsx';
import { Play, SkipForward, RotateCcw, Eye, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  sessionId: string;
  sectionId: string;
  options: SectionOption[];
  isAdmin: boolean;
  currentUserId: string;
}

const CARD_COLORS = [
  'from-purple-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-orange-500 to-amber-600',
  'from-red-500 to-pink-600',
];

export function CardFlipGame({ sessionId, sectionId, options, isAdmin, currentUserId }: Props) {
  const { cardGame, session } = useSessionStore();
  const socket = getSocket();

  const handleStart = () => {
    socket.emit('cardgame:start', { sessionId, sectionId });
  };
  const handleFlip = (cardIdx: number) => {
    socket.emit('cardgame:flip', { sessionId, cardIdx });
  };
  const handleReveal = (cardIdx: number) => {
    socket.emit('cardgame:reveal', { sessionId, cardIdx });
  };
  const handleNextPlayer = () => {
    socket.emit('cardgame:next_player', { sessionId });
  };
  const handleReset = () => {
    socket.emit('cardgame:reset', { sessionId });
  };

  // No game started yet
  if (!cardGame || cardGame.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="text-center">
          <HelpCircle size={48} className="text-indigo-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Jeu de cartes</h3>
          <p className="text-gray-500 text-sm max-w-md">
            {options.length} carte{options.length !== 1 ? 's' : ''} disponible{options.length !== 1 ? 's' : ''}.
            Chaque joueur choisit une carte à tour de rôle et répond à la question.
          </p>
        </div>
        {/* Preview of face-down cards */}
        <div className="flex gap-3 flex-wrap justify-center">
          {options.map((_, idx) => (
            <div
              key={idx}
              className={clsx(
                'w-24 h-36 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md',
                CARD_COLORS[idx % CARD_COLORS.length]
              )}
            >
              <span className="text-white text-3xl font-bold">?</span>
            </div>
          ))}
        </div>
        {isAdmin && (
          <Button onClick={handleStart} className="gap-2">
            <Play size={16} />Lancer le jeu
          </Button>
        )}
        {!isAdmin && (
          <p className="text-gray-400 text-sm">En attente que l'admin lance le jeu...</p>
        )}
      </div>
    );
  }

  const currentPlayer = cardGame.playerOrder[cardGame.currentPlayerIdx];
  const isMyTurn = currentPlayer?.userId === currentUserId;
  const currentFlippedCard = cardGame.currentFlippedCardIdx !== null
    ? cardGame.cards[cardGame.currentFlippedCardIdx]
    : null;
  const allFlipped = cardGame.cards.every(c => c.isFlipped);

  return (
    <div className="space-y-6">
      {/* Game status bar */}
      <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          {cardGame.status === 'finished' ? (
            <p className="font-semibold text-gray-700">Jeu terminé ! Toutes les cartes ont été retournées.</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500">Tour de</p>
              <p className="font-bold text-indigo-700 text-lg">
                {currentPlayer?.name ?? '—'}
                {isMyTurn && <span className="ml-2 text-sm font-normal text-indigo-500">(vous)</span>}
              </p>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {cardGame.status === 'active' && !allFlipped && currentFlippedCard?.isAnswerRevealed && (
              <Button size="sm" onClick={handleNextPlayer}>
                <SkipForward size={14} className="mr-1" />Joueur suivant
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleReset}>
              <RotateCcw size={14} className="mr-1" />Réinitialiser
            </Button>
          </div>
        )}
      </div>

      {/* Turn order */}
      {cardGame.status === 'active' && cardGame.playerOrder.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {cardGame.playerOrder.map((p, i) => (
            <span
              key={p.userId}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium',
                i === cardGame.currentPlayerIdx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {i === cardGame.currentPlayerIdx ? '▶ ' : ''}{p.name}
            </span>
          ))}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-4">
        {cardGame.cards.map((gameCard, idx) => {
          const canFlip = cardGame.status === 'active' && !gameCard.isFlipped
            && (isMyTurn || isAdmin)
            && cardGame.currentFlippedCardIdx === null;

          return (
            <div key={idx} className="perspective-1000">
              {!gameCard.isFlipped ? (
                /* Face-down card */
                <button
                  onClick={() => canFlip && handleFlip(idx)}
                  disabled={!canFlip}
                  className={clsx(
                    'w-full h-44 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center shadow-lg transition-transform',
                    CARD_COLORS[idx % CARD_COLORS.length],
                    canFlip ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-default opacity-70',
                  )}
                >
                  <span className="text-white text-5xl font-bold">?</span>
                  {canFlip && (
                    <span className="text-white/70 text-xs mt-2">Cliquez pour retourner</span>
                  )}
                </button>
              ) : (
                /* Face-up card */
                <div className={clsx(
                  'w-full min-h-44 rounded-2xl border-2 p-4 flex flex-col gap-3 shadow-md transition-all',
                  gameCard.isAnswerRevealed ? 'border-green-400 bg-green-50' : 'border-indigo-300 bg-indigo-50'
                )}>
                  {/* Question */}
                  <div>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Question</p>
                    <p className="text-sm font-medium text-gray-800">{gameCard.question}</p>
                  </div>

                  {/* Answer */}
                  {gameCard.isAnswerRevealed ? (
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Réponse</p>
                      <p className="text-sm text-gray-700">{gameCard.answer}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReveal(idx)}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-auto"
                    >
                      <Eye size={14} />Voir la réponse
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finished state */}
      {cardGame.status === 'finished' && (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-gray-600">Toutes les cartes ont été jouées !</p>
          {isAdmin && (
            <Button className="mt-4" variant="secondary" onClick={handleReset}>
              <RotateCcw size={14} className="mr-1" />Rejouer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
