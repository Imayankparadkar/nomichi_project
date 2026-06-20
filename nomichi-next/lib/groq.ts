import Groq from "groq-sdk";

export function getGroq() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
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
