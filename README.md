# Vita

Build the CV your dream university is looking for.

High-school students (14+) pick their top 5 universities and a course at each. Vita compares their profile with what each university typically expects, lists the gaps, and suggests small CV add-ons to complete in 2-week sprints.

## Features
- **Onboarding:** about you → career interest (or an 8-question quiz) → grades (course, board, grade) → optional tests, languages and activities → top 5 universities
- **Readiness score** per university and course, with a prioritised list of what to improve
- **100 universities** worldwide with approximate, realistic requirements (`js/data-universities.js`)
- **50 add-ons** (`js/data-content.js`). Each one you log goes straight onto your CV
- **Sprints & streaks:** 2-week cycles with an XP multiplier of ×1 / ×1.25 / ×1.5 / ×2 for the 1st, 2nd, 3rd and 4th+ add-on in a sprint. A streak bonus applies when it continues
- **Auto-built CV** that you can save as a PDF from the browser

Progress is saved in the browser (localStorage). There are no accounts and no server.

## Run locally
Open `index.html` in a browser. There is no build step.

## Data disclaimer
Admissions figures are approximate. Always check the official university admissions pages.
