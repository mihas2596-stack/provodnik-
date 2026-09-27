import { i as createServerFn } from "./server-BsLnKtLh.mjs";
import { t as createServerRpc } from "./createServerRpc-DzJy2JSP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tts.functions-D5C3M7x_.js
/**
* Озвучка через ElevenLabs. Ключ живёт только на сервере.
* Возвращает mp3 в base64 либо null — тогда фронтенд переходит на Web Speech API.
*/
var VOICE_ID_DEFAULT = "XB0fDUnXU5powFXDhCwa";
var TIMEOUT_MS = 1e4;
var synthesize_createServerFn_handler = createServerRpc({
	id: "32abc5ae79f4e90e8ce27b03f7335997c4fa6f663ea725f7c41e734b84c6980b",
	name: "synthesize",
	filename: "src/lib/tts.functions.ts"
}, (opts) => synthesize.__executeServer(opts));
var synthesize = createServerFn({ method: "POST" }).inputValidator((input) => ({ text: String(input?.text ?? "").slice(0, 800) })).handler(synthesize_createServerFn_handler, async ({ data }) => {
	const key = process.env["ELEVENLABS_API_KEY"];
	const text = data.text.trim();
	if (!key || !text) return { audio: null };
	const voice = process.env["ELEVENLABS_VOICE_ID"] || VOICE_ID_DEFAULT;
	const control = new AbortController();
	const timer = setTimeout(() => control.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
			method: "POST",
			headers: {
				"xi-api-key": key,
				"content-type": "application/json"
			},
			body: JSON.stringify({
				text,
				model_id: "eleven_multilingual_v2",
				voice_settings: {
					stability: .6,
					similarity_boost: .75,
					style: 0
				}
			}),
			signal: control.signal
		});
		if (!res.ok) return { audio: null };
		const bytes = new Uint8Array(await res.arrayBuffer());
		let binary = "";
		for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
		return { audio: btoa(binary) };
	} catch {
		return { audio: null };
	} finally {
		clearTimeout(timer);
	}
});
//#endregion
export { synthesize_createServerFn_handler };
