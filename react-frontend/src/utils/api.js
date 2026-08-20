const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
    ? '' 
    : 'http://127.0.0.1:8000';

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

const getWsUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    }
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        return `${protocol}${window.location.host}`;
    }
    return 'ws://127.0.0.1:8000';
};

export const WS_URL = `${getWsUrl()}/ws/auction`;

export async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/';
        throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
        const error = await response.json();
        let errMsg = error.detail || 'API request failed';
        if (typeof errMsg === 'object') {
            errMsg = JSON.stringify(errMsg);
        }
        throw new Error(errMsg);
    }

    return response.json();
}

export function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function getUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return parseJwt(token);
}

export function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}
