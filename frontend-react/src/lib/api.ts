import axios from 'axios';

// Create an Axios instance configured to handle cookies
const api = axios.create({
    baseURL: '', // Uses relative path to hit the Vite proxy
    withCredentials: true, // Crucial for sending/receiving session cookies
});

// Interceptor to automatically attach the CSRF token to non-GET requests
api.interceptors.request.use((config) => {
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
        // CSRF cookie name in Django is typically 'csrftoken'
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];

        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
