(function () {

const AppStorage = window.TrueLevelStorage;
const Calc = window.TrueLevelCalc;

const result = AppStorage.getResult();
if (!result) {
  window.location.href = "index.html";
  return;
}

const ON_TARGET_THRESHOLD_TURNS = 0.03; // ~10.8 degrees

document.getElementById("strategy-subtitle").textContent =
  result.strategy === "A"
    ? `Strategy: Fix Knob ${result.fixedKnob + 1} at 0 turns.`
    : "Strategy: Minimize total movement across all knobs.";

const list = document.getElementById("results-list");

result.requiredTurns.forEach((signedTurns, idx) => {
  const f = Calc.formatTurn(signedTurns);
  const onTarget = f.turns < ON_TARGET_THRESHOLD_TURNS;

  const card = document.createElement("div");
  card.className = "card knob-result";
  card.innerHTML = `
    <svg class="knob-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="17" stroke="#0D9488" stroke-width="2"/>
      <line x1="10" y1="22" x2="34" y2="22" stroke="#0D9488" stroke-width="2"/>
    </svg>
    <div class="knob-result-body">
      <div class="knob-result-title">
        <span class="status-dot ${onTarget ? "ok" : "warn"}"></span>
        Knob ${idx + 1}
      </div>
      <div class="knob-result-detail">
        ${f.display} ${onTarget ? "" : `&mdash; ${f.direction}`}
      </div>
      <div class="knob-result-sub">
        ${f.turns.toFixed(3)} turn(s) &middot; ${f.degrees.toFixed(1)}&deg; total
      </div>
    </div>
  `;
  list.appendChild(card);
});

})();
