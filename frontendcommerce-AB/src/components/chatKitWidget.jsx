"use client";

import { useMemo, useState } from "react";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { FaSprayCanSparkles } from "react-icons/fa6";
import { BtnIcon, Button, RegularCard, TxtField } from ".";

const LABELS = {
  concierge: "Abby n Bev – Concierge (TEST)",
  makeup: "Abby Mode – Makeup Advisor (TEST)",
  skincare: "Bev Mode – Skincare Advisor (TEST)",
  cs: "CS Mode – Store Assistant (TEST)",
};

const parseSections = (outputText = "") => {
  const chunks = outputText.split(/\n\s*\n/).filter(Boolean);
  return chunks.map((chunk) => {
    const [firstLine, ...rest] = chunk.split("\n");
    const body = rest.length ? rest.join("\n").trim() : "";

    if (firstLine === LABELS.concierge) {
      return { title: LABELS.concierge, type: "concierge", body };
    }

    if (firstLine === LABELS.makeup) {
      return { title: LABELS.makeup, type: "advisor", body };
    }

    if (firstLine === LABELS.skincare) {
      return { title: LABELS.skincare, type: "advisor", body };
    }

    if (firstLine === LABELS.cs) {
      return { title: LABELS.cs, type: "cs", body };
    }

    if (firstLine.startsWith("Classify Selected category")) {
      return { title: firstLine.trim(), type: "meta", body };
    }

    return { title: null, type: "text", body: chunk.trim() };
  });
};

const parseRecommendations = (text = "") => {
  const lines = text.split("\n");
  const items = [];
  const introLines = [];
  const trailingLines = [];
  let current = null;
  let hasList = false;
  let inTrailing = false;

  const flushCurrent = () => {
    if (!current) return;
    const description = current.descriptionLines.join("\n").trim();
    items.push({
      name: current.name.trim(),
      description,
    });
    current = null;
  };

  lines.forEach((line) => {
    const match = line.match(
      /^\s*\d+\.\s*(?:\*\*|__)?(.+?)(?:\*\*|__)?\s*(?:-|–|:)\s*(.*)$/
    );

    if (match) {
      if (current) flushCurrent();
      hasList = true;
      inTrailing = false;
      current = {
        name: match[1].trim(),
        descriptionLines: [match[2].trim()],
      };
      return;
    }

    if (!hasList) {
      introLines.push(line);
      return;
    }

    if (current && !inTrailing) {
      if (!line.trim()) {
        flushCurrent();
        inTrailing = true;
        return;
      }
      current.descriptionLines.push(line.trim());
      return;
    }

    trailingLines.push(line);
  });

  flushCurrent();

  return {
    introText: introLines.join("\n").trim(),
    trailingText: trailingLines.join("\n").trim(),
    items,
  };
};

const fetchProductByName = async (name) => {
  try {
    const res = await fetch(
      `/api/products/search?q=${encodeURIComponent(name)}&limit=1`
    );
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data[0] : null;
  } catch (error) {
    console.error("Chatkit product lookup error:", error);
    return null;
  }
};

const getSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function ChatkitWidget() {
  const sessionId = useMemo(() => getSessionId(), []);
  const apiUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_CHATKIT_API_BASE || "http://localhost:3333";
    return `${base.replace(/\/+$/, "")}/api/v1/chatkit`;
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

  const buildAssistantMessages = async (outputText) => {
    const sections = parseSections(outputText);
    const messagesWithCards = await Promise.all(
      sections.map(async (section) => {
        if (section.type === "advisor") {
          const { introText, trailingText, items } = parseRecommendations(
            section.body
          );
          const products = await Promise.all(
            items.map((item) => fetchProductByName(item.name))
          );
          const recommendations = items.map((item, index) => ({
            ...item,
            product: products[index] || null,
          }));

          return {
            role: "assistant",
            title: section.title,
            text: [introText, trailingText].filter(Boolean).join("\n\n"),
            recommendations,
          };
        }

        return {
          role: "assistant",
          title: section.title,
          text: section.body || "",
        };
      })
    );

    return messagesWithCards.filter(
      (message) => message.text || (message.recommendations || []).length > 0
    );
  };

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

      const outputText = data?.output_text || "Maaf bestie, coba lagi ya.";
      const assistantMessages = await buildAssistantMessages(outputText);

      setMessages((prev) => [...prev, ...assistantMessages]);
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
    <div className="fixed bottom-6 right-6 z-50 h-auto">
      {isOpen ? (
        <div className="w-100 rounded-2xl bg-primary-50 shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 via-primary-200 to-secondary-200 text-white">
            <div>
              <p className="text-sm font-semibold">Abby n Bev AI</p>
              <p className="text-xs text-white/70">Beauty Assistant</p>
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
                {message.title && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    {message.title}
                  </p>
                )}
                {message.text && (
                  <p className="whitespace-pre-line">{message.text}</p>
                )}
                {Array.isArray(message.recommendations) &&
                  message.recommendations.length > 0 && (
                    <div className="mt-3 space-y-4">
                      {message.recommendations.map((item, itemIndex) => (
                        <div
                          key={`${item.name}-${itemIndex}`}
                          className="space-y-2"
                        >
                          <div>
                            <p className="font-semibold">
                              {itemIndex + 1}. {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-600 whitespace-pre-line">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.product ? (
                            <div className="max-w-[220px]">
                              <RegularCard product={item.product} />
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">
                              Produk belum tersedia di katalog saat ini.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            {isSending && (
              <div className="p-4 mx-auto justify-center items-center">
                <Bouncy size="40" speed="1.2" color="#AE2D68" />
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 px-4 py-3 flex items-center gap-2">
            <TxtField
              variant="outline"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Tulis pertanyaan kamu..."
              className="flex-1 text-sm rounded-full border border-slate-200 px-3 py-2 focus:outline-none"
            />
            <BtnIcon
              variant="primary"
              size="sm"
              iconName="ArrowUpLong"
              onClick={sendMessage}
              disabled={isSending}
            />
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsOpen(true)}
          className="bg-black text-white rounded-full px-5 py-3 shadow-lg text-sm font-semibold"
        >
          <div className="flex flex-row items-center gap-2">
            <FaSprayCanSparkles className="h-5 w-5" /> Your Beauty Assistant
            here!
          </div>
        </Button>
      )}
    </div>
  );
}
