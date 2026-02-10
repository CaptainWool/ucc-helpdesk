import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null); // In postgres backend, user object includes role/profile info
    const [loading, setLoading] = useState(true);
    const [impersonating, setImpersonating] = useState(false);
    const [originalUser, setOriginalUser] = useState(null);

    const checkAuth = async () => {
        // Master Admin bypass check
        if (sessionStorage.getItem('master_access') === 'true') {
            setUser({ email: 'master@ucc.edu.gh', id: 'master-bypass' });
            setProfile({ role: 'super_admin', email: 'master@ucc.edu.gh', full_name: 'Master Admin' });
            setLoading(false);
            return;
        }

        // Student bypass check
        if (sessionStorage.getItem('student_access') === 'true') {
            setUser({ email: 'student@ucc.edu.gh', id: 'student-bypass' });
            setProfile({ role: 'student', email: 'student@ucc.edu.gh', full_name: 'Test Student', student_id: '10224055' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                const response = await api.auth.me();
                // Normalize response: some backends return { user: ... } others just the user
                const userData = response.user || response;

                // Ensure field names are consistent (snake_case)
                const normalizedUser = {
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

    const value = {
        signUp: async (signUpData) => {
            const { email, password, options, avatar, ...rest } = signUpData;
            console.log('Auth: Starting signUp for', email);
            try {
                let dataToPath;

                if (avatar) {
                    // Use FormData for file upload
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
                    // Fallback to JSON
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
                console.log('Auth: signUp success', data.user?.email || 'New User');
                // Removed automatic login to require manual authentication per user request
                return { data, error: null };
            } catch (err) {
                console.error('Auth: signUp failed', err);
                const normalizedError = {
                    ...err,
                    message: err.error || err.message || 'An unknown error occurred'
                };
                return { data: null, error: normalizedError };
            }
        },
        signIn: async ({ email, password }) => {
            console.log('Auth: Starting signIn for', email);
            try {
                const data = await api.auth.login(email, password);
                console.log('Auth: signIn success', data.user.email);
                localStorage.setItem('auth_token', data.token);

                const userData = data.user || data;
                const normalizedUser = {
                    ...userData,
                    full_name: userData.full_name || userData.fullName || userData.name || '',
                    student_id: userData.student_id || userData.studentId || userData.userId || userData.id || 'N/A'
                };

                setUser(normalizedUser);
                setProfile(normalizedUser);
                return { data, error: null };
            } catch (err) {
                console.error('Auth: signIn failed', err);
                const normalizedError = {
                    ...err,
                    message: err.error || err.message || 'Login failed'
                };
                return { data: null, error: normalizedError };
            }
        },
        masterLogin: () => {
            sessionStorage.setItem('master_access', 'true');
            setUser({ email: 'master@ucc.edu.gh', id: 'master-bypass' });
            setProfile({ role: 'super_admin', email: 'master@ucc.edu.gh', full_name: 'Master Admin' });
        },
        studentLogin: () => {
            sessionStorage.setItem('student_access', 'true');
            setUser({ email: 'student@ucc.edu.gh', id: 'student-bypass' });
            setProfile({ role: 'student', email: 'student@ucc.edu.gh', full_name: 'Test Student', student_id: '10224055' });
        },
        signOut: async () => {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('master_access');
            sessionStorage.removeItem('student_access');
            setUser(null);
            setProfile(null);
            setImpersonating(false);
            setOriginalUser(null);
        },
        impersonateUser: async (userId) => {
            try {
                // In a real app, this would be a backend call to get a temporary token or session
                // For now, we'll fetch the user data and swap context
                const users = await api.auth.getUsers();
                const targetUser = users.find(u => u.id === userId);
                if (targetUser) {
                    setOriginalUser(user);
                    setProfile(targetUser); // Use profile to store the "active" user data
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
        refreshProfile: checkAuth,
        user,
        profile,
        loading,
        impersonating
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
