const config = document.querySelector('script[src="/request.mjs"]');
const ENDPOINT = config?.dataset.endpoint;
const TOKEN = config?.dataset.token;
const DONE = "Request sent. You will hear back from a person — nothing automated goes out.";

const forms = document.querySelectorAll("form.js-request");
if (forms.length) {
  for (const form of forms) {
    const status = form.parentNode.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    const get = (n) => form.querySelector(`[name="${n}"]`);
    const val = (n) => {
      const el = get(n);
      return el ? (el.value || "").trim() : "";
    };
    const say = (text, bad) => {
      if (!status) return;
      status.textContent = text;
      status.className = bad ? "form-status bad" : "form-status";
    };

    const pick = get("engagement");
    if (pick) {
      const want = (location.hash.split("for=")[1] || "").replace(/[^a-z-]/gi, "");
      document.querySelectorAll("[data-engagement]").forEach((link) => {
        link.addEventListener("click", () => {
          pick.value = link.getAttribute("data-engagement");
        });
      });
      if (want) {
        for (const o of pick.options) {
          if (o.value.toLowerCase().replace(/[^a-z]+/g, "-") === want) pick.value = o.value;
        }
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = val("email");
      const what = val("what");
      const who = val("name");
      if (email.indexOf("@") < 1 || email.indexOf(".") < 0) {
        say("Enter an email address we can reply to.", true);
        get("email")?.focus();
        return;
      }
      if (what.length < 12) {
        say("Tell us in a line or two what you are building.", true);
        get("what")?.focus();
        return;
      }
      if (val("website")) {
        form.hidden = true;
        say(DONE);
        return;
      }

      const lines = [];
      if (val("engagement")) lines.push(`Engagement: ${val("engagement")}`);
      if (val("timeline")) lines.push(`Timeline: ${val("timeline")}`);
      if (lines.length) lines.push("");
      lines.push(what);
      const contact = `${who || "(no name)"} <${email}>${val("org") ? `, ${val("org")}` : ""}`;

      button.disabled = true;
      say("Sending…");
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: TOKEN,
          suggestion: lines.join("\n"),
          contact,
          page: location.pathname,
          url: location.href,
          pageTitle: document.title,
        }),
      })
        .then((res) => {
          if (res.status === 429) throw new Error("rate");
          if (!res.ok) throw new Error("http");
          return res.json();
        })
        .then(() => {
          form.hidden = true;
          say(DONE);
        })
        .catch((err) => {
          button.disabled = false;
          say(
            err && err.message === "rate"
              ? "That is a lot of requests at once — give it a minute."
              : "That did not send. Try again in a moment, or open an issue on GitHub (github.com/bitbaum) — the form is the only door on this site.",
            true,
          );
        });
    });
  }
}
