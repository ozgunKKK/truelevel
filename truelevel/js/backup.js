// Backup export/import. A backup is a JSON document with the saved
// calibrations, preferences and theme. Import validates everything (a bad
// matrix would break measuring) and merges: calibrations already on the device
// are kept, backup ones are added.
(function () {

const Storage = window.TrueLevelStorage;
const Prefs = window.TrueLevelPrefs;
const Theme = window.TrueLevelTheme;
const { inverse3 } = window.TrueLevelMath;

const FORMAT = "truelevel-backup";
const VERSION = 1;
const MAX_BYTES = 1024 * 1024;
const MAX_CALIBRATIONS = 500;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function build() {
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    theme: Theme.getTheme(),
    prefs: Prefs.getPrefs(),
    activeCalibrationId: Storage.getActiveCalibrationId(),
    calibrations: Storage.listCalibrations(),
  };
}

function fileName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `truelevel-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

function isMatrix(K) {
  return (
    Array.isArray(K) &&
    K.length === 3 &&
    K.every(
      (col) =>
        Array.isArray(col) && col.length === 3 && col.every((v) => Number.isFinite(v))
    ) &&
    inverse3(K) !== null
  );
}

// Returns { data } with sanitized content, or { error } with a user message.
function parse(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { error: "Nothing to import." };
  }
  if (text.length > MAX_BYTES) {
    return { error: "That file is too large to be a TrueLevel backup." };
  }
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: "That is not valid backup data." };
  }
  if (!raw || raw.format !== FORMAT) {
    return { error: "That is not a TrueLevel backup." };
  }
  if (raw.version !== VERSION) {
    return { error: "This backup was made by a newer version of TrueLevel." };
  }
  if (!Array.isArray(raw.calibrations) || raw.calibrations.length > MAX_CALIBRATIONS) {
    return { error: "The backup is damaged (calibrations)." };
  }
  const calibrations = [];
  for (const c of raw.calibrations) {
    if (
      !c ||
      typeof c.id !== "string" ||
      !ID_PATTERN.test(c.id) ||
      !isMatrix(c.K) ||
      !(c.createdAt === null || Number.isFinite(c.createdAt))
    ) {
      return { error: "The backup is damaged (a calibration is invalid)." };
    }
    calibrations.push({
      id: c.id,
      name: String(c.name == null ? "" : c.name).trim().slice(0, 60) || "Imported calibration",
      K: c.K.map((col) => col.slice()),
      createdAt: c.createdAt,
    });
  }
  const themeIds = Theme.THEMES.map((t) => t.id);
  return {
    data: {
      theme: themeIds.includes(raw.theme) ? raw.theme : null,
      prefs: Prefs.sanitize(raw.prefs),
      activeCalibrationId:
        typeof raw.activeCalibrationId === "string" ? raw.activeCalibrationId : null,
      calibrations,
    },
  };
}

// Applies validated data. Returns { added, skipped }.
function apply(data) {
  const result = Storage.mergeCalibrations(data.calibrations);
  Prefs.setPrefs(data.prefs);
  if (data.theme) Theme.setTheme(data.theme);
  // A fresh device gets the backup's active calibration so it can measure.
  if (!Storage.getK() && data.activeCalibrationId) {
    Storage.useCalibration(data.activeCalibrationId);
  }
  return result;
}

window.TrueLevelBackup = { build, fileName, parse, apply };

})();
