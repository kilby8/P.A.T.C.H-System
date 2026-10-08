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

// One channel per session code. supabase.channel(topic) hands back the
// existing channel when one is open for that topic, so publishing must reuse
// the subscription's channel and never create-and-remove its own: removing it
// would tear down the subscription after the first publish.
const sessionChannels = new Map<string, RealtimeChannel>();

function topicFor(sessionCode: string): string {
  return `patch-session:${sessionCode}`;
}

export async function publishRemoteSession<T>(
  sessionCode: string,
  envelope: RemoteEnvelope<T>,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const subscribed = sessionChannels.get(sessionCode);
  if (subscribed && subscribed.state === 'joined') {
    const result = await subscribed.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: envelope });
    if (result !== 'ok') throw new Error(`Broadcast failed for session ${sessionCode}: ${result}`);
    return;
  }

  // Not joined yet (or never subscribed): deliver over HTTP. Reuse the
  // subscription's channel object if there is one, and only remove a channel
  // this call created itself.
  const channel = subscribed ?? supabase.channel(topicFor(sessionCode));
  try {
    const result = await channel.httpSend(BROADCAST_EVENT, envelope);
    if (!result.success) throw new Error(`Broadcast failed for session ${sessionCode}: ${result.error}`);
  } finally {
    if (!subscribed) void supabase.removeChannel(channel);
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
    .channel(topicFor(sessionCode))
    .on(
      'broadcast',
      { event: BROADCAST_EVENT },
      ({ payload }) => {
        if (!payload) return;
        onMessage(payload as RemoteEnvelope<T>);
      },
    )
    .subscribe((status) => {
      if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && onError) {
        onError(new Error(`Realtime channel failed for session ${sessionCode}`));
      }
    });
  sessionChannels.set(sessionCode, channel);

  return () => {
    if (sessionChannels.get(sessionCode) === channel) sessionChannels.delete(sessionCode);
    void supabase.removeChannel(channel);
  };
}
