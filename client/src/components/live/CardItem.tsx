import { useState } from 'react';
import { Card } from '@/types';
import { getSocket } from '@/lib/socket';
import { ThumbsUp, ThumbsDown, Edit2, Trash2, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  card: Card;
  canVote: boolean;
  isAdmin: boolean;
  userId: string;
  sessionId: string;
  onVote: (delta: number) => void;
}

export function CardItem({ card, canVote, isAdmin, userId, sessionId, onVote }: Props) {
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

  return (
    <div className={clsx(
      'bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow',
      'animate-fade-in'
    )}>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => onVote(1)}
                disabled={!canVote}
                className={clsx('flex items-center gap-1 text-sm px-2 py-1 rounded-lg transition-colors',
                  canVote ? 'text-primary-600 hover:bg-primary-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed')}
              >
                <ThumbsUp size={14} />
                <span className="font-medium">{card.voteCount}</span>
              </button>
              {card.voteCount > 0 && (
                <button
                  onClick={() => onVote(-1)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <ThumbsDown size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{card.authorName}</span>
              {(isOwner || isAdmin) && (
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600 ml-1">
                  <Edit2 size={12} />
                </button>
              )}
              {(isOwner || isAdmin) && (
                <button onClick={handleDelete} className="text-red-400 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
