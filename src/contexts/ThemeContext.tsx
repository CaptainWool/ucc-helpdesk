import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

interface ThemeContextType {
    theme: string;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile, user } = useAuth();
    const currentUser = profile || user;

    const [theme, setTheme] = useState<string>(() => {
        return localStorage.getItem('theme') || 'light';
    });

    // Initialize theme from profile if available
    useEffect(() => {
        if (currentUser?.theme && currentUser.theme !== theme) {
            setTheme(currentUser.theme);
        }
    }, [currentUser?.theme]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', theme);

        // Sync to backend if logged in
        if (currentUser?.id && theme !== currentUser.theme) {
            api.auth.updateUser(currentUser.id, { theme }).catch(err => {
                console.error('Failed to sync theme to backend:', err);
            });
        }
    }, [theme, currentUser?.id, currentUser?.theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
