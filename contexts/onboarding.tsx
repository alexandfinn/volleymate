import React, { createContext, useContext, useState } from 'react';

interface OnboardingContextType {
  name: string;
  setName: (name: string) => void;
  level: string;
  setLevel: (level: string) => void;
  gender: string;
  setGender: (gender: string) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [gender, setGender] = useState('');

  const resetOnboarding = () => {
    setName('');
    setLevel('');
    setGender('');
  };

  return (
    <OnboardingContext.Provider
      value={{
        name,
        setName,
        level,
        setLevel,
        gender,
        setGender,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 