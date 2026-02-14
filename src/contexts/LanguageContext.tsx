import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../lib/translations';

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const t = (key: string): string => {
        const trans = (translations as any)[language];
        return (trans && trans[key]) || key;
    };

    const toggleLanguage = (lang: string) => {
        if ((translations as any)[lang]) {
            setLanguage(lang);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
