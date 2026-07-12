import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to dynamically inject authorization JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Axios request setup failed", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiry and API errors automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful error catching instead of raw AxiosError crashes
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // Clear storage and redirect to login only if not already there
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('employee');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        console.warn("403 Forbidden: Missing permissions for this endpoint");
      } else if (status === 404) {
        console.warn("404 Not Found: The requested resource doesn't exist");
      } else if (status >= 500) {
        console.error("500 Server Error: The backend is currently experiencing issues");
      }
    } else if (error.request) {
      console.error("Network Error: Could not reach the backend server");
    }
    
    // Return a structured error so UI components don't crash when awaiting
    return Promise.reject(error.response?.data?.error?.message || "An unexpected error occurred");
  }
);

export default api;
