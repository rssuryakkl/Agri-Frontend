/**
 * src/Context/AuthContext.jsx
 *
 * Key fixes:
 * - Added authReady mechanism so getIdToken never runs before
 *   onAuthStateChanged has fired at least once.
 * - getIdToken waits up to 3s for Firebase to initialise.
 * - Removed broken default-object export.
 */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/Firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Resolvers waiting for first onAuthStateChanged to fire
  const waitingResolvers = useRef([]);
  const isReady          = useRef(false);

  /* ── Auth actions ───────────────────────────────────────────────────────── */

  const signup = async (email, password, displayName) => {
    setError(null);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(result.user, { displayName });
    return result;
  };

  const login = async (email, password) => {
    setError(null);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setError(null);
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    setError(null);
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (updates) => {
    setError(null);
    if (currentUser) await updateProfile(currentUser, updates);
  };

  /**
   * Always returns a fresh Firebase ID token string, or null if not signed in.
   * Waits up to 3 seconds for auth to initialise before giving up.
   */
  const getIdToken = async () => {
    // Wait for the first onAuthStateChanged to fire
    if (!isReady.current) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 3000);          // hard timeout 3 s
        waitingResolvers.current.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    // Use auth.currentUser (always current) not the React state variable
    const user = auth.currentUser;
    if (!user) {
      console.warn('[AuthContext] getIdToken: no signed-in user');
      return null;
    }

    try {
      const token = await user.getIdToken(true);   // force-refresh every time
      if (!token) throw new Error('Empty token returned');
      return token;
    } catch (err) {
      console.error('[AuthContext] getIdToken error:', err.code || err.message);
      return null;
    }
  };

  /* ── Auth state listener ────────────────────────────────────────────────── */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (!isReady.current) {
        isReady.current = true;
        waitingResolvers.current.forEach((r) => r());
        waitingResolvers.current = [];
      }
    });
    return unsubscribe;
  }, []);

  /* ── Value ──────────────────────────────────────────────────────────────── */

  return (
    <AuthContext.Provider value={{
      currentUser, loading, error,
      signup, login, logout, resetPassword, updateUserProfile, getIdToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};