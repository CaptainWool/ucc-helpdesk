import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/common/Toast';

interface ToastData {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
}

interface ToastContextType {
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastData['type'] = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const value: ToastContextType = {
        showSuccess: (msg, dur) => showToast(msg, 'success', dur),
        showError: (msg, dur) => showToast(msg, 'error', dur),
        showInfo: (msg, dur) => showToast(msg, 'info', dur),
        showWarning: (msg, dur) => showToast(msg, 'warning', dur),
        removeToast
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
