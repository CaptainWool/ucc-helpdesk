export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

const handleResponse = async (res) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) throw data;
        return data;
    } else {
        const text = await res.text();
        if (!res.ok) throw { error: res.statusText, message: text || 'An unexpected error occurred' };
        return text;
    }
};

const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    auth: {
        login: async (email, password) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return handleResponse(res);
        },
        forgotPassword: async (data) => {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        register: async (data) => {
            const isFormData = data instanceof FormData;
            const token = localStorage.getItem('auth_token');
            const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers,
                body: isFormData ? data : JSON.stringify(data)
            });
            return handleResponse(res);
        },
        requestReset: async (data) => {
            const res = await fetch(`${API_URL}/auth/request-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        verifyToken: async (data) => {
            const res = await fetch(`${API_URL}/auth/verify-reset-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        completeReset: async (data) => {
            const res = await fetch(`${API_URL}/auth/complete-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        me: async () => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        getUsers: async (role, email) => {
            const params = new URLSearchParams();
            if (role) params.append('role', role);
            if (email) params.append('email', email);
            const url = params.toString() ? `${API_URL}/users?${params.toString()}` : `${API_URL}/users`;
            const res = await fetch(url, { headers: getHeaders() });
            return handleResponse(res);
        },
        updateUser: async (id, data) => {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        updateAvatar: async (id, file) => {
            const formData = new FormData();
            formData.append('avatar', file);
            // Don't set Content-Type header for FormData, browser does it automatically with boundary
            const res = await fetch(`${API_URL}/users/${id}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: formData
            });
            return handleResponse(res);
        }
    },
    tickets: {
        list: async () => {
            const res = await fetch(`${API_URL}/tickets`, { headers: getHeaders() });
            return handleResponse(res);
        },
        create: async (data) => {
            const isFormData = data instanceof FormData;
            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: isFormData ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : getHeaders(),
                body: isFormData ? data : JSON.stringify(data)
            });
            return handleResponse(res);
        },
        get: async (id) => {
            const res = await fetch(`${API_URL}/tickets/${id}`, { headers: getHeaders() });
            return handleResponse(res);
        },
        update: async (id, updates) => {
            const res = await fetch(`${API_URL}/tickets/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updates)
            });
            return handleResponse(res);
        },
        delete: async (id) => {
            const res = await fetch(`${API_URL}/tickets/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(res);
        }
    },
    faq: {
        list: async () => {
            const res = await fetch(`${API_URL}/faq`, { headers: getHeaders() });
            return handleResponse(res);
        },
        create: async (data) => {
            const res = await fetch(`${API_URL}/faq`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        update: async (id, data) => {
            const res = await fetch(`${API_URL}/faq/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        delete: async (id) => {
            const res = await fetch(`${API_URL}/faq/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        trackHelpfulness: async (id, helpful) => {
            const res = await fetch(`${API_URL}/faq/${id}/helpful`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ helpful })
            });
            return handleResponse(res);
        }
    },
    messages: {
        list: async (ticketId) => {
            const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`, { headers: getHeaders() });
            return handleResponse(res);
        },
        create: async (ticketId, content, senderRole, attachment) => {
            let body;
            const headers = getHeaders();

            if (attachment) {
                const formData = new FormData();
                formData.append('content', content);
                formData.append('sender_role', senderRole);
                formData.append('attachment', attachment);

                // Let the browser set the Content-Type boundary for FormData
                delete headers['Content-Type'];
                body = formData;
            } else {
                body = JSON.stringify({ content, sender_role: senderRole });
            }

            const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers,
                body
            });
            return handleResponse(res);
        }
    },
    system: {
        getSettings: async () => {
            const res = await fetch(`${API_URL}/settings`, { headers: getHeaders() });
            return handleResponse(res);
        },
        updateSettings: async (key, value) => {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ key, value })
            });
            return handleResponse(res);
        },
        getPublicSettings: async () => {
            const res = await fetch(`${API_URL}/public/settings`);
            return handleResponse(res);
        },
        moderateUser: async (id, data) => {
            const res = await fetch(`${API_URL}/users/${id}/moderate`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        getAuditLogs: async () => {
            const res = await fetch(`${API_URL}/audit-logs`, { headers: getHeaders() });
            return handleResponse(res);
        },
        cleanupTickets: async () => {
            const res = await fetch(`${API_URL}/system/cleanup`, {
                method: 'POST',
                headers: getHeaders()
            });
            return handleResponse(res);
        }
    },
    faq: {
        list: async () => {
            const res = await fetch(`${API_URL}/faq`);
            return handleResponse(res);
        },
        create: async (data) => {
            const res = await fetch(`${API_URL}/faq`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        update: async (id, data) => {
            const res = await fetch(`${API_URL}/faq/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(res);
        },
        delete: async (id) => {
            const res = await fetch(`${API_URL}/faq/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse(res);
        },
        trackHelpful: async (id, helpful) => {
            const res = await fetch(`${API_URL}/faq/${id}/helpful`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ helpful })
            });
            return handleResponse(res);
        }
    }
};
