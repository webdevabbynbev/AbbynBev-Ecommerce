"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/services/authToken";
import { logoutLocal } from "@/services/auth";

export function useAuthGate(checkIntervalMs = 60_000) {
  const [isAuthed, setIsAuthed] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const check = () => {
      const token = getToken(); 
      setIsAuthed(Boolean(token));
      if (!token) logoutLocal();
    };

    check();

    const id = setInterval(check, checkIntervalMs);
    return () => clearInterval(id);
  }, [checkIntervalMs]);

  return { isAuthed };
}