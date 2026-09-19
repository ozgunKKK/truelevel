// Leveling calculations built on top of TrueLevelMath.
// K is stored as [col0, col1, col2] (delta_per_turn for knob 1, 2, 3).
(function () {

const { vecSub, vecScale, vecDot, vecSum, inverse3, matVec, matRow } =
  window.TrueLevelMath;

// Strategy A: fix knob `f` (0-indexed) at 0 turns, solve for the target
// height that makes required_turns[f] == 0, then compute all required turns.
// Returns { turns: 3-vector, targetHeight: number } or null.
function computeStrategyA(K, M, f) {
  const Kinv = inverse3(K);
  if (!Kinv) return null;
  const w = matRow(Kinv, f);
  const s = vecSum(w);
  if (Math.abs(s) < 1e-10) return null;
  const targetHeight = vecDot(w, M) / s;
  const target = [targetHeight, targetHeight, targetHeight];
  const requiredChange = vecSub(target, M);
  return { turns: matVec(Kinv, requiredChange), targetHeight };
}

// Strategy B: minimum-norm solution. required_turns(h) = Kinv @ ([h,h,h] - M)
// is affine in h: required_turns(h) = h * (Kinv @ [1,1,1]) - (Kinv @ M).
// Let a = Kinv @ [1,1,1], b = Kinv @ M. required_turns(h) = h*a - b.
// Minimize ||h*a - b||^2 over h  =>  h* = (a . b) / (a . a).
// Returns { turns: 3-vector, targetHeight: number } or null.
function computeStrategyB(K, M) {
  const Kinv = inverse3(K);
  if (!Kinv) return null;
  const a = matVec(Kinv, [1, 1, 1]);
  const b = matVec(Kinv, M);
  const aa = vecDot(a, a);
  if (Math.abs(aa) < 1e-10) return null;
  const ab = vecDot(a, b);
  const hStar = ab / aa;
  return { turns: vecSub(vecScale(a, hStar), b), targetHeight: hStar };
}

// Format a signed turn count into display fields. `format` is the angle
// display preference: "turnsDeg" (default), "degrees" or "turns". `display` is
// the headline, `sub` the secondary line.
function formatTurn(signedTurns, format) {
  const direction = signedTurns >= 0 ? "Clockwise" : "Counterclockwise";
  const turns = Math.abs(signedTurns);
  const degrees = turns * 360;
  const fullTurns = Math.floor(degrees / 360);
  const remainingDegrees = degrees % 360;
  const deg = `${degrees.toFixed(1)}°`;
  const tur = turns.toFixed(3);

  let display;
  let sub;
  if (format === "degrees") {
    display = deg;
    sub = `${tur} turn(s)`;
  } else if (format === "turns") {
    display = `${tur} turns`;
    sub = `${deg} total`;
  } else {
    display =
      fullTurns >= 1
        ? `${fullTurns} turn${fullTurns === 1 ? "" : "s"} + ${remainingDegrees.toFixed(1)}°`
        : deg;
    sub = `${tur} turn(s) · ${deg} total`;
  }
  return { turns, degrees, direction, display, sub };
}

window.TrueLevelCalc = {
  computeStrategyA,
  computeStrategyB,
  formatTurn,
};

})();
