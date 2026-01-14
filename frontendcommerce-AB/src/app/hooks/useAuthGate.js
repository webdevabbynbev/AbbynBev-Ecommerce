"use client";

import { useEffect, useState } from "react";
import { getUser ,logoutLocal } from "@/services/auth";

export function useAuthGate(checkIntervalMs = 60_000) {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const { user } = await getUser();
        if (isMounted) setIsAuthed(Boolean(user));
      } catch (err) {
        if (!isMounted) return;
        setIsAuthed(false);
        if (err?.status === 401) logoutLocal();
      }
    };

    check();

    const id = setInterval(check, checkIntervalMs);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [checkIntervalMs]);

  return { isAuthed };
}