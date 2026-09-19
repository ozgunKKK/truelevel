// Persistence helpers. K (calibration matrix) and the saved-calibrations
// library live in localStorage.
// Everything else (in-progress calibration steps, last measurement/result)
// is session-only, per spec.
(function () {

const K_KEY = "truelevel.K";
const CALIB_PROGRESS_KEY = "truelevel.calibProgress";
const RESULT_KEY = "truelevel.result";
const LIBRARY_KEY = "truelevel.savedCalibrations";
const ACTIVE_ID_KEY = "truelevel.activeCalibrationId";

function getK() {
  const raw = localStorage.getItem(K_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setK(K) {
  localStorage.setItem(K_KEY, JSON.stringify(K));
}

function clearK() {
  localStorage.removeItem(K_KEY);
}

// --- Saved calibrations library -------------------------------------------
// Each entry: { id, name, K, createdAt }. `truelevel.K` stays the single
// "active" matrix that measure.js reads; the library just remembers past ones.

function readLibrary() {
  const raw = localStorage.getItem(LIBRARY_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeLibrary(list) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function defaultCalibrationName(date) {
  const d = date || new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    "Calibration " +
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}`
  );
}

// Returns the library, first adopting a pre-existing active K (saved before
// this feature existed) so it is not lost when the user recalibrates.
function listCalibrations() {
  const list = readLibrary();
  const K = getK();
  if (list.length === 0 && K) {
    const legacy = {
      id: newId(),
      name: "Previous calibration",
      K,
      createdAt: null,
    };
    list.push(legacy);
    writeLibrary(list);
    localStorage.setItem(ACTIVE_ID_KEY, legacy.id);
  }
  return list;
}

function getActiveCalibrationId() {
  return localStorage.getItem(ACTIVE_ID_KEY);
}

// Saves K under `name` and makes it the active calibration.
function saveCalibration(name, K) {
  const list = listCalibrations();
  const entry = {
    id: newId(),
    name: (name || "").trim() || defaultCalibrationName(),
    K,
    createdAt: Date.now(),
  };
  list.push(entry);
  writeLibrary(list);
  setK(K);
  localStorage.setItem(ACTIVE_ID_KEY, entry.id);
  return entry;
}

function useCalibration(id) {
  const entry = readLibrary().find((c) => c.id === id);
  if (!entry) return false;
  setK(entry.K);
  localStorage.setItem(ACTIVE_ID_KEY, id);
  return true;
}

function renameCalibration(id, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return false;
  const list = readLibrary();
  const entry = list.find((c) => c.id === id);
  if (!entry) return false;
  entry.name = trimmed;
  writeLibrary(list);
  return true;
}

// Deleting a library entry never touches the active K, so measurements keep
// working; it only forgets which saved entry the active matrix came from.
function deleteCalibration(id) {
  writeLibrary(readLibrary().filter((c) => c.id !== id));
  if (getActiveCalibrationId() === id) {
    localStorage.removeItem(ACTIVE_ID_KEY);
  }
}

function getCalibProgress() {
  const raw = sessionStorage.getItem(CALIB_PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCalibProgress(progress) {
  sessionStorage.setItem(CALIB_PROGRESS_KEY, JSON.stringify(progress));
}

function clearCalibProgress() {
  sessionStorage.removeItem(CALIB_PROGRESS_KEY);
}

function getResult() {
  const raw = sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setResult(result) {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

window.TrueLevelStorage = {
  getK,
  setK,
  clearK,
  defaultCalibrationName,
  listCalibrations,
  getActiveCalibrationId,
  saveCalibration,
  useCalibration,
  renameCalibration,
  deleteCalibration,
  getCalibProgress,
  setCalibProgress,
  clearCalibProgress,
  getResult,
  setResult,
};

})();
