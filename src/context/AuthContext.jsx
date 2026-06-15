import { useCallback, useEffect, useMemo, useState } from 'react';
import { demoAuthAccounts, isValidDemoCode, SHARED_DEMO_CODE } from '../data/demoAuth';
import { seedData } from '../data/seedData';
import { getCurrentUser, loginWithApi } from '../services/authApi';
import { useBackendApi } from '../services/apiClient';
import { AuthContext } from './AuthCore';

const AUTH_SESSION_KEY = 'simo-mugi-jaya-auth-session';

const rolesById = new Map(seedData.roles.map((role) => [role.id, role]));
const demoAccountsByUserId = new Map(demoAuthAccounts.map((account) => [account.userId, account]));

function buildDemoUsers() {
  return seedData.users.map((user) => {
    const account = demoAccountsByUserId.get(user.id);

    return {
      ...user,
      email: account?.email || '',
      demoCode: account?.demoCode || SHARED_DEMO_CODE,
      roleName: rolesById.get(user.roleId)?.name || user.roleId,
      isActive: true,
    };
  });
}

function readStoredSession() {
  try {
    const saved = window.localStorage.getItem(AUTH_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  try {
    if (session) {
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // localStorage can be unavailable in strict browser modes; auth still works in memory.
  }
}

function isExpired(session) {
  return Boolean(session?.expiresAt && Date.parse(session.expiresAt) <= Date.now());
}

function createLocalSession(user) {
  return {
    user,
    token: null,
    expiresAt: null,
    authMode: 'local-demo',
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const storedSession = readStoredSession();
    return isExpired(storedSession) ? null : storedSession;
  });
  const [isRestoringSession, setIsRestoringSession] = useState(() =>
    Boolean(useBackendApi && readStoredSession()?.token),
  );

  const demoUsers = useMemo(() => buildDemoUsers(), []);

  useEffect(() => {
    let isMounted = true;

    async function restoreBackendSession() {
      const storedSession = readStoredSession();

      if (!storedSession || isExpired(storedSession)) {
        writeStoredSession(null);
        if (isMounted) {
          setSession(null);
          setIsRestoringSession(false);
        }
        return;
      }

      if (!useBackendApi || !storedSession.token) {
        if (isMounted) {
          setSession(storedSession);
          setIsRestoringSession(false);
        }
        return;
      }

      try {
        const profile = await getCurrentUser(storedSession.token);

        if (isMounted) {
          setSession({
            user: profile.user,
            token: storedSession.token,
            expiresAt: profile.expiresAt,
            authMode: profile.authMode || 'backend-demo',
          });
        }
      } catch {
        writeStoredSession(null);
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreBackendSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  const login = useCallback(
    async ({ email, password, demoCode }) => {
      const credential = demoCode ?? password;
      let backendError;

      if (useBackendApi) {
        try {
          const result = await loginWithApi({ email, password, demoCode });
          const nextSession = {
            user: result.user,
            token: result.token,
            expiresAt: result.expiresAt,
            authMode: result.authMode || 'backend-demo',
          };

          setSession(nextSession);
          return nextSession.user;
        } catch (error) {
          backendError = error;
        }
      }

      const localUser = demoUsers.find(
        (user) => user.email.toLowerCase() === String(email || '').trim().toLowerCase(),
      );

      if (!localUser || !isValidDemoCode(localUser.id, credential)) {
        throw new Error(backendError?.message || 'Email or demo code is invalid.');
      }

      const nextSession = createLocalSession(localUser);
      setSession(nextSession);
      return nextSession.user;
    },
    [demoUsers],
  );

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser: session?.user || null,
      currentRoleId: session?.user?.roleId || null,
      token: session?.token || null,
      authMode: session?.authMode || 'signed-out',
      isAuthenticated: Boolean(session?.user),
      isRestoringSession,
      demoUsers,
      login,
      logout,
    }),
    [demoUsers, isRestoringSession, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
