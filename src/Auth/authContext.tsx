// src/context/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  name: string;
  email: string;
  adress: string;
  latitude: number;
  longitude: number;
  profile_pic_url: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const isAuthenticated = !!user;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/profile", {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (err) {
        console.warn("User not logged in");
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
