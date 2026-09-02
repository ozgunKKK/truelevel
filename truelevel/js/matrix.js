// Minimal 3x3 / 3-vector linear algebra. No external dependencies.
// A 3x3 matrix is represented as an array of 3 column arrays: [col0, col1, col2],
// matching the spec's column_stack(delta_per_turn_1, delta_per_turn_2, delta_per_turn_3).
(function () {

function vecSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vecScale(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function vecDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function vecSum(v) {
  return v[0] + v[1] + v[2];
}

// Determinant of a 3x3 matrix given as [col0, col1, col2].
function det3(cols) {
  const [c0, c1, c2] = cols;
  return (
    c0[0] * (c1[1] * c2[2] - c1[2] * c2[1]) -
    c1[0] * (c0[1] * c2[2] - c0[2] * c2[1]) +
    c2[0] * (c0[1] * c1[2] - c0[2] * c1[1])
  );
}

// Inverse of a 3x3 matrix given as [col0, col1, col2].
// Returns null if the matrix is singular (or numerically near-singular).
function inverse3(cols) {
  const d = det3(cols);
  if (!isFinite(d) || Math.abs(d) < 1e-10) {
    return null;
  }
  const [c0, c1, c2] = cols;
  // Build the matrix in row-major form for readability.
  const m = [
    [c0[0], c1[0], c2[0]],
    [c0[1], c1[1], c2[1]],
    [c0[2], c1[2], c2[2]],
  ];
  const adj = [
    [
      m[1][1] * m[2][2] - m[1][2] * m[2][1],
      m[0][2] * m[2][1] - m[0][1] * m[2][2],
      m[0][1] * m[1][2] - m[0][2] * m[1][1],
    ],
    [
      m[1][2] * m[2][0] - m[1][0] * m[2][2],
      m[0][0] * m[2][2] - m[0][2] * m[2][0],
      m[0][2] * m[1][0] - m[0][0] * m[1][2],
    ],
    [
      m[1][0] * m[2][1] - m[1][1] * m[2][0],
      m[0][1] * m[2][0] - m[0][0] * m[2][1],
      m[0][0] * m[1][1] - m[0][1] * m[1][0],
    ],
  ];
  const invRowMajor = adj.map((row) => row.map((x) => x / d));
  // Return as [col0, col1, col2] to match the calling convention.
  return [
    [invRowMajor[0][0], invRowMajor[1][0], invRowMajor[2][0]],
    [invRowMajor[0][1], invRowMajor[1][1], invRowMajor[2][1]],
    [invRowMajor[0][2], invRowMajor[1][2], invRowMajor[2][2]],
  ];
}

// Multiply a 3x3 matrix (columns form) by a 3-vector.
function matVec(cols, v) {
  const [c0, c1, c2] = cols;
  return [
    c0[0] * v[0] + c1[0] * v[1] + c2[0] * v[2],
    c0[1] * v[0] + c1[1] * v[1] + c2[1] * v[2],
    c0[2] * v[0] + c1[2] * v[1] + c2[2] * v[2],
  ];
}

// Extract row r (0-indexed) from a matrix given in column form.
function matRow(cols, r) {
  return [cols[0][r], cols[1][r], cols[2][r]];
}

window.TrueLevelMath = {
  vecSub,
  vecScale,
  vecDot,
  vecSum,
  det3,
  inverse3,
  matVec,
  matRow,
};

})();
