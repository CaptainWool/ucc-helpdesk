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
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw size={18} /> Reload Application
                        </Button>
                        <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
                            Try Again
                        </Button>
                    </div>
                    {this.state.error && (
                        <div style={{ marginTop: '32px', textAlign: 'left', background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fee2e2', maxWidth: '600px', width: '100%' }}>
                            <p style={{ color: '#991b1b', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Error Details:</p>
                            <pre style={{ fontSize: '12px', color: '#b91c1c', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {this.state.error.message || String(this.state.error)}
                            </pre>
                            {this.state.error.stack && (
                                <details style={{ marginTop: '12px' }}>
                                    <summary style={{ fontSize: '11px', color: '#7f1d1d', cursor: 'pointer' }}>View Stack Trace</summary>
                                    <pre style={{ fontSize: '10px', color: '#7f1d1d', marginTop: '8px', opacity: 0.7 }}>{this.state.error.stack}</pre>
                                </details>
                            )}
                        </div>
                    )}
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
