import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

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
  height?: string; // tailwind h-* class e.g. "h-80"
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
          <p className="text-xs text-ink/30 font-poppins italic text-center pt-10">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-ink/30 font-poppins italic text-center pt-10">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const mine =
              (isAdmin && msg.sender === "admin") ||
              (!isAdmin && msg.sender === "lead");

            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 text-sm font-poppins leading-relaxed ${
                    mine
                      ? "bg-rust text-cream"
                      : "bg-sand/25 text-ink border border-sand/50"
                  }`}
                >
                  {!mine && (
                    <p className={`text-xs font-semibold mb-1 ${mine ? "text-cream/70" : "text-ink/50"}`}>
                      {msg.sender === "admin" ? "Nomichi team" : leadName}
                    </p>
                  )}
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                  <p className={`text-xs mt-1 ${mine ? "text-cream/50" : "text-ink/35"}`}>
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

      {/* Input */}
      {error && <p className="text-rust text-xs font-poppins mb-2">{error}</p>}
      <div className="flex gap-2 pt-3 border-t border-sand/30">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          className="flex-1 input-base resize-none text-sm py-2"
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
