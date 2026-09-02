(function () {

const AppStorage = window.TrueLevelStorage;

const K = AppStorage.getK();
const container = document.getElementById("matrix-container");

if (K) {
  // K is stored as [col0, col1, col2]; render as rows for readability.
  let rows = "";
  for (let r = 0; r < 3; r++) {
    rows += "<tr>";
    for (let c = 0; c < 3; c++) {
      rows += `<td>${K[c][r].toFixed(4)}</td>`;
    }
    rows += "</tr>";
  }
  container.innerHTML = `<table class="matrix-table">${rows}</table>`;
} else {
  container.innerHTML =
    '<p class="subtitle" style="margin:0;">No calibration stored yet.</p>';
}

document.getElementById("btn-start").addEventListener("click", () => {
  AppStorage.clearCalibProgress();
  window.location.href = "calibrate.html";
});

})();
