"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lead, CallLog } from "@/lib/types";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from "@/lib/utils";
import {
  ArrowLeft, MessageSquare, Phone, Sparkles, Copy, Check, Mail, ExternalLink,
} from "lucide-react";
import ChatBox from "@/components/ChatBox";

interface Props {
  lead: Lead & { trips?: any; owner?: any };
  callLogs: CallLog[];
  profiles: Array<{ id: string; full_name: string | null; email: string }>;
}

export default function LeadDetail({ lead, callLogs: initialLogs, profiles }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [ownerId, setOwnerId] = useState(lead.owner_id ?? "");
  const [callLogs, setCallLogs] = useState(initialLogs);

  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [addingLog, setAddingLog] = useState(false);
  const [logError, setLogError] = useState("");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const [logSummary, setLogSummary] = useState("");
  const [vibeFit, setVibeFit] = useState<{ fit: string; reason: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const trip = (lead as any).trips;

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus as typeof status);
      router.refresh();
    }
  }

  async function updateOwner(newOwnerId: string) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: newOwnerId || null }),
    });
    if (res.ok) {
      setOwnerId(newOwnerId);
      router.refresh();
    }
  }

  async function addCallLog() {
    if (!note.trim()) {
      setLogError("Add a note about the call");
      return;
    }
    setAddingLog(true);
    setLogError("");

    const res = await fetch("/api/call-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: lead.id,
        note: note.trim(),
        next_action: nextAction.trim() || null,
      }),
    });

    if (res.ok) {
      const newLog = await res.json();
      setCallLogs([newLog, ...callLogs]);
      setNote("");
      setNextAction("");
    } else {
      setLogError("Could not save the note. Try again.");
    }
    setAddingLog(false);
  }

  async function fetchWhatsappDraft() {
    setAiLoading("whatsapp");
    const res = await fetch("/api/ai/whatsapp-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id }),
    });
    const data = await res.json();
    setWhatsappDraft(data.draft ?? "Could not generate draft.");
    setAiLoading(null);
  }

  async function fetchLogSummary() {
    setAiLoading("summary");
    const res = await fetch("/api/ai/summarize-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id }),
    });
    const data = await res.json();
    setLogSummary(data.summary ?? "No summary available.");
    setAiLoading(null);
  }

  async function fetchVibeFit() {
    setAiLoading("vibe");
    const res = await fetch("/api/ai/vibe-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id }),
    });
    const data = await res.json();
    setVibeFit(data);
    setAiLoading(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const vibeFitColors: Record<string, string> = {
    strong: "border-olive text-olive bg-olive/5",
    possible: "border-sand text-ink/70 bg-sand/10",
    unlikely: "border-rust/40 text-rust bg-rust/5",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/leads"
          className="flex items-center gap-2 text-sm text-ink/50 font-poppins hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All leads
        </Link>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink">{lead.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-sm text-ink/50 font-poppins">{lead.email}</span>
              <span className="text-ink/20">·</span>
              <span className="text-sm text-ink/50 font-poppins">{lead.phone}</span>
              <span className="text-ink/20">·</span>
              <span className="text-xs text-ink/40 font-poppins">
                Enquired {formatDate(lead.created_at)}
              </span>
            </div>

            {/* Direct contact actions */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <a
                href={`tel:+91${lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sand text-sm font-poppins text-ink/70 hover:border-ink/40 hover:text-ink transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </a>
              <a
                href={`https://wa.me/91${lead.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sand text-sm font-poppins text-ink/70 hover:border-olive hover:text-olive transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <a
                href={`mailto:${lead.email}?subject=Your Nomichi enquiry — ${trip?.name ?? "upcoming trip"}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sand text-sm font-poppins text-ink/70 hover:border-ink/40 hover:text-ink transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            </div>
          </div>
          <span className={getStatusBadgeClass(status)}>{STATUS_LABELS[status]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {trip && (
            <div className="card">
              <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-3">
                Trip enquired
              </h2>
              <p className="font-display font-bold text-xl text-ink">{trip.name}</p>
              <p className="text-ink/60 font-poppins text-sm mt-1">
                {trip.destination} &middot; {formatDate(trip.start_date)} to{" "}
                {formatDate(trip.end_date)} &middot; {formatCurrency(trip.price_gst)} incl. GST
              </p>
              {trip.description && (
                <p className="text-sm text-ink/50 font-poppins mt-3 leading-relaxed">
                  {trip.description}
                </p>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-3">
              What they shared
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-ink/40 font-poppins mb-0.5">Group type</p>
                <p className="text-sm font-medium text-ink font-poppins capitalize">
                  {lead.group_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink/40 font-poppins mb-0.5">Preferred month</p>
                <p className="text-sm font-medium text-ink font-poppins">{lead.preferred_month}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink/40 font-poppins mb-1">What they hope the trip feels like</p>
              <p className="text-sm text-ink font-poppins leading-relaxed bg-sand/10 px-4 py-3 border-l-2 border-sand italic">
                "{lead.vibe_text}"
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-4">
              AI assist
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink font-poppins">
                    Draft WhatsApp opening
                  </p>
                  <button
                    onClick={fetchWhatsappDraft}
                    disabled={aiLoading === "whatsapp"}
                    className="flex items-center gap-1.5 text-xs text-rust font-poppins hover:text-olive disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiLoading === "whatsapp" ? "Drafting..." : "Generate"}
                  </button>
                </div>
                {whatsappDraft && (
                  <div className="bg-olive/5 border border-olive/20 px-4 py-3 relative">
                    <p className="text-sm text-ink font-poppins leading-relaxed pr-8">
                      {whatsappDraft}
                    </p>
                    <button
                      onClick={() => copyToClipboard(whatsappDraft)}
                      className="absolute top-3 right-3 text-ink/30 hover:text-ink/60 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-olive" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="mt-3 pt-3 border-t border-olive/15 flex items-center gap-3">
                      <a
                        href={`https://wa.me/91${lead.phone}?text=${encodeURIComponent(whatsappDraft)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-poppins text-olive font-medium hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in WhatsApp with this message
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-sand/30 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink font-poppins">Call log summary</p>
                  <button
                    onClick={fetchLogSummary}
                    disabled={aiLoading === "summary"}
                    className="flex items-center gap-1.5 text-xs text-rust font-poppins hover:text-olive disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiLoading === "summary" ? "Summarising..." : "Summarise"}
                  </button>
                </div>
                {logSummary && (
                  <p className="text-sm text-ink/70 font-poppins bg-sand/10 px-4 py-3 border-l-2 border-rust italic">
                    {logSummary}
                  </p>
                )}
              </div>

              <div className="border-t border-sand/30 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink font-poppins">Vibe fit suggestion</p>
                  <button
                    onClick={fetchVibeFit}
                    disabled={aiLoading === "vibe"}
                    className="flex items-center gap-1.5 text-xs text-rust font-poppins hover:text-olive disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiLoading === "vibe" ? "Reading..." : "Assess fit"}
                  </button>
                </div>
                {vibeFit && (
                  <div className={`border px-4 py-3 ${vibeFitColors[vibeFit.fit] ?? ""}`}>
                    <p className="text-xs font-medium uppercase tracking-wider font-poppins mb-1 capitalize">
                      {vibeFit.fit} fit
                    </p>
                    <p className="text-sm font-poppins leading-relaxed">{vibeFit.reason}</p>
                    <p className="text-xs text-ink/30 font-poppins mt-2">
                      Suggestion only. The call is yours to make.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-4">
              Call log
            </h2>

            <div className="mb-5 space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input-base min-h-20 resize-none text-sm"
                placeholder="What was said. What happened. What comes next."
                rows={3}
              />
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="input-base text-sm"
                placeholder="Next action (optional)"
              />
              {logError && (
                <p className="text-rust text-xs font-poppins">{logError}</p>
              )}
              <button
                onClick={addCallLog}
                disabled={addingLog}
                className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
              >
                <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                {addingLog ? "Saving..." : "Add log entry"}
              </button>
            </div>

            {callLogs.length === 0 ? (
              <p className="text-sm text-ink/30 font-poppins italic">
                No call log entries yet. Add one after each touchpoint.
              </p>
            ) : (
              <div className="space-y-4">
                {callLogs.map((log: any) => (
                  <div key={log.id} className="border-l-2 border-sand pl-4">
                    <p className="text-sm text-ink font-poppins leading-relaxed">{log.note}</p>
                    {log.next_action && (
                      <p className="text-xs text-rust font-poppins mt-1">
                        Next: {log.next_action}
                      </p>
                    )}
                    <p className="text-xs text-ink/30 font-poppins mt-1.5">
                      {log.created_by_profile?.full_name ?? log.created_by_profile?.email ?? "Team"} &middot;{" "}
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-3">
              Move pipeline
            </h2>
            <div className="space-y-1.5">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`w-full text-left px-3 py-2 text-sm font-poppins transition-colors ${
                    status === s
                      ? "bg-rust text-cream font-medium"
                      : "text-ink/60 hover:bg-sand/20 hover:text-ink"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-3">
              Owner
            </h2>
            <select
              value={ownerId}
              onChange={(e) => updateOwner(e.target.value)}
              className="select-base text-sm"
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                </option>
              ))}
            </select>
          </div>

          {/* In-site chat panel */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium">
                Chat with lead
              </h2>
              <a
                href="/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ink/30 font-poppins hover:text-ink/60 transition-colors"
              >
                Lead view ↗
              </a>
            </div>
            <ChatBox
              leadId={lead.id}
              leadName={lead.name}
              isAdmin={true}
              height="h-72"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
