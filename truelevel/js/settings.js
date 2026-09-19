(function () {

const Prefs = window.TrueLevelPrefs;
const Theme = window.TrueLevelTheme;
const Storage = window.TrueLevelStorage;
const Backup = window.TrueLevelBackup;
const Calc = window.TrueLevelCalc;

// --- helpers ---------------------------------------------------------------

// Builds a segmented control (radio group) inside `container`.
function segmented(container, options, current, onPick) {
  container.setAttribute("role", "radiogroup");
  function render(value) {
    container.replaceChildren();
    options.forEach((opt) => {
      const el = document.createElement("div");
      el.className = "select-option" + (opt.value === value ? " active" : "");
      el.textContent = opt.label;
      el.setAttribute("role", "radio");
      el.setAttribute("aria-checked", String(opt.value === value));
      el.tabIndex = 0;
      const pick = () => {
        onPick(opt.value);
        render(opt.value);
      };
      el.addEventListener("click", pick);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      });
      container.append(el);
    });
  }
  render(current);
}

function $(id) {
  return document.getElementById(id);
}

// --- Appearance ------------------------------------------------------------

Theme.mountPicker($("theme-picker"));

segmented(
  $("text-size"),
  [
    { value: "small", label: "Small" },
    { value: "normal", label: "Normal" },
    { value: "large", label: "Large" },
  ],
  Prefs.getPrefs().textSize,
  (value) => Prefs.setPref("textSize", value)
);

// --- Results ---------------------------------------------------------------

function renderAngleExample() {
  const f = Calc.formatTurn(1.118, Prefs.getPrefs().angleFormat);
  $("angle-example").textContent = `Example: ${f.display} — ${f.direction}  (${f.sub})`;
}

segmented(
  $("angle-format"),
  [
    { value: "turnsDeg", label: "Turns + °" },
    { value: "degrees", label: "Degrees" },
    { value: "turns", label: "Turns" },
  ],
  Prefs.getPrefs().angleFormat,
  (value) => {
    Prefs.setPref("angleFormat", value);
    renderAngleExample();
  }
);
renderAngleExample();

const thresholdInput = $("threshold");
const thresholdHint = $("threshold-hint");
const { MIN_TARGET_DEGREES, MAX_TARGET_DEGREES, DEFAULTS } = Prefs;

function showThreshold(message, isError) {
  thresholdHint.textContent = message;
  thresholdHint.classList.toggle("error-text", Boolean(isError));
}

function renderThreshold() {
  const deg = Prefs.getPrefs().onTargetDegrees;
  thresholdInput.value = Number(deg.toFixed(2));
  showThreshold(
    `A knob that needs less than this shows a green dot and no direction. ` +
      `Allowed ${MIN_TARGET_DEGREES}–${MAX_TARGET_DEGREES}° ` +
      `(default ${DEFAULTS.onTargetDegrees}° = 0.03 turn).`,
    false
  );
}

thresholdInput.addEventListener("change", () => {
  const value = parseFloat(thresholdInput.value);
  if (!Number.isFinite(value) || value < MIN_TARGET_DEGREES || value > MAX_TARGET_DEGREES) {
    renderThreshold();
    showThreshold(
      `Enter a value from ${MIN_TARGET_DEGREES} to ${MAX_TARGET_DEGREES} degrees.`,
      true
    );
    thresholdInput.value = Number(Prefs.getPrefs().onTargetDegrees.toFixed(2));
    return;
  }
  Prefs.setPref("onTargetDegrees", value);
  renderThreshold();
});

$("btn-threshold-reset").addEventListener("click", () => {
  Prefs.setPref("onTargetDegrees", DEFAULTS.onTargetDegrees);
  renderThreshold();
});
renderThreshold();

segmented(
  $("height-unit"),
  [
    { value: "", label: "None" },
    { value: "mm", label: "mm" },
    { value: "µm", label: "µm" },
    { value: "in", label: "in" },
  ],
  Prefs.getPrefs().heightUnit,
  (value) => Prefs.setPref("heightUnit", value)
);

// --- Data ------------------------------------------------------------------

const status = $("data-status");

function showStatus(message, isError) {
  status.hidden = false;
  status.textContent = message;
  status.classList.toggle("error-text", Boolean(isError));
}

function renderSummary() {
  const list = Storage.listCalibrations();
  const active = list.find((c) => c.id === Storage.getActiveCalibrationId());
  const count = `${list.length} saved calibration${list.length === 1 ? "" : "s"}`;
  $("data-summary").textContent = active
    ? `${count}. Active: ${active.name}.`
    : Storage.getK()
    ? `${count}. An active calibration is in use.`
    : `${count}. No active calibration.`;
}
renderSummary();

$("btn-export").addEventListener("click", () => {
  const json = JSON.stringify(Backup.build(), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = Backup.fileName();
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showStatus(`Backup saved as ${Backup.fileName()}.`, false);
});

$("btn-copy").addEventListener("click", async () => {
  const json = JSON.stringify(Backup.build());
  try {
    await navigator.clipboard.writeText(json);
    showStatus("Backup text copied. Paste it somewhere safe.", false);
  } catch {
    // Clipboard blocked (e.g. insecure context): show the text to copy by hand.
    const details = document.querySelector("details.guide:has(#import-text)");
    $("import-text").value = json;
    if (details) details.open = true;
    showStatus("Could not copy automatically. The backup text is in the box below — select and copy it.", true);
  }
});

function importText(text) {
  const parsed = Backup.parse(text);
  if (parsed.error) {
    showStatus(parsed.error, true);
    return;
  }
  const { data } = parsed;
  const existing = new Set(Storage.listCalibrations().map((c) => c.id));
  const fresh = data.calibrations.filter((c) => !existing.has(c.id)).length;
  const ok = window.confirm(
    `Import this backup?\n\n` +
      `${fresh} new calibration${fresh === 1 ? "" : "s"} will be added ` +
      `(${data.calibrations.length - fresh} already here).\n` +
      `Your saved calibrations are kept; theme and settings are replaced with the backup's.`
  );
  if (!ok) return;
  const result = Backup.apply(data);
  showStatus(
    `Imported ${result.added} calibration${result.added === 1 ? "" : "s"}` +
      (result.skipped ? `, skipped ${result.skipped} already present` : "") +
      `. Reloading…`,
    false
  );
  setTimeout(() => window.location.reload(), 700);
}

$("btn-import").addEventListener("click", () => $("import-file").click());
$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (file.size > 1024 * 1024) {
    showStatus("That file is too large to be a TrueLevel backup.", true);
    return;
  }
  importText(await file.text());
});

$("btn-import-text").addEventListener("click", () => importText($("import-text").value));

$("btn-clear").addEventListener("click", () => {
  const ok = window.confirm(
    "Delete ALL TrueLevel data on this device?\n\n" +
      "This removes every saved calibration and your settings. " +
      "Export a backup first if you may need them."
  );
  if (!ok) return;
  Storage.clearAll();
  window.location.href = "index.html";
});

// --- Help ------------------------------------------------------------------

const ua = navigator.userAgent;
const isIOS =
  /iPad|iPhone|iPod/.test(ua) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const standalone =
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  navigator.standalone === true;

$("install-status").textContent = standalone
  ? "✓ You are using the installed app."
  : "You are using TrueLevel in the browser. Install it for a full-screen app.";
// Open the guide that matches this device.
$(isIOS ? "guide-ios" : isAndroid ? "guide-android" : "guide-desktop").open = !standalone;

async function currentBuild() {
  try {
    const key = (await caches.keys()).find((k) => /^truelevel-cache-v\d+$/.test(k));
    return key ? key.replace("truelevel-cache-v", "") : null;
  } catch {
    return null;
  }
}
currentBuild().then((build) => {
  $("about-build").textContent = build
    ? `TrueLevel — build ${build}`
    : "TrueLevel";
});

$("btn-reload").addEventListener("click", async () => {
  const button = $("btn-reload");
  button.disabled = true;
  button.textContent = "Updating…";
  try {
    // Refresh the HTTP cache for every app file first (the host allows caching
    // for 10 minutes), then drop the offline cache and service worker.
    const shell = await fetch("sw.js", { cache: "reload" }).then((r) => r.text());
    const urls = [...shell.matchAll(/"(\.\/[^"]*)"/g)].map((m) => m[1]);
    await Promise.all(urls.map((u) => fetch(u, { cache: "reload" }).catch(() => {})));
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
  window.location.reload();
});

})();
