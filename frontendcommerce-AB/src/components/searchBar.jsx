"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { TxtField } from ".";

export function SearchBar({
  className = "",
  placeholder = "Cari disini . . .",
  per_page = 4,
}) {
  const router = useRouter();
  const wrapRef = useRef(null);

  const [value, setValue] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const trimmed = useMemo(() => value.trim(), [value]);

  const goSearchPage = () => {
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  // klik di luar → tutup dropdown
  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!trimmed) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setOpen(true);
    setLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const res = await fetch(
          `/api/products/suggest?q=${encodeURIComponent(
            trimmed
          )}&limit=${per_page}`,
          { signal: abortRef.current.signal }
        );

        const json = await res.json();
        setItems(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        // abort normal
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [trimmed, per_page]);

  const getProductHref = (p) => {
    if (p?.slug) return `/${p.slug}`;
    if (p?.id) return `/${p.id}`;
    return "#";
  };

  return (
    <div ref={wrapRef} className={clsx("relative", className)}>
      <TxtField
        id="global-search-input"
        placeholder={placeholder}
        iconLeftName="MagnifyingGlass"
        variant="outline"
        size="md"
        className="w-full min-w-[300px]"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") goSearchPage();
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {/* Suggestions */}
      {open && (
        <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border bg-white overflow-hidden">
          <div className="px-3 py-2 text-xs text-neutral-500 border-b">
            {loading ? "Mencari..." : `Hasil untuk "${trimmed}"`}
          </div>

          {loading ? (
            <div className="p-3 text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm">Tidak ada suggestion.</div>
          ) : (
            <ul className="max-h-[320px] overflow-auto">
              {items.slice(0, 4).map((p) => (
                <li key={p.id || p.slug || p.name}>
                  <button
                    type="button"
                    className="w-full px-3 py-3 text-left hover:bg-neutral-50 flex gap-3"
                    onClick={() => {
                      router.push(getProductHref(p));
                      setOpen(false);
                    }}
                  >
                    {p?.image?.url ? (
                      <img
                        src={p.image.url}
                        alt={p.name}
                        className="w-10 h-10 rounded-md object-cover border"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <img
                        src="/placeholder.png"
                        className="w-10 h-10 rounded-md object-cover border"
                        crossOrigin="anonymous"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">
                        {p.brand || ""}
                        {p.price ? ` • Rp ${p.price}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              ))}

              <li className="border-t">
                <button
                  type="button"
                  className="w-full px-3 py-3 text-sm font-medium hover:bg-neutral-50"
                  onClick={goSearchPage}
                >
                  Lihat semua hasil
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
