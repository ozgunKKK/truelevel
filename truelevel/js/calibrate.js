(function () {

const { vecSub, inverse3 } = window.TrueLevelMath;
const AppStorage = window.TrueLevelStorage;

const TOTAL_STEPS = 4;

let state = AppStorage.getCalibProgress() || {
  step: 1,
  initial: null,
  knobs: [
    { after: null, turns: null, direction: "cw" },
    { after: null, turns: null, direction: "cw" },
    { after: null, turns: null, direction: "cw" },
  ],
};

const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const errorText = document.getElementById("error-text");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");

function knobStepHtml(knobIndex) {
  const knobNum = knobIndex + 1;
  return `
    <div class="card">
      <h2>Knob ${knobNum} &mdash; after measurement</h2>
      <p class="subtitle" style="margin-bottom: 0.75rem;">
        Turn knob ${knobNum} by a known amount, then record the height at
        the same 3 points.
      </p>
      <div class="point-row">
        <div class="field point-field">
          <label>Point 1</label>
          <input type="number" step="any" id="after-${knobNum}-1" inputmode="decimal" />
        </div>
        <div class="field point-field">
          <label>Point 2</label>
          <input type="number" step="any" id="after-${knobNum}-2" inputmode="decimal" />
        </div>
        <div class="field point-field">
          <label>Point 3</label>
          <input type="number" step="any" id="after-${knobNum}-3" inputmode="decimal" />
        </div>
      </div>
      <div class="field">
        <label>Turns</label>
        <input type="number" step="any" min="0" id="turns-${knobNum}" inputmode="decimal" placeholder="e.g. 1.5" />
      </div>
      <div class="field">
        <label>Direction</label>
        <div class="select-group" id="direction-${knobNum}">
          <div class="select-option" data-value="cw">Clockwise</div>
          <div class="select-option" data-value="ccw">Counterclockwise</div>
        </div>
      </div>
    </div>
  `;
}

function renderStepShells() {
  for (let i = 0; i < 3; i++) {
    const section = document.getElementById(`step-${i + 2}`);
    if (!section.dataset.rendered) {
      section.innerHTML = knobStepHtml(i);
      section.dataset.rendered = "true";
      const group = section.querySelector(".select-group");
      group.querySelectorAll(".select-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          group
            .querySelectorAll(".select-option")
            .forEach((o) => o.classList.remove("active"));
          opt.classList.add("active");
        });
      });
    }
  }
}

function populateFieldsFromState() {
  const i1 = document.getElementById("initial-1");
  if (state.initial) {
    i1.value = state.initial[0];
    document.getElementById("initial-2").value = state.initial[1];
    document.getElementById("initial-3").value = state.initial[2];
  }
  for (let k = 0; k < 3; k++) {
    const knobNum = k + 1;
    const data = state.knobs[k];
    const afterEl1 = document.getElementById(`after-${knobNum}-1`);
    if (!afterEl1) continue;
    if (data.after) {
      afterEl1.value = data.after[0];
      document.getElementById(`after-${knobNum}-2`).value = data.after[1];
      document.getElementById(`after-${knobNum}-3`).value = data.after[2];
    }
    if (data.turns !== null && data.turns !== undefined) {
      document.getElementById(`turns-${knobNum}`).value = data.turns;
    }
    const group = document.getElementById(`direction-${knobNum}`);
    group.querySelectorAll(".select-option").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.value === data.direction);
    });
  }
}

function showError(msg) {
  errorText.textContent = msg;
  errorText.hidden = false;
}

function clearError() {
  errorText.hidden = true;
  errorText.textContent = "";
}

function readPoint(prefix) {
  const v1 = parseFloat(document.getElementById(`${prefix}-1`).value);
  const v2 = parseFloat(document.getElementById(`${prefix}-2`).value);
  const v3 = parseFloat(document.getElementById(`${prefix}-3`).value);
  if ([v1, v2, v3].some((v) => Number.isNaN(v))) return null;
  return [v1, v2, v3];
}

function render() {
  renderStepShells();
  for (let s = 1; s <= TOTAL_STEPS; s++) {
    document.getElementById(`step-${s}`).hidden = s !== state.step;
  }
  progressLabel.textContent = `Step ${state.step} of ${TOTAL_STEPS}`;
  progressFill.style.width = `${(state.step / TOTAL_STEPS) * 100}%`;
  btnBack.hidden = state.step === 1;
  btnNext.textContent = state.step === TOTAL_STEPS ? "Finish Calibration" : "Next";
  clearError();
  populateFieldsFromState();
}

function saveCurrentStepInputs() {
  if (state.step === 1) {
    const initial = readPoint("initial");
    if (!initial) {
      showError("Enter numeric values for all 3 points.");
      return false;
    }
    state.initial = initial;
    return true;
  }
  const knobIndex = state.step - 2;
  const knobNum = knobIndex + 1;
  const after = readPoint(`after-${knobNum}`);
  if (!after) {
    showError("Enter numeric values for all 3 points.");
    return false;
  }
  const turnsInput = document.getElementById(`turns-${knobNum}`);
  const turns = parseFloat(turnsInput.value);
  if (Number.isNaN(turns) || turns <= 0) {
    showError("Enter a positive number of turns.");
    return false;
  }
  const directionGroup = document.getElementById(`direction-${knobNum}`);
  const activeOpt = directionGroup.querySelector(".select-option.active");
  if (!activeOpt) {
    showError("Select a direction.");
    return false;
  }
  state.knobs[knobIndex] = {
    after,
    turns,
    direction: activeOpt.dataset.value,
  };
  return true;
}

function finishCalibration() {
  const columns = state.knobs.map((knob) => {
    const delta = vecSub(knob.after, state.initial);
    const signedTurns = knob.direction === "cw" ? knob.turns : -knob.turns;
    return delta.map((d) => d / signedTurns);
  });
  if (!inverse3(columns)) {
    showError(
      "This calibration data produces a non-invertible matrix. Please redo calibration with more distinct knob movements."
    );
    return;
  }
  AppStorage.setK(columns);
  AppStorage.clearCalibProgress();
  window.location.href = "index.html";
}

btnNext.addEventListener("click", () => {
  if (!saveCurrentStepInputs()) return;
  AppStorage.setCalibProgress(state);
  if (state.step === TOTAL_STEPS) {
    finishCalibration();
    return;
  }
  state.step += 1;
  AppStorage.setCalibProgress(state);
  render();
});

btnBack.addEventListener("click", () => {
  if (state.step === 1) return;
  state.step -= 1;
  AppStorage.setCalibProgress(state);
  render();
});

render();

})();
