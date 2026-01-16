"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getUser, logoutUser } from "@/services/auth";

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
  };

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser(); // backend clear cookie
      clearSession();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [clearSession]);

  // hydrate from backend via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const { user: fetchedUser } = await getUser();
        if (isMounted) setUser(fetchedUser || null);
      } catch (err) {
        if (err?.status === 401 && isMounted) {
          clearSession();
        }
      }
    };

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
