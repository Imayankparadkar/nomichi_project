import Groq from "groq-sdk";

import fs from "fs";
import path from "path";

export function getGroq() {
  let apiKey = "";

  // Manually parse .env.local or .env first to ensure local project variables override global system variables
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    try {
      const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const match = content.match(/^GROQ_API_KEY\s*=\s*(.+)$/m);
        if (match && match[1]) {
          apiKey = match[1].trim();
          // Remove potential comment prefix if they commented it out
          if (apiKey.startsWith("#")) continue;
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to read ${file} for GROQ_API_KEY`, err);
    }
  }

  if (!apiKey) {
    apiKey = process.env.GROQ_API_KEY?.trim() || "";
  }

  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey });
}

export async function groqChat(prompt: string): Promise<string> {
  const client = getGroq();
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 512,
  });
  return completion.choices[0]?.message?.content ?? "";
}
