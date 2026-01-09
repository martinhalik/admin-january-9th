import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserPreferencesContextType {
  debugMode: boolean;
  toggleDebugMode: () => void;
  hasDebugControls: boolean;
  setHasDebugControls: (hasControls: boolean) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'user-preferences';

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [debugMode, setDebugMode] = useState<boolean>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.debugMode || false;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Track if current page has debug controls
  const [hasDebugControls, setHasDebugControls] = useState<boolean>(false);

  useEffect(() => {
    // Persist to localStorage whenever preferences change
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ debugMode }));
  }, [debugMode]);

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  return (
    <UserPreferencesContext.Provider value={{ debugMode, toggleDebugMode, hasDebugControls, setHasDebugControls }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
};

