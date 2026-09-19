(function () {

const AppStorage = window.TrueLevelStorage;
const listEl = document.getElementById("calib-list");

function formatDate(ts) {
  if (!ts) return "Date unknown";
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function matrixTable(K) {
  // K is stored as [col0, col1, col2]; render as rows for readability.
  const table = document.createElement("table");
  table.className = "matrix-table";
  for (let r = 0; r < 3; r++) {
    const tr = table.insertRow();
    for (let c = 0; c < 3; c++) {
      tr.insertCell().textContent = K[c][r].toFixed(4);
    }
  }
  return table;
}

function actionButton(label, className, onClick) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderItem(entry, isActive) {
  const card = document.createElement("div");
  card.className = "card calib-item";

  const head = document.createElement("div");
  head.className = "calib-head";
  const title = document.createElement("div");
  title.className = "calib-name";
  title.textContent = entry.name;
  head.append(title);
  if (isActive) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Active";
    head.append(badge);
  }

  const date = document.createElement("div");
  date.className = "calib-date";
  date.textContent = formatDate(entry.createdAt);

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Show matrix";
  details.append(summary, matrixTable(entry.K));

  const actions = document.createElement("div");
  actions.className = "btn-row calib-actions";
  if (!isActive) {
    actions.append(
      actionButton("Use", "btn-primary", () => {
        AppStorage.useCalibration(entry.id);
        render();
      })
    );
  }
  actions.append(
    actionButton("Rename", "btn-secondary", () => {
      const name = window.prompt("Calibration name", entry.name);
      if (name === null) return;
      if (AppStorage.renameCalibration(entry.id, name)) render();
    }),
    actionButton("Delete", "btn-secondary btn-danger", () => {
      const note = isActive
        ? " It is the active calibration; measuring keeps working with it until you switch or recalibrate."
        : "";
      if (!window.confirm(`Delete "${entry.name}"?${note}`)) return;
      AppStorage.deleteCalibration(entry.id);
      render();
    })
  );

  card.append(head, date, details, actions);
  return card;
}

function render() {
  const saved = AppStorage.listCalibrations();
  const activeId = AppStorage.getActiveCalibrationId();
  listEl.replaceChildren();

  if (saved.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = "No saved calibrations yet.";
    const cta = document.createElement("a");
    cta.className = "btn btn-primary";
    cta.href = "calibrate.html";
    cta.textContent = "Start Calibration";
    listEl.append(empty, cta);
    return;
  }

  // Newest first; entries without a date (adopted legacy) go last.
  [...saved]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach((entry) => listEl.append(renderItem(entry, entry.id === activeId)));
}

render();

})();
