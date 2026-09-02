(function () {

const AppStorage = window.TrueLevelStorage;
const Calc = window.TrueLevelCalc;

const K = AppStorage.getK();
if (!K) {
  window.location.href = "index.html";
  return;
}

const strategyGroup = document.getElementById("strategy-group");
const knobPickerField = document.getElementById("knob-picker-field");
const knobPicker = document.getElementById("knob-picker");
const errorText = document.getElementById("error-text");

function wireSelectGroup(group, onSelect) {
  group.querySelectorAll(".select-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      group
        .querySelectorAll(".select-option")
        .forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      onSelect(opt.dataset.value);
    });
  });
}

wireSelectGroup(strategyGroup, (value) => {
  knobPickerField.style.display = value === "A" ? "block" : "none";
});

wireSelectGroup(knobPicker, () => {});

function getActiveValue(group) {
  return group.querySelector(".select-option.active").dataset.value;
}

function readPoint() {
  const v1 = parseFloat(document.getElementById("m-1").value);
  const v2 = parseFloat(document.getElementById("m-2").value);
  const v3 = parseFloat(document.getElementById("m-3").value);
  if ([v1, v2, v3].some((v) => Number.isNaN(v))) return null;
  return [v1, v2, v3];
}

document.getElementById("btn-submit").addEventListener("click", () => {
  errorText.hidden = true;
  const M = readPoint();
  if (!M) {
    errorText.textContent = "Enter numeric values for all 3 points.";
    errorText.hidden = false;
    return;
  }

  const strategy = getActiveValue(strategyGroup);
  let requiredTurns;
  let fixedKnob = null;

  if (strategy === "A") {
    fixedKnob = parseInt(getActiveValue(knobPicker), 10);
    requiredTurns = Calc.computeStrategyA(K, M, fixedKnob);
  } else {
    requiredTurns = Calc.computeStrategyB(K, M);
  }

  if (!requiredTurns) {
    errorText.textContent =
      "Could not compute a result from the current calibration matrix. Try recalibrating.";
    errorText.hidden = false;
    return;
  }

  AppStorage.setResult({ strategy, fixedKnob, requiredTurns });
  window.location.href = "results.html";
});

})();
