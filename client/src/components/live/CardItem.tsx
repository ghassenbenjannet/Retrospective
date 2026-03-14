import { useState } from 'react';
import { Card } from '@/types';
import { getSocket } from '@/lib/socket';
import { ThumbsUp, Edit2, Trash2, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  card: Card;
  canVote: boolean;
  hasVoted: boolean;
  isAdmin: boolean;
  userId: string;
  sessionId: string;
  isNew?: boolean;
  onVote: (delta: number) => void;
}

export function CardItem({ card, canVote, hasVoted, isAdmin, userId, sessionId, isNew = false, onVote }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(card.content);
  const isOwner = card.authorId === userId;
  const socket = getSocket();

  const handleSave = () => {
    if (content.trim()) {
      socket.emit('card:update', { cardId: card._id, content });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Supprimer cette carte ?')) {
      socket.emit('card:delete', { cardId: card._id });
    }
  };

  const handleToggleVote = () => {
    if (hasVoted) {
      onVote(-1); // remove vote
    } else if (canVote) {
      onVote(1); // add vote
    }
  };

  return (
    <div className={clsx(
      'rounded-xl border p-4 shadow-sm transition-all duration-300',
      isNew
        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 animate-pulse-once'
        : 'bg-white border-gray-200 hover:shadow-md',
    )}>
      {isNew && (
        <div className="text-xs font-semibold text-indigo-500 mb-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          Nouvelle idée !
        </div>
      )}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            <button onClick={handleSave} className="text-primary-600 hover:text-primary-700"><Check size={16} /></button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{card.content}</p>
          <div className="flex items-center justify-between">
            {/* Vote toggle button */}
            <button
              onClick={handleToggleVote}
              disabled={!hasVoted && !canVote}
              title={hasVoted ? 'Retirer mon vote' : canVote ? 'Voter pour cette carte' : 'Plus de votes disponibles'}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                hasVoted
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : canVote
                    ? 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed',
              )}
            >
              <ThumbsUp size={13} className={hasVoted ? 'fill-white' : ''} />
              <span>{card.voteCount}</span>
            </button>

            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{card.authorName}</span>
              {(isOwner || isAdmin) && !editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-gray-400 hover:text-gray-600 ml-1 p-1 rounded"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-1 rounded">
                    <Trash2 size={11} />
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
