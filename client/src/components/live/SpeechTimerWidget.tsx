import { useEffect, useRef, useState } from 'react';
import { Mic, Square, ChevronDown, Timer } from 'lucide-react';
import { clsx } from 'clsx';
import { getSocket } from '@/lib/socket';

const PRESETS = [
  { label: '30s',  seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

interface Props {
  sessionId: string;
  isAdmin: boolean;
  speechTimerEndsAt: string | null;
}

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!endsAt) { setRemaining(0); return; }
    const end = new Date(endsAt).getTime();
    const update = () => {
      const diff = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  // Capture total when timer starts
  useEffect(() => {
    if (endsAt) {
      const diff = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000);
      setTotal(diff > 0 ? diff : 60);
    }
  }, [endsAt]);

  return { remaining, total };
}

export function SpeechTimerWidget({ sessionId, isAdmin, speechTimerEndsAt }: Props) {
  const socket = getSocket();
  const [open, setOpen] = useState(false);
  const [customSecs, setCustomSecs] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const isActive = !!speechTimerEndsAt && new Date(speechTimerEndsAt).getTime() > Date.now();
  const { remaining, total } = useCountdown(isActive ? speechTimerEndsAt : null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const start = (seconds: number) => {
    socket.emit('speech_timer:start', { sessionId, seconds });
    setOpen(false);
    setCustomSecs('');
  };

  const stop = () => {
    socket.emit('speech_timer:stop', { sessionId });
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const progress = total > 0 ? remaining / total : 0;
  const isUrgent = remaining > 0 && remaining <= 10;
  const isExpired = isActive && remaining === 0;

  // Ring params
  const R = 14;
  const circ = 2 * Math.PI * R;

  if (!isActive && !isAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Active timer display — visible to all */}
      {isActive && (
        <div className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors',
          isExpired ? 'bg-red-100 text-red-700' :
          isUrgent  ? 'bg-orange-100 text-orange-700 animate-pulse' :
                      'bg-indigo-100 text-indigo-700',
        )}>
          {/* SVG ring */}
          <svg width="32" height="32" viewBox="0 0 32 32" className="-ml-1 flex-shrink-0">
            <circle cx="16" cy="16" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
            <circle
              cx="16" cy="16" r={R}
              fill="none" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${circ}`}
              strokeDashoffset={`${circ * (1 - progress)}`}
              transform="rotate(-90 16 16)"
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
            <text x="16" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
              {isExpired ? '00' : timeStr.length <= 4 ? timeStr : `${mins}m`}
            </text>
          </svg>
          <span>{isExpired ? 'Temps écoulé !' : timeStr}</span>
          {/* Admin stop button */}
          {isAdmin && (
            <button
              onClick={stop}
              className="ml-1 p-0.5 rounded-full hover:bg-current/10 transition-colors"
              title="Arrêter le chronomètre"
            >
              <Square size={12} className="fill-current" />
            </button>
          )}
        </div>
      )}

      {/* Admin start button + presets */}
      {isAdmin && !isActive && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm"
            title="Chronomètre de prise de parole"
          >
            <Mic size={13} />
            <span className="hidden sm:inline">Chrono</span>
            <ChevronDown size={11} className={clsx('transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-52 z-50">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Timer size={11} /> Prise de parole
              </p>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {PRESETS.map(p => (
                  <button
                    key={p.seconds}
                    onClick={() => start(p.seconds)}
                    className="py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Custom */}
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={5}
                  max={3600}
                  value={customSecs}
                  onChange={e => setCustomSecs(e.target.value)}
                  placeholder="Secondes"
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => { const s = parseInt(customSecs); if (s > 0) start(s); }}
                  disabled={!customSecs || parseInt(customSecs) <= 0}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
