import { i as createServerFn } from "./server-BsLnKtLh.mjs";
import { t as createServerRpc } from "./createServerRpc-DzJy2JSP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/provodnik.functions-AI0YRtLF.js
/** Темы, которые по умолчанию считаются бытовыми. */
var EVERYDAY_TOPICS = [
	"ссора",
	"обида",
	"раздражение"
];
/** Ошибка сети или битый JSON не должны обрывать сеанс: идём дальше молча. */
var SAFE_CONTINUE = {
	action: "continue",
	message: "",
	escalation: false
};
var guideStep_createServerFn_handler = createServerRpc({
	id: "bb79a0692e0eeee770777ee799a856f540b1113e59c847fcd97a2f21bb638b16",
	name: "guideStep",
	filename: "src/lib/provodnik.functions.ts"
}, (opts) => guideStep.__executeServer(opts));
var guideStep = createServerFn({ method: "POST" }).inputValidator((input) => ({
	step: String(input.step ?? "").slice(0, 40),
	setsDone: Math.max(0, Math.min(8, Number(input.setsDone) || 0)),
	topic: String(input.topic ?? "").slice(0, 60),
	history: (Array.isArray(input.history) ? input.history : []).slice(-20).map((t) => ({
		role: t.role === "user" ? "user" : "assistant",
		text: String(t.text ?? "").slice(0, 2e3)
	}))
})).handler(guideStep_createServerFn_handler, async ({ data }) => {
	if (data.setsDone >= 8) return {
		action: "close",
		message: "Это был последний подход. Заканчиваем.",
		escalation: false
	};
	try {
		const { openaiText } = await import("./openai.server-D51Nh9Qq.mjs");
		const { PROVODNIK_SYSTEM_PROMPT, GUIDE_SCHEMA } = await import("./provodnik.server-DZhDMDjQ.mjs");
		const transcript = data.history.map((t) => `${t.role === "user" ? "Пользователь" : "Проводник"}: ${t.text}`).join("\n");
		const raw = await openaiText(PROVODNIK_SYSTEM_PROMPT, `${EVERYDAY_TOPICS.some((t) => data.topic.includes(t)) ? `Человек выбрал тему «${data.topic}». Считай ситуацию обычной бытовой, пока он сам прямо не скажет о травме, насилии, смерти близкого или желании навредить. Флаги здесь почти никогда не нужны.` : data.topic ? `Человек выбрал тему «${data.topic}».` : ""}\nТекущий шаг протокола: ${data.step}. Подходов пройдено: ${data.setsDone}.\n\nДиалог:\n${transcript}\n\nОтветь одним сообщением по правилам выше.`, {
			type: "json_schema",
			name: "provodnik_reply",
			strict: true,
			schema: GUIDE_SCHEMA
		});
		const parsed = JSON.parse(raw);
		const flags = new Set(Array.isArray(parsed.flags) ? parsed.flags : []);
		const message = String(parsed.message ?? "").trim();
		if (flags.size > 0) console.log(JSON.stringify({
			at: (/* @__PURE__ */ new Date()).toISOString(),
			step: data.step,
			flags: [...flags]
		}));
		if (flags.has("self_harm")) return {
			action: "crisis",
			message: "Останавливаемся здесь.",
			escalation: false
		};
		if (flags.has("trauma") || flags.has("loss") || flags.has("chronic")) return {
			action: "confirm",
			message: "Звучит так, будто это тяжелее обычной бытовой ситуации. Продолжаем или остановимся?",
			escalation: false
		};
		if (flags.has("clinical")) return {
			action: "continue",
			message: "Про диагнозы и лечение я не работаю. Продолжаем?",
			escalation: false
		};
		return {
			action: "continue",
			message,
			escalation: flags.has("escalation")
		};
	} catch {
		return SAFE_CONTINUE;
	}
});
//#endregion
export { guideStep_createServerFn_handler };
