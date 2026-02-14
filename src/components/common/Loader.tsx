import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
    fullPage?: boolean;
    size?: number;
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({
    fullPage = false,
    size = 40,
    text = 'Loading...'
}) => {
    const content = (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '24px'
        }}>
            <Loader2 className="animate-spin" size={size} color="var(--primary)" />
            {text && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                background: 'rgba(255, 255, 255, 0.8)',
                zIndex: 9999
            }}>
                {content}
            </div>
        );
    }

    return content;
};

export default Loader;
