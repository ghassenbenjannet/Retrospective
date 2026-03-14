import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';

export function TimerBar({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className={clsx('flex items-center gap-2 px-6 py-2 text-sm font-medium',
      remaining === 0 ? 'bg-red-50 text-red-600' : remaining < 30 ? 'bg-yellow-50 text-yellow-700' : 'bg-primary-50 text-primary-700'
    )}>
      <Clock size={14} />
      {remaining === 0 ? 'Temps écoulé !' : `${mins}:${String(secs).padStart(2, '0')}`}
    </div>
  );
}
