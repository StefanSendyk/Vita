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
  const A = (id, t, d, cat, f, xp, pts, cv, url, effort, w) => ({ id, t, d, cat, f, xp, pts, cv, url, effort, w: w || ["global"] });
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
    A("lnat", "Do an LNAT practice test", "Timed practice for the UK law admissions test.", "courses", ["law"], 25, 1, "Prepared for the LNAT law admissions test", "https://lnat.ac.uk", "2 h", ["uk"]),
    A("business", "Start a micro-business or fundraiser", "Sell something, run an event or raise money for a cause. Track the numbers.", "leadership", ["bus", "pol"], 60, 2, "Founded and ran a student micro-enterprise / fundraiser", "", "2 weeks"),
    A("yalefin", "Do a week of Yale's Financial Markets course", "Taught by Nobel laureate Robert Shiller on Coursera (free to audit).", "courses", ["bus", "math", "pol"], 30, 1, "Completed Yale 'Financial Markets' coursework (Coursera)", "https://www.coursera.org/learn/financial-markets-global", "3–4 h"),
    A("econessay", "Enter an economics essay competition", "For example the Royal Economic Society's Young Economist of the Year.", "writing", ["bus", "pol"], 90, 3, "Entrant, national economics essay competition", "https://res.org.uk", "Program", ["uk"]),
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


  /* ---- expanded library (region-tagged: global = online/anywhere) ---- */
  const B = A;
  ADDONS.push(
    // Computer science
    B("mitocw", "Watch an MIT OpenCourseWare lecture and take notes", "Free MIT lectures in almost every subject. Write a one-page summary.", "courses", ["cs", "eng", "math", "sci"], 25, 1, "Self-study of MIT OpenCourseWare university lectures", "https://ocw.mit.edu", "2 h"),
    B("ngml", "Do week 1 of Andrew Ng's Machine Learning course", "The classic intro to ML on Coursera (free to audit).", "courses", ["cs", "math"], 40, 1, "Completed Machine Learning Specialization coursework (Stanford / DeepLearning.AI)", "https://www.coursera.org/specializations/machine-learning-introduction", "4 h"),
    B("elemai", "Finish a chapter of Elements of AI", "A free course from the University of Helsinki for non-experts.", "courses", ["cs", "bus", "pol", "psy"], 30, 1, "Completed 'Elements of AI' course (University of Helsinki)", "https://www.elementsofai.com", "3 h"),
    B("cs50ai", "Do a week of CS50's AI with Python", "Search, knowledge and neural networks, with Harvard-quality problem sets.", "courses", ["cs", "math"], 45, 1, "Completed Harvard CS50 AI with Python coursework", "https://cs50.harvard.edu/ai/", "5–6 h"),
    B("kagglelearn", "Finish a Kaggle Learn micro-course", "Short, free certificates: Python, Pandas, Intro to ML.", "courses", ["cs", "math", "bus"], 30, 1, "Kaggle Learn certificate (data science)", "https://www.kaggle.com/learn", "3 h"),
    B("leetcode", "Solve 10 LeetCode easy problems", "Classic interview-style coding practice.", "projects", ["cs"], 30, 1, "Solved 10+ algorithmic programming problems (LeetCode)", "https://leetcode.com", "3–4 h"),
    B("codeforces", "Compete in a Codeforces round", "Div. 3 or Div. 4 rounds are beginner-friendly. Record your rating.", "competitions", ["cs", "math"], 45, 2, "Competitive programmer, Codeforces contests", "https://codeforces.com", "2–3 h"),
    B("usaco", "Compete in a USACO contest", "Free online olympiad open to students worldwide. Start in Bronze.", "competitions", ["cs", "math"], 70, 3, "Competitor, USA Computing Olympiad (USACO)", "https://usaco.org", "4 h"),
    B("aoc", "Solve Advent of Code puzzles", "25 days of programming puzzles every December.", "competitions", ["cs", "math"], 40, 1, "Advent of Code participant (programming puzzles)", "https://adventofcode.com", "1 week"),
    B("picoctf", "Play picoCTF (cybersecurity)", "A free beginner capture-the-flag competition from Carnegie Mellon.", "competitions", ["cs"], 50, 2, "Competitor, picoCTF cybersecurity competition (Carnegie Mellon)", "https://picoctf.org", "4 h"),
    B("hackathon", "Join an online hackathon", "Build something in 24–48 h with a team, e.g. via MLH.", "competitions", ["cs", "des", "bus"], 70, 2, "Hackathon participant: built a working prototype in 48 hours", "https://mlh.io", "Weekend"),
    B("firstpr", "Make your first open-source contribution", "Fix a typo or a small bug in a real project.", "projects", ["cs"], 50, 1, "Open-source contributor on GitHub", "https://github.com/firstcontributions/first-contributions", "2–4 h"),
    B("mlproject", "Train a small ML model and write it up", "Pick a public dataset, train a model, explain the results.", "projects", ["cs", "math", "sci"], 60, 1, "Built and evaluated a machine-learning model on a public dataset", "https://www.kaggle.com/datasets", "1 week"),
    B("portfolioweb", "Build a personal portfolio website", "Showcase your projects. Free hosting on GitHub Pages.", "projects", ["cs", "des"], 50, 1, "Designed and built a personal portfolio website", "https://pages.github.com", "1 week"),
    B("fccert", "Earn a freeCodeCamp certification", "Complete a full certification, e.g. Responsive Web Design.", "courses", ["cs", "des"], 90, 2, "freeCodeCamp certification (web development)", "https://www.freecodecamp.org/learn", "Program"),
    B("cac", "Enter the Congressional App Challenge", "US students build an app judged by their congressional district.", "competitions", ["cs", "des"], 90, 3, "Entrant, Congressional App Challenge", "https://www.congressionalappchallenge.us", "Program", ["us"]),
    B("oi", "Register for Olimpiada Informatyczna", "The Polish Informatics Olympiad, the path to the IOI. Round 1 is solved online.", "competitions", ["cs", "math"], 90, 3, "Participant, Olimpiada Informatyczna (Polish Olympiad in Informatics)", "https://oi.edu.pl", "Program", ["pl"]),
    // Maths
    B("aops", "Work through an Art of Problem Solving set", "Competition-style problems with full solutions.", "courses", ["math", "cs"], 30, 1, "Competition maths training (Art of Problem Solving)", "https://artofproblemsolving.com", "3 h"),
    B("3b1b", "Watch 3Blue1Brown's linear algebra series", "Then write a one-page explanation of eigenvectors in your own words.", "courses", ["math", "cs", "eng", "sci"], 30, 1, "Independent study of linear algebra (3Blue1Brown series)", "https://www.3blue1brown.com/topics/linear-algebra", "4 h"),
    B("latex", "Typeset a proof in LaTeX", "Learn LaTeX on Overleaf and write up a proof you like.", "projects", ["math", "cs", "sci"], 25, 1, "Typeset mathematical writing in LaTeX", "https://www.overleaf.com/learn", "2 h"),
    B("purplecomet", "Enter the Purple Comet! Math Meet", "Free online team maths competition, open worldwide.", "competitions", ["math"], 60, 3, "Competitor, Purple Comet! international online math meet", "https://purplecomet.org", "1 day"),
    B("kangaroo", "Take part in Math Kangaroo", "One of the world's largest maths competitions, run nationally.", "competitions", ["math"], 50, 2, "Participant, International Mathematical Kangaroo", "https://www.aksf.org", "1 day"),
    B("cemc", "Write a Waterloo CEMC math contest", "Euclid, Fermat and others, offered at schools worldwide.", "competitions", ["math", "cs"], 60, 3, "Competitor, University of Waterloo CEMC mathematics contest", "https://cemc.uwaterloo.ca", "1 day"),
    B("amc", "Take the AMC 10/12", "The first step towards the USA Math Olympiad.", "competitions", ["math", "cs"], 70, 3, "Competitor, American Mathematics Competitions (AMC 10/12)", "https://maa.org/student-programs/amc/", "1 day", ["us"]),
    B("ukmt", "Enter the UKMT Maths Challenge", "Senior or Intermediate Challenge, sat at school.", "competitions", ["math", "cs", "eng"], 60, 3, "UKMT Senior Mathematical Challenge participant", "https://ukmt.org.uk", "1 day", ["uk"]),
    B("om", "Register for Olimpiada Matematyczna", "The Polish Mathematical Olympiad, the path to the IMO.", "competitions", ["math"], 90, 3, "Participant, Olimpiada Matematyczna (Polish Mathematical Olympiad)", "https://om.mimuw.edu.pl", "Program", ["pl"]),
    B("aus_amc", "Enter the Australian Mathematics Competition", "Run by the Australian Maths Trust at schools.", "competitions", ["math"], 60, 3, "Participant, Australian Mathematics Competition", "https://www.amt.edu.au", "1 day", ["au"]),
    B("matura", "Do a past Matura rozszerzona paper", "Timed practice of an extended-level Matura paper, marked against the key.", "courses", [], 25, 1, "Matura extended-level exam preparation", "https://cke.gov.pl", "3 h", ["pl"]),
    // Sciences
    B("zooniverse", "Contribute to a Zooniverse citizen-science project", "Classify galaxies, animals or cells for real research.", "projects", ["sci", "med", "psy"], 30, 1, "Citizen scientist, Zooniverse research projects", "https://www.zooniverse.org", "2 h"),
    B("owid", "Chart a finding from Our World in Data", "Pick a dataset, make one clear chart and write 300 words.", "projects", ["sci", "bus", "pol", "med"], 35, 1, "Independent data analysis using Our World in Data", "https://ourworldindata.org", "2–3 h"),
    B("jei", "Submit to a student science journal", "e.g. the Journal of Emerging Investigators (peer-reviewed, for students).", "writing", ["sci", "med", "psy", "eng"], 100, 4, "Author, research paper submitted to a peer-reviewed student journal", "https://emerginginvestigators.org", "Program"),
    B("igem", "Join or start an iGEM high-school team", "The global synthetic-biology competition.", "projects", ["sci", "med", "eng"], 100, 4, "Team member, iGEM synthetic biology competition", "https://igem.org", "Program"),
    B("plantexp", "Run a 2-week plant growth experiment", "Change one variable, measure daily, graph the results.", "projects", ["sci"], 40, 1, "Designed and ran a controlled biology experiment", "", "2 weeks"),
    B("scifest", "Attend a science festival or public lecture", "Write a short reflection on one idea that surprised you.", "courses", ["sci", "med", "eng"], 20, 1, "Attended science festival / public research lecture", "", "Half day"),
    B("igeo", "Enter the Geography Olympiad (national round)", "The path to the International Geography Olympiad.", "competitions", ["sci", "hum", "pol"], 80, 3, "Participant, National Geography Olympiad", "https://www.geoolympiad.org", "Program"),
    B("physolymp", "Enter your national Physics Olympiad", "Register and practise one past paper.", "competitions", ["sci", "eng"], 90, 3, "Participant, National Physics Olympiad", "", "Program"),
    B("chemolymp", "Enter your national Chemistry Olympiad", "Register and practise one past paper.", "competitions", ["sci", "med"], 90, 3, "Participant, National Chemistry Olympiad", "", "Program"),
    B("rscolymp", "Do a UK Chemistry Olympiad past paper", "Royal Society of Chemistry papers with mark schemes.", "courses", ["sci", "med"], 30, 1, "UK Chemistry Olympiad preparation (Royal Society of Chemistry)", "https://edu.rsc.org/enrichment/chemistry-olympiad", "2 h", ["uk"]),
    B("bpho", "Enter a British Physics Olympiad challenge", "Online challenges for different school years.", "competitions", ["sci", "eng"], 70, 3, "Participant, British Physics Olympiad", "https://www.bpho.org.uk", "1 day", ["uk"]),
    B("bigbang", "Enter The Big Bang Competition", "UK science & engineering project competition for 11–18s.", "competitions", ["sci", "eng"], 90, 3, "Entrant, The Big Bang Competition (UK)", "https://www.thebigbang.org.uk", "Program", ["uk"]),
    B("sciolyus", "Join a Science Olympiad team", "US team competition across 23 events.", "competitions", ["sci", "eng"], 80, 3, "Team member, Science Olympiad (US)", "https://www.soinc.org", "Program", ["us"]),
    B("regeneron", "Prepare a Regeneron STS research entry", "The US's oldest science competition for seniors.", "projects", ["sci", "med", "eng", "math"], 100, 4, "Research entrant, Regeneron Science Talent Search", "https://www.societyforscience.org/regeneron-sts/", "Program", ["us"]),
    B("jugendforscht", "Enter Jugend forscht", "Germany's largest youth science and technology competition.", "competitions", ["sci", "eng", "cs"], 90, 3, "Participant, Jugend forscht (German science competition)", "https://www.jugend-forscht.de", "Program", ["de"]),
    B("pl_olymp_bio", "Register for Olimpiada Biologiczna", "The Polish Biology Olympiad. Prepare a research project for round 1.", "competitions", ["sci", "med"], 90, 3, "Participant, Olimpiada Biologiczna (Polish Biology Olympiad)", "", "Program", ["pl"]),
    // Engineering & design
    B("arduino", "Build and document an Arduino project", "A sensor, a robot or a smart device. Publish a write-up.", "projects", ["eng", "cs"], 55, 1, "Designed and built an Arduino electronics project", "https://www.arduino.cc", "1 week"),
    B("cad", "Model and 3D-print an object", "Use Onshape or Fusion, then print it at school or a makerspace.", "projects", ["eng", "des", "arch"], 50, 1, "CAD design and 3D printing project", "https://www.onshape.com", "1 week"),
    B("bridge", "Design and load-test a model bridge", "Spaghetti or balsa. Record the load-to-weight ratio.", "projects", ["eng", "arch"], 40, 1, "Designed and load-tested a structural bridge model", "", "1 week"),
    B("teardown", "Take apart a device and explain how it works", "Photograph each part and write a short engineering teardown.", "projects", ["eng", "cs"], 30, 1, "Engineering teardown and analysis of a consumer device", "", "3 h"),
    B("first", "Join a FIRST robotics team", "FIRST Tech Challenge or FIRST Robotics Competition, worldwide.", "competitions", ["eng", "cs"], 90, 3, "Team member, FIRST Robotics", "https://www.firstinspires.org", "Program"),
    B("vex", "Compete in VEX Robotics", "Design, build and program a robot with your team.", "competitions", ["eng", "cs"], 90, 3, "Competitor, VEX Robotics Competition", "https://www.vexrobotics.com/competition", "Program"),
    B("wro", "Enter the World Robot Olympiad", "National rounds lead to the international final.", "competitions", ["eng", "cs"], 90, 3, "Participant, World Robot Olympiad", "https://wro-association.org", "Program"),
    B("arkwright", "Apply for an Arkwright Engineering Scholarship", "UK scholarship with an aptitude exam and interview.", "competitions", ["eng", "des"], 100, 3, "Applicant, Arkwright Engineering Scholarship", "https://www.arkwright.org.uk", "Program", ["uk"]),
    B("dailyui", "Do the Daily UI challenge for 7 days", "One small interface design per day.", "projects", ["des", "cs"], 40, 1, "Completed Daily UI design challenge", "https://www.dailyui.co", "7 × 30 min"),
    B("sketchup", "Model your room or house in SketchUp", "Then propose one improvement with a before/after.", "projects", ["arch", "des"], 40, 1, "3D architectural modelling (SketchUp)", "https://www.sketchup.com", "4 h"),
    B("buildwalk", "Make a photo essay of 3 buildings", "Analyse form, materials and how people use the space.", "arts", ["arch", "des", "hum"], 35, 1, "Architectural photo essay and analysis", "", "Half day"),
    B("publicspace", "Redesign a public space", "Sketch and write a one-page proposal for a square, park or street near you.", "arts", ["arch", "des", "pol"], 45, 1, "Urban design proposal for a local public space", "", "1 week"),
    B("archcomp", "Enter a student architecture competition", "Look for open ideas competitions for school students.", "competitions", ["arch", "des"], 80, 3, "Entrant, student architecture competition", "", "Program"),
    B("photo", "Enter a photography competition", "Submit a themed series of 3–5 photos.", "competitions", ["des", "arch", "hum"], 50, 2, "Entrant, photography competition", "", "1 week"),
    B("shortfilm", "Make a short film (under 5 min)", "Write, shoot and edit it, then share it at school or online.", "arts", ["des", "hum"], 60, 1, "Wrote, directed and edited a short film", "", "2 weeks"),
    B("exhibitionreview", "Review a museum exhibition", "Write 500 words: what worked, what didn't, why.", "writing", ["hum", "arch", "des"], 30, 1, "Wrote critical exhibition review", "", "Half day"),
    // Medicine & psychology
    B("cpr", "Learn CPR in a certified session", "A short basic life support session with certification.", "courses", ["med", "psy"], 35, 1, "Certified in CPR / Basic Life Support", "", "2 h"),
    B("neuro", "Do week 1 of Duke's Medical Neuroscience", "Free to audit on Coursera.", "courses", ["med", "psy", "sci"], 40, 1, "Completed Duke 'Medical Neuroscience' coursework (Coursera)", "https://www.coursera.org/learn/medical-neuroscience", "4 h"),
    B("epi", "Do a week of an Epidemiology course", "UNC's 'Epidemiology: The Basic Science of Public Health'.", "courses", ["med", "sci", "pol"], 35, 1, "Completed epidemiology coursework (UNC, Coursera)", "https://www.coursera.org/learn/epidemiology", "3 h"),
    B("laysummary", "Summarise a medical study for a general reader", "Pick a BMJ or NEJM article and explain it in 300 words.", "writing", ["med", "sci"], 35, 1, "Wrote lay summaries of medical research", "https://www.bmj.com", "2 h"),
    B("ethicscase", "Analyse a medical ethics case", "Pick a famous case and argue both sides in 500 words.", "writing", ["med", "law", "psy"], 35, 1, "Medical ethics case analysis", "", "2–3 h"),
    B("beingmortal", "Read 'Being Mortal' and reflect", "Atul Gawande's book on medicine and the end of life is common at interviews.", "writing", ["med", "psy"], 30, 1, "Independent reading: 'Being Mortal' (Gawande), written reflection", "", "1–2 weeks"),
    B("hospice", "Volunteer with a hospice or disability charity", "Commit to a regular slot, because consistency matters for Medicine.", "volunteering", ["med", "psy"], 45, 1, "Volunteer, hospice / disability support charity (ongoing)", "", "4 h"),
    B("sja", "Join St John Ambulance cadets", "First-aid training and duties at public events.", "volunteering", ["med"], 60, 2, "St John Ambulance cadet (first aid volunteer)", "https://www.sja.org.uk", "Program", ["uk"]),
    B("stroop", "Run a Stroop-effect experiment", "Classic psychology experiment: collect data from 20 people and analyse it.", "projects", ["psy", "sci"], 45, 1, "Designed and analysed a cognitive psychology experiment", "", "1 week"),
    B("peersupport", "Join a peer-support or buddy scheme", "Support younger or new students at school.", "volunteering", ["psy", "med"], 40, 1, "Peer mentor / buddy scheme volunteer", "", "Ongoing"),
    B("brainbee", "Enter a Brain Bee neuroscience competition", "A youth neuroscience quiz with national and international rounds.", "competitions", ["psy", "med", "sci"], 80, 3, "Participant, Brain Bee neuroscience competition", "", "Program"),
    // Law & politics
    B("forage_law", "Do a virtual law work-experience programme", "Free, self-paced tasks set by real law firms on Forage.", "work", ["law"], 50, 1, "Completed virtual legal work experience (Forage)", "https://www.theforage.com", "4–6 h"),
    B("casenote", "Write a case note on a landmark ruling", "Facts, legal question, decision, why it matters, in about 500 words.", "writing", ["law", "pol"], 35, 1, "Legal case note on a landmark court decision", "", "3 h"),
    B("mocktrial", "Compete in a mock trial or moot", "Argue a case as advocate or witness.", "competitions", ["law", "pol"], 70, 2, "Advocate, mock trial / moot court competition", "", "Program"),
    B("lawbook", "Read 'Letters to a Law Student' and reflect", "Nicholas McBride's book, written for applicants.", "writing", ["law"], 30, 1, "Independent reading on law (McBride), written reflection", "", "1–2 weeks"),
    B("policybrief", "Write a one-page policy brief", "Problem, options, recommendation, on a local issue.", "writing", ["pol", "law", "bus"], 40, 1, "Authored a policy brief on a local issue", "", "3 h"),
    B("interviewpol", "Interview a local official and write it up", "Ask about one real decision they made.", "writing", ["pol", "law", "hum"], 45, 1, "Interviewed local government official; published write-up", "", "1 week"),
    B("ngo", "Volunteer with an NGO or local campaign", "Help with research, social media or events.", "volunteering", ["pol", "law"], 45, 1, "Volunteer, non-governmental organisation", "", "4 h"),
    B("unv", "Volunteer online with UN Volunteers", "Remote assignments for UN partner organisations (check age rules).", "volunteering", ["pol", "hum"], 60, 3, "Online volunteer, United Nations Volunteers", "https://app.unv.org", "Program"),
    B("sdgproject", "Run a UN Sustainable Development Goals project at school", "Pick one SDG and organise a concrete action.", "leadership", ["pol", "sci", "bus"], 60, 2, "Led a school project on the UN Sustainable Development Goals", "https://sdgs.un.org/goals", "2 weeks"),
    B("philolymp", "Enter the Philosophy Olympiad (national round)", "Write a philosophical essay under exam conditions.", "competitions", ["hum", "law", "pol", "psy"], 80, 3, "Participant, National Philosophy Olympiad (IPO pathway)", "https://www.philosophy-olympiad.org", "Program"),
    B("eyp", "Take part in a European Youth Parliament session", "Debate real policy with students across Europe.", "leadership", ["pol", "law"], 80, 3, "Delegate, European Youth Parliament", "https://eyp.org", "Program", ["eu", "uk"]),
    B("nhd", "Enter National History Day", "A research project as a paper, exhibit, documentary or website.", "competitions", ["hum", "pol"], 80, 3, "Competitor, National History Day", "https://www.nhd.org", "Program", ["us"]),
    B("nsda", "Compete in NSDA speech & debate", "US National Speech & Debate Association tournaments.", "competitions", ["law", "pol"], 70, 3, "Competitor, NSDA speech & debate", "https://www.speechanddebate.org", "Program", ["us"]),
    B("ukyp", "Run for UK Youth Parliament", "Represent young people in your area.", "leadership", ["pol", "law"], 90, 3, "Candidate / Member, UK Youth Parliament", "https://www.byc.org.uk/uk/uk-youth-parliament", "Program", ["uk"]),
    // Business & economics
    B("mru", "Do a unit of Marginal Revolution University", "Free, short economics videos with quizzes.", "courses", ["bus", "pol"], 30, 1, "Economics coursework (Marginal Revolution University)", "https://mru.org", "3 h"),
    B("economist", "Summarise 5 articles from The Economist", "Over 2 weeks: one paragraph each, plus your own view.", "writing", ["bus", "pol", "law"], 35, 1, "Regular reading and written analysis of The Economist", "", "2 weeks"),
    B("stocksim", "Run a virtual stock portfolio for 2 weeks", "Track trades and write a short review of what you learned.", "projects", ["bus", "math"], 40, 1, "Managed a simulated investment portfolio with written review", "", "2 weeks"),
    B("wharton", "Enter the Wharton Global High School Investment Competition", "Teams manage a virtual portfolio for a client case.", "competitions", ["bus", "math"], 90, 4, "Competitor, Wharton Global High School Investment Competition", "https://globalyouth.wharton.upenn.edu", "Program"),
    B("blueocean", "Enter the Blue Ocean Entrepreneurship Competition", "Pitch an original venture idea in a short video.", "competitions", ["bus", "des"], 80, 4, "Entrant, Blue Ocean Entrepreneurship Competition", "https://www.blueoceancompetition.org", "Program"),
    B("conrad", "Enter the Conrad Challenge", "Innovation competition: solve a global problem with a product.", "competitions", ["sci", "eng", "bus"], 90, 4, "Entrant, Conrad Challenge (innovation & entrepreneurship)", "https://www.conradchallenge.org", "Program"),
    B("bizcase", "Write a case study on a local business", "Interview the owner about one challenge and how they solved it.", "writing", ["bus"], 45, 1, "Business case study based on owner interview", "", "1 week"),
    B("bizplan", "Write a one-page business plan", "Customer, problem, solution, costs and pricing.", "projects", ["bus", "des"], 35, 1, "Developed a one-page business plan", "", "3 h"),
    B("forage", "Do a virtual work-experience programme", "Free job simulations from big companies (banking, consulting, tech).", "work", ["bus", "cs", "law"], 50, 1, "Completed virtual work-experience programme (Forage)", "https://www.theforage.com", "4–6 h"),
    B("deca", "Compete in DECA or FBLA", "US business and marketing competitions.", "competitions", ["bus"], 80, 3, "Competitor, DECA / FBLA business competitions", "https://www.deca.org", "Program", ["us"]),
    B("youngent", "Run a Young Enterprise company", "UK programme: set up and run a real student company for a year.", "leadership", ["bus"], 90, 3, "Director, Young Enterprise Company Programme", "https://www.young-enterprise.org.uk", "Program", ["uk"]),
    // Humanities, writing & languages
    B("blogpost", "Write a blog post explaining an idea", "Explain one concept from your field to a 14-year-old.", "writing", [], 30, 1, "Published explanatory blog writing", "", "2 h"),
    B("podcast", "Record a 3-episode podcast", "Interview people or explain topics in your field.", "projects", ["hum", "pol", "bus", "sci"], 60, 1, "Created and hosted a 3-episode podcast", "", "2 weeks"),
    B("explainer", "Make a 3-minute explainer video", "Script, record and edit a video on one concept.", "projects", ["sci", "math", "des", "med"], 45, 1, "Produced an educational explainer video", "", "1 week"),
    B("nyt", "Enter a New York Times Learning Network contest", "Student editorials, reviews and more, for ages 13–19.", "writing", ["hum", "pol", "law"], 70, 3, "Entrant, New York Times Learning Network student contest", "https://www.nytimes.com/section/learning", "Program"),
    B("foyle", "Enter the Foyle Young Poets of the Year Award", "Open to 11–17 year-olds worldwide.", "writing", ["hum"], 70, 3, "Entrant, Foyle Young Poets of the Year Award", "https://poetrysociety.org.uk", "Program"),
    B("shortstory", "Submit a short story to a youth writing competition", "Edit it twice before you submit.", "writing", ["hum"], 50, 2, "Short story submitted to youth writing competition", "", "2 weeks"),
    B("iol", "Try the Linguistics Olympiad", "Puzzle-based: decode languages you have never seen.", "competitions", ["hum", "math", "cs"], 70, 3, "Participant, Linguistics Olympiad (IOL pathway)", "https://ioling.org", "1 day"),
    B("localhistory", "Research a piece of local history", "Use archives or interviews and write it up.", "projects", ["hum", "pol"], 50, 1, "Independent local history research project", "", "2 weeks"),
    B("transcribe", "Transcribe historical documents online", "Smithsonian Digital Volunteers: help make archives searchable.", "volunteering", ["hum"], 30, 1, "Digital volunteer, Smithsonian Transcription Center", "https://transcription.si.edu", "2 h"),
    B("museum", "Volunteer at a museum or archive", "Help visitors, catalogue items or support events.", "volunteering", ["hum", "arch"], 45, 1, "Museum / archive volunteer", "", "4 h"),
    B("bookclub", "Start or lead a book club", "Choose 3 books and lead discussions.", "leadership", ["hum", "law", "psy"], 50, 2, "Founder / leader, student book club", "", "Ongoing"),
    B("foreignbook", "Read a book in a foreign language", "Then write a short review in that language.", "languages", ["hum", "pol"], 40, 1, "Read and reviewed a book in a foreign language", "", "2 weeks"),
    B("exchange", "Do 4 language-exchange sessions", "Practise with a native speaker online or locally.", "languages", [], 30, 1, "Language exchange practice with native speakers", "", "4 × 30 min"),
    B("ieltsmock", "Take a full IELTS / TOEFL practice test", "Timed, all four skills. Record your band.", "courses", [], 25, 1, "English proficiency exam preparation (IELTS/TOEFL)", "https://ielts.org", "3 h"),
    B("satmock", "Do a full Bluebook SAT practice test", "The official digital SAT practice app.", "courses", [], 30, 1, "SAT preparation (official practice tests)", "https://bluebook.collegeboard.org", "3 h"),
    B("epq", "Start an Extended Project Qualification (EPQ)", "A 5,000-word independent project that UK universities value.", "projects", [], 100, 3, "Extended Project Qualification (EPQ)", "", "Program", ["uk"]),
    B("uniq", "Apply to a UK access summer school", "e.g. UNIQ (Oxford) or Sutton Trust summer schools.", "courses", [], 80, 3, "Applicant, UK university access summer school (UNIQ / Sutton Trust)", "https://www.suttontrust.com", "Program", ["uk"]),
    B("taster", "Watch an Oxford or Cambridge taster lecture", "Many are free online. Note 3 questions it raised.", "courses", [], 20, 1, "Attended university taster lecture", "", "1 h", ["uk", "global"]),
    B("etwinning", "Join an eTwinning / Erasmus+ school project", "Collaborate with schools across Europe.", "projects", [], 60, 2, "Participant, eTwinning / Erasmus+ international school project", "https://school-education.ec.europa.eu", "Program", ["eu"]),
    B("wosp", "Volunteer for WOŚP (Great Orchestra of Christmas Charity)", "Poland's biggest charity drive.", "volunteering", [], 50, 2, "Volunteer, Wielka Orkiestra Świątecznej Pomocy (WOŚP)", "https://www.wosp.org.pl", "1 day", ["pl"]),
    B("keyclub", "Join Key Club", "Student-led community service organisation.", "volunteering", [], 50, 2, "Member, Key Club International (service)", "https://www.keyclub.org", "Ongoing", ["us"]),
    // Leadership, work & sport
    B("schoolhouse", "Tutor peers on Schoolhouse.world", "Free online peer tutoring, founded by Sal Khan. Earn certified hours.", "volunteering", ["math", "cs", "sci"], 50, 2, "Volunteer tutor, Schoolhouse.world (certified hours)", "https://schoolhouse.world", "4 h"),
    B("bemyeyes", "Volunteer with Be My Eyes", "Help blind and low-vision people through short video calls.", "volunteering", [], 25, 1, "Volunteer, Be My Eyes accessibility app", "https://www.bemyeyes.com", "Ongoing"),
    B("foodbank", "Volunteer at a food bank", "Sorting, packing or distributing for 4+ hours.", "volunteering", [], 35, 1, "Volunteer, local food bank", "", "4 h"),
    B("charity", "Organise a charity event", "Bake sale, sports day or concert, with a fundraising target.", "leadership", ["bus", "pol"], 60, 2, "Organised charity fundraising event", "", "2 weeks"),
    B("council", "Join student council", "Stand for election or take on a committee role.", "leadership", ["pol", "law", "bus"], 60, 2, "Student council representative", "", "Ongoing"),
    B("mentor", "Mentor a younger student in your club", "Meet regularly and help them build one skill.", "leadership", [], 40, 1, "Mentor to younger students", "", "Ongoing"),
    B("sustain", "Lead a school sustainability initiative", "Recycling, energy or transport, with measurable results.", "leadership", ["sci", "pol", "eng"], 60, 2, "Led school sustainability initiative", "", "2 weeks"),
    B("modelg20", "Attend a Model G20 or Model EU", "Simulate economic or EU negotiations.", "leadership", ["pol", "bus", "law"], 70, 2, "Delegate, Model G20 / Model EU simulation", "", "Program"),
    B("mockinterview", "Do a mock admissions interview", "Ask a teacher to interview you on your subject and get feedback.", "courses", [], 30, 1, "University admissions interview preparation", "", "1 h"),
    B("shadowpro", "Shadow a professional for a day", "Pick someone in your target career.", "work", [], 45, 1, "Job shadowing in target career field", "", "1 day"),
    B("internapp", "Apply for a summer internship or job", "Send 3 applications with a tailored cover letter.", "work", [], 50, 1, "Applied for summer internship / employment", "", "1 week"),
    B("coachcert", "Get a coaching or refereeing certificate", "Coach juniors or referee matches in your sport.", "sports", [], 60, 2, "Certified youth coach / referee", "", "Program"),
    B("run10k", "Train for and finish a 5K or 10K race", "Log your training over 2 weeks.", "sports", [], 35, 1, "Completed 5K/10K race", "", "2 weeks"),
    B("teamorg", "Organise a sports tournament", "Plan teams, schedule and results for a school event.", "leadership", [], 55, 2, "Organised school sports tournament", "", "2 weeks"),
    B("music", "Perform at a concert or recital", "Solo or ensemble, at school or in your community.", "arts", ["hum", "des"], 45, 2, "Performer, concert / recital", "", "1 day"),
    B("abrsm", "Take a graded music exam", "ABRSM, Trinity or your national equivalent.", "arts", ["hum"], 70, 2, "Graded music examination (ABRSM / Trinity)", "https://www.abrsm.org", "Program"),
    B("theatre", "Take part in a school play or musical", "Acting, tech or backstage all count.", "arts", ["hum", "des"], 50, 2, "Cast / crew, school theatre production", "", "Program"),
    B("cefrtest", "Take an online CEFR placement test", "Find your official-style level in a foreign language.", "languages", [], 20, 1, "Language level assessment (CEFR)", "https://www.efset.org", "1 h")
  );

  return { FIELDS, CATS, LEVELS, FIELDREQ, SUBJECTS, BOARDS, QUIZ, ADDONS };
})();
