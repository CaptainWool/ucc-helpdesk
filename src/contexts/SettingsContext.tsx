import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface Settings {
    showHeaderSubmit: boolean;
    showHeaderFAQ: boolean;
    allowVideoSupport: boolean;
    maintenanceMode: boolean;
    [key: string]: any;
}

interface SettingsContextType {
    settings: Settings;
    updateSetting: (key: string, value: any) => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>({
        showHeaderSubmit: true,
        showHeaderFAQ: true,
        allowVideoSupport: true,
        maintenanceMode: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const cached = localStorage.getItem('ucc_system_settings');
                if (cached) {
                    setSettings(JSON.parse(cached));
                }

                const backendSettings = await api.system.getPublicSettings();
                if (backendSettings) {
                    setSettings(prev => {
                        const merged = { ...prev, ...backendSettings };
                        localStorage.setItem('ucc_system_settings', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (err) {
                console.warn('System settings fetch failed, using defaults/cache', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateSetting = async (key: string, value: any) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            localStorage.setItem('ucc_system_settings', JSON.stringify(newSettings));
            return newSettings;
        });

        try {
            await api.system.updateSettings(key, value);
        } catch (err) {
            console.error('Failed to sync setting to backend', err);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};
