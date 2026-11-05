# SWE-CoWork research page

The research website for **SWE-CoWork: Benchmarking Coding Agents as Digital Employees in Organizations**, by TokenWave AI Team.

- Website: https://tokenwave-ai.github.io/swe-cowork-page/
- Benchmark repository: https://github.com/TokenWave-AI/swe-cowork-bench

The page includes the reported leaderboard, a five-step Mempool case, the inline 92-second demo, the research vision, paper figures and supporting resources. The benchmark repository is private; GitHub access is required to view it.

## Local preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/. The site is static and has no build or package installation step. Links and assets use relative paths so the site also works under the GitHub Pages project path.

## Editing and publishing

- `index.html`: page content, leaderboard, research team and resource links.
- `styles.css` and `flow.css`: TokenWave visual styles and responsive layouts.
- `script.js`: sorting, inline video playback, requirement walkthrough, figure dialogs, citation copying and navigation.
- `assets/swe-cowork-demo.mp4`: the 1920 × 1080 demo; its poster is stored beside it.
- `static/`: the paper, figures, model logos, source data and fonts.
- `original/`: the earlier page and detailed interactive usage/workplace analyses.

GitHub Pages publishes the repository root from `main`. `.nojekyll` keeps the files as a plain static site.

The TokenWave horizontal logo is supplied artwork. Franie Test is used when installed locally; the bundled Noto Sans font provides an offline fallback. Its license is in `static/fonts/NotoSans-OFL.txt`. Scientific figures and benchmark values retain their reported scope and precision.
