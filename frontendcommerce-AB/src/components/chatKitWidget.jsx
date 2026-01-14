"use client";

import { useMemo, useState } from "react";

const getSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function ChatkitWidget() {
  const sessionId = useMemo(() => getSessionId(), []);
  const apiUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_CHATKIT_API_BASE;
    if (!base) return "/api/v1/chatkit";
    return `${base.replace(/\/+$/, "")}/chatkit`;
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi bestie! Mau tanya makeup, skincare, atau info toko hari ini?",
    },
  ]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        let errorMessage = "Gagal kirim pesan.";
        try {
          const errorPayload = await res.json();
          if (errorPayload?.error) {
            errorMessage = errorPayload.error;
          }
        } catch {
          // ignore json parsing errors
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.output_text || "Maaf bestie, coba lagi ya.",
        },
      ]);
    } catch (error) {
      console.error("Chatkit send error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            error?.message ||
            "Maaf bestie, lagi ada kendala. Coba lagi sebentar ya.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
            <div>
              <p className="text-sm font-semibold">Abby n Bev AI</p>
              <p className="text-xs text-white/70">Concierge & Advisor</p>
            </div>
            <button
              type="button"
              className="text-xs uppercase tracking-wide"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto max-h-96">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-black text-white ml-auto"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {message.text}
              </div>
            ))}
            {isSending && (
              <div className="rounded-2xl px-3 py-2 text-sm bg-slate-100 text-slate-600">
                Lagi mikir dulu ya...
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 px-4 py-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Tulis pertanyaan kamu..."
              className="flex-1 text-sm rounded-full border border-slate-200 px-3 py-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending}
              className="text-sm font-semibold text-white bg-black rounded-full px-4 py-2 disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-black text-white rounded-full px-5 py-3 shadow-lg text-sm font-semibold"
        >
          Chat Abby n Bev
        </button>
      )}
    </div>
  );
}
