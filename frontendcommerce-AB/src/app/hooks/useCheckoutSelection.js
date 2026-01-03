"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "checkout_selected_ids";

export function useCheckoutSelection() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSelectedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSelectedIds([]);
    } finally {
      setReady(true);
    }
  }, []);

  function persist(next) {
    setSelectedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function removeId(id) {
    persist(selectedIds.filter((x) => x !== id));
  }

  return { selectedIds, setSelectedIds: persist, removeId, ready };
}
