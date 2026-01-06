"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = ({ user, token }) => {
    setUser(user);
    setToken(token);
    // Hanya simpan user ID, bukan full object
    if (user?.id) {
      localStorage.setItem("userId", String(user.id));
    }
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
  };
  // Restore session saat reload - hanya restore token, bukan user data
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    try {
      if (storedToken && storedToken !== "undefined") {
        setToken(storedToken);
      }
    } catch (err) {
      console.error("Failed to parse stored token:", err);
      localStorage.removeItem("token");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
