import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function draftWhatsAppMessage(params: {
  leadName: string;
  tripName: string;
  tripDestination: string;
  tripDates: string;
  groupType: string;
  vibeText: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are writing a WhatsApp message for a Nomichi team member to send to a travel enquiry lead.

Nomichi is a community-led travel brand that designs slow, offbeat, small-group journeys. The voice is warm, honest, specific, and still. Use second person. Write short sentences. No exclamation marks, no em-dashes, no AI-isms like "unlock", "elevate" or "embark on a journey". Prefer concrete detail over abstract feelings. The tagline is "Travel that finds you."

Lead details:
- Name: ${params.leadName}
- Trip interested in: ${params.tripName} to ${params.tripDestination}
- Trip dates: ${params.tripDates}
- Group type: ${params.groupType}
- What they hope the trip feels like: ${params.vibeText}

Write a warm, short WhatsApp opening message (3-4 sentences max). Reference something specific from what they shared. Sign off from "the Nomichi team". Do not use exclamation marks or em-dashes.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function summarizeCallLog(params: {
  leadName: string;
  tripName: string;
  currentStatus: string;
  callLogs: Array<{ note: string; next_action: string | null; created_at: string }>;
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const logsText = params.callLogs
    .map(
      (log, i) =>
        `${i + 1}. [${new Date(log.created_at).toLocaleDateString()}] ${log.note}${log.next_action ? ` | Next: ${log.next_action}` : ""}`
    )
    .join("\n");

  const prompt = `Summarize the following call log for a Nomichi travel lead in one clear sentence. State where things stand and what the most important next action is. Be specific and practical. Write in the style of a smart colleague handing over a file. No jargon, no em-dashes.

Lead: ${params.leadName}
Trip: ${params.tripName}
Current status: ${params.currentStatus}

Call log:
${logsText}

Write exactly one sentence (max 30 words) covering: where things stand + what to do next.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function suggestVibeFit(params: {
  leadName: string;
  groupType: string;
  preferredMonth: string;
  vibeText: string;
  tripName: string;
  tripDescription: string;
}): Promise<{ fit: "strong" | "possible" | "unlikely"; reason: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are helping a Nomichi travel associate assess whether an enquiry lead is a good fit for slow, small-group travel.

Nomichi runs intimate, offbeat journeys for people who want travel to feel personal and unhurried.

Lead:
- Name: ${params.leadName}
- Group type: ${params.groupType}
- Preferred month: ${params.preferredMonth}
- What they hope the trip feels like: "${params.vibeText}"

Trip they enquired about:
- Name: ${params.tripName}
- Description: ${params.tripDescription}

Based only on the lead's own words, assess their fit. This is a suggestion to help the associate, never an automatic decision.

Respond with valid JSON only:
{
  "fit": "strong" | "possible" | "unlikely",
  "reason": "One specific sentence explaining why, referencing something they actually said."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  return JSON.parse(jsonMatch[0]);
}
