import { create } from 'zustand';
import axios from 'axios';

// Configure axios for Django session/CSRF
axios.defaults.withCredentials = true;
axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.xsrfCookieName = "csrftoken";

interface AuthState {
    user: { email: string; is_superuser?: boolean } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: any) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: (userData) => set({ user: userData, isAuthenticated: true, isLoading: false }),
    logout: async () => {
        try {
            await axios.post('/auth/logout/');
        } catch (e) {
            console.error('Logout failed', e);
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
    },
    checkAuth: async () => {
        try {
            const response = await axios.get('/auth/check-session/');
            if (response.data.isAuthenticated) {
                set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (e) {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
