import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // On mount, check if there's a valid session (cookie is sent automatically)
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await api.get('/api/auth/me');
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = useCallback(async (username, password) => {
        const { data } = await api.post('/api/auth/login', { username, password });
        setUser(data);
        navigate('/dashboard');
    }, [navigate]);

    const logout = useCallback(async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            setUser(null);
            navigate('/login');
        }
    }, [navigate]);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };
};
