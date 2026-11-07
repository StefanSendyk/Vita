/* Vita — app */
(function () {
  "use strict";
  const UNIS = window.VITA_UNIS;
  const { FIELDS, CATS, LEVELS, FIELDREQ, SUBJECTS, BOARDS, QUIZ, ADDONS } = window.VITA;
  const ART = window.VITA_ART, ICON = ART.ICON;
  const KEY = "vita.v1";
  const DAY = 864e5, CYCLE = 14 * DAY, MAX_PICKS = 5;
  const app = document.getElementById("app");

  /* ---------- state ---------- */
  function fresh() {
    return {
      v: 1, created: Date.now(), onboarded: false, step: 0,
      name: "", age: "16", country: "", curriculum: "IB", englishNative: "no",
      contact: { email: "", city: "", school: "" }, summary: "", headline: "", photo: "", banner: "", bannerStyle: "hero", freezes: 1, frozen: [], badges: [], cvTpl: "classic", cvPhoto: true, addonWhere: "me", statement: { fmt: "ucas", ucas: ["", "", ""], ca: "", caPrompt: "0", ml: "" }, edu: { start: "", end: "" }, exams: [], courses: [], skills: [],
      fields: [], grades: [], tests: { sat: "", act: "", ielts: "", toefl: "" },
      languages: [], activities: [], picks: [], done: [], xp: 0, quiz: {}
    };
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(fresh(), s); } catch (e) {}
    return fresh();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }

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
    return { score, gaps, goods, parts, pts, tgt, W };
  }

  const EU = ["austria", "belgium", "bulgaria", "croatia", "cyprus", "czech", "denmark", "estonia", "finland", "france", "germany", "greece", "hungary", "ireland", "italy", "latvia", "lithuania", "luxembourg", "malta", "netherlands", "poland", "portugal", "romania", "slovakia", "slovenia", "spain", "sweden"];
  const REGION_L = { global: "🌐 Online / global", uk: "🇬🇧 UK", us: "🇺🇸 US", ca: "🇨🇦 Canada", pl: "🇵🇱 Poland", de: "🇩🇪 Germany", eu: "🇪🇺 EU", au: "🇦🇺 Australia / NZ" };
  function userRegions() {
    const c = (S.country || "").toLowerCase().trim(), r = ["global"]; if (!c) return r;
    if (/united kingdom|^uk$|england|scotland|wales|britain/.test(c)) r.push("uk");
    if (/united states|^usa?$|america/.test(c)) r.push("us");
    if (/canada/.test(c)) r.push("ca");
    if (/poland|polska/.test(c)) r.push("pl");
    if (/germany|deutschland/.test(c)) r.push("de");
    if (/australia|new zealand/.test(c)) r.push("au");
    if (EU.some((x) => c.includes(x))) r.push("eu");
    return r;
  }
  const forMe = (a) => { const r = userRegions(); return a.w.some((x) => r.includes(x)); };
  function suggestFor(f, gaps, n) {
    const missing = new Set(gaps.filter((g) => g.cat).map((g) => g.cat));
    const scored = ADDONS.map((a) => {
      let s = 0;
      if (!forMe(a)) return null;
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
  const kept = (c) => cycleCount(c) > 0 || S.frozen.includes(c);
  function streak() { const cc = curCycle(); let c = kept(cc) ? cc : cc - 1, s = 0; while (c >= 0 && kept(c)) { if (cycleCount(c) > 0) s++; c--; } return s; }
  function applyFreezes() {
    // auto-use a freeze for each fully missed sprint, if the streak was alive before it
    const cc = curCycle(); let used = 0;
    for (let c = 1; c < cc; c++) {
      if (kept(c) || S.freezes <= 0) continue;
      let p = c - 1, alive = false; while (p >= 0 && kept(p)) { if (cycleCount(p) > 0) { alive = true; break; } p--; }
      if (!alive) continue;
      if (S.done.some((d) => d.cycle > c) || c === cc - 1) { S.frozen.push(c); S.freezes--; used++; }
    }
    if (used) { save(); setTimeout(() => toast(`❄️ Streak freeze used. Your streak survived a missed sprint!`), 400); }
  }
  function daysLeft() { const end = S.created + (curCycle() + 1) * CYCLE; return Math.ceil((end - Date.now()) / DAY); }
  const lvlStart = (n) => 50 * n * (n - 1);
  function level() { let n = 1; while (S.xp >= lvlStart(n + 1)) n++; return { n, cur: S.xp - lvlStart(n), need: lvlStart(n + 1) - lvlStart(n) }; }

  function completeAddon(a, cvLine) {
    const cc = curCycle(), n = cycleCount(cc) + 1, m = multFor(n);
    const bonus = n === 1 && streak() > 0 ? 10 * streak() : 0;
    const xp = Math.round(a.xp * m) + bonus, lvBefore = level().n;
    S.done.push({ a: a.id, ts: Date.now(), cycle: cc, xp, mult: m });
    if (n === 1) { const st = streak(); if (st > 0 && st % 3 === 0 && S.freezes < 2) { S.freezes++; setTimeout(() => toast("❄️ You earned a streak freeze!"), 1600); } }
    S.xp += xp;
    const f = a.f.includes(S.fields[0]) ? S.fields[0] : (a.f[0] || "");
    S.activities.push({ id: uid(), cat: a.cat, t: cvLine || a.cv, lvl: a.pts >= 4 ? "international" : a.pts === 3 ? "national" : a.pts === 2 ? "regional" : "school", pts: a.pts, f, src: "addon", ts: Date.now() });
    save();
    toast(`+${xp} XP${m > 1 ? ` · ×${m} sprint multiplier` : ""}${bonus ? ` · +${bonus} streak bonus` : ""}`);
    return { xp, leveled: level().n > lvBefore ? level().n : 0 };
  }

  /* ---------- delight: confetti, XP float, count-up, tilt ---------- */
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PALETTE = ["#2a4343", "#416b66", "#646756", "#f1d49a", "#d35e36", "#c0c29d"];
  function confetti(n) {
    if (reduced()) return;
    const x0 = innerWidth / 2, y0 = innerHeight / 2.4;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i"); el.className = "confetti";
      el.style.background = PALETTE[i % PALETTE.length]; el.style.left = x0 + "px"; el.style.top = y0 + "px";
      if (i % 3 === 0) el.style.borderRadius = "50%";
      document.body.appendChild(el);
      const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 260;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.7 + 180 + Math.random() * 120;
      el.animate([{ transform: "translate(-50%,-50%) rotate(0)", opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }],
        { duration: 1100 + Math.random() * 700, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" }).onfinish = () => el.remove();
    }
  }
  function floatXP(xp) {
    const chip = document.querySelector(".chip.lvl"); if (!chip || reduced()) return;
    const r = chip.getBoundingClientRect(), el = document.createElement("div");
    el.className = "xpfloat"; el.textContent = `+${xp} XP`; el.style.left = r.left + r.width / 2 + "px"; el.style.top = r.bottom + 8 + "px";
    document.body.appendChild(el); setTimeout(() => el.remove(), 1600);
    chip.classList.add("bump"); setTimeout(() => chip.classList.remove("bump"), 700);
  }
  function celebrate(res) {
    confetti(res.leveled ? 140 : 70); floatXP(res.xp);
    if (res.leveled) {
      const m = document.createElement("div"); m.className = "levelup";
      m.innerHTML = `<div class="levelup-card"><div class="levelup-badge">${res.leveled}</div><h2>Level ${res.leveled}!</h2><p>Your CV keeps getting stronger. Keep the sprint going.</p><button class="btn primary">Continue</button></div>`;
      document.body.appendChild(m); m.addEventListener("click", () => { m.classList.add("out"); setTimeout(() => m.remove(), 250); });
    }
  }
  function countUp() {
    app.querySelectorAll("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count); if (!to || reduced() || document.hidden) return;
      const t0 = performance.now(), dur = 900;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(step); };
      el.textContent = "0"; requestAnimationFrame(step);
    });
  }
  function bindTilt() {
    if (reduced() || !matchMedia("(hover: hover)").matches) return;
    app.querySelectorAll(".tilt").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-3px)`;
        el.style.setProperty("--mx", (x + 0.5) * 100 + "%"); el.style.setProperty("--my", (y + 0.5) * 100 + "%");
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
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
      <defs><linearGradient id="rg-${cls}" x1="0" y1="0" x2="1" y2="1">${{ good: '<stop offset="0" stop-color="#2a4343"/><stop offset="1" stop-color="#7fa39c"/>', mid: '<stop offset="0" stop-color="#d9a441"/><stop offset="1" stop-color="#f1d49a"/>', low: '<stop offset="0" stop-color="#d35e36"/><stop offset="1" stop-color="#e9a07a"/>' }[cls]}</linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="url(#rg-${cls})" style="--c:${c}" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle">${p}%</text></svg>`;
  }
  const bar = (p, cls = "") => `<div class="bar ${cls}"><span style="width:${clamp(p, 0, 100)}%"></span></div>`;
  const uniById = (id) => UNIS[id];

  /* ---------- views ---------- */
  function nav(active) {
    const items = [["home", "Home"], ["unis", "Universities"], ["addons", "Add-ons"], ["plan", "Plan"], ["cv", "My CV"], ["profile", "Profile"]];
    const lv = level();
    return `<header class="topbar"><div class="wrap topbar-in">
      <a href="#/home" class="brand"><span class="logo">V</span>Vita</a>
      <nav>${items.map(([k, l]) => `<a href="#/${k}" class="${active === k ? "on" : ""}">${l}</a>`).join("")}</nav>
      <div class="chips"><a href="#/streak" class="chip streak ${active === "streak" ? "on" : ""}" title="Open your streak"><span class="flame">🔥</span> ${streak()} <span class="chip-l">Streak</span></a><span class="chip lvl" title="Level">Lv ${lv.n} · ${S.xp} XP</span><a href="#/cv" class="nav-av ${S.photo ? "has" : ""}" title="My CV">${avatarInner()}</a></div>
    </div></header>`;
  }

  function viewLanding() {
    return `<div class="landing"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
      <div class="wrap landing-in">
        <div class="landing-copy">
          <div class="brand big"><span class="logo">V</span>Vita</div>
          <span class="eyebrow">For students aged 14–18</span>
          <h1>Build the CV your <span class="grad-text">dream university</span> is looking for.</h1>
          <p class="lead">Pick your top 5 universities. Vita shows what you're missing and gives you small CV add-ons to complete every two weeks. Keep your streak going and watch your readiness grow.</p>
          <div class="row-gap center"><button class="btn primary lg" data-act="start">Get started, it's free →</button><span class="muted small">100 universities · 50 CV add-ons · no sign-up</span></div>
        </div>
        <div class="landing-visual" aria-hidden="true">
          <div class="mock m1">${ring(82, 72)}<div><div class="muted small">#1 · UK</div><b>Imperial College London</b><div class="small muted">Computer Science</div></div></div>
          <div class="mock m2"><div class="lab">Sprint streak</div><div class="val">🔥 6 <small>sprints</small></div><div class="mults"><span class="on">×1</span><span class="on">×1.25</span><span class="next">×1.5</span><span>×2</span></div></div>
          <div class="mock m3"><div class="addon-top"><span class="cat">Competitions</span><span class="xp">+90 XP</span></div><b>Enter your national Math Olympiad</b></div>
        </div>
      </div>
      <div class="wrap"><div class="how">
        <div class="tilt"><b>1</b><h3>Tell us about you</h3><p>Grades, interests and anything you've already done.</p></div>
        <div class="tilt"><b>2</b><h3>Pick 5 universities</h3><p>Choose from 100 universities worldwide, with realistic requirements.</p></div>
        <div class="tilt"><b>3</b><h3>Close the gaps</h3><p>Complete add-ons in 2-week sprints. The more you do, the bigger your multiplier.</p></div>
      </div></div></div>`;
  }

  const STEPS = ["About you", "Career interest", "Top 5 universities"];
  const STEP_META = [
    { art: "about", tip: "Your name and school go at the top of your CV. Email and city are optional." },
    { art: "career", tip: "Not sure yet? The 8-question quiz takes about a minute." },
    { art: "unis", tip: "Aim for a mix: 1–2 dream schools, 2 targets, 1 safer choice." }
  ];
  const FIELD_ICON = { cs: "💻", eng: "⚙️", med: "🩺", law: "⚖️", bus: "📈", math: "➗", sci: "🔬", psy: "🧠", arch: "🏛️", hum: "📚", pol: "🌍", des: "🎨" };
  const BOARD_DESC = { IB: "International Baccalaureate", ALEVEL: "UK sixth form", AP: "US Advanced Placement", GCSE: "UK / international", US: "Letter grades & GPA", PCT: "Matura, Abitur, Bac…" };
  function setupSteps() {
    return [
      { label: STEPS[0], done: !!S.name.trim() },
      { label: STEPS[1], done: S.fields.length > 0 },
      { label: STEPS[2], done: S.picks.length > 0 }
    ];
  }
  function initials(n) { return (n || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(""); }
  const REGION_G = { "Europe": ["#2a4343", "#416b66"], "North America": ["#416b66", "#9aa785"], "Asia": ["#d35e36", "#e9a86a"], "Oceania": ["#646756", "#a7a983"], "Africa": ["#c98a3a", "#f1d49a"], "Latin America": ["#b0502e", "#646756"] };
  function crest(u, size = 42) {
    const ab = (u.n.match(/\(([^)]+)\)/) || [])[1];
    let ini = ab ? ab.split(" ")[0] : "";
    if (!ini) {
      const caps = u.n.split(" ").find((w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w));
      if (caps) ini = caps;
      else {
        const words = u.n.replace(/\(.*\)/, "").split(/[\s,.-]+/).filter((w) => w && !/^(University|of|the|The|de|di|and|College|Institute|School|Royal|National|Technical|Technology|Free)$/.test(w)).slice(0, 2);
        ini = words.length === 1 ? words[0].slice(0, 3).toUpperCase() : words.map((w) => w[0]).join("");
      }
    }
    ini = ini.slice(0, 4);
    const g = REGION_G[u.r] || REGION_G.Europe;
    return `<span class="crest" style="--s:${size}px;--fs:${ini.length > 2 ? 0.26 : 0.36};background:linear-gradient(135deg,${g[0]},${g[1]})">${esc(ini)}</span>`;
  }
  const avatarInner = () => (S.photo ? `<img src="${S.photo}" alt="Profile photo">` : esc(initials(S.name)) || "?");
  const photoInput = (kind) => `<input type="file" accept="image/*" data-img="${kind}" hidden>`;
  const BANNERS = { hero: "linear-gradient(120deg,#2a4343 0%,#416b66 55%,#646756 100%)", sunset: "linear-gradient(120deg,#d35e36,#e48a55 45%,#f1d49a)", sage: "linear-gradient(120deg,#416b66,#c0c29d)", dusk: "linear-gradient(120deg,#2a4343,#646756 55%,#d35e36)", meadow: "linear-gradient(120deg,#646756,#c0c29d 60%,#f1d49a)", sand: "linear-gradient(120deg,#f1d49a,#fdf6e7 60%,#c0c29d)" };
  function handleImg(el) {
    const f = el.files && el.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) { toast("Please choose an image file (JPG or PNG)"); return; }
    const isB = el.dataset.img === "banner", key = isB ? "banner" : "photo";
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const W = isB ? 1500 : 400, H = 400, c = document.createElement("canvas"); c.width = W; c.height = H;
        const sc = Math.max(W / im.width, H / im.height), w = im.width * sc, h = im.height * sc;
        c.getContext("2d").drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
        const prev = S[key]; S[key] = c.toDataURL("image/jpeg", isB ? 0.8 : 0.85);
        if (!save()) { S[key] = prev; toast("Couldn't save that image. Try a smaller one."); return; }
        render(); toast(isB ? "Banner updated ✓" : "Profile photo updated ✓");
      };
      im.onerror = () => toast("Couldn't read that image. Try a JPG or PNG.");
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
  function previewCard() {
    const avg = academicAvg(), b = BOARDS[S.curriculum];
    return `<div class="pv-top"><span class="avatar ${S.photo ? "has" : ""}">${avatarInner()}</span><div class="grow"><b>${esc(S.name || "Your name")}</b><div class="small muted">${esc(S.contact.school || "Your school")} · age ${esc(S.age)}</div></div></div>
      <div class="pv-row"><span>Curriculum</span><b>${esc(b ? b.label : "—")}</b></div>
      <div class="pv-row"><span>Academic estimate</span><b>${avg != null ? `≈ IB ${scoreToIb(avg)}/45` : "—"}</b></div>
      <div class="pv-row"><span>Top 5 picked</span><b>${S.picks.length}/5</b></div>
      <div class="pv-fields">${S.fields.map((k, i) => `<span class="${i === 0 ? "main" : ""}">${FIELD_ICON[k]} ${FIELDS[k]}</span>`).join("") || `<span class="muted small">No career interest yet</span>`}</div>`;
  }
  function updatePreview() { const p = document.getElementById("preview"); if (p) p.innerHTML = previewCard(); }

  function viewSetup() {
    if (!(S.step >= 0 && S.step < STEPS.length)) S.step = 0;
    const st = S.step, steps = setupSteps(), doneN = steps.filter((x) => x.done).length, meta = STEP_META[st];
    const body = [secAbout, secInterest, secPicker][st]();
    return `${nav("profile")}<main class="wrap setup">
      <div class="setup-head"><div><span class="eyebrow">My profile · ${doneN}/${STEPS.length} complete</span><h1>${STEPS[st]}</h1></div><a class="btn ghost" href="#/home">← Back to home</a></div>
      <div class="steps">${STEPS.map((x, i) => `<button class="${steps[i].done ? "done" : ""} ${i === st ? "on" : ""}" data-act="goto" data-i="${i}"><span>${steps[i].done && i !== st ? "✓" : i + 1}</span>${x}</button>`).join("")}</div>
      <div class="setup-grid">
        <aside class="setup-side">
          <div class="art-card" key="${st}">${ART[meta.art]}<p class="art-tip">💡 ${meta.tip}</p></div>
          <div class="card preview"><div class="pv-label">Live preview</div><div id="preview">${previewCard()}</div></div>
          <a class="card movedcard" href="#/cv"><span class="mc-ic">📊</span><span class="grow"><b>Grades, exams, languages & activities</b><span class="small muted">are now edited directly in My CV</span></span><span class="chev">›</span></a>
        </aside>
        <div class="setup-main">
          <div class="card pad setup-form">${body}</div>
          <div class="onb-nav">
            ${st > 0 ? `<button class="btn" data-act="prev">← Back</button>` : "<span></span>"}
            ${st < STEPS.length - 1 ? `<button class="btn primary" data-act="next">Continue →</button>` : `<a class="btn warm" href="#/home">Finish → Home</a>`}
          </div>
        </div>
      </div>
      <details class="demo"><summary>Demo tools</summary><p class="muted small">For testing the sprint system without waiting two weeks.</p>
        <div class="row-gap"><button class="btn sm" data-act="skip">Jump to next sprint</button><button class="btn sm danger" data-act="reset">Reset all data</button></div></details>
    </main>`;
  }

  function secAbout() {
    return `<p class="muted">This is used for your CV and to tailor suggestions.</p>
      <div class="photo-up">
        <label class="avatar big ${S.photo ? "has" : ""}" title="Upload photo">${avatarInner()}<span class="av-cam">📷</span>${photoInput("photo")}</label>
        <div><b>Profile photo</b><div class="small muted">Shown on your profile and your CV. Square photos work best.</div>
          <div class="row-gap" style="margin-top:8px"><label class="btn sm primary">⬆ ${S.photo ? "Change photo" : "Upload photo"}${photoInput("photo")}</label>${S.photo ? `<button class="btn sm danger" data-act="photo-rm">Remove</button>` : ""}</div></div>
      </div>
      <div class="grid2">
        <label>Full name<input data-bind="name" value="${esc(S.name)}" placeholder="e.g. Alex Kowalski" autocomplete="name"></label>
        <label>School<input data-bind="contact.school" value="${esc(S.contact.school)}" placeholder="School name"></label>
      </div>
      <div class="fieldset"><div class="flabel">Age</div><div class="pillrow">${[14, 15, 16, 17, 18, 19].map((a) => `<button class="pill ${String(S.age) === String(a) ? "on" : ""}" data-act="set" data-k="age" data-v="${a}">${a}</button>`).join("")}</div></div>
      <div class="fieldset"><div class="flabel">Main curriculum</div><div class="optgrid">${Object.entries(BOARDS).map(([k, b]) => `<button class="optcard ${S.curriculum === k ? "on" : ""}" data-act="set" data-k="curriculum" data-v="${k}"><b>${b.label}</b><span>${BOARD_DESC[k]}</span></button>`).join("")}</div></div>
      <div class="fieldset"><div class="flabel">Is English your first language?</div><div class="toggle">${[["yes", "Yes"], ["no", "No"]].map(([v, l]) => `<button class="${S.englishNative === v ? "on" : ""}" data-act="set" data-k="englishNative" data-v="${v}">${l}</button>`).join("")}</div></div>
      <div class="grid3">
        <label>Country<input data-bind="country" value="${esc(S.country)}" placeholder="e.g. Poland"></label>
        <label><span>Email <span class="opt">· optional</span></span><input data-bind="contact.email" type="email" value="${esc(S.contact.email)}" placeholder="you@example.com"></label>
        <label><span>City <span class="opt">· optional</span></span><input data-bind="contact.city" value="${esc(S.contact.city)}" placeholder="e.g. Warsaw"></label>
      </div>`;
  }

  function secInterest() {
    return `<p class="muted">Pick up to 3. The first one you pick is your main interest.</p>
      <div class="fieldgrid">${Object.entries(FIELDS).map(([k, l]) => {
        const i = S.fields.indexOf(k);
        return `<button class="fieldbtn ${i >= 0 ? "on" : ""}" data-act="field" data-k="${k}"><span class="fi">${FIELD_ICON[k]}</span>${i >= 0 ? `<em>${i + 1}</em>` : ""}<span>${l}</span></button>`;
      }).join("")}</div>
      <div class="quizcta"><div><b>Not sure yet?</b><br><span class="muted">Answer 8 quick questions and we'll suggest fields.</span></div><a class="btn" href="#/quiz">Take the quiz →</a></div>`;
  }

  let pickerQ = "", pickerRegion = "", pickerField = "";
  function secPicker() {
    const q = pickerQ.toLowerCase();
    const list = UNIS.filter((u) => (!q || (u.n + " " + u.c).toLowerCase().includes(q)) && (!pickerRegion || u.r === pickerRegion) && (!pickerField || u.f.includes(pickerField)));
    const regions = [...new Set(UNIS.map((u) => u.r))];
    const picked = S.picks.map((p, i) => {
      const u = uniById(p.u);
      return `<div class="pick"><span class="num">${i + 1}</span>${crest(u, 36)}<div class="grow"><b>${esc(u.n)}</b><span class="muted small">${esc(u.c)}</span></div>
        <select data-bind="picks.${i}.f" data-rerender>${u.f.map((k) => opt(k, FIELDS[k], p.f)).join("")}</select>
        <button class="icon" data-act="unpick" data-i="${i}" aria-label="Remove">✕</button></div>`;
    }).join("");
    return `<p class="muted">Choose up to 5 universities, then pick the course you'd apply for at each.</p>
      <div class="picks">${picked || `<p class="empty">No universities picked yet.</p>`}</div>
      <div class="filters">
        <input id="pq" placeholder="Search 100 universities…" value="${esc(pickerQ)}">
        <select id="pf"><option value="">All courses</option>${Object.entries(FIELDS).map(([k, l]) => opt(k, l, pickerField)).join("")}</select>
      </div>
      <div class="chiprow">${[["", "All regions"], ...regions.map((r) => [r, r])].map(([k, l]) => `<button class="pill ${pickerRegion === k ? "on" : ""}" data-act="preg" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="unilist">${list.map((u) => {
        const on = S.picks.some((p) => p.u === u.id);
        return `<div class="unirow">${crest(u)}<a class="grow unilink" href="#/uni/${u.id}"><b>${esc(u.n)}</b><div class="muted small">${esc(u.c)} · ~${u.a}% admit · ${esc(u.req)}${u.lang ? ` · taught in ${esc(u.lang)}` : ""}</div></a>
        <button class="btn sm ${on ? "" : "primary"}" data-act="${on ? "unpickid" : "pick"}" data-id="${u.id}" ${!on && S.picks.length >= MAX_PICKS ? "disabled" : ""}>${on ? "Added ✓" : "+ Add"}</button></div>`;
      }).join("") || `<p class="empty">No matches.</p>`}</div>`;
  }

  function viewQuiz() {
    const answered = Object.keys(S.quiz).length;
    if (answered < QUIZ.length) {
      const i = answered, Q = QUIZ[i];
      return `<div class="wrap narrow onb"><a href="#/profile" class="back">← Back to profile</a>
        <div class="card pad"><div class="muted small">Question ${i + 1} of ${QUIZ.length}</div>${bar((i / QUIZ.length) * 100)}
        <h2>${esc(Q.q)}</h2><div class="quizopts">${Q.o.map((o, j) => `<button class="quizopt" data-act="quiz" data-i="${i}" data-j="${j}">${esc(o[0])}</button>`).join("")}</div></div></div>`;
    }
    const tot = {}; Object.entries(S.quiz).forEach(([i, j]) => Object.entries(QUIZ[i].o[j][1]).forEach(([k, v]) => (tot[k] = (tot[k] || 0) + v)));
    const top = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 3), max = top[0][1];
    return `<div class="wrap narrow onb"><div class="card pad"><h2>Your best-fit fields</h2><p class="muted">Based on your answers. Choose one to set it as your main interest.</p>
      ${top.map(([k, v], i) => `<div class="quizres"><div class="grow"><b>${i + 1}. ${FIELDS[k]}</b>${bar((v / max) * 100)}</div><button class="btn sm primary" data-act="quizpick" data-k="${k}">Choose</button></div>`).join("")}
      <div class="row-between"><button class="btn" data-act="quizreset">Retake</button><a class="btn" href="#/profile">Back</a></div></div></div>`;
  }

  let homeQ = "";
  function homeResults() {
    const q = homeQ.trim().toLowerCase(); if (!q) return "";
    const list = UNIS.filter((u) => (u.n + " " + u.c + " " + u.r).toLowerCase().includes(q)).slice(0, 6);
    if (!list.length) return `<div class="sr-empty">No universities match “${esc(homeQ)}”.</div>`;
    return list.map((u) => {
      const on = S.picks.some((p) => p.u === u.id);
      return `<div class="sr-row">${crest(u, 38)}<a class="grow unilink" href="#/uni/${u.id}"><b>${esc(u.n)}</b><div class="small muted">${esc(u.c)} · ~${u.a}% admit · ${esc(u.req)}</div></a>
        <button class="btn sm ${on ? "" : "primary"}" data-act="${on ? "unpickid" : "pick"}" data-id="${u.id}" ${!on && S.picks.length >= MAX_PICKS ? "disabled" : ""}>${on ? "✓ Top 5" : "+ Top 5"}</button></div>`;
    }).join("") + `<a class="sr-all" href="#/unis">Browse all 100 universities →</a>`;
  }
  function viewHome() {
    const lv = level(), cc = curCycle(), n = cycleCount(cc), st = streak();
    const atRisk = n === 0 && st > 0;
    const res = S.picks.map((p) => ({ p, u: uniById(p.u), r: assess(uniById(p.u), p.f) }));
    const avg = res.length ? Math.round(mean(res.map((x) => x.r.score))) : 0;
    const allGaps = res.flatMap((x) => x.r.gaps.map((g) => ({ ...g, f: x.p.f })));
    const mainF = S.fields[0] || (S.picks[0] && S.picks[0].f) || "cs";
    const sugg = suggestFor(mainF, allGaps, 3);
    const recent = S.done.slice(-4).reverse();
    const steps = setupSteps(), doneN = steps.filter((x) => x.done).length;
    const featured = [1, 21, 22, 45, 74, 84].map(uniById).filter(Boolean);
    const tiles = [
      ["#/unis", "Universities", "Search & pick your top 5", ICON.uni, `${S.picks.length}/5 picked`, "t1"],
      ["#/cv", "My CV", "Auto-built · save as PDF", ICON.cv, `${S.activities.filter((a) => a.t).length} entries`, "t2"],
      ["#/addons", "CV add-ons", "Small tasks, big multipliers", ICON.spark, `${ADDONS.length} available`, "t3"],
      ["#/quiz", "Career quiz", "Not sure what to study?", ICON.compass, S.fields.length ? FIELDS[S.fields[0]] : "8 questions", "t4"],
      ["#/profile", "My profile", "Photo, interests, top 5", ICON.user, `${doneN}/${steps.length} complete`, "t5"]
    ];
    return `${nav("home")}<main class="wrap">
      <div class="heroband home-hero"><div class="hb-blob"></div>
        <div class="hb-copy">
          <span class="eyebrow light">Sprint ${cc + 1} · ${daysLeft()} day${daysLeft() === 1 ? "" : "s"} left</span>
          <h1>${S.name.trim() ? `Hi ${esc(S.name.trim().split(" ")[0])} 👋` : "Welcome to Vita 👋"}</h1>
          <p>Find your universities, build your CV, and close the gaps one sprint at a time.</p>
          <div class="searchbox"><span class="si">${ICON.search}</span><input id="hs" placeholder="Search universities, e.g. Oxford, MIT, Delft, Japan…" autocomplete="off" value="${esc(homeQ)}"><kbd>/</kbd></div>
          <div id="hsr" class="search-results">${homeResults()}</div>
          <div class="hb-quick">${["Oxford", "MIT", "ETH", "Singapore", "Medicine"].map((q) => `<button data-act="hq" data-q="${q === "Medicine" ? "" : q}" data-f="${q === "Medicine" ? "med" : ""}">${q}</button>`).join("")}</div>
        </div>
        <div class="hb-art">${ART.hero}</div>
      </div>

      <div class="tiles">${tiles.map(([h, t, d, ic, m, c]) => `<a class="tile tilt ${c}" href="${h}"><span class="tile-ic">${ic}</span><b>${t}</b><span class="small muted">${d}</span><span class="tile-meta">${esc(m)}</span></a>`).join("")}</div>

      ${doneN < steps.length ? `<div class="card setupcard"><div class="sc-art">${ART[STEP_META[steps.findIndex((x) => !x.done)].art]}</div>
        <div class="sc-body"><span class="eyebrow">Get accurate results</span><h2>Complete your profile · ${doneN}/${steps.length}</h2>
        <p class="muted small">Readiness scores get more accurate with every step. Each one takes under a minute.</p>${bar((doneN / steps.length) * 100, "accent")}
        <div class="sc-steps">${steps.map((x, i) => `<button class="sc-step ${x.done ? "done" : ""}" data-act="goto" data-i="${i}"><span>${x.done ? "✓" : i + 1}</span>${x.label}</button>`).join("")}</div></div></div>` : ""}

      <div class="stats">
        <div class="card stat"><div class="lab">Level ${lv.n}</div><div class="val"><span data-count="${S.xp}">${S.xp}</span> <small>XP</small></div>${bar((lv.cur / lv.need) * 100, "xpbar")}<div class="muted small">${lv.need - lv.cur} XP to level ${lv.n + 1}</div></div>
        <div class="card stat ${atRisk ? "risk" : ""}"><div class="lab">Sprint streak</div><div class="val"><span class="flame">🔥</span> <span data-count="${st}">${st}</span> <small>sprint${st === 1 ? "" : "s"}</small></div><div class="muted small">${atRisk ? `⚠ Complete an add-on in ${daysLeft()} days to keep your streak` : n ? "Streak secured for this sprint ✓" : "Complete 1 add-on to start your streak"}</div></div>
        <div class="card stat"><div class="lab">This sprint</div><div class="val">${n} <small>add-on${n === 1 ? "" : "s"}</small></div>
          <div class="mults">${[1, 2, 3, 4].map((k) => `<span class="${n >= k ? "on" : n + 1 === k ? "next" : ""}">×${multFor(k)}</span>`).join("")}</div><div class="muted small">Next add-on earns ×${multFor(n + 1)} XP</div></div>
        <div class="card stat"><div class="lab">Average readiness</div><div class="val"><span data-count="${avg}">${avg}</span><small>%</small></div>${bar(avg, "accent")}<div class="muted small">${res.length ? `across your top ${res.length}` : "pick universities to see this"}</div></div>
      </div>

      <div class="cols">
        <section><h2>${res.length ? `Your top ${res.length}` : "Popular universities"}</h2>
          ${res.length ? res.map((x, i) => `<a class="card unicard tilt" href="#/uni/${x.u.id}/${x.p.f}">${ring(x.r.score)}<div class="grow"><div class="muted small">#${i + 1} · ${esc(x.u.c)} ${tierChip(x.u, x.r.score, x.p.f)}</div><b>${esc(x.u.n)}</b><div class="small">${FIELDS[x.p.f]}</div>
            <div class="small gapline">${x.r.gaps.length ? `${x.r.gaps.length} things to improve · top: ${esc(x.r.gaps[0].t)}` : "No major gaps 🎉"}</div></div><span class="chev">›</span></a>`).join("")
            : `<div class="featured">${featured.map((u) => `<div class="card feat tilt">${crest(u, 48)}<a class="unilink" href="#/uni/${u.id}"><b>${esc(u.n)}</b><div class="small muted">${esc(u.c)} · ~${u.a}% admit</div></a><button class="btn sm primary" data-act="pick" data-id="${u.id}">+ Top 5</button></div>`).join("")}</div>`}
        </section>
        <section><h2>Recommended this sprint</h2>
          ${sugg.map(addonCard).join("")}
          ${recent.length ? `<h2>Recent</h2><div class="card">${recent.map((d) => { const a = ADDONS.find((x) => x.id === d.a); return `<div class="recent"><span>${esc(a ? a.t : d.a)}</span><b>+${d.xp} XP</b></div>`; }).join("")}</div>` : ""}
        </section>
      </div></main>`;
  }

  function addonCard(a) {
    const times = timesDone(a.id);
    const local = a.w.filter((x) => x !== "global");
    return `<div class="card addon tilt"><div class="addon-top"><span class="cat">${CATS[a.cat]}${local.length ? ` <span class="where">${local.map((r) => REGION_L[r] || r).join(", ")}</span>` : ""}</span><span class="xp">+${a.xp} XP</span></div>
      <b>${esc(a.t)}</b><p class="small muted">${esc(a.d)}</p>
      <div class="addon-bot"><span class="small muted">⏱ ${esc(a.effort)}${a.f.length ? " · " + a.f.slice(0, 3).map((k) => FIELDS[k]).join(", ") : " · Any field"}${times ? ` · done ×${times}` : ""}</span>
      <span>${a.url ? `<a class="btn sm ghost" href="${esc(a.url)}" target="_blank" rel="noopener">Open ↗</a>` : ""}<button class="btn sm primary" data-act="log" data-id="${a.id}">Log it</button></span></div></div>`;
  }

  let addonF = null, addonCat = "";
  function viewAddons() {
    if (addonF === null) addonF = S.fields[0] || "";
    const regs = userRegions();
    const list = ADDONS.filter((a) => (!addonF || a.f.includes(addonF) || !a.f.length) && (!addonCat || a.cat === addonCat) && (S.addonWhere === "all" || (S.addonWhere === "global" ? a.w.includes("global") : forMe(a))));
    const n = cycleCount(curCycle());
    return `${nav("addons")}<main class="wrap">
      <div class="hello pagehead"><div><span class="eyebrow">Sprint ${curCycle() + 1} · ${daysLeft()} days left</span><h1>CV add-ons</h1><p class="muted">Small activities you can finish in a 2-week sprint. Each one goes straight onto your CV. This sprint: ${n} done, next one earns <b>×${multFor(n + 1)}</b> XP.</p></div></div>
      <div class="filters">
        <select id="af"><option value="">All fields</option>${Object.entries(FIELDS).map(([k, l]) => opt(k, l, addonF)).join("")}</select>
        <div class="toggle">${[["me", `For me${regs.length > 1 ? " · " + regs.filter((r) => r !== "global").map((r) => REGION_L[r].split(" ")[0]).join("") : ""}`], ["global", "🌐 Online only"], ["all", "All regions"]].map(([k, l]) => `<button class="${S.addonWhere === k ? "on" : ""}" data-act="set" data-k="addonWhere" data-v="${k}">${l}</button>`).join("")}</div>
        <span class="muted small">${list.length} add-ons${regs.length === 1 ? ` · <a href="#/profile">set your country</a> to see local ones` : ""}</span>
      </div>
      <div class="chiprow">${[["", "All"], ...Object.entries(CATS)].map(([k, l]) => `<button class="pill ${addonCat === k ? "on" : ""}" data-act="acat" data-k="${k}">${l}</button>`).join("")}</div>
      <div class="addongrid">${list.map(addonCard).join("") || `<p class="empty">No add-ons match.</p>`}</div></main>`;
  }

  function viewUnis() {
    return `${nav("unis")}<main class="wrap"><div class="card pad">${secPicker()}</div></main>`;
  }

  function viewUni(id, f) {
    const u = uniById(Number(id)); if (!u) return viewHome();
    const pick = S.picks.find((p) => p.u === u.id); f = f || (pick && pick.f) || u.f[0];
    const r = assess(u, f), sugg = suggestFor(f, r.gaps, 4);
    const sevL = { 3: "High", 2: "Medium", 1: "Low" };
    return `${nav("unis")}<main class="wrap">
      <a href="#/home" class="back">← Home</a>
      <div class="card pad unihead">${crest(u, 64)}${ring(r.score, 96)}<div class="grow"><div class="muted small">${esc(u.c)} · ${esc(u.r)}</div><h1>${esc(u.n)}</h1>
        <div class="uni-course"><select id="uf" data-uni="${u.id}">${u.f.map((k) => opt(k, FIELDS[k], f)).join("")}</select>
        ${pick ? `<span class="tag">In your top 5</span>` : `<button class="btn sm primary" data-act="pick" data-id="${u.id}" ${S.picks.length >= MAX_PICKS ? "disabled" : ""}>+ Add to top 5</button>`}</div>
        <div class="facts">${tierChip(u, r.score, f)}<span>~${u.a}% admit rate</span><span>${esc(u.req)}</span>${u.sat ? `<span>SAT ~${u.sat}</span>` : ""}${u.lang ? `<span>Taught in ${esc(u.lang)}</span>` : ""}<a class="factlink" href="${officialLink(u)}" target="_blank" rel="noopener">Check official requirements ↗</a></div></div></div>
      ${u.note ? `<div class="note">💡 ${esc(u.note)}</div>` : ""}
      ${u.c === "USA" && (f === "med" || f === "law") ? `<div class="note">ℹ In the US, ${f === "med" ? "Medicine" : "Law"} is a graduate degree. You'd apply as a pre-${f === "med" ? "med" : "law"} undergraduate.</div>` : ""}
      <div class="cols">
        <section><h2>Readiness breakdown</h2><div class="card pad">${Object.entries(r.parts).map(([k, v]) => `<div class="part"><span>${k}</span>${bar(v * 100, v >= 0.75 ? "good" : v >= 0.5 ? "mid" : "low")}<b>${Math.round(v * 100)}%</b></div>`).join("")}
          <p class="small muted">Readiness compares your profile to what this university typically expects. At a ~${u.a}% admit rate, even a strong profile isn't a guarantee.</p>
          <details class="explain"><summary>How is ${r.score}% calculated?</summary>
            <table><thead><tr><th>Part</th><th>You</th><th>Weight</th><th>Points</th></tr></thead><tbody>
            ${Object.entries(r.parts).map(([k, v], i) => `<tr><td>${k}</td><td>${Math.round(v * 100)}%</td><td>× ${Math.round(r.W[i] * 100)}%</td><td><b>${(v * r.W[i] * 100).toFixed(1)}</b></td></tr>`).join("")}
            <tr class="tot"><td colspan="3">Readiness</td><td><b>${r.score}%</b></td></tr></tbody></table>
            <p class="small muted">Weights depend on how much this university values activities (${u.ec === 3 ? "holistic, US-style" : u.ec === 2 ? "super-curricular" : "mostly grades"}${u.lang ? ", plus the teaching language" : ""}). Grades compare your average (≈ IB ${academicAvg() != null ? scoreToIb(academicAvg()) : "?"}) with the typical IB ${u.ib}. Activities compare your points (${r.pts}) with a target of ${r.tgt}.</p></details></div>
          <h2>Typical deadlines</h2><div class="card pad">${uniDeadlines(u, f).map((d) => `<div class="dl-row"><span>${esc(d.label)}</span><b>${d.date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</b><span class="muted small">${daysUntil(d.date)} days</span></div>`).join("") || `<p class="small muted">No deadline data yet.</p>`}<p class="small muted" style="margin:8px 0 0">Typical dates. Confirm on the <a href="${officialLink(u)}" target="_blank" rel="noopener">official site ↗</a>.</p></div>
          <h2>What to improve</h2>${r.gaps.map((g) => `<div class="card gap sev${g.sev}"><div class="gap-top"><span class="tag">${g.k}</span><span class="sev">${sevL[g.sev]} priority</span></div><b>${esc(g.t)}</b><p class="small muted">${esc(g.d)}</p></div>`).join("") || `<p class="empty">No gaps found 🎉</p>`}
          ${r.goods.length ? `<h2>Strengths</h2><div class="card pad">${r.goods.map((g) => `<div class="good">✓ ${esc(g)}</div>`).join("")}</div>` : ""}
        </section>
        <section><h2>Add-ons for this goal</h2>${sugg.map(addonCard).join("")}</section>
      </div>
      <p class="small muted disclaimer">Figures are approximate. Always check the university's official admissions page.</p></main>`;
  }

  /* ---------- tiers & deadlines ---------- */
  function tier(u, score, f) {
    const a = f === "med" ? u.a * 0.5 : u.a;
    if (a < 10) return ["dream", "Dream", f === "med" && u.a >= 10 ? "Medicine is far more competitive than the university's overall admit rate, so this is a reach for everyone" : "Under 10% of applicants get in, so this is a reach for everyone"];
    if (score >= 80 && a >= 30) return ["safety", "Safety", "Your profile is well above what's typical, and the admit rate is high"];
    if (score >= 65) return ["target", "Target", "Your profile is close to what's typical for admitted students"];
    return ["dream", "Dream", "There's a gap between your profile and what's typical. Keep building!"];
  }
  const tierChip = (u, score, f) => { const t = tier(u, score, f); return `<span class="tier ${t[0]}" title="${esc(t[2])}">${t[1]}</span>`; };
  function nextDate(m, d) { const now = new Date(), y = now.getFullYear(); let dt = new Date(y, m - 1, d); if (dt < new Date(now.getTime() - DAY)) dt = new Date(y + 1, m - 1, d); return dt; }
  function uniDeadlines(u, f) {
    const D = [], add = (label, m, d) => D.push({ label, date: nextDate(m, d) });
    switch (u.c) {
      case "UK": if (/Oxford|Cambridge/.test(u.n) || f === "med") add("UCAS deadline (Oxbridge / Medicine)", 10, 15); else add("UCAS equal-consideration deadline", 1, 14); break;
      case "USA": add("Early Decision / Early Action", 11, 1); add("Regular Decision", 1, 1); break;
      case "Canada": add("Application deadline", 1, 15); break;
      case "Ireland": add("CAO application deadline", 2, 1); break;
      case "Netherlands": add("Numerus fixus programmes", 1, 15); add("Other programmes (Studielink)", 5, 1); break;
      case "Germany": add("Winter-semester application", 7, 15); break;
      case "Switzerland": add("International application deadline", 4, 30); break;
      case "France": if (/Sciences Po/.test(u.n)) add("Sciences Po application", 1, 15); else if (/HEC/.test(u.n)) add("Bachelor application round", 1, 15); else add("Parcoursup wishes deadline", 3, 14); break;
      case "Italy": add("Early application round", 11, 1); add("Final application round", 4, 1); break;
      case "Spain": add("Apply early (rolling rounds)", 1, 15); break;
      case "Sweden": add("Autumn intake (universityadmissions.se)", 1, 15); break;
      case "Denmark": add("Application deadline", 3, 15); break;
      case "Finland": add("Joint application (January)", 1, 20); break;
      case "Norway": add("Application deadline", 4, 15); break;
      case "Austria": add("General admission deadline", 9, 5); break;
      case "Poland": add("Online registration opens", 6, 1); break;
      case "Czechia": add("Application deadline", 3, 1); break;
      case "Belgium": add("Pre-registration (international)", 3, 1); break;
      case "Japan": add("International / English-programme application", 12, 1); break;
      case "Singapore": add("International applications close", 2, 20); break;
      case "Hong Kong": add("International admissions main round", 1, 5); break;
      case "China": add("International applications", 3, 1); break;
      case "South Korea": add("International admissions round", 10, 1); break;
      case "India": add("JEE Main registration", 11, 30); break;
      case "Australia": add("International applications (rolling)", 11, 30); break;
      case "South Africa": add("Application deadline", 7, 31); break;
      case "Brazil": add("FUVEST registration", 9, 1); break;
    }
    return D;
  }
  const daysUntil = (d) => Math.ceil((d - Date.now()) / DAY);
  const officialLink = (u) => `https://www.google.com/search?q=${encodeURIComponent(u.n + " undergraduate admissions requirements international")}`;
  function allDeadlines() {
    return S.picks.flatMap((p) => { const u = uniById(p.u); return uniDeadlines(u, p.f).map((d) => ({ ...d, u, f: p.f })); }).sort((a, b) => a.date - b.date);
  }
  function icsDeadlines() {
    const list = allDeadlines(); if (!list.length) { toast("Pick universities first"); return; }
    downloadFile("vita-deadlines.ics", icsWrap(list.map((d, i) => icsEvent(`dl-${d.u.id}-${i}-${ymd(d.date)}`, d.date, `🎓 ${d.u.n}: ${d.label}`, "Typical deadline. Confirm on the official admissions site.", "-P14D"))), "text/calendar");
    toast("📅 Deadlines calendar downloaded");
  }

  /* ---------- plan page ---------- */
  const ROADMAP = [
    { ages: [14, 15], name: "Explore", ic: "🧭", tasks: [["Take the career quiz", () => Object.keys(S.quiz).length >= QUIZ.length || S.fields.length > 0, "#/quiz"], ["Start one activity you enjoy", () => S.activities.some((a) => a.t), "#/addons"], ["Read beyond the syllabus in 1 subject", () => S.done.some((d) => ["bookreview", "critic", "review", "economist"].includes(d.a)), "#/addons"], ["Keep your grades strong", () => academicAvg() != null && academicAvg() >= 80, "#/cv"]] },
    { ages: [16], name: "Build", ic: "🧱", tasks: [["Choose subjects that fit your course", () => FIELDREQ[S.fields[0] || "cs"].subjects.every((x) => S.grades.some((g) => g.s === x)), "#/cv"], ["Enter a competition or olympiad", () => S.activities.some((a) => a.t && a.cat === "competitions"), "#/addons"], ["Apply to a summer school", () => S.done.some((d) => ["summer", "uniq"].includes(d.a)), "#/addons"], ["Get a language certificate", () => !!(S.tests.ielts || S.tests.toefl) || S.done.some((d) => d.a === "langcert"), "#/cv"]] },
    { ages: [17], name: "Prove", ic: "🎯", tasks: [["Sit SAT / IELTS / admissions tests", () => Object.values(S.tests).some(Boolean) || S.exams.length > 0, "#/cv"], ["Pick a balanced top 5", () => S.picks.length >= 5, "#/unis"], ["Draft your personal statement", () => stmtWords() >= 300, "#/statement"], ["Do a mock interview", () => S.done.some((d) => d.a === "mockinterview"), "#/addons"]] },
    { ages: [18, 19], name: "Apply", ic: "🚀", tasks: [["Add deadlines to your calendar", () => !!S.icsDone, "#/plan"], ["Finish your statement", () => stmtWords() >= 500, "#/statement"], ["Make your CV all-star", () => S.badges.includes("allstar"), "#/cv"], ["Submit your applications", () => false, "#/plan"]] }
  ];
  function viewPlan() {
    const dl = allDeadlines(), age = Number(S.age) || 16;
    const res = S.picks.map((p) => ({ u: uniById(p.u), p, r: assess(uniById(p.u), p.f) }));
    const tiers = res.map((x) => tier(x.u, x.r.score, x.p.f)[0]);
    const advice = !res.length ? "Pick universities to get a deadline plan." : !tiers.includes("safety") ? "Your list has no Safety choice. Add one university where you're comfortably above the typical profile." : !tiers.includes("target") ? "Add at least one Target choice, where your profile matches what's typical." : "Nice balance of Dream, Target and Safety choices 👌";
    return `${nav("plan")}<main class="wrap">
      <div class="hello pagehead"><div><span class="eyebrow">Your plan · age ${age}</span><h1>Timeline & deadlines</h1><p class="muted">What to do now, and the dates that matter for your top ${S.picks.length || 5}.</p></div>
        <div class="row-gap"><button class="btn" data-act="ics-sprints">📅 Sprint reminders</button><button class="btn primary" data-act="ics-deadlines" ${dl.length ? "" : "disabled"}>📅 Add deadlines to calendar</button></div></div>
      <section class="card pad roadmap"><h2>Your roadmap</h2>
        <div class="rm">${ROADMAP.map((st) => { const here = st.ages.includes(age) || (age < 14 && st.ages[0] === 14) || (age > 19 && st.ages.includes(19)); const past = Math.max(...st.ages) < age; const done = st.tasks.filter((t) => t[1]()).length;
          return `<div class="rm-stage ${here ? "here" : ""} ${past ? "past" : ""}"><div class="rm-top"><span class="rm-ic">${st.ic}</span><div><b>${st.name}</b><div class="small muted">Age ${st.ages.join("–")}</div></div>${here ? `<span class="tag">You are here</span>` : ""}</div>
            ${bar((done / st.tasks.length) * 100, "accent")}
            <ul>${st.tasks.map((t) => `<li class="${t[1]() ? "ok" : ""}"><a href="${t[2]}">${t[1]() ? "✓" : "○"} ${esc(t[0])}</a></li>`).join("")}</ul></div>`; }).join("")}</div></section>
      <div class="cols">
        <section><h2>Upcoming deadlines</h2>
          ${dl.length ? dl.map((d) => { const n = daysUntil(d.date); return `<a class="card dl tilt" href="#/uni/${d.u.id}/${d.f}">${crest(d.u, 42)}<div class="grow"><b>${esc(d.u.n)}</b><div class="small">${esc(d.label)}</div><div class="small muted">${d.date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</div></div>
              <div class="dl-count ${n <= 30 ? "soon" : n <= 90 ? "mid" : ""}"><b>${n}</b><span>days</span></div></a>`; }).join("") : `<p class="empty">No universities picked yet. <a href="#/unis">Pick your top 5</a>.</p>`}
          <p class="small muted">These are <b>typical</b> deadlines for each country or university. Dates change every year and can differ by course, so always confirm on the official admissions site.</p>
        </section>
        <section><h2>Your list balance</h2>
          <div class="card pad">${res.map((x) => `<a class="mini-uni" href="#/uni/${x.u.id}/${x.p.f}">${crest(x.u, 34)}<span class="grow"><b>${esc(x.u.n)}</b><span class="small muted">${x.r.score}% ready · ~${x.u.a}% admit</span></span>${tierChip(x.u, x.r.score, x.p.f)}</a>`).join("") || `<p class="small muted">No universities yet.</p>`}
            <div class="note" style="margin-top:12px">${esc(advice)}</div>
            <p class="small muted" style="margin:10px 0 0"><b>Dream</b> = admit rate under 10% or a big gap · <b>Target</b> = you match the typical profile · <b>Safety</b> = you're comfortably above it.</p></div>
        </section>
      </div></main>`;
  }

  /* ---------- personal statement ---------- */
  const UCAS_Q = ["Why do you want to study this course or subject?", "How have your qualifications and studies helped you to prepare for this course or subject?", "What else have you done to prepare outside of education, and why are these experiences useful?"];
  const CA_PROMPTS = ["A background, identity, interest or talent that is central to who you are", "A challenge, setback or failure, and what you learned from it", "A time you questioned or challenged a belief or idea", "Something someone did for you that made you grateful, and how it affected you", "An accomplishment or event that sparked personal growth", "A topic or idea so engaging that you lose track of time", "An essay on any topic of your choice"];
  const words = (t) => (t || "").trim().split(/\s+/).filter(Boolean).length;
  function stmtWords() { const st = S.statement || {}; return words((st.ucas || []).join(" ")) + words(st.ca) + words(st.ml); }
  let lastTA = null;
  function stmtIdeas() {
    const f = S.fields[0], F = f ? FIELDS[f] : "my subject", ideas = [];
    ideas.push(["Why this subject", `I first became fascinated by ${F} when `]);
    const best = S.grades.map((g) => ({ g, sc: gradeScore(g) })).filter((x) => x.sc != null).sort((a, b) => b.sc - a.sc)[0];
    if (best) ideas.push([`Strongest subject: ${best.g.s}`, `Studying ${best.g.s}${best.g.l ? " at " + best.g.l : ""} taught me `]);
    S.courses.forEach((c) => ideas.push([`Course: ${c.title}`, `Taking ${c.title}${c.provider ? " (" + c.provider + ")" : ""} showed me `]));
    S.activities.filter((a) => a.t).slice(-8).forEach((a) => ideas.push([`${CAT_ICON[a.cat] || "•"} ${a.t}`, `Through ${a.t.replace(/\.$/, "")}${a.org ? " at " + a.org : ""}, I learned `]));
    S.exams.forEach((e) => ideas.push([`Exam: ${e.name}`, `Preparing for ${e.name} pushed me to `]));
    ideas.push(["Future goals", `At university, I hope to explore ${F} further, especially `]);
    return ideas;
  }
  function counter(path, txt) {
    const st = S.statement;
    if (st.fmt === "ucas") { const c = (txt || "").length; return `<span class="cnt ${c < 350 ? "low" : ""}" data-counter="${path}">${c} chars${c < 350 ? " · aim for 350+" : ""}</span>`; }
    const w = words(txt), max = st.fmt === "ca" ? 650 : 600; return `<span class="cnt ${w > max ? "over" : ""}" data-counter="${path}">${w} / ${max} words</span>`;
  }
  function viewStatement() {
    const st = S.statement, fmt = st.fmt;
    const total = fmt === "ucas" ? st.ucas.join("").length : 0;
    const editors = fmt === "ucas" ? UCAS_Q.map((q, i) => `<div class="st-q"><label for="ucas${i}"><span class="st-n">${i + 1}</span>${esc(q)}</label>
        <textarea id="ucas${i}" data-bind="statement.ucas.${i}" rows="8" placeholder="Write freely, then refine…">${esc(st.ucas[i])}</textarea><div class="st-meta">${counter(`statement.ucas.${i}`, st.ucas[i])}</div></div>`).join("")
      : fmt === "ca" ? `<div class="st-q"><label>Prompt<select data-bind="statement.caPrompt">${CA_PROMPTS.map((p, i) => opt(String(i), `${i + 1}. ${p}`, st.caPrompt)).join("")}</select></label>
        <textarea id="caTA" data-bind="statement.ca" rows="16" placeholder="Tell a story only you can tell…">${esc(st.ca)}</textarea><div class="st-meta">${counter("statement.ca", st.ca)}</div></div>`
      : `<div class="st-q"><label for="mlTA">Motivation letter <span class="opt">· usually 1 page, about 400–600 words</span></label><textarea id="mlTA" data-bind="statement.ml" rows="16" placeholder="Dear Admissions Committee, …">${esc(st.ml)}</textarea><div class="st-meta">${counter("statement.ml", st.ml)}</div></div>`;
    const tips = { ucas: ["Show, don't tell: use specific examples from your CV.", "Spend most of your words on Q1 and Q2. Universities care most about academic interest.", "Each answer needs at least 350 characters. The total limit is 4,000."], ca: ["Pick one story and go deep, rather than listing achievements.", "Your voice matters more than impressive vocabulary.", "Hard limit: 650 words."], ml: ["Name the specific programme and say why this university.", "Connect your experiences to what you'll study.", "End with what you'll contribute."] }[fmt];
    return `${nav("cv")}<main class="wrap">
      <div class="cvtabs"><a href="#/cv">My CV</a><a href="#/statement" class="on">Personal statement</a></div>
      <div class="hello pagehead"><div><span class="eyebrow">Writing helper</span><h1>Personal statement</h1><p class="muted">Draft your statement using your CV. Click an idea to insert a sentence starter. Saved automatically.</p></div></div>
      <div class="pillrow" style="margin-bottom:16px">${[["ucas", "🇬🇧 UCAS (3 questions)"], ["ca", "🇺🇸 Common App essay"], ["ml", "🇪🇺 Motivation letter"]].map(([k, l]) => `<button class="pill ${fmt === k ? "on" : ""}" data-act="set" data-k="statement.fmt" data-v="${k}">${l}</button>`).join("")}</div>
      <div class="cvp-grid">
        <div class="cvp-main"><section class="card li-sec">${editors}
          ${fmt === "ucas" ? `<div class="st-total"><span>Total</span><b data-counter="ucas-total" class="${total > 4000 ? "over" : ""}">${total} / 4,000 characters</b></div>${bar(Math.min(100, (total / 4000) * 100), total > 4000 ? "low" : "accent")}` : ""}</section></div>
        <aside class="cvp-side">
          <section class="card li-sec"><h2>Ideas from your CV</h2><p class="small muted">Click to insert at the end of the box you last typed in.</p>
            <div class="ideas">${stmtIdeas().map(([l, t]) => `<button class="idea" data-act="idea" data-t="${esc(t)}">${esc(l)}</button>`).join("")}</div></section>
          <section class="card li-sec tipcard"><h2>💡 Tips</h2><ul class="tips">${tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>
        </aside></div></main>`;
  }
  function updateCounters() {
    app.querySelectorAll("[data-counter]").forEach((el) => {
      const path = el.dataset.counter;
      if (path === "ucas-total") { const t = S.statement.ucas.join("").length; el.textContent = `${t} / 4,000 characters`; el.classList.toggle("over", t > 4000); const b = el.parentElement.nextElementSibling; if (b && b.firstElementChild) b.firstElementChild.style.width = Math.min(100, (t / 4000) * 100) + "%"; return; }
      const tmp = document.createElement("div"); tmp.innerHTML = counter(path, getPath(S, path)); el.replaceWith(tmp.firstElementChild);
    });
  }

  /* ---------- share link ---------- */
  function sharePayload() {
    return { n: S.name, h: S.headline, s: S.contact.school, c: [S.contact.city, S.country].filter(Boolean).join(", "), b: S.curriculum, e: S.edu, sum: S.summary || autoSummary(),
      g: S.grades.filter((g) => g.g !== "").map((g) => [g.s, g.b, g.l, g.g]), t: S.tests, x: S.exams, co: S.courses.map((c) => [c.title, c.provider, c.date]),
      a: S.activities.filter((a) => a.t).map((a) => [a.t, a.org || "", a.cat, a.lvl, a.date || "", a.desc || ""]), sk: S.skills, l: S.languages.filter((l) => l.lang).map((l) => [l.lang, l.lvl]), f: S.fields, bd: S.badges };
  }
  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = (str) => Uint8Array.from(atob(str.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  async function encodeShare(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) { const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw")); return "z" + b64u(new Uint8Array(await new Response(cs).arrayBuffer())); }
    return "j" + b64u(bytes);
  }
  async function decodeShare(code) {
    const bytes = unb64u(code.slice(1));
    if (code[0] === "z") { const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")); return JSON.parse(await new Response(ds).text()); }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function copyShare() {
    try {
      const code = await encodeShare(sharePayload());
      const url = location.href.split("#")[0] + "#/share/" + code;
      try { await navigator.clipboard.writeText(url); toast("🔗 Share link copied!"); }
      catch (e) { prompt("Copy your share link:", url); }
    } catch (e) { toast("Couldn't create a share link in this browser"); }
  }
  function viewShared(d) {
    const B = BOARDS[d.b], acts = (d.a || []).map(([t, org, cat, lvl, date, desc]) => ({ t, org, cat, lvl, date, desc }));
    const group = (cats) => acts.filter((a) => cats.includes(a.cat));
    const item = (a) => `<div class="li-item static"><span class="li-ic c-${a.cat}">${CAT_ICON[a.cat] || "•"}</span><div class="grow"><b>${esc(a.t)}</b><div class="small">${[a.org, CATS[a.cat]].filter(Boolean).map(esc).join(" · ")}</div><div class="small muted">${[LEVELS[a.lvl] ? LEVELS[a.lvl][0] + " level" : "", a.date ? fmtMonth(a.date) : ""].filter(Boolean).join(" · ")}</div>${a.desc ? `<p class="li-desc">${esc(a.desc)}</p>` : ""}</div></div>`;
    const sec = (title, inner) => inner ? `<section class="card li-sec"><h2>${title}</h2>${inner}</section>` : "";
    const tests = Object.entries(TEST_MAX).filter(([k]) => d.t && d.t[k]);
    return `<header class="topbar"><div class="wrap topbar-in"><a href="#/" class="brand"><span class="logo">V</span>Vita</a><span class="muted small grow">Shared CV · read-only</span><a class="btn primary sm" href="#/">Build your own →</a></div></header>
      <main class="wrap narrow cvp"><div class="cvp-main">
        <section class="card li-head"><div class="li-cover" style="background:${BANNERS.hero}"><div class="hb-blob"></div><div class="li-cover-art">${ART.hero}</div></div>
          <div class="li-body"><span class="li-avatar">${esc(initials(d.n)) || "?"}</span><h1>${esc(d.n || "Student")}</h1>${d.h ? `<p class="li-headline">${esc(d.h)}</p>` : ""}<p class="small muted">${[d.s, d.c].filter(Boolean).map(esc).join(" · ")}</p>
          <div class="li-badges">${B ? `<span>🎓 ${esc(B.label)}</span>` : ""}${(d.f || []).map((k) => `<span>${FIELD_ICON[k] || ""} ${esc(FIELDS[k] || "")}</span>`).join("")}${(d.bd || []).map((id) => { const b = BADGES.find((x) => x[0] === id); return b ? `<span title="${esc(b[3])}">${b[1]} ${esc(b[2])}</span>` : ""; }).join("")}</div></div></section>
        ${sec("About", `<p class="li-about" style="cursor:auto">${esc(d.sum)}</p>`)}
        ${sec("Education", `<div class="li-item static"><span class="li-ic school">${esc(initials(d.s || "S"))}</span><div class="grow"><b>${esc(d.s || "School")}</b><div class="small">${B ? esc(B.label) : ""}</div><div class="small muted">${d.e && (d.e.start || d.e.end) ? `${esc(d.e.start || "?")} – ${esc(d.e.end || "present")}` : ""}</div></div></div>
          ${(d.g || []).length ? `<div class="gradegrid">${d.g.map(([sb, b, l, g]) => { const sc = gradeScore({ b, g }); return `<div class="gcard ${sc == null ? "" : sc >= 88 ? "good" : sc >= 74 ? "mid" : "low"}"><span class="gc-s">${esc(sb)}</span><span class="gc-l">${esc([BOARDS[b] ? BOARDS[b].label : "", l].filter(Boolean).join(" · "))}</span><span class="gc-g">${esc(g)}</span><span class="gc-bar"><i style="width:${sc || 0}%"></i></span></div>`; }).join("")}</div>` : ""}`)}
        ${sec("Exams & test results", tests.length || (d.x || []).length ? `<div class="examgrid">${tests.map(([k, [l, m]]) => `<div class="ecard"><span class="ec-n">${l}</span><span class="ec-v">${esc(d.t[k])}<small>/${m}</small></span></div>`).join("")}${(d.x || []).map((e) => `<div class="ecard"><span class="ec-n">${esc(e.name)}</span><span class="ec-v">${esc(e.score)}${e.max ? `<small>/${esc(e.max)}</small>` : ""}</span></div>`).join("")}</div>` : "")}
        ${sec("Courses & certifications", [...(d.co || []).map(([t, p, dt]) => item({ t, org: p, cat: "courses", date: dt })), ...group(SEC_COURSE).map(item)].join(""))}
        ${sec("Experience & leadership", group(SEC_EXP).map(item).join(""))}
        ${sec("Projects & achievements", group(SEC_ACH).map(item).join(""))}
        ${sec("Skills", (d.sk || []).length ? `<div class="skills">${d.sk.map((k) => `<span class="skill" style="padding-right:14px">${esc(k)}</span>`).join("")}</div>` : "")}
        ${sec("Languages", (d.l || []).length ? `<div class="langs">${d.l.map(([l, v]) => `<div class="lang"><b>${esc(l)}</b><span>${esc(v)}</span></div>`).join("")}</div>` : "")}
      </div></main>`;
  }

  /* ---------- streak page ---------- */
  function bestStreak() { let best = 0, run = 0; for (let c = 0; c <= curCycle(); c++) { if (cycleCount(c) > 0) { run++; best = Math.max(best, run); } else if (!S.frozen.includes(c) && c < curCycle()) run = 0; } return best; }
  /* ---------- badges ---------- */
  const BADGES = [
    ["first", "🌱", "First step", "Log your first add-on", () => S.done.length >= 1],
    ["s3", "🔥", "On fire", "Reach a 3-sprint streak", () => bestStreak() >= 3],
    ["s6", "⚡", "Unstoppable", "Reach a 6-sprint streak", () => bestStreak() >= 6],
    ["x2", "🚀", "Max multiplier", "Log 4 add-ons in one sprint", () => S.done.some((d) => d.mult >= 2)],
    ["comp", "🏆", "Competitor", "Add a competition or olympiad", () => S.activities.some((a) => a.t && a.cat === "competitions")],
    ["nat", "🥇", "National level", "Add a national or international activity", () => S.activities.some((a) => a.t && (a.lvl === "national" || a.lvl === "international"))],
    ["course3", "🎓", "Lifelong learner", "Complete 3 courses", () => S.courses.length + S.activities.filter((a) => a.t && a.cat === "courses").length >= 3],
    ["poly", "🗣️", "Polyglot", "Speak 3 languages", () => S.languages.filter((l) => l.lang).length >= 3],
    ["top5", "🏛️", "Goal setter", "Pick your top 5 universities", () => S.picks.length >= 5],
    ["lv5", "⭐", "Level 5", "Reach level 5", () => level().n >= 5],
    ["allstar", "💎", "All-star CV", "Reach 90% profile strength", () => profileChecks().filter((c) => c[1]).length / profileChecks().length >= 0.9],
    ["writer", "✍️", "Storyteller", "Write 300+ words of your personal statement", () => stmtWords() >= 300]
  ];
  function checkBadges() {
    const fresh = BADGES.filter((b) => !S.badges.includes(b[0]) && b[4]());
    if (!fresh.length) return;
    fresh.forEach((b) => S.badges.push(b[0])); save();
    fresh.slice(0, 2).forEach((b, i) => setTimeout(() => { toast(`${b[1]} Badge unlocked: ${b[2]}`); confetti(40); }, 900 + i * 1800));
    if (fresh.length > 2) setTimeout(() => toast(`🏅 +${fresh.length - 2} more badges. See them on your Streak page.`), 900 + 2 * 1800);
  }
  function badgeGrid(onlyEarned) {
    const list = BADGES.filter((b) => !onlyEarned || S.badges.includes(b[0]));
    return `<div class="badges">${list.map((b) => { const on = S.badges.includes(b[0]); return `<div class="badge ${on ? "on" : ""}" title="${esc(b[3])}"><span class="b-ic">${on ? b[1] : "🔒"}</span><b>${esc(b[2])}</b><span class="small muted">${esc(b[3])}</span></div>`; }).join("")}</div>`;
  }
  /* ---------- calendar (.ics) ---------- */
  const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  function downloadFile(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function icsEvent(uid, date, title, desc, alarm, rrule) {
    const end = new Date(date.getTime() + DAY);
    return ["BEGIN:VEVENT", `UID:${uid}@vita`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${ymd(end)}`, rrule ? `RRULE:${rrule}` : "", `SUMMARY:${title}`, `DESCRIPTION:${desc}`,
      "BEGIN:VALARM", `TRIGGER:${alarm}`, "ACTION:DISPLAY", `DESCRIPTION:${title}`, "END:VALARM", "END:VEVENT"].filter(Boolean).join("\r\n");
  }
  const icsWrap = (events) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vita//Streaks//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
  function icsSprints() {
    const first = new Date(S.created + (curCycle() + 1) * CYCLE - 3 * DAY);
    downloadFile("vita-sprint-reminders.ics", icsWrap([icsEvent("sprint-" + S.created, first, "🔥 Vita: 3 days left in your sprint", "Log a CV add-on to keep your streak alive.", "PT9H", "FREQ=WEEKLY;INTERVAL=2;COUNT=26")]), "text/calendar");
    toast("📅 Calendar file downloaded. Open it to add reminders.");
  }
  function viewStreak() {
    const cc = curCycle(), st = streak(), n = cycleCount(cc), atRisk = n === 0 && st > 0, best = bestStreak();
    const totalXP = S.done.reduce((t, d) => t + d.xp, 0), bonusXP = S.done.reduce((t, d) => { const a = ADDONS.find((x) => x.id === d.a); return t + (a ? Math.max(0, d.xp - a.xp) : 0); }, 0);
    const from = Math.max(0, cc - 11), cells = []; for (let c = from; c <= cc; c++) cells.push(c);
    const startOf = (c) => new Date(S.created + c * CYCLE), dfmt = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const msg = atRisk ? `Your streak is at risk. Log one add-on in the next ${daysLeft()} days to keep it.` : n ? `Streak secured for this sprint. Each extra add-on now earns ×${multFor(n + 1)} XP.` : "Log your first add-on to light the flame.";
    const log = S.done.slice().reverse();
    return `${nav("streak")}<main class="wrap">
      <div class="heroband streak-hero ${atRisk ? "risk" : ""}"><div class="hb-blob"></div>
        <div class="sk-flame ${st ? "" : "off"}"><span class="flame">🔥</span><span class="sk-num" data-count="${st}">${st}</span></div>
        <div class="hb-copy"><span class="eyebrow light">Sprint ${cc + 1} · ${daysLeft()} day${daysLeft() === 1 ? "" : "s"} left</span><h1>${st} sprint streak</h1><p>${msg}</p>
          <div class="sprintbar"><span style="width:${((14 - daysLeft()) / 14) * 100}%"></span></div></div>
        <div class="hb-btns"><a class="btn warm lg" href="#/addons">Log an add-on →</a><button class="btn ghostlight" data-act="ics-sprints">📅 Add reminders to calendar</button></div></div>
      <div class="stats five">
        <div class="card stat"><div class="lab">Current streak</div><div class="val"><span data-count="${st}">${st}</span> <small>sprints</small></div><div class="muted small">${st * 2} weeks of consistent progress</div></div>
        <div class="card stat"><div class="lab">Best streak</div><div class="val"><span data-count="${best}">${best}</span> <small>sprints</small></div><div class="muted small">${best && best === st ? "You're at your best 🏆" : "Beat your record!"}</div></div>
        <div class="card stat"><div class="lab">Add-ons logged</div><div class="val"><span data-count="${S.done.length}">${S.done.length}</span></div><div class="muted small">${n} this sprint</div></div>
        <div class="card stat freeze"><div class="lab">Streak freezes</div><div class="val">❄️ ${S.freezes} <small>/ 2</small></div><div class="muted small">Saves your streak if you miss a sprint. Earn one every 3 sprints.</div></div>
        <div class="card stat"><div class="lab">Bonus XP earned</div><div class="val">+<span data-count="${bonusXP}">${bonusXP}</span> <small>XP</small></div><div class="muted small">from multipliers & streak bonuses (of ${totalXP})</div></div>
      </div>
      <div class="cols">
        <section>
          <h2>Sprint history</h2>
          <div class="card pad"><div class="sk-grid">${cells.map((c) => { const k = cycleCount(c), cls = c === cc ? "now" : ""; const fz = S.frozen.includes(c); return `<div class="sk-cell l${Math.min(k, 4)} ${cls} ${fz ? "frozen" : ""}" title="${fz ? "❄️ Freeze used · " : ""}Sprint ${c + 1} · ${dfmt(startOf(c))} – ${dfmt(new Date(startOf(c).getTime() + CYCLE - DAY))}: ${k} add-on${k === 1 ? "" : "s"}"><span class="sk-c">${k ? (k >= 4 ? "×2" : "×" + multFor(k)) : fz ? "❄️" : c === cc ? "…" : "–"}</span><span class="sk-l">S${c + 1}</span></div>`; }).join("")}</div>
          <div class="sk-legend"><span>Fewer</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>More add-ons</span></div></div>
          <h2>Badges <span class="muted small" style="font-weight:600">${S.badges.length}/${BADGES.length}</span></h2>
          <div class="card pad">${badgeGrid(false)}</div>
          <h2>Activity log</h2>
          <div class="card">${log.map((d) => { const a = ADDONS.find((x) => x.id === d.a); return `<div class="recent"><span><b class="sk-mult">×${d.mult}</b> ${esc(a ? a.t : d.a)} <span class="muted small">· Sprint ${d.cycle + 1} · ${new Date(d.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></span><b>+${d.xp} XP</b></div>`; }).join("") || `<p class="li-empty" style="padding:16px">No add-ons yet. Your log will appear here.</p>`}</div>
        </section>
        <section>
          <h2>Multiplier ladder</h2>
          <div class="card pad ladder">${[1, 2, 3, 4].map((k) => `<div class="rung ${n >= k ? "on" : n + 1 === k ? "next" : ""}"><span class="rung-m">×${multFor(k)}</span><div class="grow"><b>${k === 4 ? "4th add-on and beyond" : ["1st", "2nd", "3rd"][k - 1] + " add-on"}</b><div class="small muted">${n >= k ? "Unlocked this sprint ✓" : n + 1 === k ? "Your next add-on" : "Locked"}</div></div></div>`).join("")}</div>
          <h2>How streaks work</h2>
          <div class="card pad rules">
            <div><span>🗓️</span><p><b>Sprints last 2 weeks.</b> Log at least 1 CV add-on per sprint to keep your streak.</p></div>
            <div><span>⚡</span><p><b>More add-ons = bigger multiplier.</b> The 2nd add-on in a sprint earns ×1.25, the 3rd ×1.5, the 4th and beyond ×2.</p></div>
            <div><span>🔥</span><p><b>Streak bonus.</b> Your first add-on each sprint earns +10 XP for every sprint in your streak.</p></div>
            <div><span>❄️</span><p><b>Streak freezes.</b> If you miss a whole sprint, a freeze is used automatically. You earn one every 3 sprints (max 2).</p></div>
            <div><span>💔</span><p><b>No freezes left?</b> Missing a sprint resets your streak to 0, but your CV and XP stay.</p></div>
          </div>
        </section>
      </div></main>`;
  }

  /* ---------- CV: LinkedIn-style profile ---------- */
  const CAT_ICON = { competitions: "🏆", projects: "🛠️", volunteering: "🤝", leadership: "🎤", work: "💼", courses: "🎓", writing: "✍️", arts: "🎨", sports: "⚽", languages: "🗣️" };
  const SEC_EXP = ["work", "volunteering", "leadership"], SEC_ACH = ["competitions", "projects", "writing", "arts", "sports"], SEC_COURSE = ["courses", "languages"];
  const SKILL_SUGG = {
    cs: ["Python", "JavaScript", "Problem solving", "Git", "Data analysis"], eng: ["CAD", "Physics modelling", "Arduino", "Problem solving"],
    med: ["First aid", "Empathy", "Scientific reading", "Teamwork"], law: ["Public speaking", "Debate", "Research", "Persuasive writing"],
    bus: ["Excel", "Financial literacy", "Leadership", "Negotiation"], math: ["Proof writing", "Python", "Statistics", "Problem solving"],
    sci: ["Lab techniques", "Data analysis", "Scientific writing"], psy: ["Survey design", "Statistics", "Active listening"],
    arch: ["Sketching", "SketchUp", "Model making"], hum: ["Essay writing", "Critical reading", "Research"],
    pol: ["Public speaking", "Debate", "Policy analysis"], des: ["Figma", "Photoshop", "Typography", "Video editing"]
  };
  const TEST_MAX = { sat: ["SAT", 1600], act: ["ACT", 36], ielts: ["IELTS", 9], toefl: ["TOEFL iBT", 120] };
  const cvShow = {};
  let cvGradeEdit = false;
  function gradeTable() {
    const rows = S.grades.map((g, i) => {
      const b = BOARDS[g.b] || BOARDS.IB;
      return `<div class="graderow">
        <select data-bind="grades.${i}.s" aria-label="Subject">${SUBJECTS.map((x) => opt(x, x, g.s)).join("")}</select>
        <select data-bind="grades.${i}.b" data-rerender aria-label="Board">${Object.entries(BOARDS).map(([k, x]) => opt(k, x.label, g.b)).join("")}</select>
        ${b.levels.length ? `<select data-bind="grades.${i}.l" aria-label="Level">${b.levels.map((l) => opt(l, l, g.l)).join("")}</select>` : `<span class="muted small">—</span>`}
        ${b.grades ? `<select data-bind="grades.${i}.g" aria-label="Grade"><option value="">Grade</option>${b.grades.map((x) => opt(x, x, g.g)).join("")}</select>` : `<input type="number" min="0" max="100" placeholder="%" data-bind="grades.${i}.g" value="${esc(g.g)}" aria-label="Grade percent">`}
        <button class="icon" data-act="delgrade" data-i="${i}" aria-label="Remove ${esc(g.s)}">✕</button></div>`;
    }).join("");
    return `<div class="gtable"><div class="gradehead"><span>Course</span><span>Board</span><span>Level</span><span>Grade</span><span></span></div>
      ${rows || `<p class="empty">No grades yet.</p>`}
      <div class="row-gap" style="margin-top:6px"><button class="btn sm" data-act="addgrade">+ Add subject</button><button class="btn sm primary" data-act="cv" data-op="grade-mode">✓ Done</button></div></div>`;
  }
  function profileChecks() {
    const acts = S.activities.filter((a) => a.t);
    return [
      ["Add a profile photo", !!S.photo, "photo"], ["Add your name", !!S.name.trim(), "header"], ["Write a headline", !!S.headline.trim(), "header"], ["Add your school", !!S.contact.school.trim(), "edu"],
      ["Add 3+ grades", S.grades.filter((g) => g.g !== "").length >= 3, "grade-add"], ["Add an exam result", !!(S.exams.length || Object.keys(TEST_MAX).some((k) => S.tests[k])), "exam-add"],
      ["Add a course", S.courses.length > 0 || acts.some((a) => a.cat === "courses"), "course-add"], ["Add 3+ activities", acts.length >= 3, "act-add"],
      ["Add 3+ skills", S.skills.length >= 3, "skill-focus"], ["Add a language", S.languages.some((l) => l.lang), "lang-add"], ["Edit your About", !!S.summary.trim(), "about"]
    ];
  }
  function autoSummary() {
    const mainF = S.fields.map((k) => FIELDS[k]);
    return `Motivated ${S.age}-year-old student${S.contact.school ? ` at ${S.contact.school}` : ""} with a strong interest in ${mainF[0] || "my chosen field"}${mainF[1] ? ` and ${mainF[1]}` : ""}, actively building experience through competitions, courses and projects.`;
  }
  const pencil = (op, i, label = "Edit") => `<button class="icon-btn" data-act="cv" data-op="${op}"${i != null ? ` data-i="${esc(i)}"` : ""} title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg></button>`;
  const plus = (op, label) => `<button class="icon-btn add" data-act="cv" data-op="${op}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>`;
  function secHead(title, sub, actions) { return `<div class="li-sec-h"><div><h2>${title}</h2>${sub ? `<div class="small muted">${sub}</div>` : ""}</div><div class="li-actions">${actions || ""}</div></div>`; }
  function actItem(a) {
    const lv = LEVELS[a.lvl] ? LEVELS[a.lvl][0] : "";
    return `<div class="li-item" data-act="cv" data-op="act-edit" data-i="${a.id}" tabindex="0">
      <span class="li-ic c-${a.cat}">${CAT_ICON[a.cat] || "•"}</span>
      <div class="grow"><b>${esc(a.t)}</b><div class="small">${[a.org, CATS[a.cat]].filter(Boolean).map(esc).join(" · ")}</div>
        <div class="small muted">${[lv && lv + " level", a.date ? fmtMonth(a.date) : a.ts ? fmtDate(a.ts) : "", a.f ? FIELDS[a.f] : ""].filter(Boolean).join(" · ")}</div>
        ${a.desc ? `<p class="li-desc">${esc(a.desc)}</p>` : ""}
        ${a.src === "addon" ? `<span class="li-badge">⚡ Vita add-on</span>` : ""}</div>
      <span class="li-pen">✎</span></div>`;
  }
  function fmtMonth(m) { const [y, mo] = String(m).split("-"); if (!mo) return y; return new Date(Number(y), Number(mo) - 1).toLocaleDateString(undefined, { month: "short", year: "numeric" }); }
  function listSec(key, items, render, empty) {
    const max = 3, all = cvShow[key], shown = all ? items : items.slice(0, max);
    return (shown.map(render).join("") || `<p class="li-empty">${empty}</p>`) + (items.length > max ? `<button class="li-more" data-act="cv" data-op="more" data-i="${key}">${all ? "Show less ↑" : `Show all ${items.length} →`}</button>` : "");
  }
  function viewCV() {
    const acts = S.activities.filter((a) => a.t).slice().sort((x, y) => (y.date || "").localeCompare(x.date || "") || (y.ts || 0) - (x.ts || 0));
    const exp = acts.filter((a) => SEC_EXP.includes(a.cat)), ach = acts.filter((a) => SEC_ACH.includes(a.cat)), cact = acts.filter((a) => SEC_COURSE.includes(a.cat));
    const checks = profileChecks(), strength = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);
    const avg = academicAvg(), lv = level(), b = BOARDS[S.curriculum];
    const grades = S.grades.map((g, i) => ({ g, i, sc: gradeScore(g) })).filter((x) => x.g.g !== "");
    const tests = Object.entries(TEST_MAX).filter(([k]) => S.tests[k]);
    const res = S.picks.map((p) => ({ p, u: uniById(p.u), r: assess(uniById(p.u), p.f) }));
    const sugg = (SKILL_SUGG[S.fields[0]] || ["Teamwork", "Communication", "Problem solving", "Time management"]).filter((x) => !S.skills.includes(x));
    const loc = [S.contact.city, S.country].filter(Boolean).join(", ");
    return `${nav("cv")}<main class="wrap cvp">
      <div class="cvtabs"><a href="#/cv" class="on">My CV</a><a href="#/statement">Personal statement${stmtWords() ? ` · ${stmtWords()} words` : ""}</a></div>
      <div class="cvp-grid">
      <div class="cvp-main">
        <section class="card li-head">
          <div class="li-cover" style="${S.banner ? `background:url(${S.banner}) center/cover` : `background:${BANNERS[S.bannerStyle] || BANNERS.hero}`}">${!S.banner && (S.bannerStyle || "hero") === "hero" ? `<div class="hb-blob"></div><div class="li-cover-art">${ART.hero}</div>` : ""}</div>
          <details class="cover-tools"><summary class="cover-btn">📷 Edit banner</summary><div class="menu">
            <div class="flabel">Palette banners</div>
            <div class="swatches">${Object.entries(BANNERS).map(([k, g]) => `<button class="swatch ${!S.banner && (S.bannerStyle || "hero") === k ? "on" : ""}" style="background:${g}" data-act="banner" data-k="${k}" title="${k}" aria-label="${k} banner"></button>`).join("")}</div>
            <label class="menu-item">⬆ Upload your own image${photoInput("banner")}</label>
            ${S.banner ? `<button class="menu-item" data-act="banner" data-k="remove">✕ Remove banner image</button>` : ""}
            ${S.photo ? `<button class="menu-item" data-act="photo-rm">✕ Remove profile photo</button>` : ""}
          </div></details>
          <div class="li-body">
            <label class="li-avatar ${S.photo ? "has" : ""}" title="Change profile photo">${avatarInner()}<span class="av-cam">📷 ${S.photo ? "Change" : "Add photo"}</span>${photoInput("photo")}</label>
            <div class="li-head-actions">${pencil("header", null, "Edit intro")}</div>
            <h1>${esc(S.name || "Your Name")}</h1>
            <p class="li-headline ${S.headline ? "" : "ph"}" data-act="cv" data-op="header">${esc(S.headline || `Aspiring ${S.fields[0] ? FIELDS[S.fields[0]] : "university"} student · click to add a headline`)}</p>
            <p class="small muted">${[S.contact.school, loc, S.contact.email].filter(Boolean).map(esc).join(" · ") || "Add your school and location"}</p>
            <div class="li-badges"><span>🎓 ${esc(b ? b.label : "")}</span>${avg != null ? `<span>📊 ≈ IB ${scoreToIb(avg)}/45</span>` : ""}<span>🔥 ${streak()} sprint streak</span><span>⭐ Level ${lv.n}</span>${S.picks.length ? `<span>🏛️ ${S.picks.length} target universities</span>` : ""}</div>
            <div class="row-gap li-cta">
              <details class="addmenu"><summary class="btn primary">+ Add to CV</summary><div class="menu">
                ${[["act-add", "💼", "Activity or experience"], ["course-add", "🎓", "Course or certificate"], ["exam-add", "📝", "Exam result"], ["grade-add", "📊", "Grade"], ["lang-add", "🗣️", "Language"], ["skill-focus", "✨", "Skill"]].map(([op, ic, l]) => `<button data-act="cv" data-op="${op}"><span>${ic}</span>${l}</button>`).join("")}
              </div></details>
              <details class="addmenu pdfmenu"><summary class="btn">⤓ Save as PDF ▾</summary><div class="menu">
                <div class="flabel">Template</div>
                <div class="tpls">${[["classic", "Classic"], ["modern", "Modern"], ["minimal", "Minimal"]].map(([k, l]) => `<button class="tpl tpl-${k} ${S.cvTpl === k ? "on" : ""}" data-act="set" data-k="cvTpl" data-v="${k}" aria-pressed="${S.cvTpl === k}"><i></i><span>${l}</span></button>`).join("")}</div>
                <label class="chk"><input type="checkbox" id="cvphoto" ${S.cvPhoto ? "checked" : ""}> Include photo</label>
                <button class="btn primary" data-act="print" style="width:100%;justify-content:center">⤓ Download PDF</button>
                <p class="small muted" style="margin:6px 0 0">In the print window, choose “Save as PDF”.</p></div></details>
              <button class="btn" data-act="share">🔗 Share link</button>
              <a class="btn ghost" href="#/addons">Find add-ons →</a>
            </div>
          </div>
        </section>

        <section class="card li-sec">${secHead("About", "", pencil("about", null, "Edit about"))}
          <p class="li-about" contenteditable="true" data-cvsummary spellcheck="true">${esc(S.summary || autoSummary())}</p>
          <div class="small muted">Click the text to edit · ${S.summary ? "custom" : "auto-generated from your profile"}</div></section>

        <section class="card li-sec">${secHead("Education", "", `<button class="btn sm ${cvGradeEdit ? "primary" : ""}" data-act="cv" data-op="grade-mode">${cvGradeEdit ? "✓ Done" : "✎ Edit grades"}</button>` + pencil("edu", null, "Edit school"))}
          <div class="li-item static"><span class="li-ic school">${esc(initials(S.contact.school || "School")) || "S"}</span>
            <div class="grow"><b>${esc(S.contact.school || "Your school")}</b><div class="small">${esc(b ? b.label : "")}</div>
            <div class="small muted">${S.edu.start || S.edu.end ? `${esc(S.edu.start || "?")} – ${esc(S.edu.end || "present")}` : "Add your years"}${avg != null ? ` · Average ≈ IB ${scoreToIb(avg)}/45` : ""}</div></div></div>
          ${cvGradeEdit ? gradeTable() : `<div class="gradegrid">${grades.map(({ g, i, sc }) => `<button class="gcard ${sc == null ? "" : sc >= 88 ? "good" : sc >= 74 ? "mid" : "low"}" data-act="cv" data-op="grade-edit" data-i="${i}" title="Edit grade">
              <span class="gc-s">${esc(g.s)}</span><span class="sr-only">grade ${esc(g.g)}, edit</span><span class="gc-l">${esc([BOARDS[g.b] ? BOARDS[g.b].label : "", g.l].filter(Boolean).join(" · "))}</span>
              <span class="gc-g">${esc(g.g)}${g.b === "PCT" ? "%" : ""}</span><span class="gc-bar"><i style="width:${sc || 0}%"></i></span></button>`).join("")}
            <button class="gcard addcard" data-act="cv" data-op="grade-quick"><span class="gc-plus">＋</span><span class="gc-s">Add grade</span></button></div>`}
        </section>

        <section class="card li-sec">${secHead("Exams & test results", "Standardised tests, mock exams and admissions tests", plus("exam-add", "Add exam result") + pencil("tests", null, "Edit SAT / ACT / IELTS / TOEFL"))}
          <div class="examgrid">
            ${tests.map(([k, [label, max]]) => { const v = Number(S.tests[k]); return `<button class="ecard" data-act="cv" data-op="tests"><span class="ec-n">${label}</span><span class="ec-v">${esc(S.tests[k])}<small>/${max}</small></span><span class="gc-bar"><i style="width:${clamp((v / max) * 100, 0, 100)}%"></i></span></button>`; }).join("")}
            ${S.exams.map((e, i) => { const v = parseFloat(e.score), m = parseFloat(e.max); return `<button class="ecard" data-act="cv" data-op="exam-edit" data-i="${i}"><span class="ec-n">${esc(e.name)}</span><span class="ec-v">${esc(e.score)}${e.max ? `<small>/${esc(e.max)}</small>` : ""}</span>${v && m ? `<span class="gc-bar"><i style="width:${clamp((v / m) * 100, 0, 100)}%"></i></span>` : ""}${e.date ? `<span class="small muted">${esc(fmtMonth(e.date))}</span>` : ""}</button>`; }).join("")}
            <button class="ecard addcard" data-act="cv" data-op="exam-add"><span class="gc-plus">＋</span><span class="ec-n">Add exam result</span><span class="small muted">e.g. SAT, UCAT, mock IB, Olympiad round</span></button>
          </div></section>

        <section class="card li-sec">${secHead("Courses & certifications", "", plus("course-add", "Add course"))}
          ${listSec("courses", [...S.courses.map((c, i) => ({ c, i })), ...cact.map((a) => ({ a }))], (x) => x.a ? actItem(x.a) : `<div class="li-item" data-act="cv" data-op="course-edit" data-i="${x.i}" tabindex="0"><span class="li-ic c-courses">🎓</span>
              <div class="grow"><b>${esc(x.c.title)}</b><div class="small">${esc(x.c.provider || "")}</div><div class="small muted">${x.c.date ? esc(fmtMonth(x.c.date)) : ""}</div>${x.c.desc ? `<p class="li-desc">${esc(x.c.desc)}</p>` : ""}
              ${x.c.url ? `<a class="li-link" href="${esc(x.c.url)}" target="_blank" rel="noopener">Show credential ↗</a>` : ""}</div><span class="li-pen">✎</span></div>`, "No courses yet. Try a free one like Harvard CS50 or a Khan Academy unit.")}</section>

        <section class="card li-sec">${secHead("Experience & leadership", "Work, volunteering, clubs and debate", plus("act-add", "Add experience"))}
          ${listSec("exp", exp, actItem, "Add a part-time job, volunteering or a club you lead.")}</section>

        <section class="card li-sec">${secHead("Projects & achievements", "Competitions, projects, writing, arts and sports", plus("act-add", "Add achievement"))}
          ${listSec("ach", ach, actItem, "Add an olympiad, a project, an essay prize or a sports result.")}</section>

        <section class="card li-sec">${secHead("Skills", "")}
          <div class="skills">${S.skills.map((k, i) => `<span class="skill">${esc(k)}<button data-act="cv" data-op="skill-del" data-i="${i}" aria-label="Remove ${esc(k)}">×</button></span>`).join("")}
            <input id="skillin" class="skillin" placeholder="Type a skill + Enter"></div>
          ${sugg.length ? `<div class="small muted sugg-l">Suggested for ${S.fields[0] ? FIELDS[S.fields[0]] : "you"}:</div><div class="skills">${sugg.map((k) => `<button class="skill sugg" data-act="cv" data-op="skill-add" data-i="${esc(k)}">+ ${esc(k)}</button>`).join("")}</div>` : ""}</section>

        <section class="card li-sec">${secHead("Languages", "", plus("lang-add", "Add language"))}
          <div class="langs">${S.languages.map((l, i) => l.lang ? `<button class="lang" data-act="cv" data-op="lang-edit" data-i="${i}"><b>${esc(l.lang)}</b><span>${esc(l.lvl)}</span><span class="dots">${["A1", "A2", "B1", "B2", "C1", "C2", "Native"].map((x, j) => `<i class="${j <= ["A1", "A2", "B1", "B2", "C1", "C2", "Native"].indexOf(l.lvl) ? "on" : ""}"></i>`).join("")}</span></button>` : "").join("") || `<p class="li-empty">Add the languages you speak.</p>`}</div></section>
      </div>

      <aside class="cvp-side">
        <section class="card li-sec strength"><h2>Profile strength</h2>
          <div class="st-top">${ring(strength, 84)}<div><b>${strength >= 90 ? "All-star" : strength >= 60 ? "Intermediate" : "Beginner"}</b><div class="small muted">${checks.filter((c) => c[1]).length}/${checks.length} sections complete</div></div></div>
          <div class="st-list">${checks.filter((c) => !c[1]).slice(0, 5).map(([l, , op]) => `<button data-act="cv" data-op="${op}"><span>＋</span>${l}</button>`).join("") || `<p class="small muted">Your CV is complete. Keep adding add-ons every sprint!</p>`}</div></section>
        ${res.length ? `<section class="card li-sec"><h2>Target universities</h2>${res.map((x) => `<a class="mini-uni" href="#/uni/${x.u.id}/${x.p.f}">${crest(x.u, 34)}<span class="grow"><b>${esc(x.u.n)}</b><span class="small muted">${FIELDS[x.p.f]}</span></span><span class="mini-p ${x.r.score >= 75 ? "good" : x.r.score >= 50 ? "mid" : "low"}">${x.r.score}%</span></a>`).join("")}</section>` : ""}
        ${S.badges.length ? `<section class="card li-sec"><h2>Badges</h2>${badgeGrid(true)}<a class="small" href="#/streak">See all badges →</a></section>` : ""}
        <section class="card li-sec tipcard"><h2>💡 CV tip</h2><p class="small">Admissions tutors love <b>specifics</b>: say what you did, where, and the result. For example, “Ranked top 10% in the national Math Olympiad, regional round” instead of “did math olympiad”.</p></section>
      </aside>
      </div>

      <article class="cv cv-print tpl-${S.cvTpl} ${S.cvPhoto ? "" : "nophoto"}" aria-hidden="true">
        <header>${S.photo ? `<img class="cv-photo" src="${S.photo}" alt="">` : ""}<h1>${esc(S.name || "Your Name")}</h1>${S.headline ? `<div class="cv-headline">${esc(S.headline)}</div>` : ""}<div class="cv-contact">${[S.contact.email, loc].filter(Boolean).map(esc).join(" · ")}</div></header>
        <p class="cv-summary">${esc(S.summary || autoSummary())}</p>
        <h2>Education</h2><div class="cv-row"><b>${esc(S.contact.school || "School")}</b><span>${esc(b ? b.label : "")}${S.edu.start || S.edu.end ? ` · ${esc(S.edu.start)}–${esc(S.edu.end || "present")}` : ""}</span></div>
        ${grades.length ? `<div class="cv-grades">${grades.map(({ g }) => `<span>${esc(g.s)}${g.l ? ` (${esc(g.l)})` : ""}: <b>${esc(g.g)}${g.b === "PCT" ? "%" : ""}</b></span>`).join("")}</div>` : ""}
        ${tests.length || S.exams.length ? `<h2>Exams & test results</h2><div class="cv-grades">${tests.map(([k, [l, m]]) => `<span>${l}: <b>${esc(S.tests[k])}</b>/${m}</span>`).join("")}${S.exams.map((e) => `<span>${esc(e.name)}: <b>${esc(e.score)}</b>${e.max ? "/" + esc(e.max) : ""}</span>`).join("")}</div>` : ""}
        ${[["Courses & certifications", [...S.courses.map((c) => ({ t: c.title, org: c.provider, date: c.date })), ...cact]], ["Experience & leadership", exp], ["Projects & achievements", ach]].filter((x) => x[1].length).map(([h, items]) => `<h2>${h}</h2><ul>${items.map((a) => `<li><span>${esc(a.t)}${a.org ? `, ${esc(a.org)}` : ""}</span> <span class="cv-meta">${a.date ? fmtMonth(a.date) : a.ts ? fmtDate(a.ts) : ""}</span></li>`).join("")}</ul>`).join("")}
        ${S.skills.length ? `<h2>Skills</h2><p>${S.skills.map(esc).join(" · ")}</p>` : ""}
        ${S.languages.filter((l) => l.lang).length ? `<h2>Languages</h2><div class="cv-grades">${S.languages.filter((l) => l.lang).map((l) => `<span>${esc(l.lang)}: <b>${esc(l.lvl)}</b></span>`).join("")}</div>` : ""}
      </article></main>`;
  }

  /* ---------- generic form modal ---------- */
  function openForm(title, fields, vals, onSave, onDelete) {
    const m = document.createElement("div"); m.className = "modal-bg";
    const ctl = (f) => {
      const v = vals[f.k] == null ? "" : vals[f.k];
      if (f.type === "select") return `<select name="${f.k}">${f.options.map(([o, l]) => opt(o, l, v)).join("")}</select>`;
      if (f.type === "textarea") return `<textarea name="${f.k}" rows="3" placeholder="${esc(f.ph || "")}">${esc(v)}</textarea>`;
      return `<input name="${f.k}" type="${f.type || "text"}" value="${esc(v)}" placeholder="${esc(f.ph || "")}" ${f.req ? "required" : ""} ${f.step ? `step="${f.step}"` : ""}>`;
    };
    m.innerHTML = `<form class="modal card pad" role="dialog" aria-modal="true"><h2>${esc(title)}</h2>
      <div class="formgrid">${fields.map((f) => `<label class="${f.wide ? "wide" : ""}">${esc(f.label)}${ctl(f)}</label>`).join("")}</div>
      <div class="row-between">${onDelete ? `<button type="button" class="btn danger" data-m="del">Delete</button>` : "<span></span>"}<span class="row-gap"><button type="button" class="btn" data-m="cancel">Cancel</button><button type="submit" class="btn primary">Save</button></span></div></form>`;
    document.body.appendChild(m);
    const form = m.querySelector("form"), first = form.querySelector("input,select,textarea"); if (first) first.focus();
    let restore = () => {};
    const close = () => { m.classList.add("out"); setTimeout(() => m.remove(), 200); restore(); };
    restore = trapFocus(m, close);
    const gsel = form.querySelector('[name="b"]');
    if (gsel && form.querySelector('[name="g"]')) gsel.addEventListener("change", () => {
      const bd = BOARDS[gsel.value], gEl = form.querySelector('[name="g"]'), lEl = form.querySelector('[name="l"]');
      gEl.outerHTML = bd.grades ? `<select name="g"><option value="">Grade</option>${bd.grades.map((x) => opt(x, x, "")).join("")}</select>` : `<input name="g" type="number" min="0" max="100" placeholder="%">`;
      lEl.innerHTML = `<option value="">—</option>${bd.levels.map((x) => opt(x, x, "")).join("")}`;
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault(); const out = {}; new FormData(form).forEach((v, k) => (out[k] = String(v).trim()));
      onSave(out); save(); close(); render(); toast("Saved to your CV ✓");
    });
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]");
      if (e.target === m || (b && b.dataset.m === "cancel")) close();
      if (b && b.dataset.m === "del" && confirm("Delete this item?")) { onDelete(); save(); close(); render(); toast("Deleted"); }
    });
  }
  const catOpts = () => Object.entries(CATS).map(([k, l]) => [k, l]);
  const lvlOpts = () => Object.entries(LEVELS).map(([k, l]) => [k, l[0]]);
  const fieldOpts = () => [["", "General"], ...Object.entries(FIELDS)];
  const LANG_LV = ["Native", "C2", "C1", "B2", "B1", "A2", "A1"].map((x) => [x, x]);
  function cvAction(op, i) {
    const actFields = [{ k: "t", label: "Title / role", req: 1, wide: 1, ph: "e.g. Captain, school debate team" }, { k: "org", label: "Organisation", ph: "e.g. Warsaw Debate Society" },
      { k: "date", label: "Date", type: "month" }, { k: "cat", label: "Category", type: "select", options: catOpts() }, { k: "lvl", label: "Level", type: "select", options: lvlOpts() },
      { k: "f", label: "Related field", type: "select", options: fieldOpts() }, { k: "desc", label: "Description", type: "textarea", wide: 1, ph: "What you did, and the result" }];
    const gradeFields = (b) => [{ k: "s", label: "Subject", type: "select", options: SUBJECTS.map((x) => [x, x]) }, { k: "b", label: "Board", type: "select", options: Object.entries(BOARDS).map(([k, x]) => [k, x.label]) },
      { k: "l", label: "Level", type: "select", options: [["", "—"], ...BOARDS[b].levels.map((x) => [x, x])] },
      BOARDS[b].grades ? { k: "g", label: "Grade", type: "select", options: [["", "Grade"], ...BOARDS[b].grades.map((x) => [x, x])] } : { k: "g", label: "Grade (%)", type: "number" }];
    switch (op) {
      case "photo": { const el = app.querySelector('.li-avatar input[type=file]'); if (el) el.click(); return; }
      case "header": return openForm("Edit intro", [{ k: "name", label: "Full name", req: 1 }, { k: "headline", label: "Headline", wide: 1, ph: "e.g. IB student · Aspiring software engineer · Olympiad finalist" },
        { k: "school", label: "School" }, { k: "email", label: "Email", type: "email" }, { k: "city", label: "City" }, { k: "country", label: "Country" }],
        { name: S.name, headline: S.headline, school: S.contact.school, email: S.contact.email, city: S.contact.city, country: S.country },
        (o) => { S.name = o.name; S.headline = o.headline; S.contact.school = o.school; S.contact.email = o.email; S.contact.city = o.city; S.country = o.country; });
      case "about": { const el = app.querySelector("[data-cvsummary]"); if (el) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } return; }
      case "edu": return openForm("Edit education", [{ k: "school", label: "School", wide: 1, req: 1 }, { k: "curriculum", label: "Curriculum", type: "select", options: Object.entries(BOARDS).map(([k, x]) => [k, x.label]) },
        { k: "start", label: "Start year", type: "number", ph: "2023" }, { k: "end", label: "End year", type: "number", ph: "2027" }],
        { school: S.contact.school, curriculum: S.curriculum, start: S.edu.start, end: S.edu.end }, (o) => { S.contact.school = o.school; S.curriculum = o.curriculum; S.edu = { start: o.start, end: o.end }; });
      case "grade-add": if (location.hash.startsWith("#/cv")) return cvAction("grade-quick"); return openForm("Add a grade", gradeFields(S.curriculum), { s: "Mathematics", b: S.curriculum, l: BOARDS[S.curriculum].levels[0] || "" }, (o) => S.grades.push({ s: o.s, b: o.b, l: o.l || "", g: o.g || "" }));
      case "grade-edit": { const g = S.grades[i]; return openForm("Edit grade", gradeFields(g.b), g, (o) => Object.assign(g, { s: o.s, b: o.b, l: o.l || "", g: o.g || "" }), () => S.grades.splice(i, 1)); }
      case "tests": return openForm("Standardised tests", [{ k: "sat", label: "SAT (400–1600)", type: "number" }, { k: "act", label: "ACT (1–36)", type: "number" }, { k: "ielts", label: "IELTS (0–9)", type: "number", step: "0.5" }, { k: "toefl", label: "TOEFL iBT (0–120)", type: "number" }],
        S.tests, (o) => Object.assign(S.tests, o));
      case "exam-add": case "exam-edit": { const e = op === "exam-edit" ? S.exams[i] : {};
        return openForm(op === "exam-add" ? "Add exam result" : "Edit exam result", [{ k: "name", label: "Exam", req: 1, wide: 1, ph: "e.g. UCAT, IB mock exams, UKMT Senior Challenge" }, { k: "score", label: "Score / result", req: 1, ph: "e.g. 2850 or Gold" }, { k: "max", label: "Out of (optional)", ph: "e.g. 3600" }, { k: "date", label: "Date", type: "month" }],
          e, (o) => (op === "exam-add" ? S.exams.push(o) : Object.assign(e, o)), op === "exam-edit" ? () => S.exams.splice(i, 1) : null); }
      case "course-add": case "course-edit": { const c = op === "course-edit" ? S.courses[i] : {};
        return openForm(op === "course-add" ? "Add course or certificate" : "Edit course", [{ k: "title", label: "Course / certificate", req: 1, wide: 1, ph: "e.g. CS50x: Introduction to Computer Science" }, { k: "provider", label: "Provider", ph: "e.g. Harvard / edX" }, { k: "date", label: "Completed", type: "month" }, { k: "url", label: "Credential link", type: "url", wide: 1, ph: "https://…" }, { k: "desc", label: "What you learned", type: "textarea", wide: 1 }],
          c, (o) => (op === "course-add" ? S.courses.push(o) : Object.assign(c, o)), op === "course-edit" ? () => S.courses.splice(i, 1) : null); }
      case "act-add": return openForm("Add activity or experience", actFields, { cat: "leadership", lvl: "school", f: S.fields[0] || "" }, (o) => S.activities.push({ id: uid(), ...o, src: "manual", ts: Date.now() }));
      case "act-edit": { const a = S.activities.find((x) => x.id === i); if (!a) return; return openForm("Edit activity", actFields, a, (o) => Object.assign(a, o), () => (S.activities = S.activities.filter((x) => x.id !== i))); }
      case "lang-add": return openForm("Add language", [{ k: "lang", label: "Language", req: 1 }, { k: "lvl", label: "Level", type: "select", options: LANG_LV }], { lvl: "B2" }, (o) => S.languages.push(o));
      case "lang-edit": { const l = S.languages[i]; return openForm("Edit language", [{ k: "lang", label: "Language", req: 1 }, { k: "lvl", label: "Level", type: "select", options: LANG_LV }], l, (o) => Object.assign(l, o), () => S.languages.splice(i, 1)); }
      case "skill-add": if (!S.skills.includes(i)) S.skills.push(i); save(); render(); return;
      case "skill-del": S.skills.splice(Number(i), 1); save(); render(); return;
      case "skill-focus": { const el = document.getElementById("skillin"); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); } return; }
      case "more": cvShow[i] = !cvShow[i]; render(); return;
      case "grade-mode": cvGradeEdit = !cvGradeEdit; render(); if (cvGradeEdit) { const f = app.querySelector(".gtable select"); if (f) f.focus(); } return;
      case "grade-quick": { cvGradeEdit = true; const bd = S.grades.length ? S.grades[S.grades.length - 1].b : S.curriculum; S.grades.push({ s: "Mathematics", b: bd, l: BOARDS[bd].levels[0] || "", g: "" }); save(); render(); const rows = app.querySelectorAll(".gtable .graderow"); const last = rows[rows.length - 1]; if (last) { last.scrollIntoView({ block: "center", behavior: "smooth" }); last.querySelector("select").focus(); } return; }
    }
  }

  /* ---------- modal ---------- */
  function trapFocus(m, close) {
    const prev = document.activeElement;
    const key = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") {
        const f = [...m.querySelectorAll("button,input,select,textarea,a[href]")].filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    m.addEventListener("keydown", key);
    return () => { if (prev && prev.focus && document.body.contains(prev)) prev.focus(); };
  }
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
    let restore = () => {};
    const close = () => { m.classList.add("out"); setTimeout(() => m.remove(), 200); restore(); };
    restore = trapFocus(m, close);
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b && e.target !== m) return;
      if (b && b.dataset.m === "ok") { const res = completeAddon(a, m.querySelector("textarea").value.trim()); m.remove(); render(); celebrate(res); return; }
      close();
    });
  }

  /* ---------- router / render ---------- */
  function render(enter) {
    const h = location.hash.replace(/^#\/?/, "").split("/");
    const route = h[0] || "";
    let html;
    if (route === "share") {
      app.innerHTML = `<div class="wrap" style="padding:80px 16px;text-align:center"><p class="muted">Loading shared CV…</p></div>`;
      decodeShare(h[1] || "").then((d) => { app.innerHTML = viewShared(d); }).catch(() => { app.innerHTML = `<div class="wrap" style="padding:80px 16px;text-align:center"><h1>Link not valid</h1><p class="muted">This share link is broken or incomplete.</p><a class="btn primary" href="#/">Go to Vita</a></div>`; });
      return;
    }
    applyFreezes();
    if (!S.started && !S.onboarded && route === "") html = viewLanding();
    else if (route === "quiz") html = viewQuiz();
    else if (route === "profile" || route === "setup" || route === "onboarding") html = viewSetup();
    else if (route === "unis") html = viewUnis();
    else if (route === "streak") html = viewStreak();
    else if (route === "uni") html = viewUni(h[1], h[2]);
    else if (route === "addons") html = viewAddons();
    else if (route === "cv") html = viewCV();
    else if (route === "plan") html = viewPlan();
    else if (route === "statement") html = viewStatement();
    else html = viewHome();
    app.innerHTML = html;
    if (enter) {
      app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter"); countUp();
      clearTimeout(render.t); render.t = setTimeout(() => app.classList.remove("enter"), 1400);
    }
    bindTilt();
    if (S.started || S.onboarded) checkBadges();
  }

  /* ---------- events ---------- */
  app.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.bind) { setPath(S, el.dataset.bind, el.value); save(); updatePreview(); }
    if (el.id === "hs") { homeQ = el.value; const r = document.getElementById("hsr"); if (r) r.innerHTML = homeResults(); }
    if (el.id === "pq") { pickerQ = el.value; const pos = el.selectionStart; render(); const n = document.getElementById("pq"); n.focus(); n.setSelectionRange(pos, pos); }
    if (el.hasAttribute("data-cvsummary")) { S.summary = el.textContent; save(); }
    if (el.dataset.bind && el.dataset.bind.startsWith("statement.")) updateCounters();
  });
  app.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.bind) { setPath(S, el.dataset.bind, el.value); save(); }
    if (el.dataset.bind && el.hasAttribute("data-rerender")) {
      if (/^grades\.\d+\.b$/.test(el.dataset.bind)) { const g = getPath(S, el.dataset.bind.replace(/\.b$/, "")); g.g = ""; g.l = (BOARDS[g.b].levels[0] || ""); save(); }
      render();
    }
    if (el.dataset.img) { handleImg(el); return; }
    if (el.id === "pr") { pickerRegion = el.value; render(); }
    if (el.id === "pf") { pickerField = el.value; render(); }
    if (el.id === "af") { addonF = el.value; render(); }
    if (el.id === "uf") { location.hash = `#/uni/${el.dataset.uni}/${el.value}`; }
    if (el.dataset.bind && /\.g$|\.b$|\.l$/.test(el.dataset.bind)) { updatePreview(); const m = document.getElementById("gmeter"); if (m && !el.hasAttribute("data-rerender")) render(); }
    if (el.id === "ac") { addonCat = el.value; render(); }
    if (el.id === "cvphoto") { S.cvPhoto = el.checked; save(); }
  });
  app.addEventListener("click", (e) => {
    if (e.target.closest("a[target=_blank]")) return;
    const b = e.target.closest("[data-act]"); if (!b) return;
    const d = b.dataset, act = d.act;
    switch (act) {
      case "start": S.started = true; save(); location.hash = "#/home"; return;
      case "next": S.step = Math.min(STEPS.length - 1, S.step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); break;
      case "prev": S.step = Math.max(0, S.step - 1); window.scrollTo({ top: 0, behavior: "smooth" }); break;
      case "goto": S.step = Number(d.i); save(); if (!/^#\/(profile|setup)/.test(location.hash)) { location.hash = "#/profile"; return; } break;
      case "set": setPath(S, d.k, d.v); if (b.closest(".pdfmenu")) { save(); render(); const pm = app.querySelector(".pdfmenu"); if (pm) pm.open = true; return; } break;
      case "photo-rm": S.photo = ""; toast("Photo removed"); break;
      case "banner": { if (d.k === "remove") S.banner = ""; else { S.bannerStyle = d.k; S.banner = ""; } const m = b.closest("details"); if (m) m.open = false; break; }
      case "hq": if (d.f) { pickerField = d.f; save(); location.hash = "#/unis"; return; } homeQ = d.q; { const i = document.getElementById("hs"); if (i) { i.value = d.q; i.focus(); } const r = document.getElementById("hsr"); if (r) r.innerHTML = homeResults(); } return;
      case "field": {
        const i = S.fields.indexOf(d.k);
        if (i >= 0) S.fields.splice(i, 1); else if (S.fields.length < 3) S.fields.push(d.k); else toast("You can pick up to 3. Remove one first.");
        break;
      }
      case "addgrade": { const bd = S.grades.length ? S.grades[S.grades.length - 1].b : S.curriculum; S.grades.push({ s: "Mathematics", b: bd, l: BOARDS[bd].levels[0] || "", g: "" }); break; }
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
      case "quiz": S.quiz[d.i] = Number(d.j); save(); render(true); return;
      case "acat": addonCat = d.k; break;
      case "preg": pickerRegion = d.k; break;
      case "quizreset": S.quiz = {}; break;
      case "quizpick": S.fields = [d.k, ...S.fields.filter((k) => k !== d.k)].slice(0, 3); S.step = 1; save(); location.hash = "#/profile"; return;
      case "log": { const a = ADDONS.find((x) => x.id === d.id); if (a) openLog(a); return; }
      case "print": { const m = b.closest("details"); if (m) m.open = false; render(); setTimeout(() => window.print(), 50); return; }
      case "share": copyShare(); return;
      case "ics-sprints": icsSprints(); S.icsDone = true; save(); return;
      case "ics-deadlines": icsDeadlines(); S.icsDone = true; save(); return;
      case "idea": {
        const ta = (lastTA && document.body.contains(lastTA)) ? lastTA : app.querySelector(".st-q textarea");
        if (!ta) return; const t = d.t; ta.value = ta.value + (ta.value.trim() ? (ta.value.endsWith("\n") ? "" : "\n\n") : "") + t;
        setPath(S, ta.dataset.bind, ta.value); save(); updateCounters(); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); ta.scrollTop = ta.scrollHeight; return;
      }
      case "cv": { const n = b.closest(".addmenu"); if (n) n.open = false; cvAction(d.op, d.i != null && /^\d+$/.test(d.i) && !/^skill-add$|^act-edit$/.test(d.op) ? Number(d.i) : d.i); return; }
      case "skip": S.created -= CYCLE; save(); toast("Moved to the next sprint"); break;
      case "reset": if (confirm("Delete all your Vita data on this device?")) { S = fresh(); save(); location.hash = ""; } break;
    }
    save(); render(["next", "prev", "goto", "quizreset", "skip"].includes(act));
  });
  window.addEventListener("hashchange", () => { render(true); window.scrollTo(0, 0); });
  app.addEventListener("focusin", (e) => { if (e.target.matches && e.target.matches(".st-q textarea")) lastTA = e.target; });
  app.addEventListener("keydown", (e) => {
    const el = e.target;
    if (el.id === "skillin" && e.key === "Enter") { e.preventDefault(); const v = el.value.trim(); if (v && !S.skills.includes(v)) { S.skills.push(v); save(); } render(); const n = document.getElementById("skillin"); if (n) n.focus(); }
    if (el.classList && el.classList.contains("li-item") && e.key === "Enter") el.click();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { const i = document.getElementById("hs"); if (i) { e.preventDefault(); i.focus(); } }
  });
  render(true);
})();
