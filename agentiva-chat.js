// Agentiva – Vollbild-Chat (v1.0.1) – Framer-kompatibel
window.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://api-agentiva-core-fegxcwcne7fed4bd.swedencentral-01.azurewebsites.net";

  /* ===== UI erzeugen ===== */
  const root = document.createElement("div");
  root.className = "ag-page";
  root.innerHTML = `
    <div class="ag-topbar">
      <div class="ag-brand"><div class="ag-logo"></div><span>Agentiva Chat</span></div>
      <button id="agDemo" class="ag-btn" type="button">Demo starten</button>
    </div>
    <div class="ag-main">
      <div class="ag-prompts" id="agPrompts" aria-label="Beispiel-Fragen">
        <button class="ag-chip" data-q="Fasse unsere Support-Policy in 3 Punkten zusammen.">Support-Policy</button>
        <button class="ag-chip" data-q="Welche Schritte braucht es, um Agentiva in unser Intranet einzubinden?">Integration</button>
        <button class="ag-chip" data-q="Erstelle eine kurze Willkommensnachricht für neue Mitarbeiter:innen.">Onboarding</button>
      </div>
      <div id="agLog" class="ag-log" aria-live="polite" aria-label="Chatverlauf"></div>
      <div class="ag-input">
        <label for="agText" style="position:absolute;left:-9999px;">Nachricht an Agentiva</label>
        <textarea id="agText" placeholder="Frag mich etwas zu euren Dokumenten …" rows="2"></textarea>
        <button id="agSend" class="ag-btn" type="button">Senden</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  /* ===== Avatar / Branding ===== */
  const style = document.createElement("style");
  style.textContent = `.ag-msg.bot::before{background-image:url("https://framer.com/m/Agentiva-teal-Chat-Logo-0G9b.js@Q2sj4SGqi6ySJQXTpqc3");}`;
  document.head.appendChild(style);

  /* ===== DOM-Referenzen ===== */
  const log = document.getElementById("agLog");
  const text = document.getElementById("agText");
  const send = document.getElementById("agSend");
  const demo = document.getElementById("agDemo");
  const chips = document.getElementById("agPrompts");

  /* ===== Hilfsfunktionen ===== */
  function append(role, content) {
    const el = document.createElement("div");
    el.className = "ag-msg " + (role === "user" ? "you" : "bot");
    el.textContent = content;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  let typingEl = null;
  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement("div");
    typingEl.className = "ag-typing";
    typingEl.innerHTML =
      `<span>Agentiva tippt</span><span class="ag-typing-dots"><span></span><span></span><span></span></span>`;
    log.appendChild(typingEl);
    log.scrollTop = log.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  async function callChat(message) {
    try {
      const r = await fetch(API_BASE + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      return data.answer || "Kein Inhalt.";
    } catch (e) {
      console.error(e);
      return "Ups – das hat nicht geklappt. Bitte später erneut versuchen.";
    }
  }

  async function sendMessage(customMessage) {
    const msg = (customMessage ?? text.value ?? "").trim();
    if (!msg) return;
    append("user", msg);
    text.value = "";
    send.disabled = true;
    showTyping();
    const answer = await callChat(msg);
    hideTyping();
    append("assistant", answer);
    send.disabled = false;
    text.focus();
  }

  /* ===== Event-Listener ===== */
  send.addEventListener("click", () => sendMessage());
  text.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chips?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-q]");
    if (!btn) return;
    sendMessage(btn.getAttribute("data-q"));
  });

  /* ===== Demo-Funnel (optional) ===== */
  demo?.addEventListener("click", () => {
    const steps = [
      { k: "name", q: "Wie lautet dein Name?" },
      { k: "email", q: "Danke! Und deine E-Mail-Adresse?" },
      { k: "company", q: "Unternehmen / Organisation?" },
      { k: "usecase", q: "Kurz: Worum geht’s in der Demo? (Use Case / Ziel)" }
    ];
    let i = 0, data = {};
    function ask() {
      append("assistant", steps[i].q + " (Tipp: „zurück“ zum Korrigieren, „abbrechen“ für normalen Chat)");
    }
    append("assistant", "Super — ich sammle kurz die Angaben für eine Demo.");
    ask();

    const handler = async (e) => {
      if (e.type === "keydown" && !(e.key === "Enter" && !e.shiftKey)) return;
      e.preventDefault();
      const v = (text.value || "").trim();
      if (!v) return;
      append("user", v);
      text.value = "";
      const low = v.toLowerCase();
      if (["abbrechen", "stop", "chat"].includes(low)) {
        append("assistant", "Alles klar, wir sind wieder im normalen Chat. Wie kann ich helfen?");
        cleanup();
        return;
      }
      if (["zurück", "korrigieren", "korrektur"].includes(low)) {
        i = Math.max(0, i - 1);
        append("assistant", "Kein Problem — dann nochmal:");
        ask();
        return;
      }
      data[steps[i].k] = v;
      i++;
      if (i >= steps.length) {
        append("assistant", "Perfekt, danke! Ich melde mich per E-Mail für einen Demo-Termin.");
        cleanup();
        return;
      }
      ask();
    };
    function cleanup() {
      text.removeEventListener("keydown", handler);
      send.removeEventListener("click", handler);
    }
    text.addEventListener("keydown", handler);
    send.addEventListener("click", handler);
  });

  /* ===== Begrüßung ===== */
  append("assistant", "👋 Willkommen bei Agentiva. Frag mich etwas – ich antworte kontextbezogen.");
});
