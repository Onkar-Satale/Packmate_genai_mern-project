import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://YOUR-DEPLOYED-BACKEND-LINK.com/api', // Fallback defaults to deployed API
    withCredentials: true // Extremely important for strictly passing HttpOnly Refresh Cookies
});

export const aiApi = axios.create({
    baseURL: process.env.REACT_APP_AI_URL || "https://YOUR-DEPLOYED-GENAI-LINK.com", // Fallback defaults to GenAI Deployment
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to elegantly handle expired access tokens and try to hit /refresh-token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't blindly retried yet
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/refresh-token' && originalRequest.url !== '/login') {
            originalRequest._retry = true;
            try {
                // The browser automatically attaches the HttpOnly refreshToken cookie here
                const res = await axios.post(`${api.defaults.baseURL}/refresh-token`, {}, { withCredentials: true });
                if (res.data?.success && res.data.data?.token) {
                    localStorage.setItem('token', res.data.data.token);
                    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, they actually need to cleanly log in again
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
