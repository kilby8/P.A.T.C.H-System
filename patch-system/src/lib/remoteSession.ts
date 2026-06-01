// ============================================================
// P.A.T.C.H. SYSTEM — Remote Session Helpers (Broadcast)
// Uses Supabase Realtime Broadcast — no database table required.
// Both devices join the same channel keyed to the session code
// and exchange state via broadcast events.
// ============================================================
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface RemoteEnvelope<T> {
  sessionCode: string;
  updatedAt: string;
  updatedBy: string;
  payload: T;
}

const BROADCAST_EVENT = 'patch-state';

export async function publishRemoteSession<T>(
  sessionCode: string,
  envelope: RemoteEnvelope<T>,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  // Use presence-less broadcast — fire and forget.
  const channel = supabase.channel(`patch-session:${sessionCode}`);
  await channel.subscribe();
  await channel.send({
    type: 'broadcast',
    event: BROADCAST_EVENT,
    payload: envelope,
  });
  // Leave immediately — we re-create the channel on every publish.
  void supabase.removeChannel(channel);
}

export function subscribeToRemoteSession<T>(
  sessionCode: string,
  onMessage: (envelope: RemoteEnvelope<T>) => void,
  onError?: (error: Error) => void,
): (() => void) | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const channel: RealtimeChannel = supabase
    .channel(`patch-session:${sessionCode}`)
    .on(
      'broadcast',
      { event: BROADCAST_EVENT },
      ({ payload }) => {
        if (!payload) return;
        onMessage(payload as RemoteEnvelope<T>);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error(`Realtime channel failed for session ${sessionCode}`));
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}