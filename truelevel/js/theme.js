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
  { id: "contrast", name: "High contrast", themeColor: "#005f56" },
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

// Renders the picker tiles into `container`. Each tile carries its own
// data-theme so it previews itself with that theme's colors.
function mountPicker(container) {
  function render() {
    const current = getTheme();
    container.replaceChildren();
    THEMES.forEach((theme) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "theme-tile" + (theme.id === current ? " active" : "");
      tile.dataset.theme = theme.id;
      tile.setAttribute("aria-pressed", String(theme.id === current));

      const name = document.createElement("span");
      name.className = "theme-tile-name";
      name.textContent = theme.name;
      if (theme.id === current) {
        const check = document.createElement("span");
        check.className = "theme-tile-check";
        check.textContent = "✓";
        name.append(check);
      }

      const preview = document.createElement("span");
      preview.className = "theme-tile-preview";
      preview.innerHTML =
        '<span class="sw-accent"></span><span class="sw-surface"></span><span class="sw-muted"></span>';

      tile.append(name, preview);
      tile.addEventListener("click", () => {
        setTheme(theme.id);
        render();
      });
      container.append(tile);
    });
  }
  container.classList.add("theme-picker");
  render();
}

applyTheme(getTheme());

window.TrueLevelTheme = { THEMES, getTheme, setTheme, mountPicker };

})();
