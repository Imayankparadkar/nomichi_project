import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import type { Lead, CallLog } from "@/lib/types";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from "@/lib/utils";
import {
  ArrowLeft, Phone, Sparkles, Copy, Check, ExternalLink,
} from "lucide-react";
import ChatBox from "@/components/ChatBox";

const vibeFitColors: Record<string, string> = {
  strong: "border-olive bg-olive/5 text-ink",
  possible: "border-sand bg-sand/10 text-ink",
  unlikely: "border-rust/30 bg-rust/5 text-rust",
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const [, setLocation] = useLocation();

  const [lead, setLead] = useState<(Lead & { trips?: any; owner?: any }) | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<string>("");
  const [ownerId, setOwnerId] = useState("");

  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [addingLog, setAddingLog] = useState(false);
  const [logError, setLogError] = useState("");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [whatsappDraft, setWhatsappDraft] = useState("");
  const [logSummary, setLogSummary] = useState("");
  const [vibeFit, setVibeFit] = useState<{ fit: string; reason: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: leadData }, { data: logsData }, { data: profilesData }] = await Promise.all([
        supabase
          .from("leads")
          .select("*, trips(id, name, destination, start_date, end_date, price_gst, description), owner:profiles!leads_owner_id_fkey(id, full_name, email)")
          .eq("id", leadId)
          .single(),
        supabase
          .from("call_logs")
          .select("*, created_by_profile:profiles!call_logs_created_by_fkey(id, full_name, email)")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
      ]);

      if (!leadData) {
        setLocation("/admin/leads");
        return;
      }

      setLead(leadData as any);
      setStatus(leadData.status);
      setOwnerId((leadData as any).owner_id ?? "");
      setCallLogs((logsData as CallLog[]) ?? []);
      setProfiles(profilesData ?? []);
      setLoading(false);
    }
    load();
  }, [leadId]);

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
    }
  }

  async function updateOwner(newOwnerId: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner_id: newOwnerId || null }),
    });
    if (res.ok) {
      setOwnerId(newOwnerId);
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
        lead_id: leadId,
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
      body: JSON.stringify({ lead_id: leadId }),
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
      body: JSON.stringify({ lead_id: leadId }),
    });
    const data = await res.json();
    setLogSummary(data.summary ?? "Could not generate summary.");
    setAiLoading(null);
  }

  async function fetchVibeFit() {
    setAiLoading("vibe");
    const res = await fetch("/api/ai/vibe-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });
    const data = await res.json();
    setVibeFit(data);
    setAiLoading(null);
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !lead) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-ink/40 font-poppins text-sm">Loading…</p>
      </div>
    );
  }

  const trip = (lead as any).trips;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-sm text-ink/50 font-poppins hover:text-ink transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to leads
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink">{lead.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <a href={`mailto:${lead.email}`} className="text-sm text-ink/50 font-poppins hover:text-ink transition-colors">
                {lead.email}
              </a>
              <span className="text-ink/20">·</span>
              <span className="text-sm text-ink/50 font-poppins">{lead.phone}</span>
            </div>
          </div>
          <span className={getStatusBadgeClass(lead.status as any)}>
            {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {trip && (
            <div className="card">
              <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-3">
                Trip
              </h2>
              <p className="font-display font-bold text-xl text-ink">{trip.name}</p>
              <p className="text-sm text-ink/60 font-poppins mt-1">
                {trip.destination} &middot; {formatDate(trip.start_date)} to {formatDate(trip.end_date)} &middot;{" "}
                {formatCurrency(trip.price_gst)} incl. GST
              </p>
              {trip.description && (
                <p className="text-sm text-ink/70 font-poppins mt-3 leading-relaxed">{trip.description}</p>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium mb-3">
              Enquiry details
            </h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-ink/50 font-poppins">Group type</dt>
                <dd className="text-sm text-ink font-poppins capitalize">{lead.group_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-ink/50 font-poppins">Preferred month</dt>
                <dd className="text-sm text-ink font-poppins">{lead.preferred_month}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-ink/50 font-poppins">Enquired</dt>
                <dd className="text-sm text-ink font-poppins">{formatDate(lead.created_at)}</dd>
              </div>
            </dl>
            <div className="mt-4 pt-4 border-t border-sand/30">
              <p className="text-xs text-ink/50 font-poppins uppercase tracking-wider mb-2">What they hope the trip feels like</p>
              <p className="text-sm text-ink font-poppins leading-relaxed italic">"{lead.vibe_text}"</p>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium">
              AI tools
            </h2>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink font-poppins">WhatsApp draft</p>
                <button
                  onClick={fetchWhatsappDraft}
                  disabled={aiLoading === "whatsapp"}
                  className="flex items-center gap-1.5 text-xs text-rust font-poppins hover:text-olive disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {aiLoading === "whatsapp" ? "Drafting..." : "Draft"}
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

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider font-poppins text-ink/50 font-medium">
                Chat with lead
              </h2>
            </div>
            <ChatBox
              leadId={leadId}
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
