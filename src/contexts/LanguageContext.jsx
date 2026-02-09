import React, { createContext, useState, useContext } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // Default to English

    const t = (key) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = (lang) => {
        if (translations[lang]) {
            setLanguage(lang);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
