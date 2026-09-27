// Вызовы модели — только с сервера. Ключ никогда не попадает в браузер.
//
// Прямой вызов OpenAI Responses API (раньше — через проприетарный
// Lovable AI Gateway). Формат запроса/стрима идентичен, поэтому парсинг
// SSE не менялся.
//
// Env: OPENAI_API_KEY (обязательно), OPENAI_MODEL (по умолчанию gpt-4o-mini).
const ENDPOINT = "https://api.openai.com/v1/responses";
const MODEL = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

type TextFormat =
  | { type: "text" }
  | {
      type: "json_schema";
      name: string;
      strict: true;
      schema: Record<string, unknown>;
    };

export async function openaiText(
  system: string,
  user: string,
  format: TextFormat = { type: "text" },
): Promise<string> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is missing");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "developer", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: user }] },
      ],
      // Стрим нужен только серверу: длинный ответ иначе обрывается по таймауту.
      stream: true,
      store: false,
      text: { format },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`openai ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && event.delta) {
          out += event.delta;
        } else if (event.type === "response.completed" && !out && event.response?.output_text) {
          out = event.response.output_text;
        }
      } catch {
        // битый кусок SSE игнорируем
      }
    }
  }

  return out.trim();
}
