// User preferences (text size, result display). Loaded synchronously in <head>
// on every page so text size is applied before first paint. Stored per device
// in localStorage; anything unreadable or out of range falls back to defaults.
(function () {

const PREFS_KEY = "truelevel.prefs";

const TEXT_SIZES = ["small", "normal", "large"];
const ANGLE_FORMATS = ["turnsDeg", "degrees", "turns"];
const HEIGHT_UNITS = ["", "mm", "µm", "in"];
const MIN_TARGET_DEGREES = 0.5;
const MAX_TARGET_DEGREES = 90;

const DEFAULTS = {
  textSize: "normal",
  angleFormat: "turnsDeg",
  heightUnit: "",
  // A knob turning less than this counts as "on target" (0.03 turn).
  onTargetDegrees: 10.8,
};

function sanitize(raw) {
  const prefs = { ...DEFAULTS };
  if (!raw || typeof raw !== "object") return prefs;
  if (TEXT_SIZES.includes(raw.textSize)) prefs.textSize = raw.textSize;
  if (ANGLE_FORMATS.includes(raw.angleFormat)) prefs.angleFormat = raw.angleFormat;
  if (HEIGHT_UNITS.includes(raw.heightUnit)) prefs.heightUnit = raw.heightUnit;
  if (
    typeof raw.onTargetDegrees === "number" &&
    Number.isFinite(raw.onTargetDegrees) &&
    raw.onTargetDegrees >= MIN_TARGET_DEGREES &&
    raw.onTargetDegrees <= MAX_TARGET_DEGREES
  ) {
    prefs.onTargetDegrees = raw.onTargetDegrees;
  }
  return prefs;
}

function getPrefs() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(PREFS_KEY)));
  } catch {
    return { ...DEFAULTS };
  }
}

function applyPrefs(prefs) {
  document.documentElement.dataset.textSize = prefs.textSize;
}

// Replaces all preferences at once (used by backup import); returns the
// sanitized result.
function setPrefs(next) {
  const prefs = sanitize(next);
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
  applyPrefs(prefs);
  return prefs;
}

function setPref(key, value) {
  return setPrefs({ ...getPrefs(), [key]: value });
}

// Fills every <span data-unit-note> with " (mm)" (or nothing) so headings can
// mention the height unit without each page knowing the preference.
function applyUnitNotes(root) {
  const unit = getPrefs().heightUnit;
  (root || document).querySelectorAll("[data-unit-note]").forEach((el) => {
    el.textContent = unit ? ` (${unit})` : "";
  });
}

applyPrefs(getPrefs());

window.TrueLevelPrefs = {
  DEFAULTS,
  TEXT_SIZES,
  ANGLE_FORMATS,
  HEIGHT_UNITS,
  MIN_TARGET_DEGREES,
  MAX_TARGET_DEGREES,
  sanitize,
  getPrefs,
  setPrefs,
  setPref,
  applyUnitNotes,
};

})();
