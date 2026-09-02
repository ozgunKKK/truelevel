// Persistence helpers. K (calibration matrix) lives in localStorage.
// Everything else (in-progress calibration steps, last measurement/result)
// is session-only, per spec.
(function () {

const K_KEY = "truelevel.K";
const CALIB_PROGRESS_KEY = "truelevel.calibProgress";
const RESULT_KEY = "truelevel.result";

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
  getCalibProgress,
  setCalibProgress,
  clearCalibProgress,
  getResult,
  setResult,
};

})();
