// The homepage Ask box hands the question to Loki's widget in Chat mode — a
// chat the Cat and Loki both live in, answering from the public fleet map. The widget boots
// asynchronously and can decline to render at all (a paused token, Loki
// unreachable), so `window.Loki` decides: ready with `ask` → hand it over;
// otherwise say so on the spot and offer the catalogue. A sentence typed as a
// catalogue search would match nothing, so the question is never quietly
// turned into one. Without JavaScript the form simply opens the catalogue.
const form = document.querySelector("#ask-form");
const input = document.querySelector("#ask-q");
const status = document.querySelector("#ask-status");

function ask(question) {
  const q = question.trim().slice(0, 1000);
  if (!q) return input?.focus();
  const loki = window.Loki;
  if (loki?.ready && typeof loki.ask === "function") {
    loki.ask(q);
    if (input) input.value = "";
    if (status) status.hidden = true;
    return;
  }
  if (status) status.hidden = false;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  ask(input?.value ?? "");
});
for (const starter of document.querySelectorAll(".ask-starter")) {
  starter.addEventListener("click", () => ask(starter.dataset.q ?? starter.textContent ?? ""));
}
