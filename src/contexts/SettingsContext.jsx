import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const SettingsContext = createContext({});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        showHeaderSubmit: true,
        showHeaderFAQ: true,
        allowVideoSupport: true,
        maintenanceMode: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Try to load from localStorage first for instant UI
                const cached = localStorage.getItem('ucc_system_settings');
                if (cached) {
                    setSettings(JSON.parse(cached));
                }

                // Try to sync with backend
                const backendSettings = await api.system.getPublicSettings();
                if (backendSettings) {
                    const merged = { ...settings, ...backendSettings };
                    setSettings(merged);
                    localStorage.setItem('ucc_system_settings', JSON.stringify(merged));
                }
            } catch (err) {
                console.warn('System settings fetch failed, using defaults/cache', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('ucc_system_settings', JSON.stringify(newSettings));

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
