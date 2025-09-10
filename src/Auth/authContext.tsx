// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect } from "react";
import api, { setTokens, removeTokens, getToken } from "../utils/api";
import { useLocationRequest } from "../Location/useLocationRequest";

interface User {
    id: number;
    name: string;
    email: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    profilePicUrl?: string;
    rating: number;
    verified: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    loading: boolean;
    isLoading: boolean;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    address?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Token management is now handled in utils/api.ts

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const isAuthenticated = !!user;

    // Fetch current user on app load
    useEffect(() => {
        const fetchUser = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get("/api/profile");
                const userData = res.data.data || res.data.user;
                setUser({
                    ...userData,
                    rating: userData.rating || 5, // Default rating
                    verified: userData.verified || false, // Default verified status
                });
            } catch (err) {
                console.warn("Failed to fetch user:", err);
                removeTokens();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post("/api/auth/login", {
                email,
                password,
            });

            const { accessToken, refreshToken, user: userData } = response.data;
            setTokens(accessToken, refreshToken);
            setUser({
                ...userData,
                rating: 5, // Default rating
                verified: false, // Default verified status
            });
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData: RegisterData) => {
        try {
            const response = await api.post("/api/auth/register", userData);
            const { accessToken, refreshToken, user: newUser } = response.data;
            setTokens(accessToken, refreshToken);
            setUser({
                ...newUser,
                rating: 5, // Default rating
                verified: false, // Default verified status
            });
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        // Just clear tokens and user state - no API call needed
        removeTokens();
        setUser(null);
        // Redirect to home page using replace to avoid back button issues
        window.location.replace("/");
    };

    const updateUser = (userData: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...userData } : null));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                login,
                register,
                logout,
                updateUser,
                loading,
                isLoading: loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
