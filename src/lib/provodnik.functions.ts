import { createServerFn } from "@tanstack/react-start";

export type GuideAction = "continue" | "crisis" | "confirm" | "close";

export type GuideReply = {
  action: GuideAction;
  message: string;
  escalation: boolean;
};

type Turn = { role: "assistant" | "user"; text: string };

type GuideInput = {
  step: string;
  setsDone: number;
  history: Turn[];
  topic?: string;
};

/** Темы, которые по умолчанию считаются бытовыми. */
const EVERYDAY_TOPICS = ["ссора", "обида", "раздражение"];

/** Ошибка сети или битый JSON не должны обрывать сеанс: идём дальше молча. */
const SAFE_CONTINUE: GuideReply = { action: "continue", message: "", escalation: false };

export const guideStep = createServerFn({ method: "POST" })
  .inputValidator((input: GuideInput) => ({
    step: String(input.step ?? "").slice(0, 40),
    setsDone: Math.max(0, Math.min(8, Number(input.setsDone) || 0)),
    topic: String(input.topic ?? "").slice(0, 60),
    history: (Array.isArray(input.history) ? input.history : []).slice(-20).map((t) => ({
      role: t.role === "user" ? ("user" as const) : ("assistant" as const),
      text: String(t.text ?? "").slice(0, 2000),
    })),
  }))
  .handler(async ({ data }): Promise<GuideReply> => {
    // Потолок подходов проверяет код, не модель.
    if (data.setsDone >= 8) {
      return {
        action: "close",
        message: "Это был последний подход. Заканчиваем.",
        escalation: false,
      };
    }

    try {
      const { openaiText } = await import("@/lib/openai.server");
      const { PROVODNIK_SYSTEM_PROMPT, GUIDE_SCHEMA } = await import("@/lib/provodnik.server");

      const transcript = data.history
        .map((t) => `${t.role === "user" ? "Пользователь" : "Проводник"}: ${t.text}`)
        .join("\n");

      const everyday = EVERYDAY_TOPICS.some((t) => data.topic.includes(t));
      const context = everyday
        ? `Человек выбрал тему «${data.topic}». Считай ситуацию обычной бытовой, пока он сам прямо не скажет о травме, насилии, смерти близкого или желании навредить. Флаги здесь почти никогда не нужны.`
        : data.topic
          ? `Человек выбрал тему «${data.topic}».`
          : "";

      const raw = await openaiText(
        PROVODNIK_SYSTEM_PROMPT,
        `${context}\nТекущий шаг протокола: ${data.step}. Подходов пройдено: ${data.setsDone}.\n\nДиалог:\n${transcript}\n\nОтветь одним сообщением по правилам выше.`,
        { type: "json_schema", name: "provodnik_reply", strict: true, schema: GUIDE_SCHEMA },
      );

      const parsed = JSON.parse(raw) as {
        state?: string;
        message?: string;
        flags?: string[];
      };
      const flags = new Set(Array.isArray(parsed.flags) ? parsed.flags : []);
      const message = String(parsed.message ?? "").trim();

      // Только время, шаг и факт флага. Содержание ответов не логируется.
      if (flags.size > 0) {
        console.log(
          JSON.stringify({
            at: new Date().toISOString(),
            step: data.step,
            flags: [...flags],
          }),
        );
      }

      // Единственная жёсткая остановка: вред себе или другому, угроза жизни.
      if (flags.has("self_harm")) {
        return { action: "crisis", message: "Останавливаемся здесь.", escalation: false };
      }
      // Всё остальное — только вопрос с двумя кнопками, решает человек.
      if (flags.has("trauma") || flags.has("loss") || flags.has("chronic")) {
        return {
          action: "confirm",
          message:
            "Звучит так, будто это тяжелее обычной бытовой ситуации. Продолжаем или остановимся?",
          escalation: false,
        };
      }
      if (flags.has("clinical")) {
        return {
          action: "continue",
          message: "Про диагнозы и лечение я не работаю. Продолжаем?",
          escalation: false,
        };
      }

      return { action: "continue", message, escalation: flags.has("escalation") };
    } catch {
      // Ошибка сети или битый JSON не повод обрывать сеанс.
      return SAFE_CONTINUE;
    }
  });
