import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX, Home } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            <Card style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
                <SearchX size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
                <h1>Page Not Found</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Button onClick={() => navigate('/')} style={{ width: '100%' }}>
                    <Home size={18} /> Back to Home
                </Button>
            </Card>
        </div>
    );
};

export default NotFound;
