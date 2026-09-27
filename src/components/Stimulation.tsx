import { useEffect, useRef, useState } from "react";

export type Channel = "visual" | "audio";
export type Speed = "slow" | "medium" | "fast";

export const SPEED_MS: Record<Speed, number> = { slow: 1400, medium: 1000, fast: 700 };

/**
 * Экран упражнения: шарик, отсчёт, «Стоп». Ничего больше.
 * Движение — Web Animations API, плавное качание без рывков на краях.
 */
export function Stimulation({
  channel,
  speed = "medium",
  seconds = 30,
  onFinish,
  onStop,
}: {
  channel: Channel;
  speed?: Speed;
  seconds?: number;
  onFinish: () => void;
  onStop: () => void;
}) {
  const cycleMs = SPEED_MS[speed];
  const cycles = Math.max(1, Math.round((seconds * 1000) / cycleMs));
  const totalMs = cycles * cycleMs;

  const ballRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const doneRef = useRef(false);
  const [left, setLeft] = useState(Math.round(totalMs / 1000));

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;
    doneRef.current = false;

    const anim = ball.animate(
      [
        { transform: "translateX(-40vw) scale(0.94)" },
        { transform: "translateX(0) scale(1)" },
        { transform: "translateX(40vw) scale(0.94)" },
        { transform: "translateX(0) scale(1)" },
        { transform: "translateX(-40vw) scale(0.94)" },
      ],
      {
        duration: cycleMs,
        iterations: cycles,
        easing: "cubic-bezier(0.37, 0, 0.63, 1)",
      },
    );
    animRef.current = anim;

    if (channel === "audio" && typeof window !== "undefined") {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audioRef.current = new Ctor();
    }

    // Чередующиеся тоны в стерео как альтернативный канал.
    const ping = (index: number) => {
      const ctx = audioRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      osc.type = "sine";
      osc.frequency.value = 220;
      panner.pan.value = index % 2 === 0 ? -1 : 1;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(panner).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    };

    let raf = 0;
    let lastIndex = -1;
    const tick = () => {
      const t = Number(anim.currentTime ?? 0);
      setLeft(Math.max(0, Math.ceil((totalMs - t) / 1000)));
      const index = Math.floor(t / (cycleMs / 2));
      if (index !== lastIndex) {
        lastIndex = index;
        if (channel === "audio") ping(index);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    void anim.finished
      .then(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        onFinish();
      })
      .catch(() => {
        // anim.cancel() — остановка пользователем, её обрабатывает кнопка
      });

    return () => {
      cancelAnimationFrame(raf);
      doneRef.current = true;
      anim.cancel();
      const ctx = audioRef.current;
      if (ctx) {
        void ctx.close();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, cycleMs, cycles]);

  // «Стоп» срабатывает всегда, даже если анимация уже закончилась.
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  const stop = () => {
    doneRef.current = true;
    animRef.current?.cancel();
    onStopRef.current();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="fixed inset-0 flex h-dvh flex-col items-center justify-between overflow-hidden bg-background">
      <div className="flex flex-1 items-center">
        <div
          ref={ballRef}
          aria-hidden="true"
          className="h-12 w-12 rounded-full bg-dot"
          style={{ visibility: channel === "visual" ? "visible" : "hidden" }}
        />
      </div>

      <p aria-live="off" className="text-sm tabular-nums text-foreground">
        {left}
      </p>

      <button
        type="button"
        onClick={stop}
        autoFocus
        className="btn-base btn-quiet mb-8 mt-6 w-64 text-xl"
      >
        Стоп
      </button>
    </main>
  );
}
