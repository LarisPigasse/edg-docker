import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAccount } from '@/features/auth/store/authSlice';
import { getErrorMessage } from '@/core/utils';
import { fetchActiveSessions, revokeSession, blockUser, unblockUser, fetchBlockedUsers } from '../api/sessionsApi';
import type { Session, BlockUserRequest, BlockedUser } from '../types';

interface UseSessionsReturn {
  sessions: Session[];
  blockedUsers: BlockedUser[];
  loading: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
  handleRevokeSession: (sessionId: number) => Promise<void>;
  handleBlockUser: (userId: number, blockData: BlockUserRequest) => Promise<void>;
  handleUnblockUser: (userId: number) => Promise<void>;
  currentSessionId: number | null;
}

/**
 * Hook per gestire sessioni attive con auto-refresh
 *
 * Features:
 * - Caricamento iniziale sessioni
 * - Auto-refresh ogni 30 secondi
 * - Revoca sessione
 * - Blocco/sblocco utente
 * - Detection sessione corrente
 */
export const useSessions = (): UseSessionsReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ottieni accountId dell'utente loggato da Redux
  const account = useSelector(selectAccount);
  const currentAccountId = account?.id;

  /**
   * Carica sessioni e utenti bloccati dal backend
   */
  const loadSessions = useCallback(async () => {
    try {
      setError(null);

      // Carica sessioni attive
      const sessionsResponse = await fetchActiveSessions();
      setSessions(sessionsResponse.data);

      // Carica utenti bloccati
      const blockedResponse = await fetchBlockedUsers();
      setBlockedUsers(blockedResponse.data);

      // Identifica sessione corrente confrontando accountId
      if (sessionsResponse.data.length > 0 && currentAccountId) {
        // Trova la sessione dell'utente corrente più recente
        const userSessions = sessionsResponse.data.filter(s => s.user.id === currentAccountId);

        if (userSessions.length > 0) {
          // Ordina per lastActivityAt DESC e prendi la più recente
          const sorted = [...userSessions].sort((a, b) => {
            const timeA = new Date(a.lastActivityAt || a.createdAt).getTime();
            const timeB = new Date(b.lastActivityAt || b.createdAt).getTime();
            return timeB - timeA;
          });
          setCurrentSessionId(sorted[0].id);
        }
      }
    } catch (err) {
      console.error('Errore caricamento sessioni:', err);
      setError(getErrorMessage(err, 'Errore nel caricamento delle sessioni'));
    } finally {
      setLoading(false);
    }
    // `currentAccountId` è letto solo per marcare la sessione corrente:
    // un suo cambiamento non deve far ripartire la fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Refresh manuale (utile dopo revoke/block)
   */
  const refreshSessions = useCallback(async () => {
    setLoading(true);
    await loadSessions();
  }, [loadSessions]);

  /**
   * Revoca una sessione
   */
  const handleRevokeSession = useCallback(
    async (sessionId: number) => {
      try {
        await revokeSession(sessionId);
        // Refresh immediato
        await loadSessions();
      } catch (err) {
        console.error('Errore revoca sessione:', err);
        throw new Error(getErrorMessage(err, 'Errore nella revoca della sessione'));
      }
    },
    [loadSessions]
  );

  /**
   * Blocca un utente
   */
  const handleBlockUser = useCallback(
    async (userId: number, blockData: BlockUserRequest) => {
      try {
        await blockUser(userId, blockData);
        // Refresh immediato (le sessioni dell'utente bloccato saranno revocate)
        await loadSessions();
      } catch (err) {
        console.error('Errore blocco utente:', err);
        throw new Error(getErrorMessage(err, "Errore nel blocco dell'utente"));
      }
    },
    [loadSessions]
  );

  /**
   * Sblocca un utente
   */
  const handleUnblockUser = useCallback(
    async (userId: number) => {
      try {
        await unblockUser(userId);
        // Refresh immediato
        await loadSessions();
      } catch (err) {
        console.error('Errore sblocco utente:', err);
        throw new Error(getErrorMessage(err, "Errore nello sblocco dell'utente"));
      }
    },
    [loadSessions]
  );

  /**
   * Setup auto-refresh ogni 30 secondi
   */
  useEffect(() => {
    // Caricamento iniziale
    loadSessions();

    // Setup polling
    intervalRef.current = setInterval(() => {
      loadSessions();
    }, 60000); // 60 secondi

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadSessions]);

  return {
    sessions,
    blockedUsers,
    loading,
    error,
    refreshSessions,
    handleRevokeSession,
    handleBlockUser,
    handleUnblockUser,
    currentSessionId,
  };
};
