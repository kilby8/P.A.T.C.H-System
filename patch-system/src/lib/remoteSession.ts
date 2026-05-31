// ============================================================
// P.A.T.C.H. SYSTEM — Remote Session Helpers
// ============================================================
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface RemoteEnvelope<T> {
  sessionCode: string;
  updatedAt: string;
  updatedBy: string;
  payload: T;
}

export async function publishRemoteSession<T>(
  sessionCode: string,
  envelope: RemoteEnvelope<T>,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('patch_sessions')
    .upsert({
      session_code: sessionCode,
      payload: envelope,
      updated_at: envelope.updatedAt,
    }, { onConflict: 'session_code' });

  if (error) {
    throw error;
  }
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
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'patch_sessions',
        filter: `session_code=eq.${sessionCode}`,
      },
      (payload) => {
        const nextValue = payload.new as { payload?: RemoteEnvelope<T> } | undefined;
        if (!nextValue?.payload) return;
        onMessage(nextValue.payload);
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