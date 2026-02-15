import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { api } from '../lib/api';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [impersonating, setImpersonating] = useState(false);
    const [originalUser, setOriginalUser] = useState<User | null>(null);

    const checkAuth = async () => {


        try {
            const token = localStorage.getItem('auth_token');
            if (token && token !== 'undefined' && token !== 'null') {
                const response = await api.auth.me();
                const userData = (response as any).user || response;

                const normalizedUser: User = {
                    ...userData,
                    full_name: userData.full_name || userData.fullName || userData.name || '',
                    student_id: userData.student_id || userData.studentId || userData.userId || userData.id || 'N/A'
                };

                setUser(normalizedUser);
                setProfile(normalizedUser);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            localStorage.removeItem('auth_token');
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const signOut = async () => {
        localStorage.removeItem('auth_token');

        setUser(null);
        setProfile(null);
        setImpersonating(false);
        setOriginalUser(null);
    };

    const value: AuthContextType = {
        user,
        profile,
        loading,
        impersonating,
        signUp: async (signUpData: any) => {
            const { email, password, options, avatar, ...rest } = signUpData;
            try {
                let dataToPath: any;

                if (avatar) {
                    const formData = new FormData();
                    formData.append('email', email);
                    formData.append('password', password);
                    formData.append('full_name', options?.data?.full_name || rest.full_name || signUpData.fullName || rest.fullName || '');
                    formData.append('student_id', options?.data?.student_id || rest.student_id || signUpData.studentId || rest.studentId || '');
                    formData.append('phone_number', options?.data?.phone_number || rest.phone_number || signUpData.phoneNumber || rest.phoneNumber || '');
                    formData.append('level', options?.data?.level || rest.level || signUpData.level || '');
                    formData.append('programme', options?.data?.programme || rest.programme || signUpData.programme || '');
                    formData.append('avatar', avatar);
                    if (rest.staffId || signUpData.staffId || rest.staff_id) formData.append('staff_id', rest.staffId || signUpData.staffId || rest.staff_id);
                    if (rest.role || signUpData.role) formData.append('role', rest.role || signUpData.role);
                    if (rest.department || signUpData.department) formData.append('department', rest.department || signUpData.department);
                    if (rest.expertise || signUpData.expertise) formData.append('expertise', rest.expertise || signUpData.expertise);
                    dataToPath = formData;
                } else {
                    dataToPath = {
                        ...rest,
                        email,
                        password,
                        full_name: options?.data?.full_name || rest.full_name || signUpData.fullName || rest.fullName || '',
                        student_id: options?.data?.student_id || rest.student_id || signUpData.studentId || rest.studentId || '',
                        staff_id: options?.data?.staff_id || rest.staff_id || signUpData.staffId || rest.staffId || '',
                        phone_number: options?.data?.phone_number || rest.phone_number || signUpData.phoneNumber || rest.phoneNumber || '',
                        level: options?.data?.level || rest.level || signUpData.level || '',
                        programme: options?.data?.programme || rest.programme || signUpData.programme || '',
                        role: options?.data?.role || rest.role || signUpData.role,
                        department: options?.data?.department || rest.department || signUpData.department || '',
                        expertise: options?.data?.expertise || rest.expertise || signUpData.expertise || ''
                    };
                }

                const data = await api.auth.register(dataToPath);
                return { data, error: null };
            } catch (err: any) {
                const normalizedError = {
                    ...err,
                    message: err.error || err.message || 'An unknown error occurred'
                };
                return { data: null, error: normalizedError };
            }
        },
        signIn: async ({ email, password }) => {
            try {
                const data = await api.auth.login(email, password);
                localStorage.setItem('auth_token', data.token);

                const userData = data.user || data;
                const normalizedUser: User = {
                    ...userData,
                    full_name: userData.full_name || userData.fullName || userData.name || '',
                    student_id: userData.student_id || userData.studentId || userData.userId || userData.id || 'N/A'
                };

                setUser(normalizedUser);
                setProfile(normalizedUser);
                return { data, error: null };
            } catch (err: any) {
                const normalizedError = {
                    ...err,
                    message: err.error || err.message || 'Login failed'
                };
                return { data: null, error: normalizedError };
            }
        },
        signOut,
        impersonateUser: async (userId: string) => {
            try {
                const users = await api.auth.getUsers();
                const targetUser = users.find(u => u.id === userId);
                if (targetUser) {
                    setOriginalUser(user);
                    setProfile(targetUser);
                    setImpersonating(true);
                }
            } catch (err) {
                console.error('Impersonation failed:', err);
            }
        },
        stopImpersonating: () => {
            if (originalUser) {
                setProfile(originalUser);
                setImpersonating(false);
                setOriginalUser(null);
            }
        },
        refreshProfile: checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
