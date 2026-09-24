const root = document.documentElement;
const media = matchMedia("(prefers-color-scheme: dark)");

function apply(choice) {
  const dark = choice === "dark" || (choice === "system" && media.matches);
  root.classList.toggle("dark", dark);
  root.dataset.theme = choice;
  document.querySelectorAll("[data-set-theme]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.setTheme === choice));
  });
}

let saved = "system";
try {
  saved = localStorage.getItem("theme") || "system";
} catch {
  /* private mode */
}
apply(saved);

document.querySelectorAll("[data-set-theme]").forEach((b) => {
  b.addEventListener("click", () => {
    const choice = b.dataset.setTheme;
    try {
      localStorage.setItem("theme", choice);
    } catch {
      /* ignore */
    }
    apply(choice);
  });
});

media.addEventListener("change", () => {
  if ((root.dataset.theme || "system") === "system") apply("system");
});
