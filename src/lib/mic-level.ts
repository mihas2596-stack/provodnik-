/**
 * Уровень микрофона. Web Audio API: getUserMedia → AudioContext →
 * AnalyserNode → getByteTimeDomainData, RMS на каждый кадр анимации.
 * Нужен только для того, чтобы человек видел, что его слышно.
 */

export type Meter = { stop: () => void };

type Ctx = typeof AudioContext;

export async function startMicMeter(onLevel: (rms: number) => void): Promise<Meter> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const Ctor =
    (window as unknown as { AudioContext?: Ctx; webkitAudioContext?: Ctx }).AudioContext ??
    (window as unknown as { webkitAudioContext?: Ctx }).webkitAudioContext;
  if (!Ctor) {
    stream.getTracks().forEach((t) => t.stop());
    return { stop: () => {} };
  }

  const ctx = new Ctor();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);

  const buffer = new Uint8Array(analyser.fftSize);
  let alive = true;
  let raf = 0;

  const tick = () => {
    if (!alive) return;
    analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const v = ((buffer[i] ?? 128) - 128) / 128;
      sum += v * v;
    }
    onLevel(Math.min(1, Math.sqrt(sum / buffer.length) * 3));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    stop: () => {
      alive = false;
      cancelAnimationFrame(raf);
      try {
        source.disconnect();
      } catch {
        // уже отключено
      }
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => {});
      onLevel(0);
    },
  };
}
