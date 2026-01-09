"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { clearToken } from "@/services/authToken";
import { logoutUser } from "@/services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = ({ user, token }) => {
    setUser(user);
    setToken(token || null);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    clearToken();
    localStorage.removeItem("user");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore logout errors
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    try {
      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
        setToken("cookie");
        return;
      }
    } catch (err) {
      console.error("Failed to parse stored user:", err);
    }
    clearSession();
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== "user") return;
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined") {
        try {
          setUser(JSON.parse(storedUser));
          setToken("cookie");
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
