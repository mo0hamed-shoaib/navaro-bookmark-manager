import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EditingContextType {
  isEditingEnabled: boolean;
  enableEditing: () => void;
  disableEditing: () => void;
}

const EditingContext = createContext<EditingContextType | undefined>(undefined);

export function EditingProvider({ children }: { children: ReactNode }) {
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('editing-enabled');
    if (savedState === 'true') {
      setIsEditingEnabled(true);
    }
  }, []);

  const enableEditing = () => {
    setIsEditingEnabled(true);
    localStorage.setItem('editing-enabled', 'true');
  };

  const disableEditing = () => {
    setIsEditingEnabled(false);
    localStorage.setItem('editing-enabled', 'false');
  };

  return (
    <EditingContext.Provider value={{ isEditingEnabled, enableEditing, disableEditing }}>
      {children}
    </EditingContext.Provider>
  );
}

export function useEditing() {
  const context = useContext(EditingContext);
  if (context === undefined) {
    throw new Error('useEditing must be used within an EditingProvider');
  }
  return context;
}
