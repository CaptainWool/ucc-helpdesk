import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Forbidden: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
            <Card style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
                <ShieldAlert size={64} color="var(--danger)" style={{ marginBottom: '20px' }} />
                <h1>Access Denied</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                    You don't have permission to view this page. If you believe this is an error, please contact support.
                </p>
                <Button onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
                    <Home size={18} /> Back to Safety
                </Button>
            </Card>
        </div>
    );
};

export default Forbidden;
