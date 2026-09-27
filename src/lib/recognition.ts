/**
 * Ввод речи. SpeechRecognition, ru-RU, по одной фразе.
 * Слушаем только когда Проводник молчит — иначе микрофон поймает синтез.
 */

type SRAlternative = { transcript: string; confidence: number };
type SRResult = { 0: SRAlternative; isFinal: boolean; length: number };
type SREvent = { results: { length: number; [i: number]: SRResult } };

type SRInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

type SRCtor = new () => SRInstance;

function ctor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return ctor() !== null;
}

export type Heard = { text: string; confidence: number };

export type Listening = {
  result: Promise<Heard>;
  /** Человек нажал «Готово» — закончить реплику прямо сейчас. */
  finish: () => void;
  abort: () => void;
};

export type ListenOptions = {
  timeoutMs?: number;
  silenceMs?: number;
  /** Живой транскрипт: промежуточный и уже распознанный текст. */
  onText?: (interim: string, finals: string) => void;
  /** Первая же речь в микрофоне. */
  onSpeech?: () => void;
  /** Понятное сообщение вместо тишины. */
  onError?: (message: string) => void;
};

/** Понятные сообщения вместо кодов ошибок браузера. */
export function recognitionErrorText(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed")
    return "Микрофон запрещён в браузере. Напиши текстом.";
  if (code === "audio-capture") return "Микрофон не найден. Напиши текстом.";
  if (code === "network") return "Нет связи с распознаванием речи. Напиши текстом.";
  if (code === "no-match") return "Не разобрал слова. Повтори или напиши текстом.";
  return "Не получилось распознать речь. Напиши текстом.";
}

/**
 * Слушает одну фразу. Распознавание держим открытым до паузы в речи:
 * короткие обрывы и «no-speech» не считаются ответом, микрофон перезапускается.
 */
export function listenOnce(options: ListenOptions = {}): Listening {
  const timeoutMs = options.timeoutMs ?? 60000;
  const silenceMs = options.silenceMs ?? 1800;
  const Ctor = ctor();
  if (!Ctor) {
    return {
      result: Promise.resolve({ text: "", confidence: 0 }),
      finish: () => {},
      abort: () => {},
    };
  }

  let settled = false;
  let best: Heard = { text: "", confidence: 0 };
  let finals = "";
  let rec: SRInstance | null = null;
  let restarts = 0;
  let silence = 0;
  let timer = 0;
  let force: () => void = () => {};

  const result = new Promise<Heard>((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.clearTimeout(silence);
      try {
        rec?.abort();
      } catch {
        // уже остановлено
      }
      const text = (finals + " " + best.text).trim() || best.text.trim();
      resolve({ text, confidence: best.confidence });
    };

    force = finish;

    // Пауза в речи считается концом ответа, а не ошибкой.
    const armSilence = () => {
      window.clearTimeout(silence);
      silence = window.setTimeout(finish, silenceMs);
    };

    const start = () => {
      const instance = new Ctor();
      rec = instance;
      instance.lang = "ru-RU";
      instance.continuous = true;
      instance.interimResults = true;
      instance.maxAlternatives = 3;

      instance.onresult = (e) => {
        for (let i = 0; i < e.results.length; i += 1) {
          const r = e.results[i];
          if (!r) continue;
          const alt = r[0];
          if (!alt) continue;
          const text = (alt.transcript ?? "").trim();
          if (!text) continue;
          options.onSpeech?.();
          if (r.isFinal) {
            finals = (finals + " " + text).trim();
            best = { text: "", confidence: alt.confidence ?? 1 };
          } else if (text.length > best.text.length) {
            best = { text, confidence: alt.confidence ?? 0 };
          }
          options.onText?.(best.text, finals);
          armSilence();
        }
      };
      instance.onend = () => {
        if (settled) return;
        // Браузер закрывает поток сам — поднимаем снова, пока не вышло время.
        if ((finals + best.text).trim() || restarts >= 4) {
          armSilence();
          return;
        }
        restarts += 1;
        try {
          start();
        } catch {
          finish();
        }
      };
      instance.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        options.onError?.(recognitionErrorText(e.error));
        finish();
      };

      instance.start();
    };

    timer = window.setTimeout(finish, timeoutMs);
    try {
      start();
    } catch {
      options.onError?.(recognitionErrorText("audio-capture"));
      finish();
    }
  });

  return {
    result,
    finish: () => {
      window.clearTimeout(silence);
      try {
        rec?.stop();
      } catch {
        // уже остановлено
      }
      // Даём последнему результату дойти, потом закрываем ход.
      window.setTimeout(force, 400);
    },

    abort: () => {
      try {
        rec?.abort();
      } catch {
        // уже остановлено
      }
    },
  };
}

const STOP_WORDS = ["стоп", "stop", "останови", "хватит"];

export function isStopWord(text: string): boolean {
  const t = text
    .toLowerCase()
    .replace(/[^a-zа-яё ]/gi, "")
    .trim();
  return STOP_WORDS.some((w) => t === w || t.startsWith(w + " ") || t.endsWith(" " + w));
}

/** «да», «ага», «бывает», «есть» → да. «нет», «не», «никогда» → нет. */
export function parseYesNo(text: string): boolean | null {
  const t = text
    .toLowerCase()
    .replace(/[^а-яё ]/gi, " ")
    .trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const no = ["нет", "не", "никогда", "неа"];
  const yes = ["да", "ага", "бывает", "есть", "было", "иногда", "конечно", "угу"];
  for (const w of words) {
    if (no.includes(w)) return false;
  }
  for (const w of words) {
    if (yes.includes(w)) return true;
  }
  return null;
}

const NUMBER_WORDS: Record<string, number> = {
  ноль: 0,
  нуль: 0,
  один: 1,
  одна: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
};

/** «семь», «7», «где-то семь», «семь-восемь» (берём большее). */
export function parseSud(text: string): number | null {
  const t = text.toLowerCase().replace(/[^а-яё0-9 ]/gi, " ");
  const found: number[] = [];
  for (const token of t.split(/\s+/).filter(Boolean)) {
    if (/^\d{1,2}$/.test(token)) {
      const n = Number(token);
      if (n >= 0 && n <= 10) found.push(n);
      continue;
    }
    const word = NUMBER_WORDS[token];
    if (word !== undefined) found.push(word);
  }
  if (found.length === 0) return null;
  return Math.max(...found);
}
