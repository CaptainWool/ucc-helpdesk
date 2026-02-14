import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/layout/Layout';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load pages for better performance
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SubmitTicket = lazy(() => import('./pages/SubmitTicket'));
const TrackTicket = lazy(() => import('./pages/TrackTicket'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <Loader fullPage />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0) {
        const userRole = profile?.role || user.role;
        if (!roles.includes(userRole)) {
            return <Navigate to="/forbidden" replace />;
        }
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <LanguageProvider>
                        <SettingsProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    <Layout>
                                        <Suspense fallback={<Loader fullPage />}>
                                            <Routes>
                                                {/* Public Routes */}
                                                <Route path="/login" element={<StudentLogin />} />
                                                <Route path="/admin/login" element={<AdminLogin />} />
                                                <Route path="/faq" element={<FAQ />} />
                                                <Route path="/terms" element={<TermsOfService />} />

                                                {/* Student Routes */}
                                                <Route path="/dashboard" element={
                                                    <ProtectedRoute roles={['student', 'agent', 'super_admin']}>
                                                        <StudentDashboard />
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/submit-ticket" element={
                                                    <ProtectedRoute roles={['student']}>
                                                        <SubmitTicket />
                                                    </ProtectedRoute>
                                                } />
                                                <Route path="/track-ticket" element={
                                                    <ProtectedRoute>
                                                        <TrackTicket />
                                                    </ProtectedRoute>
                                                } />

                                                {/* Admin Routes */}
                                                <Route path="/admin" element={
                                                    <ProtectedRoute roles={['agent', 'super_admin']}>
                                                        <AdminDashboard />
                                                    </ProtectedRoute>
                                                } />

                                                {/* Utilities */}
                                                <Route path="/forbidden" element={<Forbidden />} />
                                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                                <Route path="*" element={<NotFound />} />
                                            </Routes>
                                        </Suspense>
                                    </Layout>
                                </AuthProvider>
                            </ToastProvider>
                        </SettingsProvider>
                    </LanguageProvider>
                </ThemeProvider>

            </QueryClientProvider>
        </ErrorBoundary>
    );
};

export default App;
