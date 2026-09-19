(function () {

const AppStorage = window.TrueLevelStorage;

const K = AppStorage.getK();
const saved = AppStorage.listCalibrations();
const activeId = AppStorage.getActiveCalibrationId();
const active = saved.find((c) => c.id === activeId);
const container = document.getElementById("home-content");

const savedLink = saved.length
  ? `<a class="btn btn-secondary" href="calibrations.html">Saved Calibrations (${saved.length})</a>`
  : "";

if (K) {
  container.innerHTML = `
    <div class="card center-cta">
      <p style="margin: 0 0 1rem; color: var(--text-muted); font-size: 0.9rem;">
        Calibration found. Ready to measure.
      </p>
      <a class="btn btn-primary" href="measure.html">New Measurement</a>
    </div>
    <div class="stack">
      <a class="btn btn-secondary" href="recalibrate.html">Recalibrate</a>
      ${savedLink}
    </div>
  `;
  if (active) {
    const note = container.querySelector(".center-cta p");
    note.textContent = "Active calibration: ";
    const strong = document.createElement("strong");
    strong.textContent = active.name;
    note.append(strong, ". Ready to measure.");
  }
} else {
  container.innerHTML = `
    <div class="card center-cta">
      <p style="margin: 0 0 1rem; color: var(--text-muted); font-size: 0.9rem;">
        No calibration yet. Calibrate the platform once before taking
        measurements.
      </p>
      <a class="btn btn-primary" href="calibrate.html">Start Calibration</a>
    </div>
    ${savedLink}
  `;
}

})();
