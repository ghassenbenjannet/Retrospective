import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Send } from 'lucide-react';

interface Props {
  sessionId: string;
  sectionId: string;
}

export function AddCardForm({ sessionId, sectionId }: Props) {
  const [content, setContent] = useState('');
  const { user } = useAuthStore();
  const socket = getSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitStopTyping = () => {
    socket.emit('user:stopped_typing', { sessionId, sectionId });
  };

  useEffect(() => () => {
    emitStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const handleChange = (val: string) => {
    setContent(val);
    socket.emit('user:typing', { sessionId, sectionId, name: user?.name ?? '' });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitStopTyping, 2000);
  };

  const submit = () => {
    const text = content.trim();
    if (!text) return;
    socket.emit('card:create', { sessionId, sectionId, content: text });
    setContent('');
    emitStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="flex gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Votre idée... (Entrée pour envoyer)"
        className="flex-1 text-sm resize-none focus:outline-none min-h-[60px]"
        rows={2}
      />
      <button
        onClick={submit}
        disabled={!content.trim()}
        className="self-end px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
