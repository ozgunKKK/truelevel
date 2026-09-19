// Theme selection. Loaded synchronously in <head> on every page so the theme
// is applied before first paint (no flash of the wrong colors). The choice is
// a per-device preference kept in localStorage.
(function () {

const THEME_KEY = "truelevel.theme";
const DEFAULT_THEME = "light";

// themeColor tints the phone's status bar / PWA title bar.
const THEMES = [
  { id: "light", name: "Classic", themeColor: "#0d9488" },
  { id: "dark", name: "Dark", themeColor: "#0f1416" },
  { id: "blueprint", name: "Blueprint", themeColor: "#0b2545" },
  { id: "pastel", name: "Pastel", themeColor: "#f3edff" },
  { id: "vangogh", name: "Van Gogh", themeColor: "#4c7093" },
  { id: "matisse", name: "Matisse", themeColor: "#287c74" },
];

function getTheme() {
  let id = null;
  try {
    id = localStorage.getItem(THEME_KEY);
  } catch {}
  return THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME;
}

function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  document.documentElement.dataset.theme = theme.id;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = theme.themeColor;
}

function setTheme(id) {
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {}
  applyTheme(id);
}

// Renders one round swatch per theme into `container`, plus a caption with the
// current theme's name. Each swatch carries its own data-theme so it previews
// itself with that theme's colors.
function mountPicker(container) {
  const row = document.createElement("div");
  row.className = "theme-picker";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Theme");
  const caption = document.createElement("p");
  caption.className = "theme-caption";
  container.replaceChildren(row, caption);

  function render() {
    const current = getTheme();
    row.replaceChildren();
    THEMES.forEach((theme) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "theme-swatch" + (theme.id === current ? " active" : "");
      swatch.dataset.theme = theme.id;
      swatch.title = theme.name;
      swatch.setAttribute("aria-label", theme.name);
      swatch.setAttribute("aria-pressed", String(theme.id === current));
      swatch.addEventListener("click", () => {
        setTheme(theme.id);
        render();
      });
      row.append(swatch);
    });
    const name = THEMES.find((t) => t.id === current).name;
    caption.replaceChildren("Theme: ");
    const strong = document.createElement("strong");
    strong.textContent = name;
    caption.append(strong);
  }
  render();
}

applyTheme(getTheme());

window.TrueLevelTheme = { THEMES, getTheme, setTheme, mountPicker };

})();
