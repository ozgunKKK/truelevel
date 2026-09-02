(function () {

const K = window.TrueLevelStorage.getK();
const container = document.getElementById("home-content");

if (K) {
  container.innerHTML = `
    <div class="card center-cta">
      <p style="margin: 0 0 1rem; color: var(--text-muted); font-size: 0.9rem;">
        Calibration found. Ready to measure.
      </p>
      <a class="btn btn-primary" href="measure.html">New Measurement</a>
    </div>
    <a class="btn btn-secondary" href="recalibrate.html">Recalibrate</a>
  `;
} else {
  container.innerHTML = `
    <div class="card center-cta">
      <p style="margin: 0 0 1rem; color: var(--text-muted); font-size: 0.9rem;">
        No calibration yet. Calibrate the platform once before taking
        measurements.
      </p>
      <a class="btn btn-primary" href="calibrate.html">Start Calibration</a>
    </div>
  `;
}

})();
