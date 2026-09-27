//#region node_modules/.nitro/vite/services/ssr/assets/openai.server-D51Nh9Qq.js
var ENDPOINT = "https://api.openai.com/v1/responses";
var MODEL = process.env["OPENAI_MODEL"] || "gpt-4o-mini";
async function openaiText(system, user, format = { type: "text" }) {
	const key = process.env["OPENAI_API_KEY"];
	if (!key) throw new Error("OPENAI_API_KEY is missing");
	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model: MODEL,
			input: [{
				role: "developer",
				content: [{
					type: "input_text",
					text: system
				}]
			}, {
				role: "user",
				content: [{
					type: "input_text",
					text: user
				}]
			}],
			stream: true,
			store: false,
			text: { format }
		})
	});
	if (!res.ok || !res.body) throw new Error(`openai ${res.status}`);
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let out = "";
	while (true) {
		const chunk = await reader.read();
		if (chunk.done) break;
		buffer += decoder.decode(chunk.value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			if (!line.startsWith("data:")) continue;
			const payload = line.slice(5).trim();
			if (!payload || payload === "[DONE]") continue;
			try {
				const event = JSON.parse(payload);
				if (event.type === "response.output_text.delta" && event.delta) out += event.delta;
				else if (event.type === "response.completed" && !out && event.response?.output_text) out = event.response.output_text;
			} catch {}
		}
	}
	return out.trim();
}
//#endregion
export { openaiText };
