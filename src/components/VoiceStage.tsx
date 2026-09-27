import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { CrisisResources } from "@/components/CrisisResources";
import type { FeedItem, Phase } from "@/hooks/use-voice-turn";

const STATUS: Record<Phase, string> = {
  idle: "Пауза",
  speaking: "Говорю",
  listening: "Слушаю",
  transcribing: "Распознаю",
  thinking: "Думаю",
  awaiting_input: "Твоя очередь",
  error: "Не получилось",
};

/**
 * Голосовой экран. Состояние видно всегда: строка статуса сверху,
 * кольцо уровня микрофона, живой транскрипт и лента реплик.
 */
export function VoiceStage({
  phase,
  caption,
  interim,
  finalText,
  level = 0,
  hint,
  feed = [],
  progress,
  manualOpen,
  textMode,
  onManual,
  onRepeat,
  onSkip,
  onOpenManual,
  onFinishTurn,
  onSkipSpeech,
  onTextMode,
  onDismissHint,
  controls,
  onStop,
}: {
  phase: Phase;
  caption: string;
  interim?: string;
  finalText?: string;
  level?: number;
  hint?: string | null;
  feed?: FeedItem[];
  progress?: string | undefined;
  manualOpen?: boolean;
  textMode?: boolean;
  onManual?: (text: string) => void;
  onRepeat?: (() => void) | undefined;
  onSkip?: (() => void) | undefined;
  onOpenManual?: (() => void) | undefined;
  onFinishTurn?: (() => void) | undefined;
  onSkipSpeech?: (() => void) | undefined;
  onTextMode?: ((on: boolean) => void) | undefined;
  onDismissHint?: (() => void) | undefined;
  controls?: ReactNode;
  onStop?: () => void;
}) {
  const [text, setText] = useState("");
  const feedEnd = useRef<HTMLDivElement | null>(null);
  const live = [finalText, interim].filter(Boolean).join(" ").trim();

  // Новая реплика всегда снизу и всегда в поле зрения.
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [feed.length, caption, live]);

  // Текст из распознавания можно поправить руками.
  const edit = () => {
    setText(live);
    onOpenManual?.();
  };

  const pulsing = phase === "listening";
  const busy = phase === "thinking" || phase === "transcribing";

  return (
    <main className="relative flex min-h-dvh flex-col bg-background px-5 py-4 text-foreground">
      {/* 1. Статус-строка. Видна в любой момент. */}
      <div className="flex min-h-10 items-center justify-between gap-3">
        <span aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full bg-dot ${
              pulsing ? "animate-pulse" : busy ? "animate-ping" : "opacity-40"
            }`}
          />
          {STATUS[phase]}
          {progress && <span className="ml-2 opacity-70">· {progress}</span>}
        </span>
        <div className="flex items-center gap-3">
          {phase === "speaking" && onSkipSpeech && (
            <button
              type="button"
              onClick={onSkipSpeech}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Пропустить озвучку
            </button>
          )}
          {onStop && (
            <button type="button" onClick={onStop} className="btn-base btn-quiet px-5 py-2">
              Стоп
            </button>
          )}
        </div>
      </div>

      {/* 5. Лента сеанса: прошлые реплики приглушены и остаются на экране. */}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-end gap-4 overflow-y-auto py-6">
        {feed.slice(0, -1).map((item) => (
          <p
            key={item.id}
            className={`text-sm leading-relaxed opacity-45 ${
              item.role === "user" ? "text-right" : ""
            }`}
          >
            {item.text}
          </p>
        ))}
        {feed.length > 0 && (
          <p
            className={`text-base leading-relaxed ${
              feed[feed.length - 1]!.role === "user" ? "text-right" : ""
            }`}
            aria-live="polite"
          >
            {feed[feed.length - 1]!.text}
          </p>
        )}

        {/* 3. Живой транскрипт: финальное основным цветом, промежуточное приглушённым. */}
        {live && (
          <div className="space-y-2 text-right">
            <p className="text-sm leading-relaxed">
              <span>{finalText}</span> <span className="text-muted-foreground">{interim}</span>
            </p>
            {onOpenManual && !manualOpen && (
              <button
                type="button"
                onClick={edit}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Исправить
              </button>
            )}
          </div>
        )}
        <div ref={feedEnd} />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-4">
        {controls && <div className="w-full">{controls}</div>}

        {/* Таймауты и ошибки — текстом, а не тишиной. */}
        {hint && (
          <div className="space-y-3 border border-input px-4 py-3">
            <p className="text-sm leading-relaxed">{hint}</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {onTextMode && (
                <button
                  type="button"
                  onClick={() => onTextMode(true)}
                  className="underline-offset-4 hover:underline"
                >
                  Продолжить текстом
                </button>
              )}
              {onDismissHint && (
                <button
                  type="button"
                  onClick={onDismissHint}
                  className="underline-offset-4 hover:underline"
                >
                  Подождать
                </button>
              )}
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="underline-offset-4 hover:underline"
                >
                  Пропустить вопрос
                </button>
              )}
            </div>
          </div>
        )}

        {manualOpen && onManual && (
          <form
            className="w-full space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const value = text.trim();
              if (!value) return;
              setText("");
              onManual(value);
            }}
          >
            <label className="sr-only" htmlFor="manual">
              Ответ текстом
            </label>
            <textarea
              id="manual"
              autoFocus
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-input bg-background px-4 py-3 text-base text-card-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
            <button type="submit" className="btn-base btn-primary w-full">
              Ответить
            </button>
          </form>
        )}

        {/* 2. Кольцо уровня микрофона и 4. явное «Готово». */}
        {phase === "listening" && (
          <div className="flex flex-col items-center gap-3">
            <div
              aria-hidden="true"
              className="relative flex h-16 w-16 items-center justify-center rounded-full border border-input"
            >
              <span
                className="absolute inset-0 rounded-full border-2 border-dot"
                style={{ opacity: 0.15 + level * 0.7, transform: `scale(${1 + level * 0.35})` }}
              />
              <span className="h-3 w-3 rounded-full bg-dot" />
            </div>

            {onFinishTurn && (
              <button type="button" onClick={onFinishTurn} className="btn-base btn-primary w-52">
                Готово
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-5 text-xs text-muted-foreground">
          {onRepeat && (
            <button type="button" onClick={onRepeat} className="underline-offset-4 hover:underline">
              Повтори вопрос
            </button>
          )}
          {onOpenManual && !manualOpen && (
            <button
              type="button"
              onClick={onOpenManual}
              className="underline-offset-4 hover:underline"
            >
              Я скажу текстом
            </button>
          )}
          {onTextMode && textMode && (
            <button
              type="button"
              onClick={() => onTextMode(false)}
              className="underline-offset-4 hover:underline"
            >
              Вернуться к голосу
            </button>
          )}
          {onSkip && (
            <button type="button" onClick={onSkip} className="underline-offset-4 hover:underline">
              Пропустить
            </button>
          )}
        </div>
        <CrisisResources />
      </div>
    </main>
  );
}
