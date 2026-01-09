"use client";

import { useEffect, useState } from "react";
import { logoutLocal } from "@/services/auth";

const USER_KEY = "user";

export function useAuthGate(checkIntervalMs = 60_000) {
  const [isAuthed, setIsAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem(USER_KEY));
  });

  useEffect(() => {
    const check = () => {
      const hasUser = Boolean(localStorage.getItem(USER_KEY));
      setIsAuthed(hasUser);
      if (!hasUser) logoutLocal();
    };

    check();

    const id = setInterval(check, checkIntervalMs);
    return () => clearInterval(id);
  }, [checkIntervalMs]);

  return { isAuthed };
}