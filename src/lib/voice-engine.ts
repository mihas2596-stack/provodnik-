/**
 * Вывод речи. Основной канал — ElevenLabs (серверная функция synthesize),
 * запасной — Web Speech API, ru-RU, rate 0.9.
 * Длинные реплики режем на предложения и произносим очередью:
 * так синтез не обрывается и переход между кусками остаётся ровным.
 */

import { synthesize } from "@/lib/tts.functions";

let ruVoice: SpeechSynthesisVoice | null = null;
let subscribed = false;
let elevenOff = false; // ключа нет или сервис не ответил — больше не пробуем

function synthesisApi(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

export function speechSupported(): boolean {
  return synthesisApi() !== null;
}

function pickVoice() {
  const s = synthesisApi();
  if (!s) return;
  const list = s.getVoices();
  const ru = list.filter((v) => v.lang?.toLowerCase().startsWith("ru"));
  ruVoice = ru.find((v) => v.localService) ?? ru[0] ?? null;
}

/** Список голосов приходит асинхронно — подписываемся на voiceschanged. */
export function initVoices() {
  const s = synthesisApi();
  if (!s || subscribed) return;
  subscribed = true;
  pickVoice();
  s.addEventListener("voiceschanged", pickVoice);
}

export function cancelSpeech() {
  synthesisApi()?.cancel();
  stopAudio();
}

/** Режем на предложения, слишком длинные — по запятым. */
export function splitSpeech(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parts: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 220) {
      parts.push(sentence);
      continue;
    }
    let buffer = "";
    for (const chunk of sentence.split(/(?<=,)\s+/)) {
      if ((buffer + " " + chunk).trim().length > 220 && buffer) {
        parts.push(buffer.trim());
        buffer = chunk;
      } else {
        buffer = (buffer + " " + chunk).trim();
      }
    }
    if (buffer) parts.push(buffer.trim());
  }
  return parts;
}

// ——— ElevenLabs ———

const audioCache = new Map<string, Promise<string | null>>();
let current: HTMLAudioElement | null = null;

function stopAudio() {
  if (!current) return;
  current.pause();
  current.src = "";
  current = null;
}

function fetchAudio(text: string): Promise<string | null> {
  if (elevenOff) return Promise.resolve(null);
  const hit = audioCache.get(text);
  if (hit) return hit;
  const task = synthesize({ data: { text } })
    .then((r) => {
      if (!r.audio) elevenOff = true;
      return r.audio ?? null;
    })
    .catch(() => {
      elevenOff = true;
      return null;
    });
  audioCache.set(text, task);
  return task;
}

function playAudio(base64: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    current = audio;
    const finish = () => {
      if (current === audio) current = null;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = finish;
    void audio.play().catch(finish);
  });
}

// ——— Web Speech API как запасной канал ———

function speakPart(text: string): Promise<void> {
  const s = synthesisApi();
  if (!s) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    if (ruVoice) u.voice = ruVoice;

    let settled = false;
    let watchdog = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // Страховка: если браузер не пришлёт ни onend, ни onerror.
    watchdog = window.setTimeout(finish, 1500 + text.length * 130);

    s.speak(u);
  });
}

export type Speaking = { done: Promise<void>; cancel: () => void };

/** Произносит текст целиком. Возвращает промис окончания и способ прервать. */
export function speak(text: string): Speaking {
  let cancelled = false;
  const parts = splitSpeech(text);

  const done = (async () => {
    cancelSpeech();

    for (let i = 0; i < parts.length; i += 1) {
      if (cancelled) return;
      const part = parts[i]!;
      const audio = await fetchAudio(part);
      if (cancelled) return;

      // Следующий кусок готовим заранее, чтобы не было паузы между фразами.
      const next = parts[i + 1];
      if (next && !elevenOff) void fetchAudio(next);

      if (audio) {
        await playAudio(audio);
        continue;
      }

      const s = synthesisApi();
      if (!s || s.getVoices().length === 0) {
        // Нет ни аудио, ни голосов — выдерживаем паузу под длину текста.
        await new Promise((r) => window.setTimeout(r, Math.min(9000, 900 + part.length * 45)));
        continue;
      }
      await speakPart(part);
    }
  })();

  return {
    done,
    cancel: () => {
      cancelled = true;
      cancelSpeech();
    },
  };
}
