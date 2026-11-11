// Anonymous session heartbeat for real-time metrics tracking
const STORAGE_KEY_SESSION = "anunciaai_anon_uid";

export function getAnonymousSessionId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!id || typeof id !== "string") {
      id = "usr_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_SESSION, id);
    }
    return id;
  } catch {
    return "usr_anon_" + Date.now().toString(36);
  }
}

export function initSessionHeartbeat() {
  const sessionId = getAnonymousSessionId();

  const ping = () => {
    fetch("/api/track-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {
      // Ignore background heartbeat network errors
    });
  };

  // Initial ping
  ping();

  // Periodic heartbeat every 90 seconds while active
  const interval = setInterval(ping, 90 * 1000);
  return () => clearInterval(interval);
}

// Client-side cache of event IDs to prevent duplicate event dispatches on re-renders/retries
const clientSentEventIds = new Set<string>();

export async function recordAppEvent(params: {
  event: 'ad_generated' | 'ad_analyzed';
  eventId: string;
  sessionId?: string;
  category?: string;
  score?: number;
  scoreLabel?: string;
}): Promise<boolean> {
  const { event, eventId } = params;
  if (!eventId || typeof eventId !== 'string') {
    return false;
  }

  // Deduplication guard in client memory
  if (clientSentEventIds.has(eventId)) {
    return true;
  }
  clientSentEventIds.add(eventId);

  const sessionId = params.sessionId || getAnonymousSessionId();

  try {
    const res = await fetch('/api/record-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({
        event,
        eventId,
        sessionId,
        category: params.category,
        score: params.score,
        scoreLabel: params.scoreLabel,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Aviso ao registrar evento de telemetria no servidor:', err);
    return false;
  }
}

