# TrueLevel — App Specification

## Overview
A mobile-friendly PWA that helps level a 3-knob adjustable platform using a
linear calibration approach. Deployed to GitHub Pages, built from scratch
(not a continuation of the "Tilt Plane" project, though it shares the
general deployment pattern: static PWA on GitHub Pages under the `ozgunKKK`
account).

The platform has 3 adjustable knobs (feet/screws) and is checked at 3
measurement points. Turning any knob changes the height reading at all 3
points. Assuming the system is linear (turns superpose), we can build a
3×3 calibration matrix and invert it to compute exactly how much to turn
each knob to level the platform from any current (unlevel) state.

All UI text must be in **English**.

## Core Math

### Calibration
For each knob `i` (i = 1, 2, 3), the user:
1. Turns knob `i` by some amount (in turns, can be fractional) in a given
   direction (**clockwise** or **counterclockwise**).
2. Records the 3-point measurement after turning.

Compute:
```
delta_i = after_i - initial          (3-vector)
signed_turns_i = turns_i if direction == clockwise else -turns_i
delta_per_turn_i = delta_i / signed_turns_i
```

Calibration matrix:
```
K = column_stack(delta_per_turn_1, delta_per_turn_2, delta_per_turn_3)   # 3x3
```

`K` is persisted (localStorage) once computed. The user can re-run
calibration at any time from a "Recalibrate" action, which overwrites the
stored matrix.

> **Important constraint:** All measurements — during calibration AND
> every subsequent "current measurement" — must be taken at the exact
> same 3 physical points. `K` encodes a sensitivity vector specific to
> those three points; measuring at different points invalidates the
> matrix and produces meaningless results. The UI should remind the user
> of this on the measurement screen (e.g. "Measure at the same 3 points
> used during calibration").

### Leveling calculation
Given current measurements `M` (3-vector) and `K` (already calibrated):

```
K_inv = inverse(K)
```

**Strategy A — Fix one knob:**
User picks knob `f` to hold at 0 turns. Let `w = K_inv[f, :]`.
```
target_height = dot(w, M) / sum(w)
target = [target_height, target_height, target_height]
required_change = target - M
required_turns = K_inv @ required_change        # turns_i signed, knob f ≈ 0
```

**Strategy B — Minimize total movement (least-squares / minimum-norm):**
Instead of forcing one knob to zero, solve for the target height that
minimizes total turning effort across all 3 knobs (minimum-norm solution
to the underdetermined leveling problem — target height is a free
parameter, solve for the one that minimizes `||required_turns||`).
Implementation approach: parametrize by target height `h`, express
`required_turns(h) = K_inv @ ([h,h,h] - M)` as a linear function of `h`,
then minimize `||required_turns(h)||^2` over `h` analytically (least
squares over a single scalar), or via `numpy.linalg.lstsq` framed
appropriately.

User can switch between Strategy A (with knob picker) and Strategy B via
a toggle on the results screen.

### Output formatting
For each knob, output:
- Turns (signed magnitude, unsigned in display + direction label)
- Degrees (`turns * 360`)
- Direction: **Clockwise** / **Counterclockwise**
- If `abs(degrees) > 360`: format as combined turns + degrees, e.g.
  `372°` → **"1 turn + 12°"**. General formula:
  ```
  full_turns = int(abs(degrees) // 360)
  remaining_degrees = abs(degrees) % 360
  ```
  Display as `"{full_turns} turn(s) + {remaining_degrees:.1f}°"` when
  `full_turns >= 1`, otherwise just `"{degrees:.1f}°"`.

## Screens / Navigation
Multi-page navigation (separate pages, not a single scrolling/tab page).

1. **Home**
   - If calibration exists: shortcut to "New Measurement"
   - If not: "Start Calibration" CTA
   - Access to "Recalibrate" if calibration exists

2. **Calibration flow** (4 steps, progress indicator e.g. "Step 2 of 4")
   - Step 1: Initial measurement (3 numeric inputs)
   - Steps 2–4: For each knob — after-measurement (3 numeric inputs) +
     turns amount (numeric, supports decimals) + direction
     (clockwise/counterclockwise selector)
   - On completion: compute and persist `K` to localStorage

3. **Current Measurement**
   - 3 numeric inputs for current point readings
   - Strategy selector: "Fix a knob" (with knob picker) vs "Minimize total
     movement"
   - Submit → Results

4. **Results**
   - Expected level height readout: the target height (same for all 3
     points) that the platform reaches once the listed turns are
     applied. For Strategy A this is the height that holds the fixed
     knob at 0 turns; for Strategy B it is the minimum-effort target
     height `h*`. Shown with the current measured range for context.
   - One card per knob: turns, degrees, direction, combined
     turn+degree format when applicable
   - Simple status icon/indicator per knob (no heavy animation)
   - No 3D/animated tilt visualization — numeric results are primary

5. **Recalibration** (accessible from Home)
   - Shows current calibration matrix (optional, for transparency/debugging)
   - "Start New Calibration" → re-runs the 4-step flow, overwrites stored `K`

## Visual Design
**Theme: Laboratory / instrument**
- Background: clean white / light gray (e.g. `#FAFAFA`)
- Accent color: teal/cyan (e.g. `#0D9488`)
- Typography: monospace/tabular numerals for all numeric readouts;
  clean sans-serif for headings/labels
- Numeric values shown in bordered "digital readout" style boxes
  (thin border, subtle inset shadow — LCD-display feel)
- Icons: linear/technical line-art style (simple circle+notch for knobs,
  thin-line triangle for the platform schematic)
- Status indicators: green/red dot or bar for quick "on target / off
  target" feedback where relevant

## Persistence
- Calibration matrix `K` stored in `localStorage`
- Explicit "Recalibrate" action required to overwrite
- No other data persisted (current measurements are session-only)

## Platform / Deployment
- Static PWA (HTML/CSS/JS, installable, works offline after first load)
- Deployed via GitHub Pages
- New, separate repository under the `ozgunKKK` GitHub account (not part
  of the existing Tilt Plane repo)
- App name: **TrueLevel**
- Mobile-first layout (primary use case: phone in the field/lab)

## Explicitly Out of Scope (per discussion)
- No support for >3 knobs (fixed at 3 for now)
- No 3D/animated tilt visualization in results (numeric + simple icon only)
- No educational/reference/simulation modules (unlike Tilt Plane's
  4-module structure) — this is a focused calculator tool
