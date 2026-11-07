/* Vita — inline SVG illustrations in the brand palette */
window.VITA_ART = (function () {
  const G = (id, a, b, v) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const spark = (x, y, s, c) => `<path class="art-twinkle" d="M${x} ${y - s}l${s * 0.3} ${s * 0.7} ${s * 0.7} ${s * 0.3}-${s * 0.7} ${s * 0.3}-${s * 0.3} ${s * 0.7}-${s * 0.3}-${s * 0.7}-${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3}z" fill="${c}"/>`;
  const svg = (body, defs) => `<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" class="art" role="img" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;

  const about = svg(`
    <circle cx="160" cy="128" r="98" fill="url(#ab1)" opacity=".6"/>
    <path d="M92 226c0-42 30-66 68-66s68 24 68 66z" fill="url(#ab2)"/>
    <path d="M144 162l16 18 16-18" fill="none" stroke="#f1d49a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="160" cy="114" r="35" fill="#f3d9b8"/>
    <path d="M124 112c-2-26 16-42 38-42 20 0 36 14 34 36-12-10-30-12-44-8-10 3-19 8-28 14z" fill="#2a4343"/>
    <circle cx="147" cy="118" r="3" fill="#2a4343"/><circle cx="173" cy="118" r="3" fill="#2a4343"/>
    <path d="M151 132q9 7 18 0" fill="none" stroke="#d35e36" stroke-width="3" stroke-linecap="round"/>
    <g class="art-float"><rect x="212" y="46" width="94" height="62" rx="12" fill="#fff" stroke="#ebe9df" stroke-width="2"/>
      <circle cx="236" cy="72" r="12" fill="url(#ab3)"/><rect x="255" y="62" width="40" height="7" rx="3.5" fill="#2a4343"/>
      <rect x="255" y="75" width="28" height="6" rx="3" fill="#c0c29d"/><rect x="224" y="92" width="70" height="6" rx="3" fill="#f1d49a"/></g>
    <g class="art-float d2"><rect x="18" y="128" width="70" height="44" rx="10" fill="#fff" stroke="#ebe9df" stroke-width="2"/>
      <rect x="30" y="140" width="34" height="6" rx="3" fill="#416b66"/><rect x="30" y="152" width="46" height="5" rx="2.5" fill="#c0c29d"/></g>
    ${spark(56, 70, 10, "#d35e36")}${spark(276, 150, 7, "#416b66")}<circle cx="250" cy="196" r="5" fill="#d35e36" opacity=".6"/>`,
    G("ab1", "#f1d49a", "#c0c29d") + G("ab2", "#416b66", "#2a4343", 1) + G("ab3", "#d35e36", "#f1d49a"));

  const career = svg(`
    <circle cx="160" cy="124" r="100" fill="url(#cr1)" opacity=".5"/>
    <g fill="none" stroke="#416b66" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 11" class="art-dash">
      <path d="M160 140C150 110 100 108 70 74"/><path d="M160 140C170 108 222 104 252 70"/><path d="M160 140V46"/></g>
    <g class="art-float"><path d="M70 74V40" stroke="#2a4343" stroke-width="3"/><path d="M70 40l26 8-26 8z" fill="#d35e36"/></g>
    <g class="art-float d2"><path d="M252 70V36" stroke="#2a4343" stroke-width="3"/><path d="M252 36l26 8-26 8z" fill="#f1d49a"/></g>
    <g class="art-float d3"><path d="M160 46V14" stroke="#2a4343" stroke-width="3"/><path d="M160 14l26 8-26 8z" fill="#416b66"/></g>
    <circle cx="160" cy="176" r="44" fill="#fff" stroke="url(#cr2)" stroke-width="7"/>
    <g class="art-spin"><path d="M160 144l10 32h-20z" fill="#d35e36"/><path d="M160 208l-10-32h20z" fill="#2a4343"/></g>
    <circle cx="160" cy="176" r="6" fill="#f1d49a" stroke="#2a4343" stroke-width="2"/>
    ${spark(40, 160, 9, "#d35e36")}${spark(286, 170, 8, "#416b66")}`,
    G("cr1", "#c0c29d", "#f1d49a") + G("cr2", "#2a4343", "#416b66"));

  const grades = svg(`
    <circle cx="150" cy="128" r="98" fill="url(#gr1)" opacity=".55"/>
    <g class="art-float slow"><rect x="76" y="28" width="150" height="192" rx="16" fill="#fff" stroke="#ebe9df" stroke-width="2"/>
      <path d="M76 44a16 16 0 0 1 16-16h118a16 16 0 0 1 16 16v20H76z" fill="url(#gr2)"/>
      <rect x="92" y="40" width="60" height="8" rx="4" fill="#f1d49a"/>
      <rect x="92" y="78" width="118" height="6" rx="3" fill="#ebe9df"/><rect x="92" y="92" width="86" height="6" rx="3" fill="#ebe9df"/>
      <path d="M92 198h118" stroke="#ebe9df" stroke-width="2"/>
      <rect class="art-grow" x="100" y="160" width="18" height="38" rx="5" fill="#c0c29d"/>
      <rect class="art-grow d2" x="128" y="142" width="18" height="56" rx="5" fill="#f1d49a"/>
      <rect class="art-grow d3" x="156" y="126" width="18" height="72" rx="5" fill="#416b66"/>
      <rect class="art-grow d4" x="184" y="112" width="18" height="86" rx="5" fill="#d35e36"/></g>
    <g class="art-pop"><circle cx="238" cy="62" r="32" fill="url(#gr3)"/><text x="238" y="72" text-anchor="middle" font-family="Inter,Arial" font-weight="800" font-size="26" fill="#fff">A+</text></g>
    ${spark(50, 70, 10, "#d35e36")}${spark(270, 190, 8, "#416b66")}`,
    G("gr1", "#f1d49a", "#c0c29d") + G("gr2", "#2a4343", "#416b66") + G("gr3", "#d35e36", "#e48a55"));

  const extras = svg(`
    <circle cx="160" cy="128" r="98" fill="url(#ex1)" opacity=".55"/>
    <g class="art-float slow">
      <path d="M118 52h84v34a42 42 0 0 1-84 0z" fill="url(#ex2)"/>
      <path d="M118 62h-16a20 20 0 0 0 22 34M202 62h16a20 20 0 0 1-22 34" fill="none" stroke="#d9a441" stroke-width="7" stroke-linecap="round"/>
      <path d="M140 66h40" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>
      <rect x="152" y="126" width="16" height="26" fill="#d9a441"/>
      <rect x="130" y="150" width="60" height="14" rx="4" fill="#2a4343"/><rect x="116" y="164" width="88" height="20" rx="7" fill="#416b66"/>
      <text x="160" y="96" text-anchor="middle" font-family="Inter,Arial" font-weight="800" font-size="24" fill="#fff">1</text></g>
    <g class="art-float d2"><path d="M52 112l12 26 12-26" fill="#d35e36"/><circle cx="64" cy="150" r="20" fill="#f1d49a" stroke="#d35e36" stroke-width="4"/><path d="M64 140l3 7h7l-6 4 3 7-7-4-7 4 3-7-6-4h7z" fill="#d35e36"/></g>
    <g class="art-float d3"><path d="M246 98l12 26 12-26" fill="#416b66"/><circle cx="258" cy="136" r="20" fill="#c0c29d" stroke="#416b66" stroke-width="4"/><text x="258" y="143" text-anchor="middle" font-family="Inter,Arial" font-weight="800" font-size="18" fill="#2a4343">2</text></g>
    ${spark(98, 30, 9, "#d35e36")}${spark(228, 40, 11, "#d9a441")}${spark(280, 200, 7, "#416b66")}<circle cx="40" cy="200" r="5" fill="#d35e36" opacity=".6"/>`,
    G("ex1", "#c0c29d", "#f1d49a") + G("ex2", "#f1d49a", "#d9a441", 1));

  const unis = svg(`
    <circle cx="160" cy="130" r="98" fill="url(#un1)" opacity=".55"/>
    <ellipse cx="160" cy="214" rx="120" ry="12" fill="#c0c29d" opacity=".6"/>
    <rect x="72" y="196" width="176" height="14" rx="3" fill="#416b66"/><rect x="82" y="186" width="156" height="12" rx="3" fill="#646756"/>
    <g fill="#fff" stroke="#ebe9df" stroke-width="2">
      <rect x="92" y="114" width="16" height="72"/><rect x="122" y="114" width="16" height="72"/><rect x="152" y="114" width="16" height="72"/>
      <rect x="182" y="114" width="16" height="72"/><rect x="212" y="114" width="16" height="72"/></g>
    <rect x="80" y="102" width="160" height="14" rx="3" fill="#2a4343"/>
    <path d="M74 102L160 54l86 48z" fill="url(#un2)"/>
    <circle cx="160" cy="84" r="9" fill="#f1d49a"/>
    <path d="M160 54V24" stroke="#2a4343" stroke-width="3"/><path class="art-wave" d="M160 24h30l-8 8 8 8h-30z" fill="#d35e36"/>
    <g class="art-float"><path d="M252 52l34-14 34 14-34 14z" transform="translate(-20 0)" fill="#2a4343"/><path d="M246 58v14q20 12 40 0V58" transform="translate(-20 0)" fill="#416b66"/><path d="M300 52v22" transform="translate(-20 0)" stroke="#f1d49a" stroke-width="3"/><circle cx="280" cy="76" r="4" fill="#f1d49a"/></g>
    ${spark(44, 66, 10, "#d35e36")}${spark(60, 170, 7, "#416b66")}`,
    G("un1", "#f1d49a", "#c0c29d") + G("un2", "#416b66", "#2a4343", 1));

  /* Home hero: campus skyline, light on dark */
  const hero = `<svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" class="art" aria-hidden="true">
    <defs>${G("hr1", "#f1d49a", "#e48a55")}${G("hr2", "#ffffff", "#e7efed", 1)}</defs>
    <circle class="art-float slow" cx="270" cy="70" r="40" fill="url(#hr1)" opacity=".95"/>
    <g opacity=".25" fill="#fff"><circle cx="60" cy="50" r="2"/><circle cx="120" cy="30" r="1.6"/><circle cx="200" cy="44" r="1.8"/><circle cx="330" cy="140" r="1.6"/></g>
    <path d="M0 214c60-18 120-18 180-6s120 10 180-4v36H0z" fill="#c0c29d" opacity=".35"/>
    <rect x="40" y="120" width="70" height="94" rx="4" fill="url(#hr2)" opacity=".92"/>
    <path d="M34 122l41-30 41 30z" fill="#f1d49a"/>
    <g fill="#416b66" opacity=".55"><rect x="52" y="136" width="12" height="16" rx="2"/><rect x="86" y="136" width="12" height="16" rx="2"/><rect x="52" y="166" width="12" height="16" rx="2"/><rect x="86" y="166" width="12" height="16" rx="2"/></g>
    <rect x="66" y="190" width="18" height="24" rx="9" fill="#d35e36"/>
    <rect x="130" y="80" width="90" height="134" rx="4" fill="url(#hr2)"/>
    <rect x="160" y="50" width="30" height="34" fill="#fff"/><path d="M156 52l19-22 19 22z" fill="#d35e36"/>
    <circle cx="175" cy="66" r="7" fill="#f1d49a" stroke="#2a4343" stroke-width="2"/>
    <g fill="#416b66" opacity=".55"><rect x="144" y="98" width="14" height="20" rx="2"/><rect x="168" y="98" width="14" height="20" rx="2"/><rect x="192" y="98" width="14" height="20" rx="2"/>
      <rect x="144" y="132" width="14" height="20" rx="2"/><rect x="168" y="132" width="14" height="20" rx="2"/><rect x="192" y="132" width="14" height="20" rx="2"/></g>
    <path d="M160 214v-30a15 15 0 0 1 30 0v30z" fill="#2a4343"/>
    <rect x="240" y="138" width="64" height="76" rx="4" fill="url(#hr2)" opacity=".92"/>
    <g fill="#416b66" opacity=".55"><rect x="252" y="152" width="12" height="14" rx="2"/><rect x="280" y="152" width="12" height="14" rx="2"/><rect x="252" y="178" width="12" height="14" rx="2"/><rect x="280" y="178" width="12" height="14" rx="2"/></g>
    <circle cx="20" cy="196" r="16" fill="#416b66"/><rect x="18" y="200" width="4" height="16" fill="#646756"/>
    <circle cx="226" cy="190" r="14" fill="#c0c29d"/><rect x="224" y="196" width="4" height="18" fill="#646756"/>
    <circle cx="330" cy="188" r="18" fill="#416b66"/><rect x="328" y="196" width="4" height="20" fill="#646756"/>
    <g class="art-float"><path d="M84 52l26-11 26 11-26 11z" fill="#f1d49a"/><path d="M94 57v10q16 9 32 0V57" fill="#e7efed"/><path d="M130 52v16" stroke="#d35e36" stroke-width="2.5"/></g>
    ${spark(330, 30, 8, "#f1d49a")}${spark(30, 90, 7, "#f1d49a")}
  </svg>`;

  const ICON = {
    uni: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/><path d="M21 9v6"/></svg>`,
    cv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><circle cx="11" cy="11" r="2"/><path d="M9 17h6M8.5 14.5c1.5-1 4.5-1 6 0"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>`,
    compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`
  };

  return { about, career, grades, extras, unis, hero, ICON };
})();
