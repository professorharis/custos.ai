'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ScamResult } from '@/lib/types';

interface ScanResultContextType {
  result: ScamResult | null;
  setResult: (result: ScamResult | null) => void;
  inputContent: string;
  setInputContent: (content: string) => void;
  inputType: string;
  setInputType: (type: string) => void;
}

const ScanResultContext = createContext<ScanResultContextType | undefined>(undefined);

export const ScanResultProvider = ({ children }: { children: ReactNode }) => {
  const [result, setResult] = useState<ScamResult | null>(null);
  const [inputContent, setInputContent] = useState('');
  const [inputType, setInputType] = useState('text');

  return (
    <ScanResultContext.Provider value={{ result, setResult, inputContent, setInputContent, inputType, setInputType }}>
      {children}
    </ScanResultContext.Provider>
  );
};

export const useScanResult = () => {
  const context = useContext(ScanResultContext);
  if (!context) throw new Error('useScanResult must be used within ScanResultProvider');
  return context;
};