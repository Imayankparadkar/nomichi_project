"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";

interface Message {
  id: string;
  lead_id: string;
  sender: "admin" | "lead";
  content: string;
  created_at: string;
}

interface Props {
  leadId: string;
  leadName: string;
  isAdmin?: boolean;
  phone?: string; // required when isAdmin=false (lead verification)
  height?: string; // h-* class e.g. "h-80"
}

export default function ChatBox({
  leadId,
  leadName,
  isAdmin = false,
  phone,
  height = "h-80",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const params = new URLSearchParams({ lead_id: leadId });
    if (!isAdmin && phone) params.set("phone", phone);

    const res = isAdmin
      ? await apiGet(`/api/messages?${params}`)
      : await fetch(`/api/messages?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
    setLoading(false);
  }, [leadId, isAdmin, phone]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchSuggestion() {
    if (suggesting) return;
    setSuggesting(true);
    setSuggestion("");
    setError("");
    const res = await apiPost("/api/ai/suggest-reply", { lead_id: leadId });
    if (res.ok) {
      const data = await res.json();
      setSuggestion(data.suggestion);
    } else {
      setError("Could not generate suggested reply.");
    }
    setSuggesting(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");

    const payload: Record<string, string> = {
      lead_id: leadId,
      content: text,
      sender: isAdmin ? "admin" : "lead",
    };
    if (!isAdmin && phone) payload.phone = phone;

    const res = isAdmin
      ? await apiPost("/api/messages", payload)
      : await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
      setSuggestion(""); // clear suggestion once message is sent
    } else {
      setError("Could not send. Try again.");
    }
    setSending(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={`flex flex-col ${height}`}>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 mb-3 pr-1">
        {loading ? (
          <p className={`text-xs font-poppins italic text-center pt-10 ${isAdmin ? "text-ink/30" : "text-cream/30"}`}>Loading…</p>
        ) : messages.length === 0 ? (
          <p className={`text-xs font-poppins italic text-center pt-10 ${isAdmin ? "text-ink/30" : "text-cream/30"}`}>
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const mine =
              (isAdmin && msg.sender === "admin") ||
              (!isAdmin && msg.sender === "lead");

            const bubbleClass = mine
              ? "bg-rust text-cream"
              : isAdmin
                ? "bg-sand/25 text-ink border border-sand/50"
                : "bg-cream/8 text-cream border border-cream/15";

            const senderLabelClass = mine
              ? "text-cream/70"
              : isAdmin
                ? "text-ink/50"
                : "text-cream/55";

            const timeClass = mine
              ? "text-cream/50"
              : isAdmin
                ? "text-ink/35"
                : "text-cream/35";

            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3 py-2 text-sm font-poppins leading-relaxed ${bubbleClass}`}>
                  {!mine && (
                    <p className={`text-xs font-semibold mb-1 ${senderLabelClass}`}>
                      {msg.sender === "admin" ? "Nomichi team" : leadName}
                    </p>
                  )}
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                  <p className={`text-xs mt-1 ${timeClass}`}>
                    {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion container */}
      {isAdmin && (
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={fetchSuggestion}
            disabled={suggesting}
            className="flex items-center gap-1.5 text-xs text-rust font-poppins hover:text-olive disabled:opacity-50 transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {suggesting ? "Co-pilot thinking…" : "Suggest reply"}
          </button>
        </div>
      )}

      {suggestion && (
        <div className="mb-3 p-3 border border-olive/30 rounded bg-olive/5 relative">
          <p className="text-xs font-semibold text-olive uppercase tracking-wider mb-1 font-display">AI Reply Co-pilot</p>
          <p className="text-sm font-poppins text-cream pr-16 leading-relaxed italic">"{suggestion}"</p>
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={() => {
                setInput(suggestion);
                setSuggestion("");
              }}
              className="text-xs bg-rust text-cream px-2 py-1 font-poppins hover:bg-olive transition-colors font-medium rounded"
            >
              Use
            </button>
            <button
              onClick={() => setSuggestion("")}
              className="text-xs text-cream/40 hover:text-cream/80 font-poppins px-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {error && <p className="text-rust text-xs font-poppins mb-2">{error}</p>}
      <div className={`flex gap-2 pt-3 border-t ${isAdmin ? "border-sand/30" : "border-cream/10"}`}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          className={`flex-1 resize-none text-sm py-2 ${isAdmin ? "input-base" : "dark-input"}`}
          placeholder="Type a message… Enter to send, Shift+Enter for new line"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="btn-primary px-3 self-end disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
