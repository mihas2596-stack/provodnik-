import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import { CrisisResources } from "@/components/CrisisResources";
import { Stimulation, type Channel, type Speed } from "@/components/Stimulation";
import { SudSlider } from "@/components/SudSlider";
import { VoiceStage } from "@/components/VoiceStage";
import { StopSignal, useVoiceTurn } from "@/hooks/use-voice-turn";
import { guideStep } from "@/lib/provodnik.functions";
import { parseSud, parseYesNo, recognitionSupported } from "@/lib/recognition";
import { cancelSpeech, initVoices } from "@/lib/voice-engine";

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({
    meta: [
      { title: "Проводник — голосовой инструмент самопомощи" },
      {
        name: "description",
        content:
          "Разговор вслух и слежение глазами за шариком: инструмент самопомощи при бытовой тревоге, обиде, вине, раздражении и застрявшей мысли. Не терапия.",
      },
      { property: "og:title", content: "Проводник — голосовой инструмент самопомощи" },
      {
        property: "og:description",
        content:
          "Быстрая разгрузка за пять минут или полный сеанс: говоришь вслух, Проводник ведёт по шагам упражнения.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

// ——— Жёсткие правила протокола живут в коде, не в промпте модели ———
const SUD_GATE = 9;

type Mode = "quick" | "full";
const MODE_SECONDS: Record<Mode, number> = { quick: 24, full: 30 };

type Screen =
  | "entry"
  | "setup"
  | "dialog"
  | "bls"
  | "remeasure"
  | "breathe"
  | "final"
  | "stopped"
  | "refuse"
  | "crisis";

type Turn = { role: "assistant" | "user"; text: string };

const TOPICS = [
  ["ссора", "Ссора"],
  ["тревога перед разговором", "Тревога перед разговором"],
  ["обида", "Обида"],
  ["чувство вины", "Чувство вины"],
  ["раздражение", "Раздражение"],
  ["застрявшая мысль", "Застрявшая мысль"],
] as const;

const INTRO = `Привет, я Проводник. Сначала спокойно разберём, что тебя зацепило, потом будет упражнение: следишь глазами за шариком и держишь это в голове.
Это не терапия и не лечение. Если речь про травму, потерю близкого или мысли навредить себе — лучше к живому человеку. Номера внизу.
Голос распознаёт браузер, мы ничего не храним.
Расскажи, что произошло — как получится.`;

/** hard — остановка без вопросов. Остальное человек решает сам. */
const SCREENING: { question: string; hard: boolean }[] = [
  { question: "Это связано с насилием, аварией или угрозой жизни?", hard: true },
  { question: "Это про смерть близкого человека?", hard: true },
  { question: "Состояние очень тяжёлое и тянется много месяцев?", hard: false },
];

const REFUSE_LINE =
  "Тогда давай остановимся здесь. С таким лучше к живому специалисту, а не к программе. Номера внизу.";

const Q_FOCUS = "Спасибо, что рассказал. Какая фраза, момент или образ там самый неприятный?";
const Q_BODY = "Понятно. А где в теле это сейчас отзывается?";
const Q_SUD = "От нуля до десяти — насколько сильно сейчас?";

const WHY = `Дальше держи этот момент в голове и следи глазами за шариком. Две задачи сразу занимают память, и мысль вспоминается будто размытой.
Я молчу, кнопка «Стоп» работает всё время. Готов?`;

const HEADPHONES = "Упражнение пойдёт тонами в стерео. Понадобятся наушники.";

function IndexPage() {
  const [screen, setScreen] = useState<Screen>("entry");
  const [mode, setMode] = useState<Mode>("quick");
  const [topic, setTopic] = useState<string>("");
  const [speed, setSpeed] = useState<Speed>("medium");
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [run, setRun] = useState(0);

  const home = () => {
    cancelSpeech();
    setBefore(null);
    setAfter(null);
    setTopic("");
    setRun((r) => r + 1);
    setScreen("entry");
  };

  if (screen === "entry") return <Entry onStart={() => setScreen("setup")} />;
  if (screen === "setup") {
    return (
      <Setup
        mode={mode}
        setMode={setMode}
        speed={speed}
        setSpeed={setSpeed}
        onPick={(t) => {
          setTopic(t);
          setBefore(null);
          setAfter(null);
          setScreen("dialog");
        }}
      />
    );
  }
  if (screen === "refuse") return <Closing title={REFUSE_LINE} onHome={home} />;
  if (screen === "crisis")
    return (
      <Closing
        title="Давай остановимся здесь. Сейчас важнее живой человек, а не программа. Номера внизу."
        onHome={home}
      />
    );
  if (screen === "stopped") return <Stopped onHome={home} />;
  if (screen === "remeasure")
    return (
      <Remeasure
        onDone={(v) => {
          setAfter(v);
          setScreen("breathe");
        }}
      />
    );
  if (screen === "breathe") return <Breathe onDone={() => setScreen("final")} />;
  if (screen === "final") return <Final before={before} after={after} onHome={home} />;

  return (
    <Dialog
      key={`${topic}-${run}`}
      screen={screen}
      setScreen={setScreen}
      mode={mode}
      topic={topic}
      speed={speed}
      onScores={(s) => setBefore(s[0] ?? null)}
    />
  );
}

const INPUT_MODE_KEY = "bls_input_mode";

function savedInputMode(): "voice" | "text" {
  if (typeof window === "undefined") return "voice";
  try {
    return window.localStorage.getItem(INPUT_MODE_KEY) === "text" ? "text" : "voice";
  } catch {
    return "voice";
  }
}

/** ЭКРАН 1. Вход: одна строка и одна кнопка. */
function Entry({ onStart }: { onStart: () => void }) {
  const [voiceOk, setVoiceOk] = useState(true);

  useEffect(() => {
    initVoices();
    setVoiceOk(recognitionSupported());
  }, []);

  const start = () => {
    // Разрешение спрашиваем, но экран не ждёт ответа: отказ не блокирует вход.
    void (async () => {
      try {
        const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
        stream?.getTracks().forEach((t) => t.stop());
      } catch {
        // Микрофон не дали — дальше работает текстовое поле.
      }
    })();
    onStart();
  };

  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <p className="text-center text-sm leading-relaxed">
          {voiceOk
            ? "Отвечать можно голосом или текстом — как удобнее."
            : "В этом браузере голосовой ввод недоступен, работаем текстом."}
        </p>
        <button type="button" onClick={start} className="btn-base btn-primary w-52">
          Начать
        </button>
      </div>
    </Frame>
  );
}

/** ЭКРАН 2. Режим, скорость, способ ответа и тема. Всё одним спокойным списком. */
function Setup({
  mode,
  setMode,
  speed,
  setSpeed,
  onPick,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  speed: Speed;
  setSpeed: (s: Speed) => void;
  onPick: (topic: string) => void;
}) {
  // Голос и текст равноправны, выбор запоминается до следующего раза.
  const [input, setInput] = useState<"voice" | "text">("voice");
  const [voiceOk, setVoiceOk] = useState(true);

  useEffect(() => {
    const ok = recognitionSupported();
    setVoiceOk(ok);
    setInput(ok ? savedInputMode() : "text");
  }, []);

  const pickInput = (value: "voice" | "text") => {
    setInput(value);
    try {
      window.localStorage.setItem(INPUT_MODE_KEY, value);
    } catch {
      // приватный режим — просто не запоминаем
    }
  };

  return (
    <Frame>
      <div className="flex flex-1 flex-col justify-center gap-12 py-10">
        <Choice
          label="Сколько времени"
          value={mode}
          options={[
            ["quick", "Быстрая разгрузка, пять минут"],
            ["full", "Полный сеанс, около пятнадцати"],
          ]}
          onChange={setMode}
        />
        {voiceOk ? (
          <Choice
            label="Как отвечать"
            value={input}
            options={[
              ["voice", "Говорить"],
              ["text", "Писать"],
            ]}
            onChange={pickInput}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            В этом браузере голосовой ввод недоступен, работаем текстом.
          </p>
        )}
        <Choice
          label="Скорость шарика"
          value={speed}
          options={[
            ["slow", "Медленно"],
            ["medium", "Средне"],
            ["fast", "Быстро"],
          ]}
          onChange={setSpeed}
        />
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">С чем работаем</p>
          <div className="grid gap-3">
            {TOPICS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onPick(value)}
                className="btn-base btn-quiet w-full py-4 text-base"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm text-muted-foreground">{label}</legend>
      {options.map(([v, text]) => (
        <label key={v} className="flex items-center gap-3 text-sm">
          <input
            type="radio"
            checked={value === v}
            onChange={() => onChange(v)}
            className="h-4 w-4"
          />
          {text}
        </label>
      ))}
    </fieldset>
  );
}

/** Общая рамка экранов: воздух сверху и снизу, кризисная строка в подвале. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-5 py-8 text-foreground">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">{children}</div>
      <div className="mx-auto w-full max-w-xl pt-8">
        <CrisisResources />
      </div>
    </main>
  );
}

/** ЭКРАНЫ 3 и 4. Разговор по шагам и раунды упражнения. */
function Dialog({
  screen,
  setScreen,
  mode,
  topic,
  speed,
  onScores,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  mode: Mode;
  topic: string;
  speed: Speed;
  onScores: (s: number[]) => void;
}) {
  const goStopped = useCallback(() => {
    cancelSpeech();
    setScreen("stopped");
  }, [setScreen]);

  const turn = useVoiceTurn(goStopped);
  const callGuide = useServerFn(guideStep);
  const started = useRef(false);
  const confirmResolve = useRef<((keepGoing: boolean) => void) | null>(null);
  const [slider, setSlider] = useState(false);
  const [yesNo, setYesNo] = useState(false);
  const [confirmText, setConfirmText] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | undefined>(undefined);
  const [channel, setChannel] = useState<Channel>("visual");

  useEffect(() => {
    // prefers-reduced-motion не отключает упражнение, а меняет канал на стерео-тоны.
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setChannel("audio");
  }, []);

  const sudFromSlider = (value: number) => {
    setSlider(false);
    turn.answerManually(String(value));
  };

  /** Вопрос с двумя кнопками: продолжить обычную ситуацию или остановиться. */
  const askConfirm = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => {
        cancelSpeech();
        confirmResolve.current = resolve;
        setConfirmText(message);
      }),
    [],
  );

  const answerConfirm = (keepGoing: boolean) => {
    setConfirmText(null);
    const resolve = confirmResolve.current;
    confirmResolve.current = null;
    resolve?.(keepGoing);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const history: Turn[] = [];

      const reflect = async (step: string, userText: string, setsDone: number) => {
        // Пропущенный вопрос не отправляем — нечего отражать.
        if (!userText.trim()) return;
        history.push({ role: "user", text: userText });
        const reply = await turn
          .think(() => callGuide({ data: { step, setsDone, history, topic } }))
          .catch(() => ({ action: "continue" as const, message: "", escalation: false }));

        if (reply.action === "crisis") {
          setScreen("crisis");
          throw new StopSignal();
        }
        if (reply.action === "confirm") {
          if (!(await askConfirm(reply.message))) {
            setScreen("refuse");
            throw new StopSignal();
          }
          return;
        }
        history.push({ role: "assistant", text: reply.message });
        if (reply.message) await turn.say(reply.message);
      };

      const askYesNo = async (question: string): Promise<boolean> => {
        setYesNo(true);
        try {
          return await turn.ask<boolean>(question, {
            parse: (t) => parseYesNo(t),
            retry: "Не расслышал. Да или нет?",
            fallbackLine: "Можно просто нажать кнопку.",
          });
        } finally {
          setYesNo(false);
        }
      };

      const askSud = async (): Promise<number | null> => {
        setSlider(true);
        try {
          const value = await turn.ask<number | null>(Q_SUD, {
            parse: (t) => parseSud(t),
            retry: "Назови одно число от нуля до десяти — или отметь его на шкале.",
            fallbackLine: "Можно просто отметить число на шкале.",
            skipValue: null,
          });
          if (value === null) {
            await turn.say("Хорошо, идём дальше без оценки.");
            return null;
          }
          onScores([value]);
          return value;
        } finally {
          setSlider(false);
        }
      };

      try {
        history.push({ role: "assistant", text: INTRO });
        setProgress("Вопрос 1 из 3");
        await reflect("S1_TOPIC", await turn.ask(INTRO, { skipValue: "", clarify: true }), 0);

        history.push({ role: "assistant", text: Q_FOCUS });
        setProgress("Вопрос 2 из 3");
        await reflect("S2_FOCUS", await turn.ask(Q_FOCUS, { skipValue: "", clarify: true }), 0);

        history.push({ role: "assistant", text: Q_BODY });
        setProgress("Вопрос 3 из 3");
        await reflect("S3_BODY", await turn.ask(Q_BODY, { skipValue: "" }), 0);

        setProgress(undefined);
        const base = await askSud();

        for (const check of SCREENING) {
          if (!(await askYesNo(check.question))) continue;
          if (check.hard) {
            await turn.say(REFUSE_LINE);
            setScreen("refuse");
            return;
          }
          if (!(await askConfirm(check.question))) {
            setScreen("refuse");
            return;
          }
        }

        if (
          base !== null &&
          base >= SUD_GATE &&
          !(await askConfirm("Заряд очень высокий. Продолжаем?"))
        ) {
          setScreen("refuse");
          return;
        }

        if (channel === "audio") await turn.say(HEADPHONES);
        if (!(await askYesNo(WHY))) {
          goStopped();
          return;
        }
        cancelSpeech();
        setScreen("bls");
      } catch (e) {
        if (e instanceof StopSignal) return;
        cancelSpeech();
        setScreen("final");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (screen === "bls") {
    // Конец упражнения ведёт сразу на замер, «Стоп» — на спокойный экран. Без ожиданий.
    return (
      <Stimulation
        channel={channel}
        speed={speed}
        seconds={MODE_SECONDS[mode]}
        onFinish={() => setScreen("remeasure")}
        onStop={() => setScreen("stopped")}
      />
    );
  }

  if (confirmText !== null) {
    return (
      <Frame>
        <div className="flex flex-1 flex-col justify-center gap-8">
          <p className="text-lg leading-relaxed">{confirmText}</p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => answerConfirm(true)}
              className="btn-base btn-primary w-full py-5 text-base"
            >
              Продолжить, это обычная ситуация
            </button>
            <button
              type="button"
              onClick={() => answerConfirm(false)}
              className="btn-base btn-quiet w-full py-5 text-base"
            >
              Остановить
            </button>
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <VoiceStage
      phase={turn.phase}
      caption={turn.caption}
      interim={turn.interim}
      finalText={turn.finalText}
      level={turn.level}
      hint={turn.hint}
      feed={turn.feed}
      progress={progress}
      textMode={turn.textMode}
      manualOpen={turn.manualOpen && !yesNo}
      onManual={turn.answerManually}
      onRepeat={turn.repeatQuestion}
      onSkip={turn.skipQuestion}
      onOpenManual={yesNo ? undefined : turn.openManual}
      onFinishTurn={turn.finishTurn}
      onSkipSpeech={turn.skipSpeech}
      onTextMode={turn.setTextMode}
      onDismissHint={() => turn.setHint(null)}
      onStop={turn.halt}
      controls={
        slider ? (
          <SudSlider label="Отметь число" onSubmit={sudFromSlider} />
        ) : yesNo ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => turn.answerManually("да")}
              className="btn-base btn-primary py-5 text-lg"
            >
              Да
            </button>
            <button
              type="button"
              onClick={() => turn.answerManually("нет")}
              className="btn-base btn-quiet py-5 text-lg"
            >
              Нет
            </button>
          </div>
        ) : null
      }
    />
  );
}

/** Повторный замер сразу после упражнения. */
function Remeasure({ onDone }: { onDone: (value: number | null) => void }) {
  useEffect(() => cancelSpeech(), []);
  return (
    <Frame>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <SudSlider label={Q_SUD} onSubmit={(v) => onDone(v)} />
        <button
          type="button"
          onClick={() => onDone(null)}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Пропустить оценку
        </button>
      </div>
    </Frame>
  );
}

const BREATH: { label: string; ms: number; scale: number }[] = [
  { label: "Вдох через нос — 4", ms: 4000, scale: 1 },
  { label: "Задержи дыхание — 7", ms: 7000, scale: 1 },
  { label: "Медленный выдох ртом — 8", ms: 8000, scale: 0.45 },
];
const BREATH_CYCLES = 3;

/** Заземление: дыхание 4-7-8 с кругом. Три цикла, «Дальше» доступно всегда. */
function Breathe({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const total = BREATH.length * BREATH_CYCLES;

  useEffect(() => {
    if (step >= total) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), BREATH[step % BREATH.length]!.ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const current = BREATH[Math.min(step, total - 1) % BREATH.length]!;
  const cycle = Math.min(BREATH_CYCLES, Math.floor(step / BREATH.length) + 1);

  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <p className="text-center text-sm text-muted-foreground">
          Немного подышим. Цикл {cycle} из {BREATH_CYCLES}
        </p>
        <div className="flex h-56 w-56 items-center justify-center">
          <div
            aria-hidden="true"
            className="h-56 w-56 rounded-full border-2 border-dot bg-dot/20"
            style={{
              transform: `scale(${current.scale})`,
              transition: `transform ${current.ms}ms ease-in-out`,
            }}
          />
        </div>
        <p aria-live="polite" className="text-center text-lg">
          {current.label}
        </p>
        <button type="button" onClick={onDone} className="btn-base btn-quiet w-52">
          Дальше
        </button>
      </div>
    </Frame>
  );
}

/** Финал. Сюда приходит любой завершённый сеанс. */
function Final({
  before,
  after,
  onHome,
}: {
  before: number | null;
  after: number | null;
  onHome: () => void;
}) {
  useEffect(() => cancelSpeech(), []);
  const show = (v: number | null) => (v === null ? "без оценки" : String(v));
  return (
    <Frame>
      <div className="flex flex-1 flex-col justify-center gap-8 py-10 text-center">
        <p className="text-2xl tabular-nums">
          До: {show(before)}, после: {show(after)}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Если легче не стало — это нормально. Можно повторить позже или поговорить с кем-то из
          близких.
        </p>
        <button type="button" onClick={onHome} className="btn-base btn-primary w-full">
          На главную
        </button>
      </div>
    </Frame>
  );
}

/** Экран после «Стоп». */
function Stopped({ onHome }: { onHome: () => void }) {
  useEffect(() => cancelSpeech(), []);
  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <p className="text-center text-lg">Остановились. Всё в порядке.</p>
        <button type="button" onClick={onHome} className="btn-base btn-primary w-52">
          На главную
        </button>
      </div>
    </Frame>
  );
}

/** Мягкий отказ и кризисный выход. Кнопки продолжить нет ни в каком виде. */
function Closing({ title, onHome }: { title: string; onHome: () => void }) {
  const turn = useVoiceTurn(() => {});
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void turn.say(title).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <p aria-live="polite" className="text-center text-sm leading-relaxed">
          {title}
        </p>
        <button type="button" onClick={onHome} className="btn-base btn-quiet w-52">
          На главную
        </button>
      </div>
    </Frame>
  );
}
