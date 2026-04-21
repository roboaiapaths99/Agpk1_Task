import { create } from 'zustand';
import api from '../services/api/axios';

const useAuthStore = create((set) => ({
    user: null,
    organization: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,

    login: async (credentials) => {
        set({ loading: true });
        try {
            const response = await api.post('/auth/login', credentials);
            const { accessToken, refreshToken, user, organization } = response;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            set({ user, organization, token: accessToken, isAuthenticated: true, loading: false });
            return response;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await api.post('/auth/logout', { refreshToken });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, organization: null, token: null, isAuthenticated: false });
    },

    fetchMe: async () => {
        try {
            const response = await api.get('/auth/me');
            const { user, organization } = response;
            set({ user, organization, isAuthenticated: true });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, organization: null, isAuthenticated: false });
        }
    },
}));

export default useAuthStore;
