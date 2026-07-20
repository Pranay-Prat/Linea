import axios from "axios";

// Create a globally configured Axios instance
export const api = axios.create({
    // If you have a separate backend running on a different port (e.g. 3001), 
    // set NEXT_PUBLIC_API_URL in your .env.local file.
    // Otherwise, this will default to calling Next.js API routes on the same domain.
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Automatically attach tokens to every request
api.interceptors.request.use(
    (config) => {
        // For example, grabbing a JWT token from localStorage:
        // const token = localStorage.getItem("token");
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Globally handle API errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // For example, redirect to login page or clear local storage
            // console.warn("Unauthorized access - redirecting to login");
        }
        return Promise.reject(error);
    }
);

export default api;
