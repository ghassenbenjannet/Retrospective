import { CheckCircle2, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { getSocket } from '@/lib/socket';

interface Props {
  sessionId: string;
  sectionId: string;
  isDone: boolean;
}

export function DoneButton({ sessionId, sectionId, isDone }: Props) {
  const socket = getSocket();

  const toggle = () => {
    socket.emit(isDone ? 'section:unmark_done' : 'section:mark_done', { sessionId, sectionId });
  };

  return (
    <button
      onClick={toggle}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
        isDone
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
          : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200',
      )}
    >
      {isDone ? <CheckCircle2 size={16} className="fill-emerald-600 text-white" /> : <Circle size={16} />}
      {isDone ? 'Terminé' : "J'ai terminé"}
    </button>
  );
}
