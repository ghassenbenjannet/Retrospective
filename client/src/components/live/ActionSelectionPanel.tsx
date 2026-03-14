import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { Action, ActionPriority, Card } from '@/types';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThumbsUp, Star, Trophy, Medal, Award, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const PRIORITY_OPTIONS: { value: ActionPriority; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'prio', label: 'Prioritaire', color: 'bg-red-500 text-white border-red-500', icon: <Star size={14} /> },
  { value: 'top1', label: 'Top 1', color: 'bg-yellow-500 text-white border-yellow-500', icon: <Trophy size={14} /> },
  { value: 'top2', label: 'Top 2', color: 'bg-gray-400 text-white border-gray-400', icon: <Medal size={14} /> },
  { value: 'top3', label: 'Top 3', color: 'bg-amber-600 text-white border-amber-600', icon: <Award size={14} /> },
];

const PRIORITY_BADGE_COLOR: Record<ActionPriority, 'red' | 'yellow' | 'gray' | 'blue'> = {
  prio: 'red',
  top1: 'yellow',
  top2: 'gray',
  top3: 'blue',
};

interface Props { sessionId: string; isAdmin: boolean; }

export function ActionSelectionPanel({ sessionId, isAdmin }: Props) {
  const { cards, actions } = useSessionStore();
  const socket = getSocket();

  // Get cards that have at least 1 vote, sorted by vote count descending
  const votedCards = cards
    .filter(c => c.voteCount > 0)
    .sort((a, b) => b.voteCount - a.voteCount);

  // Map sourceCardId -> action
  const actionByCard = new Map<string, Action>();
  actions.forEach(a => { if (a.sourceCardId) actionByCard.set(a.sourceCardId, a); });

  const [selected, setSelected] = useState<Record<string, ActionPriority>>({});

  // Initialize selected from existing actions
  useEffect(() => {
    const init: Record<string, ActionPriority> = {};
    actions.forEach(a => {
      if (a.sourceCardId && a.priority) {
        init[a.sourceCardId] = a.priority;
      }
    });
    setSelected(init);
  }, [actions]);

  const handleSelectPriority = (card: Card, priority: ActionPriority) => {
    if (!isAdmin) return;
    setSelected(prev => {
      // Toggle off if same
      if (prev[card._id] === priority) {
        const next = { ...prev };
        delete next[card._id];
        return next;
      }
      return { ...prev, [card._id]: priority };
    });
  };

  const handleValidate = () => {
    if (!isAdmin) return;
    Object.entries(selected).forEach(([cardId, priority]) => {
      socket.emit('action:create', { sessionId, cardId, priority });
    });
    toast.success('Actions validées !');
  };

  const pendingCount = Object.keys(selected).length;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex items-center justify-between bg-indigo-50 rounded-xl p-4">
          <p className="text-sm text-indigo-700">
            Sélectionnez la priorité de chaque carte pour la convertir en action.
          </p>
          <Button size="sm" onClick={handleValidate} disabled={pendingCount === 0}>
            <CheckCircle size={14} className="mr-1" />
            Valider {pendingCount > 0 ? `(${pendingCount})` : ''}
          </Button>
        </div>
      )}

      {votedCards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Aucune carte avec des votes. Activez le vote d'abord.
        </div>
      ) : (
        votedCards.map(card => {
          const existingAction = actionByCard.get(card._id);
          const currentPriority = selected[card._id] ?? existingAction?.priority ?? null;
          const isConverted = !!existingAction;

          return (
            <div
              key={card._id}
              className={clsx(
                'bg-white rounded-xl border p-4 shadow-sm transition-all',
                isConverted ? 'border-green-300 bg-green-50' : 'border-gray-200'
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="text-sm text-gray-800 font-medium flex-1">{card.content}</p>
                <div className="flex items-center gap-1 flex-shrink-0 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                  <ThumbsUp size={12} />
                  <span className="text-xs font-bold">{card.voteCount}</span>
                </div>
              </div>

              {isConverted && !isAdmin && (
                <Badge
                  label={PRIORITY_OPTIONS.find(p => p.value === existingAction.priority)?.label ?? existingAction.priority ?? 'Action'}
                  color={PRIORITY_BADGE_COLOR[existingAction.priority as ActionPriority] ?? 'gray'}
                />
              )}

              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectPriority(card, opt.value)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all',
                        currentPriority === opt.value
                          ? opt.color + ' scale-105 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      )}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                  {isConverted && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={12} />Ajouté
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Actions created so far */}
      {actions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions retenues</h3>
          <div className="space-y-2">
            {['prio', 'top1', 'top2', 'top3'].map(priority => {
              const priorityActions = actions.filter(a => a.priority === priority);
              if (priorityActions.length === 0) return null;
              const opt = PRIORITY_OPTIONS.find(p => p.value === priority)!;
              return (
                <div key={priority} className="bg-gray-50 rounded-xl p-3">
                  <div className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold mb-2', opt.color)}>
                    {opt.icon}{opt.label}
                  </div>
                  {priorityActions.map(a => (
                    <div key={a._id} className="text-sm text-gray-700 py-1 pl-2 border-l-2 border-gray-300">
                      {a.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
