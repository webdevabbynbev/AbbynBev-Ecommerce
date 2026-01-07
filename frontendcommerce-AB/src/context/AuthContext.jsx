"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getToken,
  setToken as persistToken,
  clearToken,
} from "@/services/authToken";
import { logoutUser } from "@/services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getToken());

  const login = ({ user, token }) => {
    setUser(user);
    setToken(token || null);
    if (token) {
      persistToken(token);
    } else {
      clearToken();
    }
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
    const storedToken = getToken();

    try {
      if (storedToken) {
        if (storedUser && storedUser !== "undefined") {
          setUser(JSON.parse(storedUser));
        }
        setToken(storedToken);
        return;
      }
    } catch (err) {
      console.error("Failed to parse stored user:", err);
    }
    clearSession();
  }, []);

  useEffect(() => {
    const checkToken = () => {
      const latestToken = getToken();
      if (!latestToken) {
        clearSession();
        return;
      }
      if (latestToken !== token) {
        setToken(latestToken);
      }
    };

    const id = setInterval(checkToken, 60_000);

    const onStorage = (event) => {
      if (
        event.key === "token" ||
        event.key === "token_expires_at" ||
        event.key === "user"
      ) {
        checkToken();
        if (event.key === "user") {
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
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
    };
  }, [clearSession, token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
