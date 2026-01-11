"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function PrivacyPolicyPage() {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/privacy-policy");
        setHtml(res?.data?.serve?.value || "");
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Gagal load privacy policy");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Privacy Policy</h1>

      {loading && <p>Loading...</p>}
      {!loading && err && <p className="text-red-600">{err}</p>}

      {!loading && !err && (
        html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p>Privacy policy belum tersedia.</p>
        )
      )}
    </div>
  );
}
