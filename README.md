# TrueLevel

A mobile-first PWA that helps level a 3-knob adjustable platform using a
linear calibration approach.

The platform has 3 adjustable knobs and is checked at 3 measurement points.
Turning any knob changes the reading at all 3 points. Assuming the system is
linear, TrueLevel builds a 3×3 calibration matrix `K`, inverts it, and
computes exactly how much to turn each knob to level the platform from any
current state.

## Live app

<https://ozgunkkk.github.io/truelevel/>

## Usage

1. **Calibrate once** — record an initial 3-point measurement, then for each
   knob turn it a known amount and record the 3-point measurement again.
   `K` is stored in `localStorage`.
2. **Measure** — enter the current 3-point reading, pick a strategy
   (hold one knob fixed, or minimize total movement), and read off the
   required turns per knob.
3. **Recalibrate** anytime to overwrite `K`.

> All measurements must be taken at the exact same 3 physical points used
> during calibration.

## Project layout

| Path | What |
| --- | --- |
| `truelevel/` | The PWA (static HTML/CSS/JS, service worker, manifest). Deployed as the Pages site root. |
| `level-calibrator-spec.md` | Full app specification. |
| `.github/workflows/deploy.yml` | GitHub Actions workflow that publishes `truelevel/` to GitHub Pages on push to `main`. |

## Local development

It's a static site — serve the `truelevel/` folder with any static server:

```bash
cd truelevel
python3 -m http.server 8000
# open http://localhost:8000
```
