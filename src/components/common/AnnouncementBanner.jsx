
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Bell, X } from 'lucide-react';
import { api } from '../../lib/api';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const settings = await api.system.getPublicSettings();
                if (settings.global_announcement && settings.global_announcement.enabled) {
                    setAnnouncement(settings.global_announcement);
                }
            } catch (err) {
                console.error('Failed to fetch announcement:', err);
            }
        };
        fetchAnnouncement();
    }, []);

    if (!announcement || !isVisible) return null;

    const getIcon = () => {
        switch (announcement.type) {
            case 'warning': return <AlertTriangle size={18} />;
            case 'info': return <Info size={18} />;
            default: return <Bell size={18} />;
        }
    };

    return (
        <div className={`announcement-banner banner-${announcement.type} fade-in`}>
            <div className="banner-content">
                <span className="banner-icon">{getIcon()}</span>
                <p>{announcement.message}</p>
            </div>
            <button className="banner-close" onClick={() => setIsVisible(false)}>
                <X size={16} />
            </button>
        </div>
    );
};

export default AnnouncementBanner;
