import { useState } from 'react';
import { SectionOption, Card } from '@/types';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import { CheckCircle } from 'lucide-react';

interface Props {
  sessionId: string;
  sectionId: string;
  options: SectionOption[];
  existingCards: Card[];
  isActive: boolean;
}

export function MoodSection({ sessionId, sectionId, options, existingCards, isActive }: Props) {
  const { user } = useAuthStore();
  const socket = getSocket();

  const myCard = existingCards.find(c => c.authorId === user?.id);
  const [selected, setSelected] = useState<string | null>(myCard?.content ?? null);

  const handleSelect = (title: string) => {
    if (!isActive || myCard) return;
    setSelected(title);
    socket.emit('card:create', { sessionId, sectionId, content: title });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {myCard && (
        <p className="text-center text-sm text-green-600 font-medium mb-4">
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
              disabled={!isActive || !!myCard}
              className={clsx(
                'relative rounded-2xl overflow-hidden border-2 transition-all group',
                isMyChoice
                  ? 'border-primary-600 shadow-lg scale-105'
                  : 'border-transparent hover:border-primary-300',
                (!isActive || !!myCard) && !isMyChoice && 'opacity-70 cursor-default'
              )}
            >
              {opt.imageUrl ? (
                <img
                  src={opt.imageUrl}
                  alt={opt.title}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center text-4xl">
                  😊
                </div>
              )}
              <div className="p-3 bg-white">
                <p className="font-medium text-gray-900 text-sm text-center">{opt.title}</p>
                {chosenByCount > 0 && (
                  <p className="text-xs text-gray-400 text-center mt-0.5">{chosenByCount} choix</p>
                )}
              </div>
              {isMyChoice && (
                <div className="absolute top-2 right-2 bg-primary-600 rounded-full p-0.5">
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
