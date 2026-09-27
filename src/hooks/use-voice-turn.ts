import { useCallback, useEffect, useRef, useState } from "react";

import { startMicMeter, type Meter } from "@/lib/mic-level";
import {
  isStopWord,
  listenOnce,
  parseSud,
  parseYesNo,
  recognitionSupported,
  type Listening,
} from "@/lib/recognition";
import { cancelSpeech, initVoices, speak, type Speaking } from "@/lib/voice-engine";

export class StopSignal extends Error {
  constructor() {
    super("stop");
    this.name = "StopSignal";
  }
}

/** Явный автомат сеанса. Одно место, а не набор флагов. */
export type Phase =
  "idle" | "speaking" | "listening" | "transcribing" | "thinking" | "awaiting_input" | "error";

/** Служебные ответы с экранных кнопок. */
const REPEAT = "\u0000repeat";
const SKIP = "\u0000skip";

const NO_SPEECH_MS = 10000;
const SLOW_THINKING_MS = 15000;
const INPUT_MODE_KEY = "bls_input_mode";

export type FeedItem = { id: number; role: "assistant" | "user"; text: string };

type AskOptions<T> = {
  /** Разбор ответа. null — не понял, переспрашиваем. */
  parse?: (text: string) => T | null;
  /** Реплика при неудачном распознавании. */
  retry?: string;
  /** Сколько неудач до текстового запасного варианта. */
  maxFails?: number;
  /** Реплика перед показом запасного варианта. */
  fallbackLine?: string;
  /** Что вернуть, если человек нажал «Пропустить». */
  skipValue?: T;
  /** На слишком короткий ответ один раз попросить подробнее. */
  clarify?: boolean;
};

const DEFAULT_RETRY = "Не расслышал. Можно сказать ещё раз или пропустить вопрос.";
const DEFAULT_FALLBACK = "Давай продолжим текстом — так будет проще.";
const CLARIFY = "Расскажи чуть подробнее, парой фраз — что именно зацепило?";
const MIC_HINT = "Похоже, микрофон недоступен. Продолжим текстом?";
const SLOW_HINT = "Долго думаю.";

function readInputMode(): "voice" | "text" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(INPUT_MODE_KEY);
    return v === "text" || v === "voice" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Один голосовой ход: сказать — послушать. Говорить и слушать одновременно нельзя,
 * поэтому распознавание стартует только после окончания реплики.
 * Состояние хода всегда видно наружу: phase, живой транскрипт, уровень микрофона.
 */
export function useVoiceTurn(onStop: () => void) {
  const [caption, setCaption] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [manualOpen, setManualOpen] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [textMode, setTextModeState] = useState(false);

  const voiceAvailable = useRef(true);
  const speakingRef = useRef<Speaking | null>(null);
  const listeningRef = useRef<Listening | null>(null);
  const meterRef = useRef<Meter | null>(null);
  const manualRef = useRef<((text: string) => void) | null>(null);
  const pendingManual = useRef<string | null>(null);
  const stoppedRef = useRef(false);
  const textModeRef = useRef(false);
  const feedId = useRef(0);

  useEffect(() => {
    initVoices();
    stoppedRef.current = false;
    voiceAvailable.current = recognitionSupported();
    const saved = readInputMode();
    const initial = !voiceAvailable.current || saved === "text";
    textModeRef.current = initial;
    setTextModeState(initial);
    if (!voiceAvailable.current) {
      setHint("В этом браузере голосовой ввод недоступен, работаем текстом.");
    }
    return () => {
      stoppedRef.current = true;
      speakingRef.current?.cancel();
      listeningRef.current?.abort();
      meterRef.current?.stop();
      cancelSpeech();
    };
  }, []);

  const setTextMode = useCallback((on: boolean) => {
    textModeRef.current = on;
    setTextModeState(on);
    try {
      window.localStorage.setItem(INPUT_MODE_KEY, on ? "text" : "voice");
    } catch {
      // приватный режим — просто не запоминаем
    }
    if (on) setManualOpen(true);
  }, []);

  const push = useCallback((role: "assistant" | "user", text: string) => {
    const clean = text.trim();
    if (!clean) return;
    feedId.current += 1;
    setFeed((prev) => {
      // Одна и та же реплика подряд в ленту не попадает.
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === clean) return prev;
      return [...prev.slice(-30), { id: feedId.current, role, text: clean }];
    });
  }, []);

  /** Переход в текст без записи в настройки: это ситуативно. */
  const switchToText = useCallback(() => {
    textModeRef.current = true;
    setTextModeState(true);
    setManualOpen(true);
  }, []);

  /** Микрофон не работает: один раз спокойно спрашиваем, повторно — сразу текст. */
  const micWarned = useRef(false);
  const micProblem = useCallback(() => {
    setManualOpen(true);
    if (!micWarned.current) {
      micWarned.current = true;
      setHint(MIC_HINT);
      return;
    }
    setHint(null);
    switchToText();
  }, [switchToText]);

  const halt = useCallback(() => {
    stoppedRef.current = true;
    speakingRef.current?.cancel();
    listeningRef.current?.abort();
    meterRef.current?.stop();
    meterRef.current = null;
    cancelSpeech();
    setPhase("idle");
    setManualOpen(false);
    onStop();
  }, [onStop]);

  const say = useCallback(
    async (text: string) => {
      if (stoppedRef.current) throw new StopSignal();
      setCaption(text);
      setHint(null);
      push("assistant", text);
      setPhase("speaking");
      const s = speak(text);
      speakingRef.current = s;
      await s.done;
      speakingRef.current = null;
      if (stoppedRef.current) throw new StopSignal();
      setPhase("idle");
    },
    [push],
  );

  /** «Пропустить озвучку» — реплика уже на экране, читать её вслух не обязательно. */
  const skipSpeech = useCallback(() => {
    speakingRef.current?.cancel();
    cancelSpeech();
  }, []);

  /** Ждём либо микрофон, либо экранную кнопку/поле. */
  const hear = useCallback(async (): Promise<{
    text: string;
    confidence: number;
    manual: boolean;
  }> => {
    // Кнопку могли нажать, пока Проводник ещё говорил — ответ не теряем.
    if (pendingManual.current !== null) {
      const text = pendingManual.current;
      pendingManual.current = null;
      return { text, confidence: 1, manual: true };
    }

    setInterim("");
    setFinalText("");

    const manual = new Promise<string>((resolve) => {
      manualRef.current = resolve;
    });

    if (!voiceAvailable.current || textModeRef.current) {
      setPhase("awaiting_input");
      setManualOpen(true);
      const text = await manual;
      manualRef.current = null;
      setPhase("transcribing");
      return { text, confidence: 1, manual: true };
    }

    setPhase("listening");
    let spoke = false;
    const noSpeech = window.setTimeout(() => {
      if (!spoke) micProblem();
    }, NO_SPEECH_MS);

    void startMicMeter(setLevel)
      .then((m) => {
        if (stoppedRef.current) m.stop();
        else meterRef.current = m;
      })
      .catch(() => micProblem());

    const l = listenOnce({
      onSpeech: () => {
        spoke = true;
        setHint(null);
      },
      onText: (i, f) => {
        setInterim(i);
        setFinalText(f);
      },
      onError: () => micProblem(),
    });
    listeningRef.current = l;

    const heard = await Promise.race([
      l.result.then((r) => ({ ...r, manual: false })),
      manual.then((text) => ({ text, confidence: 1, manual: true })),
    ]);

    window.clearTimeout(noSpeech);
    l.abort();
    listeningRef.current = null;
    manualRef.current = null;
    meterRef.current?.stop();
    meterRef.current = null;
    setLevel(0);

    // Короткая, но видимая фаза «Распознаю».
    setPhase("transcribing");
    await new Promise((r) => window.setTimeout(r, 250));
    return heard;
  }, []);

  /** Ответ через экранную кнопку или текстовое поле. Работает всегда. */
  const answerManually = useCallback((text: string) => {
    const resolve = manualRef.current;
    if (resolve) {
      manualRef.current = null;
      resolve(text);
      return;
    }
    // Нажали, пока Проводник говорит: обрываем реплику и запоминаем ответ.
    pendingManual.current = text;
    speakingRef.current?.cancel();
    cancelSpeech();
  }, []);

  /** «Готово» — явное завершение реплики, не ждём автоопределения паузы. */
  const finishTurn = useCallback(() => {
    listeningRef.current?.finish();
  }, []);

  /** «Повтори вопрос» — та же реплика заново, без упрёка. */
  const repeatQuestion = useCallback(() => answerManually(REPEAT), [answerManually]);
  /** «Пропустить» — шаг остаётся без ответа. */
  const skipQuestion = useCallback(() => answerManually(SKIP), [answerManually]);
  /** «Я скажу текстом» — открыть поле сразу, не дожидаясь неудач. */
  const openManual = useCallback(() => setManualOpen(true), []);

  /** Обёртка над ожиданием ответа модели: видно «Думаю», после 15 секунд — подсказка. */
  const think = useCallback(async <T>(work: () => Promise<T>): Promise<T> => {
    setPhase("thinking");
    setHint(null);
    const slow = window.setTimeout(() => setHint(SLOW_HINT), SLOW_THINKING_MS);
    try {
      return await work();
    } catch (e) {
      setPhase("error");
      setHint("Не получилось связаться с сервером. Продолжаем.");
      throw e;
    } finally {
      window.clearTimeout(slow);
      setPhase((p) => (p === "thinking" ? "idle" : p));
    }
  }, []);

  const ask = useCallback(
    async <T = string>(question: string, options: AskOptions<T> = {}): Promise<T> => {
      const parse = options.parse ?? ((t: string) => t as unknown as T);
      // Любой повтор — не больше двух раз, дальше молча переходим на текст.
      const maxFails = Math.min(options.maxFails ?? 2, 2);
      let fails = 0;
      let clarified = false;
      let earlier = "";
      let line: string | null = question;

      for (;;) {
        if (line !== null) await say(line);
        line = null;
        const heard = await hear();
        if (stoppedRef.current) throw new StopSignal();

        const raw = heard.text.trim();
        if (raw === REPEAT) {
          line = question;
          continue;
        }
        if (raw === SKIP) {
          if (options.skipValue !== undefined) {
            push("user", "Пропустил");
            return options.skipValue;
          }
          continue;
        }
        if (isStopWord(raw)) {
          halt();
          throw new StopSignal();
        }

        // Короткий ответ — один раз мягко просим подробнее, потом принимаем любой.
        if (options.clarify && !clarified && raw && raw.split(/\s+/).length < 3) {
          clarified = true;
          earlier = raw;
          push("user", raw);
          line = CLARIFY;
          continue;
        }

        const full = earlier && raw ? `${earlier}. ${raw}` : raw || earlier;
        const parsed = full ? parse(full) : null;
        if (parsed !== null && parsed !== undefined) {
          push("user", raw || earlier);
          setInterim("");
          setFinalText("");
          return parsed;
        }

        fails += 1;
        if (fails >= maxFails) {
          if (!textModeRef.current) {
            switchToText();
            await say(options.fallbackLine ?? DEFAULT_FALLBACK);
          }
          continue;
        }
        line = options.retry ?? DEFAULT_RETRY;
      }
    },
    [say, hear, halt, push, switchToText],
  );

  return {
    caption,
    phase,
    listening: phase === "listening",
    speaking: phase === "speaking",
    manualOpen,
    interim,
    finalText,
    level,
    hint,
    feed,
    textMode,
    voiceAvailable: voiceAvailable.current,
    setTextMode,
    setHint,
    say,
    ask,
    think,
    skipSpeech,
    finishTurn,
    answerManually,
    repeatQuestion,
    skipQuestion,
    openManual,
    halt,
    parseYesNo,
    parseSud,
  };
}
