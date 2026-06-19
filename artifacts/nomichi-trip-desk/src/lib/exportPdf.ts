/**
 * exportDashboardPdf.ts
 * Generates a fully branded Nomichi analytics PDF using jsPDF + jspdf-autotable.
 * Colors match the website: void #0D0C0B, rust #D55D27, olive #45471D, cream #FFFBF5
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { STATUS_LABELS, type LeadStatus } from "./types";
import { formatCurrency, formatDate } from "./utils";

// ── Brand colours (RGB) ─────────────────────────────────────────────────────
const C = {
  void:    [13,  12,  11]  as [number, number, number],
  dark:    [17,  17,  16]  as [number, number, number],
  card:    [26,  25,  24]  as [number, number, number],
  rust:    [213, 93,  39]  as [number, number, number],
  olive:   [69,  71,  29]  as [number, number, number],
  sand:    [209, 183, 136] as [number, number, number],
  cream:   [255, 251, 245] as [number, number, number],
  muted:   [100, 98,  94]  as [number, number, number],
  dimmed:  [55,  53,  50]  as [number, number, number],
};

const STATUS_COLOURS: Record<string, [number, number, number]> = {
  NEW:             [254, 240, 138],  // yellow
  CONTACTED:       C.sand,
  QUALIFIED:       C.olive,
  VIBE_CHECK_SENT: C.rust,
  CONFIRMED:       C.cream,
  NOT_A_FIT:       C.dimmed,
};

export interface PdfData {
  leads: any[];
  trips: any[];
  byStatus: Record<string, number>;
  byTrip: Record<string, { name: string; count: number }>;
  recentLeads: any[];
}

export async function exportDashboardPdf(data: PdfData): Promise<void> {
  const { leads, trips, byStatus, byTrip, recentLeads } = data;
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();   // 595.28
  const H = doc.internal.pageSize.getHeight();  // 841.89
  const PAD = 40;
  let y = 0;

  // ── Helper: draw full-width dark background page ────────────────────────
  function pageBg() {
    doc.setFillColor(...C.void);
    doc.rect(0, 0, W, H, "F");
  }

  // ── Helper: section divider ─────────────────────────────────────────────
  function divider(yPos: number) {
    doc.setDrawColor(...C.dimmed);
    doc.setLineWidth(0.5);
    doc.line(PAD, yPos, W - PAD, yPos);
  }

  // ── Helper: page check + auto new page ─────────────────────────────────
  function ensureSpace(needed: number) {
    if (y + needed > H - 60) {
      doc.addPage();
      pageBg();
      y = 48;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  PAGE 1 — HEADER
  // ══════════════════════════════════════════════════════════════════
  pageBg();

  // -- Rust accent bar at top --
  doc.setFillColor(...C.rust);
  doc.rect(0, 0, W, 6, "F");

  // -- Logo (SVG fetch → rasterise via Image) --
  try {
    const logoUrl = "https://www.thenomichi.com/Logo-Rust-cropped.svg";
    const imgData = await fetchSvgAsDataUrl(logoUrl, 280, 60);
    if (imgData) {
      doc.addImage(imgData, "PNG", PAD, 24, 140, 30);
    } else {
      throw new Error("no img");
    }
  } catch {
    // Fallback text logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...C.rust);
    doc.text("NOMICHI", PAD, 52);
  }

  // -- Report title block --
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.muted);
  doc.text("DASHBOARD ANALYTICS REPORT", W - PAD, 36, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const now = new Date();
  doc.text(
    `Generated: ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
    W - PAD, 50, { align: "right" }
  );

  // -- Title big --
  y = 88;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...C.cream);
  doc.text("Trip Desk Overview", PAD, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text("Travel that finds you.", PAD, y + 14);
  y += 32;

  divider(y);
  y += 24;

  // ══════════════════════════════════════════════════════════════════
  //  STAT CARDS (3-up row)
  // ══════════════════════════════════════════════════════════════════
  const cardW = (W - PAD * 2 - 16) / 3;
  const cardH = 68;

  const stats = [
    { label: "TOTAL LEADS",  value: String(leads.length),                              accent: C.cream },
    { label: "CONFIRMED",    value: String(byStatus["CONFIRMED"] ?? 0),                accent: C.olive },
    { label: "OPEN TRIPS",   value: String(trips.filter(t => t.status === "open").length), accent: C.rust  },
  ];

  stats.forEach((s, i) => {
    const cx = PAD + i * (cardW + 8);
    // card bg
    doc.setFillColor(...C.card);
    doc.roundedRect(cx, y, cardW, cardH, 4, 4, "F");
    // accent top bar
    doc.setFillColor(...s.accent);
    doc.roundedRect(cx, y, cardW, 3, 1, 1, "F");
    // label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(s.label, cx + 14, y + 20);
    // value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...C.cream);
    doc.text(s.value, cx + 14, y + 52);
  });

  y += cardH + 28;

  // ══════════════════════════════════════════════════════════════════
  //  PIPELINE CHART
  // ══════════════════════════════════════════════════════════════════
  ensureSpace(220);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.cream);
  doc.text("Pipeline Breakdown", PAD, y);
  y += 18;

  const statuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "VIBE_CHECK_SENT", "CONFIRMED", "NOT_A_FIT"];
  const maxCount = Math.max(...statuses.map(s => byStatus[s] ?? 0), 1);
  const barTrackW = W - PAD * 2 - 110;

  statuses.forEach((status, i) => {
    const count = byStatus[status] ?? 0;
    const fillW = (count / maxCount) * barTrackW;
    const rowY = y + i * 26;

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(STATUS_LABELS[status], PAD, rowY + 9);

    // Track
    doc.setFillColor(...C.dimmed);
    doc.roundedRect(PAD + 100, rowY, barTrackW, 12, 2, 2, "F");

    // Fill
    if (fillW > 0) {
      const col = STATUS_COLOURS[status] ?? C.rust;
      doc.setFillColor(...col);
      doc.roundedRect(PAD + 100, rowY, Math.max(fillW, 4), 12, 2, 2, "F");
    }

    // Count
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.cream);
    doc.text(String(count), W - PAD, rowY + 9, { align: "right" });
  });

  y += statuses.length * 26 + 28;
  divider(y - 10);

  // ══════════════════════════════════════════════════════════════════
  //  LEADS BY TRIP
  // ══════════════════════════════════════════════════════════════════
  ensureSpace(120);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.cream);
  doc.text("Leads by Trip", PAD, y + 10);
  y += 26;

  const tripRows = Object.values(byTrip)
    .sort((a, b) => b.count - a.count)
    .map(item => [item.name, String(item.count)]);

  if (tripRows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.text("No lead-trip data yet.", PAD, y + 10);
    y += 28;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Trip", "Leads"]],
      body: tripRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 9, textColor: C.cream, fillColor: C.card, cellPadding: 6 },
      headStyles: { fillColor: C.void, textColor: C.rust, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: C.dark },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 50, halign: "right" } },
      margin: { left: PAD, right: PAD },
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  divider(y);
  y += 20;

  // ══════════════════════════════════════════════════════════════════
  //  PAGE 2 — ALL TRIPS
  // ══════════════════════════════════════════════════════════════════
  ensureSpace(160);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.cream);
  doc.text("All Trips", PAD, y + 10);
  y += 26;

  const tripTableRows = trips.map((t: any) => [
    t.name ?? "—",
    t.destination ?? "—",
    t.start_date ? formatDate(t.start_date) : "—",
    t.end_date ? formatDate(t.end_date) : "—",
    t.price_gst ? formatCurrency(t.price_gst) : "—",
    `${t.seats_available ?? 0}/${t.total_seats ?? 0}`,
    (t.status ?? "").toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Name", "Destination", "Start", "End", "Price", "Seats", "Status"]],
    body: tripTableRows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 7.5, textColor: C.cream, fillColor: C.card, cellPadding: 5 },
    headStyles: { fillColor: C.void, textColor: C.rust, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: C.dark },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 90 },
      2: { cellWidth: 55 },
      3: { cellWidth: 55 },
      4: { cellWidth: 60, halign: "right" },
      5: { cellWidth: 45, halign: "center" },
      6: { cellWidth: 50, halign: "center" },
    },
    margin: { left: PAD, right: PAD },
    didParseCell(hookData) {
      if (hookData.section === "body" && hookData.column.index === 6) {
        const val = String(hookData.cell.raw ?? "");
        if (val === "OPEN") hookData.cell.styles.textColor = [107, 142, 35];
        else hookData.cell.styles.textColor = C.muted;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 20;
  divider(y);
  y += 20;

  // ══════════════════════════════════════════════════════════════════
  //  ALL LEADS TABLE
  // ══════════════════════════════════════════════════════════════════
  ensureSpace(160);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.cream);
  doc.text("All Leads", PAD, y + 10);
  y += 26;

  const leadRows = leads
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((l: any) => [
      l.name ?? "—",
      l.trips?.name ?? "—",
      STATUS_LABELS[l.status as LeadStatus] ?? l.status,
      l.created_at ? formatDate(l.created_at) : "—",
    ]);

  autoTable(doc, {
    startY: y,
    head: [["Name", "Trip", "Status", "Date"]],
    body: leadRows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8, textColor: C.cream, fillColor: C.card, cellPadding: 5 },
    headStyles: { fillColor: C.void, textColor: C.rust, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: C.dark },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 140 },
      2: { cellWidth: 110 },
      3: { cellWidth: 80, halign: "right" },
    },
    margin: { left: PAD, right: PAD },
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  // ══════════════════════════════════════════════════════════════════
  //  FOOTER (every page)
  // ══════════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    // bottom accent line
    doc.setFillColor(...C.rust);
    doc.rect(0, H - 5, W, 5, "F");
    // page number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`Page ${p} of ${pageCount}`, W - PAD, H - 14, { align: "right" });
    doc.text("Nomichi · Travel that finds you.", PAD, H - 14);
  }

  // ── Save ────────────────────────────────────────────────────────
  const dateStr = now.toISOString().slice(0, 10);
  doc.save(`nomichi-dashboard-${dateStr}.pdf`);
}

// ── Fetch SVG URL → PNG data URL via Canvas ────────────────────────────────
async function fetchSvgAsDataUrl(url: string, width: number, height: number): Promise<string | null> {
  try {
    const res = await fetch(url);
    const svgText = await res.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}
