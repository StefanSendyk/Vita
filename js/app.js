/* Vita — app */
(function () {
  "use strict";
  const UNIS = window.VITA_UNIS;
  const { FIELDS, CATS, LEVELS, FIELDREQ, SUBJECTS, BOARDS, QUIZ, ADDONS } = window.VITA;
  const KEY = "vita.v1";
  const DAY = 864e5, CYCLE = 14 * DAY, MAX_PICKS = 5;
  const app = document.getElementById("app");

  /* ---------- state ---------- */
  function fresh() {
    return {
      v: 1, created: Date.now(), onboarded: false, step: 0,
      name: "", age: "16", country: "", curriculum: "IB", englishNative: "no",
      contact: { email: "", city: "", school: "" }, summary: "",
      fields: [], grades: [], tests: { sat: "", act: "", ielts: "", toefl: "" },
      languages: [], activities: [], picks: [], done: [], xp: 0, quiz: {}
    };
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(fresh(), s); } catch (e) {}
    return fresh();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------- utils ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const opt = (v, label, sel) => `<option value="${esc(v)}"${String(v) === String(sel) ? " selected" : ""}>${esc(label)}</option>`;
  const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  function getPath(o, p) { return p.split(".").reduce((x, k) => (x == null ? x : x[k]), o); }
  function setPath(o, p, v) { const k = p.split("."); const last = k.pop(); const t = k.reduce((x, kk) => x[kk], o); t[last] = v; }

  /* ---------- scoring ---------- */
  function gradeScore(g) {
    const b = BOARDS[g.b]; if (!b || g.g === "" || g.g == null) return null;
    if (!b.map) { const n = Number(g.g); return isNaN(n) ? null : clamp(n, 0, 100); }
    const v = b.map[g.g]; return v == null ? null : v;
  }
  const ibToScore = (ib) => 100 - (7 - (ib - 2) / 6) * 10;
  const scoreToIb = (s) => clamp(Math.round((7 - (100 - s) / 10) * 6 + 2), 0, 45);
  function academicAvg() { const s = S.grades.map(gradeScore).filter((x) => x != null); return s.length ? mean(s) : null; }
  function userSat() {
    const sat = Number(S.tests.sat) || 0, act = Number(S.tests.act) || 0;
    return Math.max(sat, act ? Math.round(400 + act * 33.3) : 0);
  }
  function actPts(a) { return a.pts || (LEVELS[a.lvl] ? LEVELS[a.lvl][1] : 1); }
  function ecPoints(f, ecw) {
    return Math.round(S.activities.filter((a) => a.t).reduce((s, a) => {
      const rel = a.f === f || (!a.f && FIELDREQ[f].cats.includes(a.cat));
      return s + actPts(a) * (rel ? (ecw >= 3 ? 1.5 : 2) : 1);
    }, 0));
  }
  function ecTarget(u) { const base = { 1: 4, 2: 8, 3: 14 }[u.ec]; return Math.round(base * (u.a < 8 ? 1.4 : u.a < 20 ? 1.2 : 1)); }

  function assess(u, f) {
    const fr = FIELDREQ[f], gaps = [], goods = [];
    const target = ibToScore(u.ib), avg = academicAvg();
    let acad, subj = 1, test = 1;
    // academics
    if (avg == null) { acad = 0.4; gaps.push({ k: "Grades", sev: 3, t: "Add your grades", d: "Vita needs your grades to estimate your academic fit." }); }
    else {
      const diff = target - avg; acad = clamp(1 - diff / 20, 0, 1);
      if (diff > 1) gaps.push({ k: "Grades", sev: diff > 8 ? 3 : 2, t: `Raise your grade average (≈ IB ${scoreToIb(avg)} → ${u.ib})`, d: `Typical requirement: ${u.req}.` });
      else goods.push(`Grades on target (≈ IB ${scoreToIb(avg)} vs ${u.ib} needed)`);
    }
    // required subjects
    if (fr.subjects.length) {
      let ok = 0;
      fr.subjects.forEach((s) => {
        const rows = S.grades.filter((g) => g.s === s);
        if (!rows.length) { gaps.push({ k: "Subjects", sev: 3, t: `Take ${s}`, d: `${FIELDS[f]} applicants are expected to study ${s}${S.curriculum === "IB" ? " at HL" : ""}.` }); return; }
        const best = Math.max(...rows.map((g) => gradeScore(g) ?? 0));
        if (rows.every((g) => g.b === "IB") && !rows.some((g) => g.l === "HL")) { gaps.push({ k: "Subjects", sev: 2, t: `Move ${s} to HL`, d: `Competitive ${FIELDS[f]} courses usually require ${s} at Higher Level.` }); ok += 0.5; return; }
        if (best < target - 5) { gaps.push({ k: "Subjects", sev: 2, t: `Raise your ${s} grade`, d: `This subject counts most for ${FIELDS[f]}.` }); ok += 0.5; return; }
        ok++; goods.push(`${s} grade is strong`);
      });
      subj = ok / fr.subjects.length;
    }
    // tests
    if (u.sat) {
      const sat = userSat();
      if (!sat) { test = 0.4; gaps.push({ k: "Tests", sev: u.c === "USA" ? 3 : 1, t: `Sit the SAT or ACT (target ~${u.sat}+)`, d: u.c === "USA" ? "Many top US universities require test scores again." : "Test scores can strengthen your application here." }); }
      else { test = clamp(1 - (u.sat - sat) / 250, 0, 1); if (sat < u.sat - 20) gaps.push({ k: "Tests", sev: 2, t: `Raise your SAT ${sat} → ${u.sat}+`, d: "This is the score of a typical admitted student." }); else goods.push(`SAT ${sat} is at the typical admitted level`); }
    }
    if (u.c === "UK" && fr.ukTest) gaps.push({ k: "Tests", sev: 1, t: `Prepare for ${fr.ukTest}`, d: "Many UK courses use an admissions test for this subject. Check the course page." });
    if (!u.lang && S.englishNative !== "yes") {
      const ok = Number(S.tests.ielts) >= 7 || Number(S.tests.toefl) >= 100;
      if (!ok) { test *= 0.85; gaps.push({ k: "Language", sev: 2, t: "Get an English certificate", d: "Aim for IELTS 7.0+ or TOEFL iBT 100+. Some courses ask for more." }); }
      else goods.push("English certificate meets typical requirements");
    }
    if (u.lang) {
      const l = S.languages.find((x) => x.lang && u.lang.toLowerCase() === x.lang.trim().toLowerCase());
      const fluent = l && ["Native", "C2", "C1", "B2"].includes(l.lvl);
      if (!fluent) { test *= l ? 0.7 : 0.5; gaps.push({ k: "Language", sev: l ? 2 : 3, t: l ? `Raise your ${u.lang} from ${l.lvl} to B2/C1` : `Teaching language: ${u.lang}`, d: `Most bachelor's programmes are taught in ${u.lang}. Universities usually ask for B2–C1 (or look for English-taught tracks).` }); }
      else goods.push(`Your ${u.lang} (${l.lvl}) meets typical requirements`);
    }
    // activities
    const pts = ecPoints(f, u.ec), tgt = ecTarget(u), ec = clamp(pts / tgt, 0, 1);
    if (ec < 1) gaps.push({ k: "Activities", sev: ec < 0.5 ? 3 : 2, t: `Build your activities (${pts}/${tgt} pts)`, d: u.ec >= 3 ? "Holistic admissions weigh activities, leadership and impact heavily." : u.ec === 2 ? "Show super-curricular depth: activities connected to your course count double." : "Grades matter most here, but activities help scholarships and motivation letters." });
    else goods.push(`Activity profile is strong (${pts} pts)`);
    fr.cats.forEach((c) => { if (!S.activities.some((a) => a.cat === c)) gaps.push({ k: "Activities", sev: 1, t: `Add something in ${CATS[c]}`, d: `Key for ${FIELDS[f]}: ${fr.tip}`, cat: c }); });

    const W = (u.lang ? { 1: [0.5, 0.15, 0.1, 0.25], 2: [0.45, 0.1, 0.2, 0.25], 3: [0.35, 0.1, 0.3, 0.25] } : { 1: [0.6, 0.2, 0.1, 0.1], 2: [0.5, 0.15, 0.25, 0.1], 3: [0.4, 0.1, 0.35, 0.15] })[u.ec];
    const parts = { Grades: acad, Subjects: subj, Activities: ec, [u.lang ? "Tests & language" : "Tests"]: test };
    const score = Math.round(100 * (W[0] * acad + W[1] * subj + W[2] * ec + W[3] * test));
    gaps.sort((a, b) => b.sev - a.sev);
    return { score, gaps, goods, parts, pts, tgt };
  }

  function suggestFor(f, gaps, n) {
    const missing = new Set(gaps.filter((g) => g.cat).map((g) => g.cat));
    const scored = ADDONS.map((a) => {
      let s = 0;
      if (a.f.includes(f)) s += 3; else if (!a.f.length) s += 1; else return null;
      if (missing.has(a.cat)) s += 3;
      if (FIELDREQ[f].cats.includes(a.cat)) s += 1;
      s -= timesDone(a.id) * 0.5;
      return [s, a];
    }).filter(Boolean).sort((x, y) => y[0] - x[0]);
    return scored.slice(0, n).map((x) => x[1]);
  }

  /* ---------- XP, levels, sprints, streak ---------- */
  const cycleOf = (ts) => Math.floor((ts - S.created) / CYCLE);
  const curCycle = () => cycleOf(Date.now());
  const cycleCount = (c) => S.done.filter((d) => d.cycle === c).length;
  const multFor = (n) => (n <= 1 ? 1 : n === 2 ? 1.25 : n === 3 ? 1.5 : 2);
  const timesDone = (id) => S.done.filter((d) => d.a === id).length;
  function streak() { const cc = curCycle(); let c = cycleCount(cc) > 0 ? cc : cc - 1, s = 0; while (c >= 0 && cycleCount(c) > 0) { s++; c--; } return s; }
  function daysLeft() { const end = S.created + (curCycle() + 1) * CYCLE; return Math.ceil((end - Date.now()) / DAY); }
  const lvlStart = (n) => 50 * n * (n - 1);
  function level() { let n = 1; while (S.xp >= lvlStart(n + 1)) n++; return { n, cur: S.xp - lvlStart(n), need: lvlStart(n + 1) - lvlStart(n) }; }

  function completeAddon(a, cvLine) {
    const cc = curCycle(), n = cycleCount(cc) + 1, m = multFor(n);
    const bonus = n === 1 && streak() > 0 ? 10 * streak() : 0;
    const xp = Math.round(a.xp * m) + bonus;
    S.done.push({ a: a.id, ts: Date.now(), cycle: cc, xp, mult: m });
    S.xp += xp;
    const f = a.f.includes(S.fields[0]) ? S.fields[0] : (a.f[0] || "");
    S.activities.push({ id: uid(), cat: a.cat, t: cvLine || a.cv, lvl: a.pts >= 4 ? "international" : a.pts === 3 ? "national" : a.pts === 2 ? "regional" : "school", pts: a.pts, f, src: "addon", ts: Date.now() });
    save();
    toast(`+${xp} XP${m > 1 ? ` · ×${m} sprint multiplier` : ""}${bonus ? ` · +${bonus} streak bonus` : ""}`);
  }

  /* ---------- UI helpers ---------- */
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10); setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2800);
  }
  function ring(p, size = 64) {
    const r = size / 2 - 5, c = 2 * Math.PI * r, off = c * (1 - p / 100);
    const cls = p >= 75 ? "good" : p >= 50 ? "mid" : "low";
    return `<svg class="ring ${cls}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p}% ready">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle">${p}%</text></svg>`;
  }
  const bar = (p, cls = "") => `<div class="bar ${cls}"><span style="width:${clamp(p, 0, 100)}%"></span></div>`;
  const uniById = (id) => UNIS[id];

  /* ---------- views ---------- */
  function nav(active) {
    const items = [["dashboard", "Dashboard"], ["unis", "Universities"], ["addons", "Add-ons"], ["cv", "My CV"], ["profile", "Profile"]];
    const lv = level();
    return `<header class="topbar"><div class="wrap topbar-in">
      <a href="#/dashboard" class="brand"><span class="logo">V</span>Vita</a>
      <nav>${items.map(([k, l]) => `<a href="#/${k}" class="${active === k ? "on" : ""}">${l}</a>`).join("")}</nav>
      <div class="chips"><span class="chip streak" title="Sprint streak">🔥 ${streak()}</span><span class="chip" title="Level">Lv ${lv.n} · ${S.xp} XP</span></div>
    </div></header>`;
  }

  function viewLanding() {
    return `<div class="landing"><div class="wrap">
      <div class="brand big"><span class="logo">V</span>Vita</div>
      <h1>Build the CV your dream university is looking for.</h1>
      <p class="lead">Pick your top 5 universities. Vita shows what you're missing and gives you small CV add-ons to complete every two weeks. Keep your streak going and watch your readiness grow.</p>
      <button class="btn primary lg" data-act="start">Get started, it's free</button>
      <div class="how">
        <div><b>1</b><h3>Tell us about you</h3><p>Grades, interests and anything you've already done.</p></div>
        <div><b>2</b><h3>Pick 5 universities</h3><p>Choose from 100 universities worldwide, with realistic requirements.</p></div>
        <div><b>3</b><h3>Close the gaps</h3><p>Complete add-ons in 2-week sprints. The more you do, the bigger your multiplier.</p></div>
      </div></div></div>`;
  }

  const STEPS = ["About you", "Career interest", "Grades", "Extras", "Top 5 universities"];
  function viewOnboarding() {
    const st = S.step;
    const body = [secAbout, secInterest, secGrades, secExtras, secPicker][st]();
    return `<div class="onb wrap narrow">
      <div class="brand"><span class="logo">V</span>Vita</div>
      <div class="steps">${STEPS.map((s, i) => `<div class="${i < st ? "done" : i === st ? "on" : ""}"><span>${i + 1}</span>${s}</div>`).join("")}</div>
      <div class="card pad">${body}</div>
      <div class="onb-nav">
        ${st > 0 ? `<button class="btn" data-act="prev">Back</button>` : "<span></span>"}
        ${st < 4 ? `<button class="btn primary" data-act="next">${st === 3 ? "Continue (you can skip)" : "Continue"}</button>` : `<button class="btn primary" data-act="finish" ${S.picks.length ? "" : "disabled"}>See my readiness →</button>`}
      </div></div>`;
  }

  function secAbout() {
    return `<h2>About you</h2><p class="muted">This is used for your CV and to tailor suggestions.</p>
      <div class="grid2">
        <label>Full name<input data-bind="name" value="${esc(S.name)}" placeholder="e.g. Alex Kowalski"></label>
        <label>Age<select data-bind="age">${[14, 15, 16, 17, 18, 19].map((a) => opt(a, a, S.age)).join("")}</select></label>
        <label>School<input data-bind="contact.school" value="${esc(S.contact.school)}" placeholder="School name"></label>
        <label>Country<input data-bind="country" value="${esc(S.country)}" placeholder="e.g. Poland"></label>
        <label>Main curriculum<select data-bind="curriculum">${Object.entries(BOARDS).map(([k, b]) => opt(k, b.label, S.curriculum)).join("")}</select></label>
        <label>Is English your first language?<select data-bind="englishNative">${opt("no", "No", S.englishNative)}${opt("yes", "Yes", S.englishNative)}</select></label>
        <label>Email (for your CV)<input data-bind="contact.email" type="email" value="${esc(S.contact.email)}" placeholder="optional"></label>
        <label>City (for your CV)<input data-bind="contact.city" value="${esc(S.contact.city)}" placeholder="optional"></label>
      </div>`;
  }

  function secInterest() {
    return `<h2>What career are you aiming for?</h2><p class="muted">Pick up to 3. The first one you pick is your main interest.</p>
      <div class="fieldgrid">${Object.entries(FIELDS).map(([k, l]) => {
        const i = S.fields.indexOf(k);
        return `<button class="fieldbtn ${i >= 0 ? "on" : ""}" data-act="field" data-k="${k}">${i >= 0 ? `<em>${i + 1}</em>` : ""}${l}</button>`;
      }).join("")}</div>
      <div class="quizcta"><div><b>Not sure yet?</b><br><span class="muted">Answer 8 quick questions and we'll suggest fields.</span></div><a class="btn" href="#/quiz">Take the quiz</a></div>`;
  }

  function secGrades() {
    const rows = S.grades.map((g, i) => {
      const b = BOARDS[g.b] || BOARDS.IB;
      return `<div class="graderow">
        <select data-bind="grades.${i}.s">${SUBJECTS.map((s) => opt(s, s, g.s)).join("")}</select>
        <select data-bind="grades.${i}.b" data-rerender>${Object.entries(BOARDS).map(([k, x]) => opt(k, x.label, g.b)).join("")}</select>
        ${b.levels.length ? `<select data-bind="grades.${i}.l">${b.levels.map((l) => opt(l, l, g.l)).join("")}</select>` : `<span class="muted small">—</span>`}
        ${b.grades ? `<select data-bind="grades.${i}.g"><option value="">Grade</option>${b.grades.map((x) => opt(x, x, g.g)).join("")}</select>` : `<input type="number" min="0" max="100" placeholder="%" data-bind="grades.${i}.g" value="${esc(g.g)}">`}
        <button class="icon" data-act="delgrade" data-i="${i}" aria-label="Remove">✕</button></div>`;
    }).join("");
    return `<h2>Your grades</h2><p class="muted">Add your current or predicted grades: course, board and grade.</p>
      <div class="gradehead"><span>Course</span><span>Board</span><span>Level</span><span>Grade</span><span></span></div>
      ${rows || `<p class="empty">No grades yet. Add your first subject.</p>`}
      <button class="btn" data-act="addgrade">+ Add subject</button>`;
  }

  function secExtras() {
    const acts = S.activities.filter((a) => a.src !== "addon");
    return `<h2>Extras <span class="tag">optional</span></h2><p class="muted">Fill in only what you have. You can add more later in Profile.</p>
      <h3>Test scores</h3>
      <div class="grid4">
        <label>SAT<input type="number" data-bind="tests.sat" value="${esc(S.tests.sat)}" placeholder="400–1600"></label>
        <label>ACT<input type="number" data-bind="tests.act" value="${esc(S.tests.act)}" placeholder="1–36"></label>
        <label>IELTS<input type="number" step="0.5" data-bind="tests.ielts" value="${esc(S.tests.ielts)}" placeholder="0–9"></label>
        <label>TOEFL iBT<input type="number" data-bind="tests.toefl" value="${esc(S.tests.toefl)}" placeholder="0–120"></label>
      </div>
      <h3>Languages</h3>
      ${S.languages.map((l, i) => `<div class="row3"><input data-bind="languages.${i}.lang" value="${esc(l.lang)}" placeholder="Language"><select data-bind="languages.${i}.lvl">${["Native", "C2", "C1", "B2", "B1", "A2", "A1"].map((x) => opt(x, x, l.lvl)).join("")}</select><button class="icon" data-act="dellang" data-i="${i}" aria-label="Remove">✕</button></div>`).join("")}
      <button class="btn sm" data-act="addlang">+ Add language</button>
      <h3>Activities you've already done</h3>
      ${acts.map((a) => { const i = S.activities.indexOf(a); return `<div class="actrow">
        <input data-bind="activities.${i}.t" value="${esc(a.t)}" placeholder="e.g. Captain, school football team">
        <select data-bind="activities.${i}.cat">${Object.entries(CATS).map(([k, l]) => opt(k, l, a.cat)).join("")}</select>
        <select data-bind="activities.${i}.lvl">${Object.entries(LEVELS).map(([k, l]) => opt(k, l[0], a.lvl)).join("")}</select>
        <select data-bind="activities.${i}.f"><option value="">General</option>${Object.entries(FIELDS).map(([k, l]) => opt(k, l, a.f)).join("")}</select>
        <button class="icon" data-act="delact" data-id="${a.id}" aria-label="Remove">✕</button></div>`; }).join("")}
      <button class="btn sm" data-act="addact">+ Add activity</button>`;
  }

  let pickerQ = "", pickerRegion = "", pickerField = "";
  function secPicker() {
    const q = pickerQ.toLowerCase();
    const list = UNIS.filter((u) => (!q || (u.n + " " + u.c).toLowerCase().includes(q)) && (!pickerRegion || u.r === pickerRegion) && (!pickerField || u.f.includes(pickerField)));
    const regions = [...new Set(UNIS.map((u) => u.r))];
    const picked = S.picks.map((p, i) => {
      const u = uniById(p.u);
      return `<div class="pick"><span class="num">${i + 1}</span><div class="grow"><b>${esc(u.n)}</b><span class="muted small">${esc(u.c)}</span></div>
        <select data-bind="picks.${i}.f" data-rerender>${u.f.map((k) => opt(k, FIELDS[k], p.f)).join("")}</select>
        <button class="icon" data-act="unpick" data-i="${i}" aria-label="Remove">✕</button></div>`;
    }).join("");
    return `<h2>Your top 5 universities</h2><p class="muted">Choose up to 5 universities, then pick the course you'd apply for at each.</p>
      <div class="picks">${picked || `<p class="empty">No universities picked yet.</p>`}</div>
      <div class="filters">
        <input id="pq" placeholder="Search 100 universities…" value="${esc(pickerQ)}">
        <select id="pr"><option value="">All regions</option>${regions.map((r) => opt(r, r, pickerRegion)).join("")}</select>
        <select id="pf"><option value="">All courses</option>${Object.entries(FIELDS).map(([k, l]) => opt(k, l, pickerField)).join("")}</select>
      </div>
      <div class="unilist">${list.map((u) => {
        const on = S.picks.some((p) => p.u === u.id);
        return `<div class="unirow"><div class="grow"><b>${esc(u.n)}</b><div class="muted small">${esc(u.c)} · ~${u.a}% admit · ${esc(u.req)}${u.lang ? ` · taught in ${esc(u.lang)}` : ""}</div></div>
        <button class="btn sm ${on ? "" : "primary"}" data-act="${on ? "unpickid" : "pick"}" data-id="${u.id}" ${!on && S.picks.length >= MAX_PICKS ? "disabled" : ""}>${on ? "Added ✓" : "+ Add"}</button></div>`;
      }).join("") || `<p class="empty">No matches.</p>`}</div>`;
  }

  function viewQuiz() {
    const answered = Object.keys(S.quiz).length;
    if (answered < QUIZ.length) {
      const i = answered, Q = QUIZ[i];
      return `<div class="wrap narrow onb"><a href="#/${S.onboarded ? "profile" : "onboarding"}" class="back">← Back</a>
        <div class="card pad"><div class="muted small">Question ${i + 1} of ${QUIZ.length}</div>${bar((i / QUIZ.length) * 100)}
        <h2>${esc(Q.q)}</h2><div class="quizopts">${Q.o.map((o, j) => `<button class="quizopt" data-act="quiz" data-i="${i}" data-j="${j}">${esc(o[0])}</button>`).join("")}</div></div></div>`;
    }
    const tot = {}; Object.entries(S.quiz).forEach(([i, j]) => Object.entries(QUIZ[i].o[j][1]).forEach(([k, v]) => (tot[k] = (tot[k] || 0) + v)));
    const top = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 3), max = top[0][1];
    return `<div class="wrap narrow onb"><div class="card pad"><h2>Your best-fit fields</h2><p class="muted">Based on your answers. Choose one to set it as your main interest.</p>
      ${top.map(([k, v], i) => `<div class="quizres"><div class="grow"><b>${i + 1}. ${FIELDS[k]}</b>${bar((v / max) * 100)}</div><button class="btn sm primary" data-act="quizpick" data-k="${k}">Choose</button></div>`).join("")}
      <div class="row-between"><button class="btn" data-act="quizreset">Retake</button><a class="btn" href="#/${S.onboarded ? "profile" : "onboarding"}">Back</a></div></div></div>`;
  }

  function viewDashboard() {
    const lv = level(), cc = curCycle(), n = cycleCount(cc), st = streak();
    const atRisk = n === 0 && st > 0;
    const res = S.picks.map((p) => ({ p, u: uniById(p.u), r: assess(uniById(p.u), p.f) }));
    const avg = res.length ? Math.round(mean(res.map((x) => x.r.score))) : 0;
    const allGaps = res.flatMap((x) => x.r.gaps.map((g) => ({ ...g, f: x.p.f })));
    const mainF = S.fields[0] || (S.picks[0] && S.picks[0].f) || "cs";
    const sugg = suggestFor(mainF, allGaps, 4);
    const recent = S.done.slice(-4).reverse();
    return `${nav("dashboard")}<main class="wrap">
      <div class="hello"><div><h1>Hi ${esc(S.name.split(" ")[0] || "there")} 👋</h1><p class="muted">Sprint ${cc + 1} · ${daysLeft()} day${daysLeft() === 1 ? "" : "s"} left</p></div>
      <a class="btn primary" href="#/addons">Find an add-on</a></div>
      <div class="stats">
        <div class="card stat"><div class="lab">Level ${lv.n}</div><div class="val">${S.xp} <small>XP</small></div>${bar((lv.cur / lv.need) * 100, "accent")}<div class="muted small">${lv.need - lv.cur} XP to level ${lv.n + 1}</div></div>
        <div class="card stat ${atRisk ? "risk" : ""}"><div class="lab">Sprint streak</div><div class="val">🔥 ${st} <small>sprint${st === 1 ? "" : "s"}</small></div><div class="muted small">${atRisk ? `⚠ Complete an add-on in ${daysLeft()} days to keep your streak` : n ? "Streak secured for this sprint ✓" : "Complete 1 add-on to start your streak"}</div></div>
        <div class="card stat"><div class="lab">This sprint</div><div class="val">${n} <small>add-on${n === 1 ? "" : "s"}</small></div>
          <div class="mults">${[1, 2, 3, 4].map((k) => `<span class="${n >= k ? "on" : n + 1 === k ? "next" : ""}">×${multFor(k)}</span>`).join("")}</div><div class="muted small">Next add-on earns ×${multFor(n + 1)} XP</div></div>
        <div class="card stat"><div class="lab">Average readiness</div><div class="val">${avg}<small>%</small></div>${bar(avg, "accent")}<div class="muted small">across your top ${res.length}</div></div>
      </div>
      <div class="cols">
        <section><h2>Your top ${res.length}</h2>
          ${res.map((x, i) => `<a class="card unicard" href="#/uni/${x.u.id}/${x.p.f}">${ring(x.r.score)}<div class="grow"><div class="muted small">#${i + 1} · ${esc(x.u.c)}</div><b>${esc(x.u.n)}</b><div class="small">${FIELDS[x.p.f]}</div>
            <div class="small gapline">${x.r.gaps.length ? `${x.r.gaps.length} things to improve · top: ${esc(x.r.gaps[0].t)}` : "No major gaps 🎉"}</div></div><span class="chev">›</span></a>`).join("") || `<p class="empty">No universities yet. <a href="#/unis">Pick your top 5</a>.</p>`}
        </section>
        <section><h2>Recommended this sprint</h2>
          ${sugg.map(addonCard).join("")}
          ${recent.length ? `<h2>Recent</h2><div class="card">${recent.map((d) => { const a = ADDONS.find((x) => x.id === d.a); return `<div class="recent"><span>${esc(a ? a.t : d.a)}</span><b>+${d.xp} XP</b></div>`; }).join("")}</div>` : ""}
        </section>
      </div></main>`;
  }

  function addonCard(a) {
    const times = timesDone(a.id);
    return `<div class="card addon"><div class="addon-top"><span class="cat">${CATS[a.cat]}</span><span class="xp">+${a.xp} XP</span></div>
      <b>${esc(a.t)}</b><p class="small muted">${esc(a.d)}</p>
      <div class="addon-bot"><span class="small muted">⏱ ${esc(a.effort)}${a.f.length ? " · " + a.f.slice(0, 3).map((k) => FIELDS[k]).join(", ") : " · Any field"}${times ? ` · done ×${times}` : ""}</span>
      <span>${a.url ? `<a class="btn sm ghost" href="${esc(a.url)}" target="_blank" rel="noopener">Open ↗</a>` : ""}<button class="btn sm primary" data-act="log" data-id="${a.id}">Log it</button></span></div></div>`;
  }

  let addonF = null, addonCat = "";
  function viewAddons() {
    if (addonF === null) addonF = S.fields[0] || "";
    const list = ADDONS.filter((a) => (!addonF || a.f.includes(addonF) || !a.f.length) && (!addonCat || a.cat === addonCat));
    const n = cycleCount(curCycle());
    return `${nav("addons")}<main class="wrap">
      <div class="hello"><div><h1>CV add-ons</h1><p class="muted">Small activities you can finish in a 2-week sprint. Each one goes straight onto your CV. This sprint: ${n} done, next one earns <b>×${multFor(n + 1)}</b> XP.</p></div></div>
      <div class="filters">
        <select id="af"><option value="">All fields</option>${Object.entries(FIELDS).map(([k, l]) => opt(k, l, addonF)).join("")}</select>
        <select id="ac"><option value="">All categories</option>${Object.entries(CATS).map(([k, l]) => opt(k, l, addonCat)).join("")}</select>
      </div>
      <div class="addongrid">${list.map(addonCard).join("") || `<p class="empty">No add-ons match.</p>`}</div></main>`;
  }

  function viewUnis() {
    return `${nav("unis")}<main class="wrap"><div class="card pad">${secPicker()}</div></main>`;
  }

  function viewUni(id, f) {
    const u = uniById(Number(id)); if (!u) return viewDashboard();
    const pick = S.picks.find((p) => p.u === u.id); f = f || (pick && pick.f) || u.f[0];
    const r = assess(u, f), sugg = suggestFor(f, r.gaps, 4);
    const sevL = { 3: "High", 2: "Medium", 1: "Low" };
    return `${nav("unis")}<main class="wrap">
      <a href="#/dashboard" class="back">← Dashboard</a>
      <div class="card pad unihead">${ring(r.score, 96)}<div class="grow"><div class="muted small">${esc(u.c)} · ${esc(u.r)}</div><h1>${esc(u.n)}</h1><div>${FIELDS[f]}</div>
        <div class="facts"><span>~${u.a}% admit rate</span><span>${esc(u.req)}</span>${u.sat ? `<span>SAT ~${u.sat}</span>` : ""}${u.lang ? `<span>Taught in ${esc(u.lang)}</span>` : ""}</div></div></div>
      ${u.note ? `<div class="note">💡 ${esc(u.note)}</div>` : ""}
      ${u.c === "USA" && (f === "med" || f === "law") ? `<div class="note">ℹ In the US, ${f === "med" ? "Medicine" : "Law"} is a graduate degree. You'd apply as a pre-${f === "med" ? "med" : "law"} undergraduate.</div>` : ""}
      <div class="cols">
        <section><h2>Readiness breakdown</h2><div class="card pad">${Object.entries(r.parts).map(([k, v]) => `<div class="part"><span>${k}</span>${bar(v * 100, v >= 0.75 ? "good" : v >= 0.5 ? "mid" : "low")}<b>${Math.round(v * 100)}%</b></div>`).join("")}
          <p class="small muted">Readiness compares your profile to what this university typically expects. At a ~${u.a}% admit rate, even a strong profile isn't a guarantee.</p></div>
          <h2>What to improve</h2>${r.gaps.map((g) => `<div class="card gap sev${g.sev}"><div class="gap-top"><span class="tag">${g.k}</span><span class="sev">${sevL[g.sev]} priority</span></div><b>${esc(g.t)}</b><p class="small muted">${esc(g.d)}</p></div>`).join("") || `<p class="empty">No gaps found 🎉</p>`}
          ${r.goods.length ? `<h2>Strengths</h2><div class="card pad">${r.goods.map((g) => `<div class="good">✓ ${esc(g)}</div>`).join("")}</div>` : ""}
        </section>
        <section><h2>Add-ons for this goal</h2>${sugg.map(addonCard).join("")}</section>
      </div>
      <p class="small muted disclaimer">Figures are approximate. Always check the university's official admissions page.</p></main>`;
  }

  function viewCV() {
    const grouped = {};
    S.activities.filter((a) => a.t).forEach((a) => (grouped[a.cat] = grouped[a.cat] || []).push(a));
    const tests = [["SAT", S.tests.sat], ["ACT", S.tests.act], ["IELTS", S.tests.ielts], ["TOEFL iBT", S.tests.toefl]].filter((x) => x[1]);
    const mainF = S.fields.map((k) => FIELDS[k]);
    const summary = S.summary || `Motivated ${S.age}-year-old student${S.contact.school ? ` at ${S.contact.school}` : ""} with a strong interest in ${mainF[0] || "my chosen field"}${mainF[1] ? ` and ${mainF[1]}` : ""}, actively building experience through competitions, courses and projects.`;
    return `${nav("cv")}<main class="wrap">
      <div class="hello noprint"><div><h1>My CV</h1><p class="muted">Built automatically from your profile and completed add-ons. Click the summary to edit it.</p></div><button class="btn primary" data-act="print">Save as PDF</button></div>
      <article class="cv">
        <header><h1>${esc(S.name || "Your Name")}</h1><div class="cv-contact">${[S.contact.email, S.contact.city, S.country].filter(Boolean).map(esc).join(" · ")}</div></header>
        <p class="cv-summary" contenteditable="true" data-cvsummary>${esc(summary)}</p>
        <h2>Education</h2><div class="cv-item"><div class="cv-row"><b>${esc(S.contact.school || "School")}</b><span>${esc(BOARDS[S.curriculum] ? BOARDS[S.curriculum].label : "")}</span></div>
          ${S.grades.length ? `<div class="cv-grades">${S.grades.filter((g) => g.g !== "").map((g) => `<span>${esc(g.s)}${g.l ? ` (${esc(g.l)})` : ""}: <b>${esc(g.g)}${g.b === "PCT" ? "%" : ""}</b></span>`).join("")}</div>` : ""}</div>
        ${tests.length ? `<h2>Test scores</h2><div class="cv-grades">${tests.map((t) => `<span>${t[0]}: <b>${esc(t[1])}</b></span>`).join("")}</div>` : ""}
        ${Object.keys(CATS).filter((c) => grouped[c]).map((c) => `<h2>${CATS[c]}</h2><ul>${grouped[c].map((a) => `<li><span>${esc(a.t)}</span><span class="cv-meta">${LEVELS[a.lvl] ? LEVELS[a.lvl][0] : ""}${a.ts ? " · " + fmtDate(a.ts) : ""}</span></li>`).join("")}</ul>`).join("")}
        ${S.languages.filter((l) => l.lang).length ? `<h2>Languages</h2><div class="cv-grades">${S.languages.filter((l) => l.lang).map((l) => `<span>${esc(l.lang)}: <b>${esc(l.lvl)}</b></span>`).join("")}</div>` : ""}
        ${mainF.length ? `<h2>Academic interests</h2><p>${mainF.map(esc).join(", ")}</p>` : ""}
      </article></main>`;
  }

  function viewProfile() {
    return `${nav("profile")}<main class="wrap narrow">
      <div class="card pad">${secAbout()}</div>
      <div class="card pad">${secInterest()}</div>
      <div class="card pad">${secGrades()}</div>
      <div class="card pad">${secExtras()}</div>
      <div class="card pad"><h2>Demo tools</h2><p class="muted small">For testing the sprint system without waiting two weeks.</p>
        <div class="row-gap"><button class="btn" data-act="skip">Jump to next sprint</button><button class="btn danger" data-act="reset">Reset all data</button></div></div>
    </main>`;
  }

  /* ---------- modal ---------- */
  function openLog(a) {
    const m = document.createElement("div"); m.className = "modal-bg";
    const n = cycleCount(curCycle()) + 1;
    m.innerHTML = `<div class="modal card pad" role="dialog" aria-modal="true"><h2>Log: ${esc(a.t)}</h2>
      <p class="muted small">This line goes onto your CV. Make it specific: what, where, result.</p>
      <textarea rows="3" id="cvline">${esc(a.cv)}</textarea>
      <div class="earn">You'll earn <b>${Math.round(a.xp * multFor(n))} XP</b> (${a.xp} × ${multFor(n)} sprint multiplier, add-on #${n} this sprint)</div>
      <div class="row-between"><button class="btn" data-m="cancel">Cancel</button><button class="btn primary" data-m="ok">Add to my CV</button></div></div>`;
    document.body.appendChild(m);
    m.querySelector("textarea").focus();
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b && e.target !== m) return;
      if (b && b.dataset.m === "ok") { completeAddon(a, m.querySelector("textarea").value.trim()); render(); }
      m.remove();
    });
  }

  /* ---------- router / render ---------- */
  function render() {
    const h = location.hash.replace(/^#\/?/, "").split("/");
    const route = h[0] || "";
    let html;
    if (route === "quiz") html = viewQuiz();
    else if (!S.onboarded) html = S.step === 0 && route !== "onboarding" && !S.started ? viewLanding() : viewOnboarding();
    else if (route === "unis") html = viewUnis();
    else if (route === "uni") html = viewUni(h[1], h[2]);
    else if (route === "addons") html = viewAddons();
    else if (route === "cv") html = viewCV();
    else if (route === "profile") html = viewProfile();
    else html = viewDashboard();
    app.innerHTML = html;
  }

  /* ---------- events ---------- */
  app.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.bind) { setPath(S, el.dataset.bind, el.value); save(); }
    if (el.id === "pq") { pickerQ = el.value; const pos = el.selectionStart; render(); const n = document.getElementById("pq"); n.focus(); n.setSelectionRange(pos, pos); }
    if (el.hasAttribute("data-cvsummary")) { S.summary = el.textContent; save(); }
  });
  app.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.bind && el.hasAttribute("data-rerender")) {
      if (/^grades\.\d+\.b$/.test(el.dataset.bind)) { const g = getPath(S, el.dataset.bind.replace(/\.b$/, "")); g.g = ""; g.l = (BOARDS[g.b].levels[0] || ""); save(); }
      render();
    }
    if (el.id === "pr") { pickerRegion = el.value; render(); }
    if (el.id === "pf") { pickerField = el.value; render(); }
    if (el.id === "af") { addonF = el.value; render(); }
    if (el.id === "ac") { addonCat = el.value; render(); }
  });
  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const d = b.dataset, act = d.act;
    switch (act) {
      case "start": S.started = true; save(); location.hash = "#/onboarding"; break;
      case "next": S.step = Math.min(4, S.step + 1); break;
      case "prev": S.step = Math.max(0, S.step - 1); break;
      case "finish": S.onboarded = true; location.hash = "#/dashboard"; break;
      case "field": {
        const i = S.fields.indexOf(d.k);
        if (i >= 0) S.fields.splice(i, 1); else if (S.fields.length < 3) S.fields.push(d.k); else toast("You can pick up to 3. Remove one first.");
        break;
      }
      case "addgrade": { const bd = S.curriculum; S.grades.push({ s: "Mathematics", b: bd, l: BOARDS[bd].levels[0] || "", g: "" }); break; }
      case "delgrade": S.grades.splice(Number(d.i), 1); break;
      case "addlang": S.languages.push({ lang: "", lvl: "B2" }); break;
      case "dellang": S.languages.splice(Number(d.i), 1); break;
      case "addact": S.activities.push({ id: uid(), cat: "leadership", t: "", lvl: "school", f: "", src: "manual", ts: Date.now() }); break;
      case "delact": S.activities = S.activities.filter((a) => a.id !== d.id); break;
      case "pick": {
        const u = uniById(Number(d.id)); if (S.picks.length >= MAX_PICKS) break;
        const f = S.fields.find((k) => u.f.includes(k)) || u.f[0];
        S.picks.push({ u: u.id, f }); break;
      }
      case "unpick": S.picks.splice(Number(d.i), 1); break;
      case "unpickid": S.picks = S.picks.filter((p) => p.u !== Number(d.id)); break;
      case "quiz": S.quiz[d.i] = Number(d.j); break;
      case "quizreset": S.quiz = {}; break;
      case "quizpick": S.fields = [d.k, ...S.fields.filter((k) => k !== d.k)].slice(0, 3); save(); location.hash = S.onboarded ? "#/profile" : "#/onboarding"; return;
      case "log": { const a = ADDONS.find((x) => x.id === d.id); if (a) openLog(a); return; }
      case "print": window.print(); return;
      case "skip": S.created -= CYCLE; save(); toast("Moved to the next sprint"); break;
      case "reset": if (confirm("Delete all your Vita data on this device?")) { S = fresh(); save(); location.hash = ""; } break;
    }
    save(); render();
  });
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
  render();
})();
