// Light, dark, or "local time": the third means the real sky where the reader
// is — day while the sun is up there, night after it sets, with dawn and dusk
// marked for the sky to warm. The sun's height comes from the date, the time
// and a place: the one sky.mjs learned from the weather lookup (stored), or
// else longitude from the time-zone offset and a middle latitude. The same
// sum runs in <head> first (build.mjs), so nothing flashes.
const root = document.documentElement;

export function sunElevation(date = new Date()) {
  let lat = 47, lng = -date.getTimezoneOffset() / 4;
  try { const g = JSON.parse(localStorage.getItem("bb-geo") || "null"); if (g) { lat = g.lat; lng = g.lng; } } catch { /* private mode */ }
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date.getTime() - start) / 86400000;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10));
  const solar = date.getUTCHours() + date.getUTCMinutes() / 60 + lng / 15;
  const hour = 15 * (solar - 12);
  return Math.asin(Math.sin(lat * rad) * Math.sin(decl * rad) + Math.cos(lat * rad) * Math.cos(decl * rad) * Math.cos(hour * rad)) / rad;
}

function apply(choice) {
  if (choice === "system") choice = "auto"; // the old name for it
  const sun = sunElevation();
  const dark = choice === "dark" || (choice === "auto" && sun < -3);
  root.classList.toggle("dark", dark);
  root.dataset.theme = choice;
  root.dataset.light = sun < -3 ? "night" : sun < 6 ? (new Date().getHours() < 12 ? "dawn" : "dusk") : "day";
  document.querySelectorAll("[data-set-theme]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.setTheme === choice));
  });
}

let saved = "auto";
try { saved = localStorage.getItem("theme") || "auto"; } catch { /* private mode */ }
apply(saved);

document.querySelectorAll("[data-set-theme]").forEach((b) => {
  b.addEventListener("click", () => {
    const choice = b.dataset.setTheme;
    try { localStorage.setItem("theme", choice); } catch { /* ignore */ }
    apply(choice);
  });
});

// The sun keeps moving while the page is open.
setInterval(() => { if ((root.dataset.theme || "auto") === "auto") apply("auto"); }, 5 * 60 * 1000);
addEventListener("bb-geo", () => { if ((root.dataset.theme || "auto") === "auto") apply("auto"); });
