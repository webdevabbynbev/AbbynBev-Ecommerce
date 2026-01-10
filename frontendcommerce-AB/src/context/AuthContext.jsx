"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { logoutUser } from "@/services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /**
   * ✅ HttpOnly cookie mode:
   * - token tidak disimpan di FE
   * - login cukup set user
   */
  const login = ({ user }) => {
    setUser(user || null);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  };

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser(); // backend clear cookie
    } catch {
      // ignore logout errors
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // hydrate from localStorage (buat UI cepat)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
        return;
      }
    } catch (err) {
      console.error("Failed to parse stored user:", err);
    }
    clearSession();
  }, [clearSession]);

  // sync antar tab
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== "user") return;
      const storedUser = localStorage.getItem("user");

      if (storedUser && storedUser !== "undefined") {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
