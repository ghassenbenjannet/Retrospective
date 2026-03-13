import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeSession(sessionId: string, onCardEvent: () => void) {
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`session:${sessionId}`)
      .on('broadcast', { event: 'card-updated' }, onCardEvent)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onCardEvent, sessionId]);
}
