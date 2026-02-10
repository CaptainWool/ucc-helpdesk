import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';

// Eager load core pages for instant performance
import Home from './pages/Home';
import StudentLogin from './pages/StudentLogin';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SubmitTicket from './pages/SubmitTicket';
import ForgotPassword from './pages/ForgotPassword';

// Lazy load secondary pages
const TrackTicket = lazy(() => import('./pages/TrackTicket'));
const FAQ = lazy(() => import('./pages/FAQ'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const StudentSignUp = lazy(() => import('./pages/StudentSignUp'));
const AdminSignUp = lazy(() => import('./pages/AdminSignUp'));

const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--primary)' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid', borderRadius: '50%', borderTopColor: 'transparent' }}></div>
    </div>
);

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <SettingsProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <BrowserRouter>
                                <Suspense fallback={<LoadingFallback />}>
                                    <Routes>
                                        <Route path="/" element={<Layout />}>
                                            <Route index element={<Home />} />
                                            <Route path="dashboard" element={
                                                <ProtectedRoute>
                                                    <StudentDashboard />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="submit-ticket" element={
                                                <ProtectedRoute requiredRole="student">
                                                    <SubmitTicket />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="track-ticket" element={<TrackTicket />} />
                                            <Route path="faq" element={<FAQ />} />
                                            <Route path="privacy" element={<PrivacyPolicy />} />
                                            <Route path="terms" element={<TermsOfService />} />
                                            <Route path="student-login" element={<StudentLogin />} />
                                            <Route path="student-signup" element={<StudentSignUp />} />
                                            <Route path="forgot-password" element={<ForgotPassword />} />
                                            <Route path="login" element={<Login />} />
                                            <Route path="admin-signup" element={
                                                <ProtectedRoute requiredRole="super_admin">
                                                    <AdminSignUp />
                                                </ProtectedRoute>
                                            } />
                                            <Route path="admin" element={
                                                <ProtectedRoute adminOnly={true}>
                                                    <AdminDashboard />
                                                </ProtectedRoute>
                                            } />
                                        </Route>
                                    </Routes>
                                </Suspense>
                            </BrowserRouter>
                        </AuthProvider>
                    </ToastProvider>
                </SettingsProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
