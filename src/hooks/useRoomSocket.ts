import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerRole, RoomState } from '../shared/gameTypes';

const STORAGE_KEY = 'trnd_session_v1';

export interface SavedSession {
  code: string;
  playerId: string;
  role: PlayerRole;
  name: string;
}

export function loadSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession | null) {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

export function useRoomSocket() {
  const [session, setSession] = useState<SavedSession | null>(() => loadSavedSession());
  const [room, setRoom] = useState<RoomState | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const sessionRef = useRef<SavedSession | null>(session);
  sessionRef.current = session;

  const clearTimers = () => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const connectWs = useCallback((sess: SavedSession) => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(sess.code)}&playerId=${encodeURIComponent(sess.playerId)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setWsConnected(true);
      setReconnecting(false);
      setError(null);
      pingTimerRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'session:ready') {
          setRoom(msg.room);
          if (msg.role && sessionRef.current && msg.role !== sessionRef.current.role) {
            const updated = { ...sessionRef.current, role: msg.role as PlayerRole };
            setSession(updated);
            saveSession(updated);
          }
        } else if (msg.type === 'room:state') {
          setRoom(msg.room);
          // Sync role if swapped in lobby
          const me =
            msg.room.players.P1_SECURITY?.playerId === sessionRef.current?.playerId
              ? 'P1_SECURITY'
              : msg.room.players.P2_STUDY?.playerId === sessionRef.current?.playerId
              ? 'P2_STUDY'
              : null;
          if (me && sessionRef.current && me !== sessionRef.current.role) {
            const updated = { ...sessionRef.current, role: me as PlayerRole };
            setSession(updated);
            saveSession(updated);
          }
        } else if (msg.type === 'session:role_updated') {
          if (sessionRef.current && msg.role) {
            const updated = { ...sessionRef.current, role: msg.role as PlayerRole };
            setSession(updated);
            saveSession(updated);
          }
        } else if (msg.type === 'error') {
          setError(msg.message || 'Session error');
          if (String(msg.message || '').includes('expired') || String(msg.message || '').includes('not recognized')) {
            saveSession(null);
            setSession(null);
            setRoom(null);
          }
        }
      } catch {
        // Ignore parse failure
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      clearTimers();
      if (!sessionRef.current) return;
      setReconnecting(true);
      const delay = Math.min(5000, 600 * Math.pow(1.5, attemptRef.current));
      attemptRef.current += 1;
      reconnectTimerRef.current = window.setTimeout(() => {
        if (sessionRef.current) {
          connectWs(sessionRef.current);
        }
      }, delay);
    };
  }, []);

  // Auto-reconnect saved session on page load / refresh
  useEffect(() => {
    const saved = loadSavedSession();
    if (!saved) return;

    // Verify room still exists and session is valid via HTTP first
    let cancelled = false;
    setLoading(true);
    fetch(`/api/rooms/${encodeURIComponent(saved.code)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: saved.playerId, name: saved.name })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const restored: SavedSession = {
          code: data.code,
          playerId: data.playerId,
          role: data.role,
          name: saved.name
        };
        setSession(restored);
        saveSession(restored);
        setRoom(data.room);
        connectWs(restored);
      })
      .catch(() => {
        if (cancelled) return;
        saveSession(null);
        setSession(null);
        setRoom(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connectWs]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const createPrivateRoom = async (name: string, role: PlayerRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create room');

      const newSession: SavedSession = {
        code: data.code,
        playerId: data.playerId,
        role: data.role,
        name
      };
      setSession(newSession);
      saveSession(newSession);
      setRoom(data.room);
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.code);
      window.history.replaceState({}, '', url.toString());
      connectWs(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinPrivateRoom = async (code: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanCode = code.trim().toUpperCase();
      const existing = loadSavedSession();
      const payload: Record<string, string> = { name };
      if (existing && existing.code === cleanCode) {
        payload.playerId = existing.playerId;
      }
      const res = await fetch(`/api/rooms/${encodeURIComponent(cleanCode)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not join room');

      const newSession: SavedSession = {
        code: data.code,
        playerId: data.playerId,
        role: data.role,
        name
      };
      setSession(newSession);
      saveSession(newSession);
      setRoom(data.room);
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.code);
      window.history.replaceState({}, '', url.toString());
      connectWs(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = () => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    saveSession(null);
    setSession(null);
    setRoom(null);
    setWsConnected(false);
    setReconnecting(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  const sendAction = useCallback((type: string, payload?: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return {
    session,
    room,
    wsConnected,
    reconnecting,
    error,
    loading,
    createPrivateRoom,
    joinPrivateRoom,
    leaveRoom,
    sendAction,
    clearError: () => setError(null)
  };
}
