import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center'
                }}>
                    <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
                    <h1>Something went wrong</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        We've encountered an unexpected error. Don't worry, your data is safe.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw size={18} /> Reload Application
                        </Button>
                        <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.children;
    }

    private get children() {
        return this.props.children;
    }
}

export default ErrorBoundary;
