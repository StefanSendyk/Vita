/* Vita — content: fields, grading boards, quiz, add-on library */
window.VITA = (function () {
  const FIELDS = {
    cs: "Computer Science", eng: "Engineering", med: "Medicine & Health", law: "Law",
    bus: "Economics & Business", math: "Mathematics", sci: "Natural Sciences", psy: "Psychology",
    arch: "Architecture", hum: "Humanities", pol: "Politics & Int. Relations", des: "Design & Media"
  };

  const CATS = {
    competitions: "Competitions & Olympiads", projects: "Projects & Research", volunteering: "Volunteering",
    leadership: "Leadership & Debate", work: "Work Experience", courses: "Courses & Summer Schools",
    writing: "Essays & Writing", arts: "Arts & Portfolio", sports: "Sports", languages: "Languages"
  };

  const LEVELS = { school: ["School", 1], regional: ["Regional", 2], national: ["National", 3], international: ["International", 4] };

  /* What each field expects. subjects = required, rec = recommended, cats = activity types that matter most */
  const FIELDREQ = {
    cs:   { subjects: ["Mathematics"], rec: ["Computer Science", "Further Mathematics", "Physics"], cats: ["projects", "competitions"], tip: "Show that you build things, for example a GitHub project, an informatics olympiad or CS50.", ukTest: "TMUA / MAT / ESAT" },
    eng:  { subjects: ["Mathematics", "Physics"], rec: ["Further Mathematics", "Chemistry"], cats: ["projects", "competitions"], tip: "Hands-on making, such as robotics, physics problems or design challenges.", ukTest: "ESAT (Cambridge, Imperial)" },
    med:  { subjects: ["Chemistry", "Biology"], rec: ["Mathematics", "Physics"], cats: ["work", "volunteering"], tip: "Clinical work experience or long-term care volunteering is close to essential.", ukTest: "UCAT" },
    law:  { subjects: [], rec: ["History", "English Literature", "Politics", "Foreign Language"], cats: ["writing", "leadership"], tip: "Essays, debate and Model UN show you can argue in writing and out loud.", ukTest: "LNAT" },
    bus:  { subjects: ["Mathematics"], rec: ["Economics", "Further Mathematics"], cats: ["work", "leadership"], tip: "Start something, such as a micro-business or fundraiser, or write about economics.", ukTest: "TMUA (many Economics courses)" },
    math: { subjects: ["Mathematics"], rec: ["Further Mathematics", "Physics"], cats: ["competitions", "courses"], tip: "Olympiads and problem solving beyond the syllabus.", ukTest: "STEP / MAT / TMUA" },
    sci:  { subjects: ["Mathematics"], rec: ["Physics", "Chemistry", "Biology"], cats: ["competitions", "projects"], tip: "Science olympiads, small experiments and science fairs.", ukTest: "ESAT (Cambridge Natural Sciences)" },
    psy:  { subjects: [], rec: ["Biology", "Mathematics", "Psychology"], cats: ["volunteering", "projects"], tip: "Volunteering with people and a small survey or research project.", ukTest: "" },
    arch: { subjects: [], rec: ["Mathematics", "Physics", "Art & Design"], cats: ["arts", "projects"], tip: "A portfolio of drawings, models and design thinking is usually required.", ukTest: "" },
    hum:  { subjects: [], rec: ["History", "English Literature", "Foreign Language", "Philosophy"], cats: ["writing", "languages"], tip: "Wide reading and essays that go beyond school.", ukTest: "HAT / ELAT style tests (Oxford)" },
    pol:  { subjects: [], rec: ["History", "Politics", "Economics", "Foreign Language"], cats: ["leadership", "writing"], tip: "Model UN, debate and op-eds on current affairs.", ukTest: "" },
    des:  { subjects: [], rec: ["Art & Design", "Computer Science"], cats: ["arts", "projects"], tip: "A strong portfolio matters more than anything else.", ukTest: "" }
  };

  const SUBJECTS = ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Economics", "Business", "History", "Geography", "English Literature", "English Language", "Foreign Language", "Psychology", "Politics", "Philosophy", "Art & Design", "Music", "Other"];

  const BOARDS = {
    IB:     { label: "IB Diploma", levels: ["HL", "SL"], grades: ["7", "6", "5", "4", "3", "2", "1"], map: { 7: 100, 6: 90, 5: 80, 4: 70, 3: 60, 2: 50, 1: 40 } },
    ALEVEL: { label: "A-Level", levels: ["A-Level", "AS"], grades: ["A*", "A", "B", "C", "D", "E"], map: { "A*": 100, A: 92, B: 82, C: 72, D: 62, E: 52 } },
    AP:     { label: "AP", levels: [], grades: ["5", "4", "3", "2", "1"], map: { 5: 97, 4: 88, 3: 78, 2: 65, 1: 50 } },
    GCSE:   { label: "GCSE / IGCSE", levels: [], grades: ["9", "8", "7", "6", "5", "4", "3", "A*", "A", "B", "C"], map: { 9: 100, 8: 94, 7: 88, 6: 80, 5: 72, 4: 64, 3: 55, "A*": 96, A: 88, B: 78, C: 68 } },
    US:     { label: "US High School", levels: ["Regular", "Honors"], grades: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"], map: { "A+": 100, A: 96, "A-": 91, "B+": 87, B: 84, "B-": 80, "C+": 77, C: 74, "C-": 70, D: 62, F: 40 } },
    PCT:    { label: "National / Percentage (0–100)", levels: [], grades: null, map: null }
  };

  /* Career quiz: each option adds points to fields */
  const QUIZ = [
    { q: "Which school subject do you enjoy most?", o: [
      ["Maths or Physics", { math: 2, eng: 2, cs: 1 }], ["Biology or Chemistry", { med: 2, sci: 2 }],
      ["History or Literature", { hum: 2, law: 1, pol: 1 }], ["Economics or Business", { bus: 2, pol: 1 }],
      ["Art or Design", { des: 2, arch: 2 }], ["Computing", { cs: 3 }] ] },
    { q: "On a free Saturday you'd rather…", o: [
      ["Build or fix something", { eng: 2, cs: 1, arch: 1 }], ["Read or write", { hum: 2, law: 1 }],
      ["Help someone out", { med: 2, psy: 2 }], ["Organise or sell something", { bus: 2, pol: 1 }],
      ["Draw, film or design", { des: 2, arch: 1 }], ["Solve puzzles", { math: 2, cs: 2 }] ] },
    { q: "Which problem would you most like to solve?", o: [
      ["Climate change", { sci: 2, eng: 2 }], ["Curing disease", { med: 3, sci: 1 }],
      ["Injustice", { law: 3, pol: 1 }], ["Poverty and markets", { bus: 2, pol: 2 }],
      ["How the mind works", { psy: 3 }], ["Making AI safe and useful", { cs: 3, math: 1 }],
      ["Better cities and products", { arch: 2, des: 2 }] ] },
    { q: "How do you like to work?", o: [
      ["Leading a team", { bus: 2, pol: 2, law: 1 }], ["Alone, deep focus", { math: 2, cs: 2, sci: 1 }],
      ["One-on-one with people", { med: 2, psy: 2 }], ["Creating things", { des: 2, arch: 2, hum: 1 }] ] },
    { q: "What would you be proudest of?", o: [
      ["An app millions use", { cs: 3 }], ["A bridge or a building", { eng: 2, arch: 2 }],
      ["Winning a court case", { law: 3 }], ["Saving a patient", { med: 3 }], ["Founding a company", { bus: 3 }],
      ["Writing a book", { hum: 3 }], ["A scientific discovery", { sci: 3, math: 1 }], ["Changing a policy", { pol: 3 }],
      ["A film or brand", { des: 3 }] ] },
    { q: "How do you feel about maths?", o: [
      ["Love it", { math: 2, eng: 2, cs: 2, sci: 1, bus: 1 }], ["It's fine", { bus: 1, sci: 1, psy: 1, med: 1 }],
      ["Not my thing", { hum: 1, law: 1, des: 1, pol: 1 }] ] },
    { q: "Pick a workplace", o: [
      ["A lab", { sci: 2, med: 1 }], ["A studio", { des: 2, arch: 2 }], ["A courtroom or ministry", { law: 2, pol: 2 }],
      ["A hospital or clinic", { med: 2, psy: 2 }], ["A tech startup", { cs: 2, eng: 1, bus: 1 }],
      ["A university or library", { hum: 2, math: 1, sci: 1 }] ] },
    { q: "What matters most in a career?", o: [
      ["High income", { bus: 2, law: 1, cs: 1, med: 1 }], ["Impact on society", { pol: 2, med: 1, law: 1 }],
      ["Creativity", { des: 2, arch: 1, hum: 1 }], ["Discovery", { sci: 2, math: 2 }], ["Helping individuals", { psy: 2, med: 2 }] ] }
  ];

  /* Add-on library: small CV activities you can do within a 2-week sprint.
     f = relevant fields ([] = any), pts = activity points, xp = base XP */
  const A = (id, t, d, cat, f, xp, pts, cv, url, effort) => ({ id, t, d, cat, f, xp, pts, cv, url, effort });
  const ADDONS = [
    A("cs50", "Finish a week of Harvard CS50x", "A free intro to computer science from Harvard. Do one lecture plus its problem set.", "courses", ["cs", "eng", "math"], 40, 1, "Completed Harvard CS50x coursework: programming fundamentals (C, Python)", "https://cs50.harvard.edu/x/", "4–6 h"),
    A("euler", "Solve 10 Project Euler problems", "Maths and programming puzzles. A great way to show problem solving.", "projects", ["cs", "math"], 35, 1, "Solved 10+ Project Euler problems (mathematical programming)", "https://projecteuler.net", "3–5 h"),
    A("github", "Ship a small project to GitHub", "Build a tiny app, tool or website and publish it with a README.", "projects", ["cs", "des", "eng"], 50, 1, "Built and published an open-source project on GitHub", "https://github.com", "5–8 h"),
    A("kaggle", "Enter a Kaggle Playground competition", "A beginner-friendly data science competition with a public leaderboard.", "competitions", ["cs", "math", "bus"], 45, 1, "Competed in a Kaggle data science competition", "https://www.kaggle.com/competitions", "4–6 h"),
    A("ioi", "Register for your national Informatics Olympiad", "The path to the International Olympiad in Informatics (IOI). Register and do a past round.", "competitions", ["cs", "math"], 90, 3, "Participant, National Olympiad in Informatics", "https://ioinformatics.org", "Program"),
    A("fcc", "Complete a freeCodeCamp module", "Free, certificate-based web development curriculum.", "courses", ["cs", "des"], 30, 1, "Completed freeCodeCamp web development module", "https://www.freecodecamp.org", "3–5 h"),
    A("imo", "Enter your national Mathematical Olympiad", "Register for the first round, the path to the IMO. Practise one past paper first.", "competitions", ["math", "cs", "eng", "sci"], 90, 3, "Participant, National Mathematical Olympiad", "https://www.imo-official.org", "Program"),
    A("nrich", "Work through an NRICH problem set", "Rich maths problems from the University of Cambridge.", "courses", ["math", "eng"], 25, 1, "Completed University of Cambridge NRICH enrichment problems", "https://nrich.maths.org", "2–3 h"),
    A("khan", "Complete a Khan Academy unit", "For example Calculus, Statistics or Organic Chemistry. Finish the unit test.", "courses", ["math", "eng", "sci", "cs", "bus", "med"], 25, 1, "Completed Khan Academy unit beyond the school syllabus", "https://www.khanacademy.org", "3–4 h"),
    A("isaac", "Do 20 Isaac Physics questions", "Free problem-solving platform from the University of Cambridge.", "courses", ["eng", "sci", "math"], 30, 1, "Completed Isaac Physics problem sets (University of Cambridge)", "https://isaacphysics.org", "3 h"),
    A("ukmath", "Try an admissions-test practice paper", "Do a timed MAT, TMUA or STEP past paper and mark it.", "courses", ["math", "cs", "eng", "bus"], 30, 1, "Prepared for university admissions tests (MAT/TMUA/STEP)", "https://www.maths.ox.ac.uk/study-here/undergraduate-study/maths-admissions-test", "2–3 h"),
    A("sciolym", "Enter a national Science Olympiad", "Chemistry, Biology or Physics Olympiad. Register and practise a past paper.", "competitions", ["sci", "med", "eng"], 90, 3, "Participant, National Science Olympiad", "https://www.ibo-info.org", "Program"),
    A("review", "Summarise a research article", "Read a review article and write a one-page summary in your own words.", "writing", ["sci", "med", "psy"], 30, 1, "Wrote research summaries of scientific review articles", "https://www.nature.com/subjects", "2–3 h"),
    A("experiment", "Run a mini experiment and write it up", "A home or school experiment with a hypothesis, method, results and conclusion.", "projects", ["sci", "eng", "psy"], 45, 1, "Designed and documented an independent science experiment", "", "4–6 h"),
    A("isef", "Enter a science fair", "Find an ISEF-affiliated or national science fair and submit a project.", "projects", ["sci", "eng", "cs", "med"], 100, 3, "Science fair project entrant", "https://www.societyforscience.org/isef/", "Program"),
    A("breakthrough", "Make a Breakthrough Junior Challenge video", "Explain a science or maths concept in a short video. Global competition.", "competitions", ["sci", "math", "med", "eng"], 80, 4, "Entrant, Breakthrough Junior Challenge (international science video competition)", "https://breakthroughjuniorchallenge.org", "Program"),
    A("shadow", "Shadow a doctor or nurse for a shift", "Ask a local clinic or hospital. Reflect on what you saw in a short note.", "work", ["med", "psy"], 50, 1, "Clinical shadowing at a local healthcare provider", "", "1 day"),
    A("firstaid", "Get certified in first aid", "Take a first-aid course from your national Red Cross / Red Crescent.", "courses", ["med", "psy"], 40, 1, "Certified in First Aid", "https://www.ifrc.org", "1 day"),
    A("carehome", "Volunteer 4 hours at a care home", "Spend time with elderly residents. Consistency matters, so repeat it every sprint.", "volunteering", ["med", "psy"], 35, 1, "Volunteer, residential care home (ongoing)", "", "4 h"),
    A("futurelearn", "Do a free FutureLearn health course week", "University-made short courses on health, psychology and more.", "courses", ["med", "psy", "sci"], 25, 1, "Completed university short course via FutureLearn", "https://www.futurelearn.com", "3 h"),
    A("ucat", "Do a UCAT practice set", "Timed practice for the UK medical admissions test.", "courses", ["med"], 25, 1, "Prepared for the UCAT medical admissions test", "https://www.ucat.ac.uk", "2 h"),
    A("locke", "Enter the John Locke Essay Competition", "A famous global essay prize in philosophy, politics, economics, history, law and more.", "writing", ["law", "pol", "hum", "bus", "psy"], 100, 4, "Entrant, John Locke Institute Global Essay Competition", "https://www.johnlockeinstitute.com/essay-competition", "Program"),
    A("mun", "Attend a Model UN conference", "Represent a country, debate and draft resolutions.", "leadership", ["pol", "law", "hum"], 70, 2, "Delegate, Model United Nations conference", "https://www.un.org/en/model-united-nations", "Program"),
    A("debate", "Compete in a debate tournament", "Join your school or a local debate competition.", "leadership", ["law", "pol", "bus"], 50, 2, "Competitive debater, school/regional tournaments", "", "1 day"),
    A("oped", "Write a 600-word op-ed", "Pick a current issue, argue a position and publish it on a blog or in the school paper.", "writing", ["pol", "law", "hum", "bus"], 30, 1, "Published opinion article on current affairs", "", "2–3 h"),
    A("court", "Watch a court hearing and write a summary", "Most courts are open to the public. Summarise the arguments.", "work", ["law", "pol"], 40, 1, "Observed court proceedings and wrote case summary", "", "Half day"),
    A("lnat", "Do an LNAT practice test", "Timed practice for the UK law admissions test.", "courses", ["law"], 25, 1, "Prepared for the LNAT law admissions test", "https://lnat.ac.uk", "2 h"),
    A("business", "Start a micro-business or fundraiser", "Sell something, run an event or raise money for a cause. Track the numbers.", "leadership", ["bus", "pol"], 60, 2, "Founded and ran a student micro-enterprise / fundraiser", "", "2 weeks"),
    A("yalefin", "Do a week of Yale's Financial Markets course", "Taught by Nobel laureate Robert Shiller on Coursera (free to audit).", "courses", ["bus", "math", "pol"], 30, 1, "Completed Yale 'Financial Markets' coursework (Coursera)", "https://www.coursera.org/learn/financial-markets-global", "3–4 h"),
    A("econessay", "Enter an economics essay competition", "For example the Royal Economic Society's Young Economist of the Year.", "writing", ["bus", "pol"], 90, 3, "Entrant, national economics essay competition", "https://res.org.uk", "Program"),
    A("diamond", "Enter the Diamond Challenge", "A global entrepreneurship competition for high school students.", "competitions", ["bus", "des", "cs"], 90, 4, "Entrant, Diamond Challenge (international entrepreneurship competition)", "https://diamondchallenge.org", "Program"),
    A("bookreview", "Read a book in your field and review it", "Write 500 words on what you learned. This also gives you material for your personal statement.", "writing", ["bus", "pol", "hum", "law", "psy", "sci", "med", "math", "cs", "eng", "arch", "des"], 30, 1, "Independent reading and written review in subject area", "", "1 week"),
    A("yalepsy", "Do a week of Yale's Intro to Psychology", "Free to audit on Coursera.", "courses", ["psy", "med"], 30, 1, "Completed Yale 'Introduction to Psychology' coursework (Coursera)", "https://www.coursera.org/learn/introduction-psychology", "3 h"),
    A("survey", "Design and run a small survey study", "Ask a question, survey 30+ people and analyse the results.", "projects", ["psy", "bus", "pol"], 50, 1, "Designed and analysed an independent survey study", "", "1 week"),
    A("critic", "Write a critical response to a classic", "Read a classic novel or philosophy text and write 500 words.", "writing", ["hum", "law"], 30, 1, "Independent critical writing on classic literature/philosophy", "", "1 week"),
    A("wiki", "Improve a Wikipedia article", "Add sourced content to an article in your subject.", "projects", ["hum", "sci", "pol", "psy"], 25, 1, "Contributor to Wikipedia articles in subject area", "https://en.wikipedia.org/wiki/Help:Introduction", "2 h"),
    A("langcert", "Book a language certificate exam", "DELF, DELE, Goethe, HSK and similar exams give an official level for your CV.", "languages", ["hum", "pol", "bus", "law"], 80, 2, "Official language certificate (CEFR level)", "", "Program"),
    A("langstreak", "Practise a language 14 days in a row", "Do 15 minutes a day of a foreign language and log it.", "languages", [], 20, 1, "Self-study of foreign language (daily practice)", "", "15 min/day"),
    A("portfolio", "Add 3 pieces to your portfolio", "Drawings, models, photos or digital work, with short captions.", "arts", ["arch", "des"], 50, 1, "Developed creative portfolio (drawing, modelling, digital)", "", "1 week"),
    A("sketch", "Sketch and annotate a building", "Draw a building in your city and note its structure, materials and light.", "arts", ["arch", "des"], 25, 1, "Architectural sketching and analysis", "", "2 h"),
    A("artcomp", "Enter an art or writing competition", "For example the Scholastic Art & Writing Awards or a national contest.", "competitions", ["des", "arch", "hum"], 80, 3, "Entrant, national art & writing competition", "https://www.artandwriting.org", "Program"),
    A("figma", "Redesign an app screen in Figma", "Learn the basics, then redesign one screen and explain your choices.", "projects", ["des", "cs"], 40, 1, "UX/UI redesign case study (Figma)", "https://www.figma.com", "3–4 h"),
    A("club", "Lead a club meeting or start a club", "Run a session or found a society around your interest.", "leadership", [], 50, 2, "Founder / leader of a student club", "", "2 weeks"),
    A("dofe", "Log a week of the International Award (DofE)", "Volunteering, a skill, physical activity or an expedition.", "volunteering", [], 30, 1, "Participant, The Duke of Edinburgh's International Award", "https://intaward.org", "2–3 h"),
    A("talk", "Give a talk at school", "A five-minute TED-style talk on an idea you care about.", "leadership", [], 40, 1, "Delivered a public talk to a school audience", "https://ed.ted.com", "1 week"),
    A("tutor", "Tutor a younger student (2 sessions)", "Help with a subject you're strong in.", "volunteering", [], 35, 1, "Volunteer peer tutor", "", "2 h"),
    A("job", "Work a part-time shift", "Any job counts: retail, café, babysitting. It shows responsibility.", "work", [], 30, 1, "Part-time employment", "", "1 shift"),
    A("sport", "Compete in a sports match or race", "Team or individual sport. Commitment counts.", "sports", [], 25, 1, "Competitive sport (team / individual)", "", "1 day"),
    A("lecture", "Attend a university lecture or open day", "Many universities stream free public lectures.", "courses", [], 20, 1, "Attended university public lecture / open day", "", "2 h"),
    A("summer", "Apply to a summer school", "University pre-college or a free summer programme in your field.", "courses", [], 60, 2, "Applied to/attended university summer school", "", "Program")
  ];

  return { FIELDS, CATS, LEVELS, FIELDREQ, SUBJECTS, BOARDS, QUIZ, ADDONS };
})();
