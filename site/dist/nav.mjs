// The phone menu. One button, one full-screen sheet of the site's map, the
// Solon pattern: on a phone the header is the mark and this button, and
// nothing else competes with the page.
//
// Without JavaScript the button is inert and the same map is in the footer —
// every destination stays one scroll away.
const button = document.querySelector("[data-menu-toggle]");
const menu = document.getElementById("site-menu");
const header = document.querySelector("[data-header]");

function setOpen(open) {
  if (!button || !menu) return;
  menu.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.documentElement.classList.toggle("menu-open", open);
  if (open) menu.querySelector("a, button")?.focus({ preventScroll: true });
}

button?.addEventListener("click", () => setOpen(menu?.hidden ?? false));

// A link inside the menu leaves the menu, including a same-page anchor.
menu?.addEventListener("click", (e) => {
  if (e.target instanceof Element && e.target.closest("a")) setOpen(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu && !menu.hidden) {
    setOpen(false);
    button?.focus();
  }
});

// Rotating to a desk-sized screen while the sheet is open must not strand the
// page behind it.
matchMedia("(min-width: 900px)").addEventListener("change", (m) => {
  if (m.matches) setOpen(false);
});

// The header is quiet at the very top and solid once the page moves.
const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
