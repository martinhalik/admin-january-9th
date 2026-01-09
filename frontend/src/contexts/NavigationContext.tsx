import React, { createContext, useContext, ReactNode } from 'react';

interface NavigationContextType {
  setReferrer: (type: 'account' | 'deal' | 'deals', id?: string) => void;
  clearReferrer: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const setReferrer = (type: 'account' | 'deal' | 'deals', id?: string) => {
    const referrerInfo = {
      type,
      id,
      timestamp: Date.now()
    };
    sessionStorage.setItem('navigationReferrer', JSON.stringify(referrerInfo));
  };

  const clearReferrer = () => {
    sessionStorage.removeItem('navigationReferrer');
  };

  return (
    <NavigationContext.Provider value={{ setReferrer, clearReferrer }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
