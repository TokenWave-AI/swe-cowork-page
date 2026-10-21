# SWE-CoWork research page

A static research page for the TokenWave AI paper **SWE-CoWork: Benchmarking Coding Agents as Digital Employees in Organizations**.

Code and benchmark: https://github.com/TokenWave-AI/swe-cowork-bench

Run it locally from this directory with:

    python3 -m http.server 4173

Then open http://127.0.0.1:4173/.

The usage explorer at `#usage` reads `static/data/usage-medians.json`,
transcribed from the paper's `analysis/usage_medians_20261022/usage_medians.json`
main snapshot. It uses per-run medians and full-release F2P; the cohorts differ.
Missing medians remain null, and Seed Evolving input usage is approximate.
The separate 20-run snapshot has its own figure and is not mixed into the explorer.
The gallery and `static/SWE-CoWork.pdf` include all three usage figures.
