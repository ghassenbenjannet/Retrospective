import { useEffect, useRef, useState } from 'react';
import { Mic, Square, ChevronDown, Timer } from 'lucide-react';
import { clsx } from 'clsx';
import { getSocket } from '@/lib/socket';

const PRESETS = [
  { label: '30s',   seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

// ── Countdown hook — always ticks once endsAt is set ─────────────────────────
function useCountdown(endsAt: string | null) {
  const calcRemaining = () =>
    endsAt ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)) : 0;

  const [remaining, setRemaining] = useState(calcRemaining);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const r = calcRemaining();
    setRemaining(r);
    if (endsAt && r > 0) setTotal(r);
    if (!endsAt) return;

    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  return { remaining, total };
}

interface WidgetProps {
  sessionId: string;
  isAdmin: boolean;
  speechTimerEndsAt: string | null;
}

// ── Admin controls button (in header) ─────────────────────────────────────────
export function SpeechTimerWidget({ sessionId, isAdmin, speechTimerEndsAt }: WidgetProps) {
  const socket = getSocket();
  const [open, setOpen] = useState(false);
  const [customSecs, setCustomSecs] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const { remaining } = useCountdown(speechTimerEndsAt);
  const isActive = remaining > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAdmin) return null;

  const start = (seconds: number) => {
    socket.emit('speech_timer:start', { sessionId, seconds });
    setOpen(false);
    setCustomSecs('');
  };
  const stop = () => socket.emit('speech_timer:stop', { sessionId });

  if (isActive) {
    return (
      <button
        onClick={stop}
        title="Arrêter le chronomètre"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-sm font-semibold hover:bg-orange-200 transition-colors"
      >
        <Mic size={13} className="animate-pulse" />
        <Square size={11} className="fill-current" />
        <span>Stop</span>
      </button>
    );
  }

  return (
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
              <button key={p.seconds} onClick={() => start(p.seconds)}
                className="py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input type="number" min={5} max={3600} value={customSecs}
              onChange={e => setCustomSecs(e.target.value)}
              placeholder="Secondes"
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400" />
            <button
              onClick={() => { const s = parseInt(customSecs); if (s > 0) start(s); }}
              disabled={!customSecs || parseInt(customSecs) <= 0}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-indigo-700">
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Visible countdown banner — shown to ALL participants when timer runs ───────
export function SpeechTimerBar({ speechTimerEndsAt }: { speechTimerEndsAt: string | null }) {
  const { remaining, total } = useCountdown(speechTimerEndsAt);

  if (remaining <= 0) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const progress = total > 0 ? remaining / total : 1;
  const isUrgent = remaining <= 10;

  const R = 12;
  const circ = 2 * Math.PI * R;

  return (
    <div className={clsx(
      'flex items-center justify-center gap-3 py-2 px-6 text-sm font-semibold transition-colors border-b',
      isUrgent
        ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
        : 'bg-indigo-50 text-indigo-700 border-indigo-100',
    )}>
      <Mic size={14} className={isUrgent ? 'animate-bounce' : ''} />
      <span>Prise de parole</span>

      {/* SVG ring */}
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <circle
          cx="14" cy="14" r={R} fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - progress)}`}
          transform="rotate(-90 14 14)"
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>

      <span className="text-base font-bold tabular-nums">{timeStr}</span>
    </div>
  );
}
