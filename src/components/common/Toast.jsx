import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration === Infinity) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle className="toast-icon" size={20} />,
        error: <AlertCircle className="toast-icon" size={20} />,
        info: <Info className="toast-icon" size={20} />,
        warning: <AlertTriangle className="toast-icon" size={20} />
    };

    return (
        <div className={`toast toast-${type} fade-in-up`}>
            <div className="toast-content">
                <div className="toast-icon-wrapper">
                    {icons[type]}
                </div>
                <div className="toast-message-wrapper">
                    <p className="toast-message">{message}</p>
                </div>
                <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
                    <X size={16} />
                </button>
            </div>
            {duration !== Infinity && (
                <div
                    className="toast-progress-bar"
                    style={{ animationDuration: `${duration}ms` }}
                />
            )}
        </div>
    );
};

export default Toast;
