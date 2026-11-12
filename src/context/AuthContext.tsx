import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: 'freelancer' | 'client') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (role?: 'freelancer' | 'client') => void;
  signOutUser: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'welvault_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Sync profile from Firestore or create initial doc
  const syncProfile = async (firebaseUser: User, fallbackName?: string, fallbackRole?: 'freelancer' | 'client') => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || 'user@welvault.app',
          displayName: firebaseUser.displayName || fallbackName || 'Creative Director',
          role: fallbackRole || 'freelancer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Could not sync user profile to Firestore:', err);
      // Fallback in-memory profile so UI doesn't crash
      setUserProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || 'user@welvault.app',
        displayName: firebaseUser.displayName || fallbackName || 'WelVault User',
        role: fallbackRole || 'freelancer',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Check if demo user is stored
    const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setIsDemoUser(true);
        setUserProfile(parsed.profile);
        setCurrentUser({
          uid: parsed.profile.id,
          email: parsed.profile.email,
          displayName: parsed.profile.displayName,
          emailVerified: true,
        } as unknown as User);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoUser(false);
        await syncProfile(user);
      } else {
        if (!isDemoUser) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setIsDemoUser(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      await syncProfile(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setAuthError('Incorrect email or password. Please try again.');
      } else if (msg.includes('auth/user-not-found')) {
        setAuthError('No account found with this email. Would you like to create one?');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setAuthError('Email/password sign-in is not enabled in Firebase Console yet. Please use Google Sign-In or Demo mode.');
      } else {
        setAuthError(msg || 'Failed to sign in. Please check your credentials.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: 'freelancer' | 'client'
  ) => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await fbUpdateProfile(res.user, { displayName: name });
      setIsDemoUser(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      await syncProfile(res.user, name, role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/email-already-in-use')) {
        setAuthError('An account with this email already exists. Please sign in instead.');
      } else if (msg.includes('auth/weak-password')) {
        setAuthError('Password should be at least 6 characters long.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        setAuthError('Email/password sign-up is not enabled in Firebase Console yet. Please use Google Sign-In or Demo mode.');
      } else {
        setAuthError(msg || 'Failed to create account.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setIsDemoUser(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
      await syncProfile(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/popup-closed-by-user')) {
        // User just cancelled popup, no big error
        setAuthError(null);
      } else {
        setAuthError('Google Sign-In failed: ' + (msg || 'Popup closed or blocked.'));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithDemo = (role: 'freelancer' | 'client' = 'freelancer') => {
    setAuthError(null);
    const demoProfile: UserProfile = {
      id: 'demo-user-welvault-101',
      email: role === 'freelancer' ? 'alex.designer@welvault.demo' : 'client.sarah@acmecorp.demo',
      displayName: role === 'freelancer' ? 'Alex Rivera (Designer)' : 'Sarah Jenkins (Acme Corp)',
      role,
      company: role === 'freelancer' ? 'Studio Rivera' : 'Acme Corp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockUser = {
      uid: demoProfile.id,
      email: demoProfile.email,
      displayName: demoProfile.displayName,
      emailVerified: true,
    } as unknown as User;

    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({ profile: demoProfile })
    );

    setIsDemoUser(true);
    setCurrentUser(mockUser);
    setUserProfile(demoProfile);
    setLoading(false);
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      if (isDemoUser) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setIsDemoUser(false);
        setCurrentUser(null);
        setUserProfile(null);
      } else {
        await fbSignOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isDemoUser,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithDemo,
        signOutUser,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
