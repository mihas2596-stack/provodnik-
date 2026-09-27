import { createServerFn } from "@tanstack/react-start";

/**
 * Озвучка через ElevenLabs. Ключ живёт только на сервере.
 * Возвращает mp3 в base64 либо null — тогда фронтенд переходит на Web Speech API.
 */

const VOICE_ID_DEFAULT = "XB0fDUnXU5powFXDhCwa"; // ровный женский голос
const TIMEOUT_MS = 10_000;

export const synthesize = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => ({
    text: String(input?.text ?? "").slice(0, 800),
  }))
  .handler(async ({ data }): Promise<{ audio: string | null }> => {
    const key = process.env["ELEVENLABS_API_KEY"];
    const text = data.text.trim();
    if (!key || !text) return { audio: null };

    const voice = process.env["ELEVENLABS_VOICE_ID"] || VOICE_ID_DEFAULT;
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": key, "content-type": "application/json" },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.0 },
          }),
          signal: control.signal,
        },
      );
      if (!res.ok) return { audio: null };

      const bytes = new Uint8Array(await res.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      return { audio: btoa(binary) };
    } catch {
      // Ошибка или таймаут — тихий переход на запасной синтез.
      return { audio: null };
    } finally {
      clearTimeout(timer);
    }
  });
