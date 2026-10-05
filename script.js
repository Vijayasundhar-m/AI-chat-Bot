// Change this if Google retires the model name: https://ai.google.dev/gemini-api/docs/models
const MODEL = "gemini-3.8-flash";
const $ = id => document.getElementById(id);
const log = $("log"), input = $("input"), send = $("send"), mic = $("mic");

// ---- storage helpers (wrapped: storage can be blocked) ----
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

let messages = [];
let autoSave = store.get("autosave", "1") === "1";
$("auto").checked = autoSave;
if (autoSave) { try { messages = JSON.parse(store.get("history", "[]")); } catch { messages = []; } }

function persist() { if (autoSave) store.set("history", JSON.stringify(messages)); }

// ---- rendering (chat list) ----
function render() {
  log.innerHTML = "";
  if (!messages.length) {
    log.innerHTML = '<div class="empty">Ask anything. Type below or tap 🎤 and speak.</div>';
    return;
  }
  messages.forEach(m => addBubble(m));
  log.scrollTop = log.scrollHeight;
}
function addBubble(m) {
  const d = document.createElement("div");
  d.className = "msg " + (m.role === "user" ? "user" : "bot") + (m.error ? " err" : "");
  d.textContent = m.text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}

// ---- Gemini API ----
async function askGemini() {
  const key = store.get("gemini_key", "");
  if (!key) { $("keyDialog").showModal(); throw new Error("Add your Gemini API key first (API key button)."); }
  const contents = messages.filter(m => !m.error).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }]
  }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || ("Request failed (" + res.status + ")"));
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  if (!text) throw new Error("The model returned no text. Try rephrasing.");
  return text.trim();
}

async function submit() {
  const text = input.value.trim();
  if (!text || send.disabled) return;
  input.value = ""; input.style.height = "auto";
  if (!messages.length) log.innerHTML = "";
  const u = { role: "user", text };
  messages.push(u); addBubble(u);
  send.disabled = true;
  const typing = addBubble({ role: "bot", text: "Thinking…" });
  try {
    const reply = await askGemini();
    messages.push({ role: "bot", text: reply });
  } catch (e) {
    messages.push({ role: "bot", text: e.message, error: true });
  }
  typing.remove();
  addBubble(messages[messages.length - 1]);
  persist();
  send.disabled = false; input.focus();
}

$("form").addEventListener("submit", e => { e.preventDefault(); submit(); });
input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } });
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = input.scrollHeight + "px"; });

// ---- voice input (Web Speech API, works in Chrome / Edge) ----
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
if (!SR) {
  mic.disabled = true; mic.title = "Voice input needs Chrome or Edge";
} else {
  rec = new SR(); rec.lang = navigator.language || "en-US"; rec.interimResults = true;
  let base = "";
  rec.onstart = () => { mic.classList.add("on"); base = input.value ? input.value + " " : ""; };
  rec.onend = () => mic.classList.remove("on");
  rec.onerror = e => { mic.classList.remove("on"); if (e.error === "not-allowed") alert("Allow microphone access to use voice input."); };
  rec.onresult = e => {
    let t = ""; for (const r of e.results) t += r[0].transcript;
    input.value = base + t;
  };
  mic.addEventListener("click", () => { mic.classList.contains("on") ? rec.stop() : rec.start(); });
}

// ---- history options ----
$("auto").addEventListener("change", e => {
  autoSave = e.target.checked; store.set("autosave", autoSave ? "1" : "0");
  autoSave ? persist() : store.del("history");
});
$("clear").addEventListener("click", () => {
  if (messages.length && !confirm("Clear this conversation and its saved history?")) return;
  messages = []; store.del("history"); render();
});
$("download").addEventListener("click", () => {
  if (!messages.length) return;
  const txt = messages.map(m => (m.role === "user" ? "You: " : "AI: ") + m.text).join("\n\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
  a.download = "chat-history.txt"; a.click(); URL.revokeObjectURL(a.href);
});

// ---- API key dialog ----
$("keyBtn").addEventListener("click", () => { $("keyInput").value = store.get("gemini_key", ""); $("keyDialog").showModal(); });
$("keyCancel").addEventListener("click", () => $("keyDialog").close());
$("keySave").addEventListener("click", () => { store.set("gemini_key", $("keyInput").value.trim()); $("keyDialog").close(); });

render();
