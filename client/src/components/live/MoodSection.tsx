import { useState, useEffect } from 'react';
import { SectionOption, Card } from '@/types';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import { CheckCircle } from 'lucide-react';
import { imgSrc } from '@/lib/imageUrl';

interface Props {
  sessionId: string;
  sectionId: string;
  options: SectionOption[];
  existingCards: Card[];
  isActive: boolean;
  isDone: boolean;
}

export function MoodSection({ sessionId, sectionId, options, existingCards, isActive, isDone }: Props) {
  const { user } = useAuthStore();
  const socket = getSocket();

  const myCard = existingCards.find(c => c.authorId === user?.id);
  const [selected, setSelected] = useState<string | null>(myCard?.content ?? null);
  const [isChanging, setIsChanging] = useState(false);

  // Keep selected in sync when myCard changes (e.g. after server confirms the new card)
  useEffect(() => {
    setSelected(myCard?.content ?? null);
    setIsChanging(false);
  }, [myCard?._id]);

  const handleSelect = (title: string) => {
    if (!isActive || isDone || isChanging) return;
    if (myCard?.content === title) return; // same choice
    if (myCard) {
      setIsChanging(true);
      socket.emit('card:delete', { cardId: myCard._id });
    }
    setSelected(title);
    socket.emit('card:create', { sessionId, sectionId, content: title });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {myCard && !isDone && (
        <p className="text-center text-sm text-indigo-700 font-semibold mb-5 bg-indigo-50 rounded-xl py-2.5 px-4 border border-indigo-200">
          Vous avez choisi : <strong>{myCard.content}</strong> — vous pouvez encore changer votre choix.
        </p>
      )}
      {myCard && isDone && (
        <p className="text-center text-sm text-emerald-700 font-semibold mb-5 bg-emerald-50 rounded-xl py-2.5 px-4 border border-emerald-200">
          ✅ Vous avez choisi : <strong>{myCard.content}</strong>
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {options.map(opt => {
          const chosenByCount = existingCards.filter(c => c.content === opt.title).length;
          const isMyChoice = selected === opt.title;
          return (
            <button
              key={opt.title}
              onClick={() => handleSelect(opt.title)}
              disabled={!isActive || isDone || isChanging}
              className={clsx(
                'relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left shadow-sm',
                isMyChoice
                  ? 'border-indigo-500 ring-2 ring-indigo-200 scale-[1.03] shadow-indigo-100'
                  : 'border-gray-100 hover:border-indigo-300 hover:shadow-md',
                (!isActive || isDone || isChanging) && !isMyChoice && 'opacity-60 cursor-default',
              )}
            >
              {/* Image — aspect-square + object-contain so full image always visible */}
              <div className="w-full aspect-square bg-gray-900 flex items-center justify-center overflow-hidden">
                {opt.imageUrl ? (
                  <img
                    src={imgSrc(opt.imageUrl)}
                    alt={opt.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-5xl select-none">😊</span>
                )}
              </div>

              {/* Label */}
              <div className="p-3 bg-white">
                <p className="font-semibold text-gray-900 text-sm text-center leading-tight">{opt.title}</p>
                {chosenByCount > 0 && (
                  <p className="text-xs text-indigo-500 font-medium text-center mt-1">{chosenByCount} choix</p>
                )}
              </div>

              {isMyChoice && (
                <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-0.5 shadow">
                  <CheckCircle size={16} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {options.length === 0 && (
        <p className="text-center text-gray-400 py-12">Aucune option configurée pour cette section.</p>
      )}
    </div>
  );
}
