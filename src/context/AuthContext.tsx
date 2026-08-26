import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, checkIsAdmin, ADMIN_UIDS, ADMIN_EMAILS } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isDevAdmin: boolean;
  adminIdentifier: string;
  signInGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  activateDevAdmin: (keyOrUid: string) => boolean;
  deactivateDevAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_ADMIN_STORAGE_KEY = 'statuter_admin_dev_mode';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDevAdmin, setIsDevAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEV_ADMIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    return await signInWithGoogle();
  };

  const handleSignOut = async () => {
    setIsDevAdmin(false);
    try {
      localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
    } catch {}
    return await logOut();
  };

  // Dev Admin activation handler (using UID: Statuter-Dev or secret admin key)
  const activateDevAdmin = (keyOrUid: string): boolean => {
    const cleanKey = keyOrUid.trim();
    if (
      cleanKey === 'Statuter-Dev' || 
      cleanKey === 'statuter-dev' || 
      cleanKey === 'StatuterAdmin2026' ||
      cleanKey === 'ratchataphiphat@gmail.com'
    ) {
      setIsDevAdmin(true);
      try {
        localStorage.setItem(DEV_ADMIN_STORAGE_KEY, 'true');
      } catch {}
      return true;
    }
    return false;
  };

  const deactivateDevAdmin = () => {
    setIsDevAdmin(false);
    try {
      localStorage.removeItem(DEV_ADMIN_STORAGE_KEY);
    } catch {}
  };

  // True if user is logged in with admin Google email OR is dev admin with UID Statuter-Dev
  const isGoogleAdmin = checkIsAdmin(user);
  const isAdmin = isGoogleAdmin || isDevAdmin;
  const adminIdentifier = isDevAdmin ? 'Statuter-Dev' : (user?.email || (isGoogleAdmin ? 'Admin' : ''));

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isDevAdmin,
      adminIdentifier,
      signInGoogle: handleSignInGoogle,
      signOut: handleSignOut,
      activateDevAdmin,
      deactivateDevAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
