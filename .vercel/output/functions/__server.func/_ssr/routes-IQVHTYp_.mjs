import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { U as isRedirect, b as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as TSS_SERVER_FUNCTION, i as createServerFn, o as getServerFnById } from "./server-BsLnKtLh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-IQVHTYp_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
/** Постоянная мелкая серая строка в самом низу. Не всплывающее окно. */
function CrisisResources() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1 text-center text-xs leading-relaxed text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Экстренные и кризисные службы 112, круглосуточно." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Телефон доверия: 8 800 2000 122 (бесплатно, круглосуточно)" })]
	});
}
var SPEED_MS = {
	slow: 1400,
	medium: 1e3,
	fast: 700
};
/**
* Экран упражнения: шарик, отсчёт, «Стоп». Ничего больше.
* Движение — Web Animations API, плавное качание без рывков на краях.
*/
function Stimulation({ channel, speed = "medium", seconds = 30, onFinish, onStop }) {
	const cycleMs = SPEED_MS[speed];
	const cycles = Math.max(1, Math.round(seconds * 1e3 / cycleMs));
	const totalMs = cycles * cycleMs;
	const ballRef = (0, import_react.useRef)(null);
	const animRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const doneRef = (0, import_react.useRef)(false);
	const [left, setLeft] = (0, import_react.useState)(Math.round(totalMs / 1e3));
	(0, import_react.useEffect)(() => {
		const ball = ballRef.current;
		if (!ball) return;
		doneRef.current = false;
		const anim = ball.animate([
			{ transform: "translateX(-40vw) scale(0.94)" },
			{ transform: "translateX(0) scale(1)" },
			{ transform: "translateX(40vw) scale(0.94)" },
			{ transform: "translateX(0) scale(1)" },
			{ transform: "translateX(-40vw) scale(0.94)" }
		], {
			duration: cycleMs,
			iterations: cycles,
			easing: "cubic-bezier(0.37, 0, 0.63, 1)"
		});
		animRef.current = anim;
		if (channel === "audio" && typeof window !== "undefined") {
			const Ctor = window.AudioContext ?? window.webkitAudioContext;
			if (Ctor) audioRef.current = new Ctor();
		}
		const ping = (index) => {
			const ctx = audioRef.current;
			if (!ctx) return;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const panner = ctx.createStereoPanner();
			osc.type = "sine";
			osc.frequency.value = 220;
			panner.pan.value = index % 2 === 0 ? -1 : 1;
			gain.gain.setValueAtTime(1e-4, ctx.currentTime);
			gain.gain.linearRampToValueAtTime(.14, ctx.currentTime + .02);
			gain.gain.linearRampToValueAtTime(1e-4, ctx.currentTime + .18);
			osc.connect(gain).connect(panner).connect(ctx.destination);
			osc.start();
			osc.stop(ctx.currentTime + .2);
		};
		let raf = 0;
		let lastIndex = -1;
		const tick = () => {
			const t = Number(anim.currentTime ?? 0);
			setLeft(Math.max(0, Math.ceil((totalMs - t) / 1e3)));
			const index = Math.floor(t / (cycleMs / 2));
			if (index !== lastIndex) {
				lastIndex = index;
				if (channel === "audio") ping(index);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		anim.finished.then(() => {
			if (doneRef.current) return;
			doneRef.current = true;
			onFinish();
		}).catch(() => {});
		return () => {
			cancelAnimationFrame(raf);
			doneRef.current = true;
			anim.cancel();
			const ctx = audioRef.current;
			if (ctx) {
				ctx.close();
				audioRef.current = null;
			}
		};
	}, [
		channel,
		cycleMs,
		cycles
	]);
	const onStopRef = (0, import_react.useRef)(onStop);
	onStopRef.current = onStop;
	const stop = () => {
		doneRef.current = true;
		animRef.current?.cancel();
		onStopRef.current();
	};
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				stop();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "fixed inset-0 flex h-dvh flex-col items-center justify-between overflow-hidden bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-1 items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: ballRef,
					"aria-hidden": "true",
					className: "h-12 w-12 rounded-full bg-dot",
					style: { visibility: channel === "visual" ? "visible" : "hidden" }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"aria-live": "off",
				className: "text-sm tabular-nums text-foreground",
				children: left
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: stop,
				autoFocus: true,
				className: "btn-base btn-quiet mb-8 mt-6 w-64 text-xl",
				children: "Стоп"
			})
		]
	});
}
/** Слайдер 0–10: крупные деления, подписи только у краёв, без цвета и смайлов. */
function SudSlider({ label, onSubmit }) {
	const [value, setValue] = (0, import_react.useState)(5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "space-y-6",
		onSubmit: (e) => {
			e.preventDefault();
			onSubmit(value);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "block text-lg",
				htmlFor: "sud",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "sud",
					type: "range",
					min: 0,
					max: 10,
					step: 1,
					value,
					onChange: (e) => setValue(Number(e.target.value)),
					"aria-valuetext": `${value} из 10`,
					className: "h-3 w-full appearance-none rounded-full bg-secondary accent-primary"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between text-sm text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0 — спокойно" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: "text-2xl text-foreground",
							children: value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "10 — максимум" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "btn-base btn-primary w-full",
				children: "Дальше"
			})
		]
	});
}
var STATUS = {
	idle: "Пауза",
	speaking: "Говорю",
	listening: "Слушаю",
	transcribing: "Распознаю",
	thinking: "Думаю",
	awaiting_input: "Твоя очередь",
	error: "Не получилось"
};
/**
* Голосовой экран. Состояние видно всегда: строка статуса сверху,
* кольцо уровня микрофона, живой транскрипт и лента реплик.
*/
function VoiceStage({ phase, caption, interim, finalText, level = 0, hint, feed = [], progress, manualOpen, textMode, onManual, onRepeat, onSkip, onOpenManual, onFinishTurn, onSkipSpeech, onTextMode, onDismissHint, controls, onStop }) {
	const [text, setText] = (0, import_react.useState)("");
	const feedEnd = (0, import_react.useRef)(null);
	const live = [finalText, interim].filter(Boolean).join(" ").trim();
	(0, import_react.useEffect)(() => {
		feedEnd.current?.scrollIntoView({
			block: "end",
			behavior: "smooth"
		});
	}, [
		feed.length,
		caption,
		live
	]);
	const edit = () => {
		setText(live);
		onOpenManual?.();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-dvh flex-col bg-background px-5 py-4 text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-10 items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					"aria-live": "polite",
					className: "flex items-center gap-2 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: `h-2 w-2 rounded-full bg-dot ${phase === "listening" ? "animate-pulse" : phase === "thinking" || phase === "transcribing" ? "animate-ping" : "opacity-40"}`
						}),
						STATUS[phase],
						progress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 opacity-70",
							children: ["· ", progress]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [phase === "speaking" && onSkipSpeech && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onSkipSpeech,
						className: "text-xs text-muted-foreground underline-offset-4 hover:underline",
						children: "Пропустить озвучку"
					}), onStop && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onStop,
						className: "btn-base btn-quiet px-5 py-2",
						children: "Стоп"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex w-full max-w-xl flex-1 flex-col justify-end gap-4 overflow-y-auto py-6",
				children: [
					feed.slice(0, -1).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `text-sm leading-relaxed opacity-45 ${item.role === "user" ? "text-right" : ""}`,
						children: item.text
					}, item.id)),
					feed.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `text-base leading-relaxed ${feed[feed.length - 1].role === "user" ? "text-right" : ""}`,
						"aria-live": "polite",
						children: feed[feed.length - 1].text
					}),
					live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm leading-relaxed",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: finalText }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: interim
								})
							]
						}), onOpenManual && !manualOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: edit,
							className: "text-xs text-muted-foreground underline-offset-4 hover:underline",
							children: "Исправить"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: feedEnd })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-xl space-y-4",
				children: [
					controls && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-full",
						children: controls
					}),
					hint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 border border-input px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed",
							children: hint
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-4 text-xs text-muted-foreground",
							children: [
								onTextMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onTextMode(true),
									className: "underline-offset-4 hover:underline",
									children: "Продолжить текстом"
								}),
								onDismissHint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: onDismissHint,
									className: "underline-offset-4 hover:underline",
									children: "Подождать"
								}),
								onSkip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: onSkip,
									className: "underline-offset-4 hover:underline",
									children: "Пропустить вопрос"
								})
							]
						})]
					}),
					manualOpen && onManual && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "w-full space-y-3",
						onSubmit: (e) => {
							e.preventDefault();
							const value = text.trim();
							if (!value) return;
							setText("");
							onManual(value);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "manual",
								children: "Ответ текстом"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "manual",
								autoFocus: true,
								rows: 2,
								value: text,
								onChange: (e) => setText(e.target.value),
								className: "w-full border border-input bg-background px-4 py-3 text-base text-card-foreground focus-visible:outline-2 focus-visible:outline-ring"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn-base btn-primary w-full",
								children: "Ответить"
							})
						]
					}),
					phase === "listening" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"aria-hidden": "true",
							className: "relative flex h-16 w-16 items-center justify-center rounded-full border border-input",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute inset-0 rounded-full border-2 border-dot",
								style: {
									opacity: .15 + level * .7,
									transform: `scale(${1 + level * .35})`
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3 w-3 rounded-full bg-dot" })]
						}), onFinishTurn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onFinishTurn,
							className: "btn-base btn-primary w-52",
							children: "Готово"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap justify-center gap-5 text-xs text-muted-foreground",
						children: [
							onRepeat && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onRepeat,
								className: "underline-offset-4 hover:underline",
								children: "Повтори вопрос"
							}),
							onOpenManual && !manualOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onOpenManual,
								className: "underline-offset-4 hover:underline",
								children: "Я скажу текстом"
							}),
							onTextMode && textMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => onTextMode(false),
								className: "underline-offset-4 hover:underline",
								children: "Вернуться к голосу"
							}),
							onSkip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onSkip,
								className: "underline-offset-4 hover:underline",
								children: "Пропустить"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CrisisResources, {})
				]
			})
		]
	});
}
async function startMicMeter(onLevel) {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	const Ctor = window.AudioContext ?? window.webkitAudioContext;
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
	return { stop: () => {
		alive = false;
		cancelAnimationFrame(raf);
		try {
			source.disconnect();
		} catch {}
		stream.getTracks().forEach((t) => t.stop());
		ctx.close().catch(() => {});
		onLevel(0);
	} };
}
function ctor() {
	if (typeof window === "undefined") return null;
	const w = window;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
function recognitionSupported() {
	return ctor() !== null;
}
/** Понятные сообщения вместо кодов ошибок браузера. */
function recognitionErrorText(code) {
	if (code === "not-allowed" || code === "service-not-allowed") return "Микрофон запрещён в браузере. Напиши текстом.";
	if (code === "audio-capture") return "Микрофон не найден. Напиши текстом.";
	if (code === "network") return "Нет связи с распознаванием речи. Напиши текстом.";
	if (code === "no-match") return "Не разобрал слова. Повтори или напиши текстом.";
	return "Не получилось распознать речь. Напиши текстом.";
}
/**
* Слушает одну фразу. Распознавание держим открытым до паузы в речи:
* короткие обрывы и «no-speech» не считаются ответом, микрофон перезапускается.
*/
function listenOnce(options = {}) {
	const timeoutMs = options.timeoutMs ?? 6e4;
	const silenceMs = options.silenceMs ?? 1800;
	const Ctor = ctor();
	if (!Ctor) return {
		result: Promise.resolve({
			text: "",
			confidence: 0
		}),
		finish: () => {},
		abort: () => {}
	};
	let settled = false;
	let best = {
		text: "",
		confidence: 0
	};
	let finals = "";
	let rec = null;
	let restarts = 0;
	let silence = 0;
	let timer = 0;
	let force = () => {};
	return {
		result: new Promise((resolve) => {
			const finish = () => {
				if (settled) return;
				settled = true;
				window.clearTimeout(timer);
				window.clearTimeout(silence);
				try {
					rec?.abort();
				} catch {}
				resolve({
					text: (finals + " " + best.text).trim() || best.text.trim(),
					confidence: best.confidence
				});
			};
			force = finish;
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
							best = {
								text: "",
								confidence: alt.confidence ?? 1
							};
						} else if (text.length > best.text.length) best = {
							text,
							confidence: alt.confidence ?? 0
						};
						options.onText?.(best.text, finals);
						armSilence();
					}
				};
				instance.onend = () => {
					if (settled) return;
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
		}),
		finish: () => {
			window.clearTimeout(silence);
			try {
				rec?.stop();
			} catch {}
			window.setTimeout(force, 400);
		},
		abort: () => {
			try {
				rec?.abort();
			} catch {}
		}
	};
}
var STOP_WORDS = [
	"стоп",
	"stop",
	"останови",
	"хватит"
];
function isStopWord(text) {
	const t = text.toLowerCase().replace(/[^a-zа-яё ]/gi, "").trim();
	return STOP_WORDS.some((w) => t === w || t.startsWith(w + " ") || t.endsWith(" " + w));
}
/** «да», «ага», «бывает», «есть» → да. «нет», «не», «никогда» → нет. */
function parseYesNo(text) {
	const words = text.toLowerCase().replace(/[^а-яё ]/gi, " ").trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return null;
	const no = [
		"нет",
		"не",
		"никогда",
		"неа"
	];
	const yes = [
		"да",
		"ага",
		"бывает",
		"есть",
		"было",
		"иногда",
		"конечно",
		"угу"
	];
	for (const w of words) if (no.includes(w)) return false;
	for (const w of words) if (yes.includes(w)) return true;
	return null;
}
var NUMBER_WORDS = {
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
	десять: 10
};
/** «семь», «7», «где-то семь», «семь-восемь» (берём большее). */
function parseSud(text) {
	const t = text.toLowerCase().replace(/[^а-яё0-9 ]/gi, " ");
	const found = [];
	for (const token of t.split(/\s+/).filter(Boolean)) {
		if (/^\d{1,2}$/.test(token)) {
			const n = Number(token);
			if (n >= 0 && n <= 10) found.push(n);
			continue;
		}
		const word = NUMBER_WORDS[token];
		if (word !== void 0) found.push(word);
	}
	if (found.length === 0) return null;
	return Math.max(...found);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* Озвучка через ElevenLabs. Ключ живёт только на сервере.
* Возвращает mp3 в base64 либо null — тогда фронтенд переходит на Web Speech API.
*/
var synthesize = createServerFn({ method: "POST" }).inputValidator((input) => ({ text: String(input?.text ?? "").slice(0, 800) })).handler(createSsrRpc("32abc5ae79f4e90e8ce27b03f7335997c4fa6f663ea725f7c41e734b84c6980b"));
/**
* Вывод речи. Основной канал — ElevenLabs (серверная функция synthesize),
* запасной — Web Speech API, ru-RU, rate 0.9.
* Длинные реплики режем на предложения и произносим очередью:
* так синтез не обрывается и переход между кусками остаётся ровным.
*/
var ruVoice = null;
var subscribed = false;
var elevenOff = false;
function synthesisApi() {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
	return window.speechSynthesis;
}
function pickVoice() {
	const s = synthesisApi();
	if (!s) return;
	const ru = s.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ru"));
	ruVoice = ru.find((v) => v.localService) ?? ru[0] ?? null;
}
/** Список голосов приходит асинхронно — подписываемся на voiceschanged. */
function initVoices() {
	const s = synthesisApi();
	if (!s || subscribed) return;
	subscribed = true;
	pickVoice();
	s.addEventListener("voiceschanged", pickVoice);
}
function cancelSpeech() {
	synthesisApi()?.cancel();
	stopAudio();
}
/** Режем на предложения, слишком длинные — по запятым. */
function splitSpeech(text) {
	const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
	const parts = [];
	for (const sentence of sentences) {
		if (sentence.length <= 220) {
			parts.push(sentence);
			continue;
		}
		let buffer = "";
		for (const chunk of sentence.split(/(?<=,)\s+/)) if ((buffer + " " + chunk).trim().length > 220 && buffer) {
			parts.push(buffer.trim());
			buffer = chunk;
		} else buffer = (buffer + " " + chunk).trim();
		if (buffer) parts.push(buffer.trim());
	}
	return parts;
}
var audioCache = /* @__PURE__ */ new Map();
var current = null;
function stopAudio() {
	if (!current) return;
	current.pause();
	current.src = "";
	current = null;
}
function fetchAudio(text) {
	if (elevenOff) return Promise.resolve(null);
	const hit = audioCache.get(text);
	if (hit) return hit;
	const task = synthesize({ data: { text } }).then((r) => {
		if (!r.audio) elevenOff = true;
		return r.audio ?? null;
	}).catch(() => {
		elevenOff = true;
		return null;
	});
	audioCache.set(text, task);
	return task;
}
function playAudio(base64) {
	return new Promise((resolve) => {
		const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
		current = audio;
		const finish = () => {
			if (current === audio) current = null;
			resolve();
		};
		audio.onended = finish;
		audio.onerror = finish;
		audio.play().catch(finish);
	});
}
function speakPart(text) {
	const s = synthesisApi();
	if (!s) return Promise.resolve();
	return new Promise((resolve) => {
		const u = new SpeechSynthesisUtterance(text);
		u.lang = "ru-RU";
		u.rate = .9;
		u.pitch = 1;
		u.volume = 1;
		if (ruVoice) u.voice = ruVoice;
		let settled = false;
		let watchdog = 0;
		const finish = () => {
			if (settled) return;
			settled = true;
			window.clearTimeout(watchdog);
			resolve();
		};
		u.onend = finish;
		u.onerror = finish;
		watchdog = window.setTimeout(finish, 1500 + text.length * 130);
		s.speak(u);
	});
}
/** Произносит текст целиком. Возвращает промис окончания и способ прервать. */
function speak(text) {
	let cancelled = false;
	const parts = splitSpeech(text);
	return {
		done: (async () => {
			cancelSpeech();
			for (let i = 0; i < parts.length; i += 1) {
				if (cancelled) return;
				const part = parts[i];
				const audio = await fetchAudio(part);
				if (cancelled) return;
				const next = parts[i + 1];
				if (next && !elevenOff) fetchAudio(next);
				if (audio) {
					await playAudio(audio);
					continue;
				}
				const s = synthesisApi();
				if (!s || s.getVoices().length === 0) {
					await new Promise((r) => window.setTimeout(r, Math.min(9e3, 900 + part.length * 45)));
					continue;
				}
				await speakPart(part);
			}
		})(),
		cancel: () => {
			cancelled = true;
			cancelSpeech();
		}
	};
}
var StopSignal = class extends Error {
	constructor() {
		super("stop");
		this.name = "StopSignal";
	}
};
/** Служебные ответы с экранных кнопок. */
var REPEAT = "\0repeat";
var SKIP = "\0skip";
var NO_SPEECH_MS = 1e4;
var SLOW_THINKING_MS = 15e3;
var INPUT_MODE_KEY$1 = "bls_input_mode";
var DEFAULT_RETRY = "Не расслышал. Можно сказать ещё раз или пропустить вопрос.";
var DEFAULT_FALLBACK = "Давай продолжим текстом — так будет проще.";
var CLARIFY = "Расскажи чуть подробнее, парой фраз — что именно зацепило?";
var MIC_HINT = "Похоже, микрофон недоступен. Продолжим текстом?";
var SLOW_HINT = "Долго думаю.";
function readInputMode() {
	if (typeof window === "undefined") return null;
	try {
		const v = window.localStorage.getItem(INPUT_MODE_KEY$1);
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
function useVoiceTurn(onStop) {
	const [caption, setCaption] = (0, import_react.useState)("");
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [manualOpen, setManualOpen] = (0, import_react.useState)(false);
	const [interim, setInterim] = (0, import_react.useState)("");
	const [finalText, setFinalText] = (0, import_react.useState)("");
	const [level, setLevel] = (0, import_react.useState)(0);
	const [hint, setHint] = (0, import_react.useState)(null);
	const [feed, setFeed] = (0, import_react.useState)([]);
	const [textMode, setTextModeState] = (0, import_react.useState)(false);
	const voiceAvailable = (0, import_react.useRef)(true);
	const speakingRef = (0, import_react.useRef)(null);
	const listeningRef = (0, import_react.useRef)(null);
	const meterRef = (0, import_react.useRef)(null);
	const manualRef = (0, import_react.useRef)(null);
	const pendingManual = (0, import_react.useRef)(null);
	const stoppedRef = (0, import_react.useRef)(false);
	const textModeRef = (0, import_react.useRef)(false);
	const feedId = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		initVoices();
		stoppedRef.current = false;
		voiceAvailable.current = recognitionSupported();
		const saved = readInputMode();
		const initial = !voiceAvailable.current || saved === "text";
		textModeRef.current = initial;
		setTextModeState(initial);
		if (!voiceAvailable.current) setHint("В этом браузере голосовой ввод недоступен, работаем текстом.");
		return () => {
			stoppedRef.current = true;
			speakingRef.current?.cancel();
			listeningRef.current?.abort();
			meterRef.current?.stop();
			cancelSpeech();
		};
	}, []);
	const setTextMode = (0, import_react.useCallback)((on) => {
		textModeRef.current = on;
		setTextModeState(on);
		try {
			window.localStorage.setItem(INPUT_MODE_KEY$1, on ? "text" : "voice");
		} catch {}
		if (on) setManualOpen(true);
	}, []);
	const push = (0, import_react.useCallback)((role, text) => {
		const clean = text.trim();
		if (!clean) return;
		feedId.current += 1;
		setFeed((prev) => {
			const last = prev[prev.length - 1];
			if (last && last.role === role && last.text === clean) return prev;
			return [...prev.slice(-30), {
				id: feedId.current,
				role,
				text: clean
			}];
		});
	}, []);
	/** Переход в текст без записи в настройки: это ситуативно. */
	const switchToText = (0, import_react.useCallback)(() => {
		textModeRef.current = true;
		setTextModeState(true);
		setManualOpen(true);
	}, []);
	/** Микрофон не работает: один раз спокойно спрашиваем, повторно — сразу текст. */
	const micWarned = (0, import_react.useRef)(false);
	const micProblem = (0, import_react.useCallback)(() => {
		setManualOpen(true);
		if (!micWarned.current) {
			micWarned.current = true;
			setHint(MIC_HINT);
			return;
		}
		setHint(null);
		switchToText();
	}, [switchToText]);
	const halt = (0, import_react.useCallback)(() => {
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
	const say = (0, import_react.useCallback)(async (text) => {
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
	}, [push]);
	/** «Пропустить озвучку» — реплика уже на экране, читать её вслух не обязательно. */
	const skipSpeech = (0, import_react.useCallback)(() => {
		speakingRef.current?.cancel();
		cancelSpeech();
	}, []);
	/** Ждём либо микрофон, либо экранную кнопку/поле. */
	const hear = (0, import_react.useCallback)(async () => {
		if (pendingManual.current !== null) {
			const text = pendingManual.current;
			pendingManual.current = null;
			return {
				text,
				confidence: 1,
				manual: true
			};
		}
		setInterim("");
		setFinalText("");
		const manual = new Promise((resolve) => {
			manualRef.current = resolve;
		});
		if (!voiceAvailable.current || textModeRef.current) {
			setPhase("awaiting_input");
			setManualOpen(true);
			const text = await manual;
			manualRef.current = null;
			setPhase("transcribing");
			return {
				text,
				confidence: 1,
				manual: true
			};
		}
		setPhase("listening");
		let spoke = false;
		const noSpeech = window.setTimeout(() => {
			if (!spoke) micProblem();
		}, NO_SPEECH_MS);
		startMicMeter(setLevel).then((m) => {
			if (stoppedRef.current) m.stop();
			else meterRef.current = m;
		}).catch(() => micProblem());
		const l = listenOnce({
			onSpeech: () => {
				spoke = true;
				setHint(null);
			},
			onText: (i, f) => {
				setInterim(i);
				setFinalText(f);
			},
			onError: () => micProblem()
		});
		listeningRef.current = l;
		const heard = await Promise.race([l.result.then((r) => ({
			...r,
			manual: false
		})), manual.then((text) => ({
			text,
			confidence: 1,
			manual: true
		}))]);
		window.clearTimeout(noSpeech);
		l.abort();
		listeningRef.current = null;
		manualRef.current = null;
		meterRef.current?.stop();
		meterRef.current = null;
		setLevel(0);
		setPhase("transcribing");
		await new Promise((r) => window.setTimeout(r, 250));
		return heard;
	}, []);
	/** Ответ через экранную кнопку или текстовое поле. Работает всегда. */
	const answerManually = (0, import_react.useCallback)((text) => {
		const resolve = manualRef.current;
		if (resolve) {
			manualRef.current = null;
			resolve(text);
			return;
		}
		pendingManual.current = text;
		speakingRef.current?.cancel();
		cancelSpeech();
	}, []);
	/** «Готово» — явное завершение реплики, не ждём автоопределения паузы. */
	const finishTurn = (0, import_react.useCallback)(() => {
		listeningRef.current?.finish();
	}, []);
	/** «Повтори вопрос» — та же реплика заново, без упрёка. */
	const repeatQuestion = (0, import_react.useCallback)(() => answerManually(REPEAT), [answerManually]);
	/** «Пропустить» — шаг остаётся без ответа. */
	const skipQuestion = (0, import_react.useCallback)(() => answerManually(SKIP), [answerManually]);
	/** «Я скажу текстом» — открыть поле сразу, не дожидаясь неудач. */
	const openManual = (0, import_react.useCallback)(() => setManualOpen(true), []);
	/** Обёртка над ожиданием ответа модели: видно «Думаю», после 15 секунд — подсказка. */
	const think = (0, import_react.useCallback)(async (work) => {
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
			setPhase((p) => p === "thinking" ? "idle" : p);
		}
	}, []);
	const ask = (0, import_react.useCallback)(async (question, options = {}) => {
		const parse = options.parse ?? ((t) => t);
		const maxFails = Math.min(options.maxFails ?? 2, 2);
		let fails = 0;
		let clarified = false;
		let earlier = "";
		let line = question;
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
				if (options.skipValue !== void 0) {
					push("user", "Пропустил");
					return options.skipValue;
				}
				continue;
			}
			if (isStopWord(raw)) {
				halt();
				throw new StopSignal();
			}
			if (options.clarify && !clarified && raw && raw.split(/\s+/).length < 3) {
				clarified = true;
				earlier = raw;
				push("user", raw);
				line = CLARIFY;
				continue;
			}
			const full = earlier && raw ? `${earlier}. ${raw}` : raw || earlier;
			const parsed = full ? parse(full) : null;
			if (parsed !== null && parsed !== void 0) {
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
	}, [
		say,
		hear,
		halt,
		push,
		switchToText
	]);
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
		parseSud
	};
}
/** Темы, которые по умолчанию считаются бытовыми. */
/** Ошибка сети или битый JSON не должны обрывать сеанс: идём дальше молча. */
var guideStep = createServerFn({ method: "POST" }).inputValidator((input) => ({
	step: String(input.step ?? "").slice(0, 40),
	setsDone: Math.max(0, Math.min(8, Number(input.setsDone) || 0)),
	topic: String(input.topic ?? "").slice(0, 60),
	history: (Array.isArray(input.history) ? input.history : []).slice(-20).map((t) => ({
		role: t.role === "user" ? "user" : "assistant",
		text: String(t.text ?? "").slice(0, 2e3)
	}))
})).handler(createSsrRpc("bb79a0692e0eeee770777ee799a856f540b1113e59c847fcd97a2f21bb638b16"));
var SUD_GATE = 9;
var MODE_SECONDS = {
	quick: 24,
	full: 30
};
var TOPICS = [
	["ссора", "Ссора"],
	["тревога перед разговором", "Тревога перед разговором"],
	["обида", "Обида"],
	["чувство вины", "Чувство вины"],
	["раздражение", "Раздражение"],
	["застрявшая мысль", "Застрявшая мысль"]
];
var INTRO = `Привет, я Проводник. Сначала спокойно разберём, что тебя зацепило, потом будет упражнение: следишь глазами за шариком и держишь это в голове.
Это не терапия и не лечение. Если речь про травму, потерю близкого или мысли навредить себе — лучше к живому человеку. Номера внизу.
Голос распознаёт браузер, мы ничего не храним.
Расскажи, что произошло — как получится.`;
/** hard — остановка без вопросов. Остальное человек решает сам. */
var SCREENING = [
	{
		question: "Это связано с насилием, аварией или угрозой жизни?",
		hard: true
	},
	{
		question: "Это про смерть близкого человека?",
		hard: true
	},
	{
		question: "Состояние очень тяжёлое и тянется много месяцев?",
		hard: false
	}
];
var REFUSE_LINE = "Тогда давай остановимся здесь. С таким лучше к живому специалисту, а не к программе. Номера внизу.";
var Q_FOCUS = "Спасибо, что рассказал. Какая фраза, момент или образ там самый неприятный?";
var Q_BODY = "Понятно. А где в теле это сейчас отзывается?";
var Q_SUD = "От нуля до десяти — насколько сильно сейчас?";
var WHY = `Дальше держи этот момент в голове и следи глазами за шариком. Две задачи сразу занимают память, и мысль вспоминается будто размытой.
Я молчу, кнопка «Стоп» работает всё время. Готов?`;
var HEADPHONES = "Упражнение пойдёт тонами в стерео. Понадобятся наушники.";
function IndexPage() {
	const [screen, setScreen] = (0, import_react.useState)("entry");
	const [mode, setMode] = (0, import_react.useState)("quick");
	const [topic, setTopic] = (0, import_react.useState)("");
	const [speed, setSpeed] = (0, import_react.useState)("medium");
	const [before, setBefore] = (0, import_react.useState)(null);
	const [after, setAfter] = (0, import_react.useState)(null);
	const [run, setRun] = (0, import_react.useState)(0);
	const home = () => {
		cancelSpeech();
		setBefore(null);
		setAfter(null);
		setTopic("");
		setRun((r) => r + 1);
		setScreen("entry");
	};
	if (screen === "entry") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Entry, { onStart: () => setScreen("setup") });
	if (screen === "setup") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Setup, {
		mode,
		setMode,
		speed,
		setSpeed,
		onPick: (t) => {
			setTopic(t);
			setBefore(null);
			setAfter(null);
			setScreen("dialog");
		}
	});
	if (screen === "refuse") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Closing, {
		title: REFUSE_LINE,
		onHome: home
	});
	if (screen === "crisis") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Closing, {
		title: "Давай остановимся здесь. Сейчас важнее живой человек, а не программа. Номера внизу.",
		onHome: home
	});
	if (screen === "stopped") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stopped, { onHome: home });
	if (screen === "remeasure") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Remeasure, { onDone: (v) => {
		setAfter(v);
		setScreen("breathe");
	} });
	if (screen === "breathe") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breathe, { onDone: () => setScreen("final") });
	if (screen === "final") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Final, {
		before,
		after,
		onHome: home
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		screen,
		setScreen,
		mode,
		topic,
		speed,
		onScores: (s) => setBefore(s[0] ?? null)
	}, `${topic}-${run}`);
}
var INPUT_MODE_KEY = "bls_input_mode";
function savedInputMode() {
	if (typeof window === "undefined") return "voice";
	try {
		return window.localStorage.getItem(INPUT_MODE_KEY) === "text" ? "text" : "voice";
	} catch {
		return "voice";
	}
}
/** ЭКРАН 1. Вход: одна строка и одна кнопка. */
function Entry({ onStart }) {
	const [voiceOk, setVoiceOk] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		initVoices();
		setVoiceOk(recognitionSupported());
	}, []);
	const start = () => {
		(async () => {
			try {
				(await navigator.mediaDevices?.getUserMedia({ audio: true }))?.getTracks().forEach((t) => t.stop());
			} catch {}
		})();
		onStart();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center gap-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-center text-sm leading-relaxed",
			children: voiceOk ? "Отвечать можно голосом или текстом — как удобнее." : "В этом браузере голосовой ввод недоступен, работаем текстом."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: start,
			className: "btn-base btn-primary w-52",
			children: "Начать"
		})]
	}) });
}
/** ЭКРАН 2. Режим, скорость, способ ответа и тема. Всё одним спокойным списком. */
function Setup({ mode, setMode, speed, setSpeed, onPick }) {
	const [input, setInput] = (0, import_react.useState)("voice");
	const [voiceOk, setVoiceOk] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const ok = recognitionSupported();
		setVoiceOk(ok);
		setInput(ok ? savedInputMode() : "text");
	}, []);
	const pickInput = (value) => {
		setInput(value);
		try {
			window.localStorage.setItem(INPUT_MODE_KEY, value);
		} catch {}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col justify-center gap-12 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				label: "Сколько времени",
				value: mode,
				options: [["quick", "Быстрая разгрузка, пять минут"], ["full", "Полный сеанс, около пятнадцати"]],
				onChange: setMode
			}),
			voiceOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				label: "Как отвечать",
				value: input,
				options: [["voice", "Говорить"], ["text", "Писать"]],
				onChange: pickInput
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "В этом браузере голосовой ввод недоступен, работаем текстом."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				label: "Скорость шарика",
				value: speed,
				options: [
					["slow", "Медленно"],
					["medium", "Средне"],
					["fast", "Быстро"]
				],
				onChange: setSpeed
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "С чем работаем"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3",
					children: TOPICS.map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onPick(value),
						className: "btn-base btn-quiet w-full py-4 text-base",
						children: label
					}, value))
				})]
			})
		]
	}) });
}
function Choice({ label, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
			className: "mb-1 text-sm text-muted-foreground",
			children: label
		}), options.map(([v, text]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "flex items-center gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "radio",
				checked: value === v,
				onChange: () => onChange(v),
				className: "h-4 w-4"
			}), text]
		}, v))]
	});
}
/** Общая рамка экранов: воздух сверху и снизу, кризисная строка в подвале. */
function Frame({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col bg-background px-5 py-8 text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto flex w-full max-w-xl flex-1 flex-col",
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-xl pt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CrisisResources, {})
		})]
	});
}
/** ЭКРАНЫ 3 и 4. Разговор по шагам и раунды упражнения. */
function Dialog({ screen, setScreen, mode, topic, speed, onScores }) {
	const goStopped = (0, import_react.useCallback)(() => {
		cancelSpeech();
		setScreen("stopped");
	}, [setScreen]);
	const turn = useVoiceTurn(goStopped);
	const callGuide = useServerFn(guideStep);
	const started = (0, import_react.useRef)(false);
	const confirmResolve = (0, import_react.useRef)(null);
	const [slider, setSlider] = (0, import_react.useState)(false);
	const [yesNo, setYesNo] = (0, import_react.useState)(false);
	const [confirmText, setConfirmText] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)(void 0);
	const [channel, setChannel] = (0, import_react.useState)("visual");
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setChannel("audio");
	}, []);
	const sudFromSlider = (value) => {
		setSlider(false);
		turn.answerManually(String(value));
	};
	/** Вопрос с двумя кнопками: продолжить обычную ситуацию или остановиться. */
	const askConfirm = (0, import_react.useCallback)((message) => new Promise((resolve) => {
		cancelSpeech();
		confirmResolve.current = resolve;
		setConfirmText(message);
	}), []);
	const answerConfirm = (keepGoing) => {
		setConfirmText(null);
		const resolve = confirmResolve.current;
		confirmResolve.current = null;
		resolve?.(keepGoing);
	};
	(0, import_react.useEffect)(() => {
		if (started.current) return;
		started.current = true;
		(async () => {
			const history = [];
			const reflect = async (step, userText, setsDone) => {
				if (!userText.trim()) return;
				history.push({
					role: "user",
					text: userText
				});
				const reply = await turn.think(() => callGuide({ data: {
					step,
					setsDone,
					history,
					topic
				} })).catch(() => ({
					action: "continue",
					message: "",
					escalation: false
				}));
				if (reply.action === "crisis") {
					setScreen("crisis");
					throw new StopSignal();
				}
				if (reply.action === "confirm") {
					if (!await askConfirm(reply.message)) {
						setScreen("refuse");
						throw new StopSignal();
					}
					return;
				}
				history.push({
					role: "assistant",
					text: reply.message
				});
				if (reply.message) await turn.say(reply.message);
			};
			const askYesNo = async (question) => {
				setYesNo(true);
				try {
					return await turn.ask(question, {
						parse: (t) => parseYesNo(t),
						retry: "Не расслышал. Да или нет?",
						fallbackLine: "Можно просто нажать кнопку."
					});
				} finally {
					setYesNo(false);
				}
			};
			const askSud = async () => {
				setSlider(true);
				try {
					const value = await turn.ask(Q_SUD, {
						parse: (t) => parseSud(t),
						retry: "Назови одно число от нуля до десяти — или отметь его на шкале.",
						fallbackLine: "Можно просто отметить число на шкале.",
						skipValue: null
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
				history.push({
					role: "assistant",
					text: INTRO
				});
				setProgress("Вопрос 1 из 3");
				await reflect("S1_TOPIC", await turn.ask(INTRO, {
					skipValue: "",
					clarify: true
				}), 0);
				history.push({
					role: "assistant",
					text: Q_FOCUS
				});
				setProgress("Вопрос 2 из 3");
				await reflect("S2_FOCUS", await turn.ask(Q_FOCUS, {
					skipValue: "",
					clarify: true
				}), 0);
				history.push({
					role: "assistant",
					text: Q_BODY
				});
				setProgress("Вопрос 3 из 3");
				await reflect("S3_BODY", await turn.ask(Q_BODY, { skipValue: "" }), 0);
				setProgress(void 0);
				const base = await askSud();
				for (const check of SCREENING) {
					if (!await askYesNo(check.question)) continue;
					if (check.hard) {
						await turn.say(REFUSE_LINE);
						setScreen("refuse");
						return;
					}
					if (!await askConfirm(check.question)) {
						setScreen("refuse");
						return;
					}
				}
				if (base !== null && base >= SUD_GATE && !await askConfirm("Заряд очень высокий. Продолжаем?")) {
					setScreen("refuse");
					return;
				}
				if (channel === "audio") await turn.say(HEADPHONES);
				if (!await askYesNo(WHY)) {
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
	}, []);
	if (screen === "bls") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stimulation, {
		channel,
		speed,
		seconds: MODE_SECONDS[mode],
		onFinish: () => setScreen("remeasure"),
		onStop: () => setScreen("stopped")
	});
	if (confirmText !== null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col justify-center gap-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg leading-relaxed",
			children: confirmText
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => answerConfirm(true),
				className: "btn-base btn-primary w-full py-5 text-base",
				children: "Продолжить, это обычная ситуация"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => answerConfirm(false),
				className: "btn-base btn-quiet w-full py-5 text-base",
				children: "Остановить"
			})]
		})]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceStage, {
		phase: turn.phase,
		caption: turn.caption,
		interim: turn.interim,
		finalText: turn.finalText,
		level: turn.level,
		hint: turn.hint,
		feed: turn.feed,
		progress,
		textMode: turn.textMode,
		manualOpen: turn.manualOpen && !yesNo,
		onManual: turn.answerManually,
		onRepeat: turn.repeatQuestion,
		onSkip: turn.skipQuestion,
		onOpenManual: yesNo ? void 0 : turn.openManual,
		onFinishTurn: turn.finishTurn,
		onSkipSpeech: turn.skipSpeech,
		onTextMode: turn.setTextMode,
		onDismissHint: () => turn.setHint(null),
		onStop: turn.halt,
		controls: slider ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SudSlider, {
			label: "Отметь число",
			onSubmit: sudFromSlider
		}) : yesNo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => turn.answerManually("да"),
				className: "btn-base btn-primary py-5 text-lg",
				children: "Да"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => turn.answerManually("нет"),
				className: "btn-base btn-quiet py-5 text-lg",
				children: "Нет"
			})]
		}) : null
	});
}
/** Повторный замер сразу после упражнения. */
function Remeasure({ onDone }) {
	(0, import_react.useEffect)(() => cancelSpeech(), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col justify-center gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SudSlider, {
			label: Q_SUD,
			onSubmit: (v) => onDone(v)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onDone(null),
			className: "text-sm text-muted-foreground underline-offset-4 hover:underline",
			children: "Пропустить оценку"
		})]
	}) });
}
var BREATH = [
	{
		label: "Вдох через нос — 4",
		ms: 4e3,
		scale: 1
	},
	{
		label: "Задержи дыхание — 7",
		ms: 7e3,
		scale: 1
	},
	{
		label: "Медленный выдох ртом — 8",
		ms: 8e3,
		scale: .45
	}
];
var BREATH_CYCLES = 3;
/** Заземление: дыхание 4-7-8 с кругом. Три цикла, «Дальше» доступно всегда. */
function Breathe({ onDone }) {
	const [step, setStep] = (0, import_react.useState)(0);
	const total = BREATH.length * BREATH_CYCLES;
	(0, import_react.useEffect)(() => {
		if (step >= total) {
			onDone();
			return;
		}
		const t = window.setTimeout(() => setStep((s) => s + 1), BREATH[step % BREATH.length].ms);
		return () => window.clearTimeout(t);
	}, [step]);
	const current = BREATH[Math.min(step, total - 1) % BREATH.length];
	const cycle = Math.min(BREATH_CYCLES, Math.floor(step / BREATH.length) + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center gap-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-center text-sm text-muted-foreground",
				children: [
					"Немного подышим. Цикл ",
					cycle,
					" из ",
					BREATH_CYCLES
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-56 w-56 items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": "true",
					className: "h-56 w-56 rounded-full border-2 border-dot bg-dot/20",
					style: {
						transform: `scale(${current.scale})`,
						transition: `transform ${current.ms}ms ease-in-out`
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"aria-live": "polite",
				className: "text-center text-lg",
				children: current.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onDone,
				className: "btn-base btn-quiet w-52",
				children: "Дальше"
			})
		]
	}) });
}
/** Финал. Сюда приходит любой завершённый сеанс. */
function Final({ before, after, onHome }) {
	(0, import_react.useEffect)(() => cancelSpeech(), []);
	const show = (v) => v === null ? "без оценки" : String(v);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col justify-center gap-8 py-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-2xl tabular-nums",
				children: [
					"До: ",
					show(before),
					", после: ",
					show(after)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted-foreground",
				children: "Если легче не стало — это нормально. Можно повторить позже или поговорить с кем-то из близких."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onHome,
				className: "btn-base btn-primary w-full",
				children: "На главную"
			})
		]
	}) });
}
/** Экран после «Стоп». */
function Stopped({ onHome }) {
	(0, import_react.useEffect)(() => cancelSpeech(), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center gap-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-center text-lg",
			children: "Остановились. Всё в порядке."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onHome,
			className: "btn-base btn-primary w-52",
			children: "На главную"
		})]
	}) });
}
/** Мягкий отказ и кризисный выход. Кнопки продолжить нет ни в каком виде. */
function Closing({ title, onHome }) {
	const turn = useVoiceTurn(() => {});
	const started = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (started.current) return;
		started.current = true;
		turn.say(title).catch(() => {});
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center gap-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			"aria-live": "polite",
			className: "text-center text-sm leading-relaxed",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onHome,
			className: "btn-base btn-quiet w-52",
			children: "На главную"
		})]
	}) });
}
//#endregion
export { IndexPage as component };
