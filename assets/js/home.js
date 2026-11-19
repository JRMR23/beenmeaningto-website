/* Home page demos. Everything here uses made-up sample books; nothing is saved. */
(function () {
  const { confetti, rain, toast, reduceMotion } = window.LoudLibrary;
  const C = ["var(--tomato)", "var(--sky)", "var(--lemon)", "var(--mint)", "var(--lilac)", "var(--pink)", "var(--orange)", "var(--paper)"];

  const BOOKS = [
    { t: "Murder at Teatime", a: "Agatha Plum", p: 288, g: "Mystery" },
    { t: "Seven Small Moons", a: "Ines Okafor", p: 412, g: "Sci-fi" },
    { t: "The Quiet Orchard", a: "May Hollis", p: 296, g: "Romance" },
    { t: "Robots Don't Knit", a: "Theo Park", p: 340, g: "Sci-fi" },
    { t: "A Map of Lost Socks", a: "Rosa Vance", p: 212, g: "Romance" },
    { t: "The Lighthouse Cat", a: "Finn Abara", p: 256, g: "Mystery" },
    { t: "Salt and Starlight", a: "Juno Reyes", p: 468, g: "Sci-fi" },
    { t: "The Last Bus Home", a: "Priya Nair", p: 384, g: "Mystery" },
    { t: "Midnight Bakery", a: "Lou Bennett", p: 198, g: "Romance" },
    { t: "Thirteen Teacups", a: "Hal Morgan", p: 520, g: "Mystery" }
  ];
  const coverFor = i => C[i % 7];

  const makeSpine = (b, i, extra = {}) => {
    const el = document.createElement("div");
    el.className = "spine";
    const h = extra.h || 140 + ((b.p * 7 + i * 31) % 60);
    const w = extra.w || 32 + Math.round(b.p / 40);
    el.style.cssText = `--h:${h}px; --w:${w}px; --c:${coverFor(i)}; --i:${i}`;
    el.textContent = b.t;
    return el;
  };

  /* ---------- Hero shelf ---------- */
  const heroShelf = document.getElementById("heroShelf");
  const heroTitles = BOOKS.concat(BOOKS.slice(0, 6).map(b => ({ ...b, t: b.a })));
  heroTitles.forEach((b, i) => {
    const s = makeSpine(b, i, { h: 120 + ((i * 37) % 70), w: 36 + ((i * 13) % 18) });
    heroShelf.appendChild(s);
  });

  /* ---------- Spin the shelf ---------- */
  const spinShelf = document.getElementById("spinShelf");
  const spinBtn = document.getElementById("spinBtn");
  const result = document.getElementById("spinResult");
  const spines = BOOKS.map((b, i) => {
    const s = makeSpine(b, i, { h: 150 + ((i * 29) % 40), w: 34 });
    s.dataset.i = i;
    spinShelf.appendChild(s);
    return s;
  });
  let mood = "any";
  const fits = b => mood === "any" ? true : mood === "short" ? b.p < 300 : b.g === mood;

  document.querySelectorAll(".mood").forEach(btn =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood").forEach(m => m.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      mood = btn.dataset.mood;
      spines.forEach((s, i) => { s.classList.toggle("out", !fits(BOOKS[i])); s.classList.remove("picked"); });
    })
  );

  spinBtn.addEventListener("click", () => {
    const pool = spines.filter((s, i) => fits(BOOKS[i]));
    if (!pool.length) return;
    spinBtn.disabled = true;
    spines.forEach(s => s.classList.remove("picked", "lit"));
    const winner = pool[(Math.random() * pool.length) | 0];
    const steps = reduceMotion ? 0 : 12 + pool.length + ((Math.random() * pool.length) | 0);
    let step = 0, idx = (Math.random() * pool.length) | 0;
    // Make sure the last step lands on the winner
    const startOffset = (pool.indexOf(winner) - steps % pool.length + pool.length * 10) % pool.length;
    idx = startOffset;

    const tick = () => {
      pool.forEach(s => s.classList.remove("lit"));
      const cur = pool[idx % pool.length];
      cur.classList.add("lit");
      if (step >= steps) return land(cur);
      step++; idx++;
      const delay = 45 + Math.pow(step / steps, 3) * 300;
      setTimeout(tick, delay);
    };
    tick();
  });

  function land(spine) {
    spine.classList.remove("lit");
    spine.classList.add("picked");
    const i = Number(spine.dataset.i), b = BOOKS[i];
    result.innerHTML = `<div class="mini-cover" style="--c:${coverFor(i)}"></div>
      <div><span class="tag">The shelf says</span><h4>${b.t}</h4><p class="muted">${b.a} · ${b.p} pages</p></div>`;
    result.classList.remove("bump"); void result.offsetWidth; result.classList.add("bump");
    confetti(spine, { count: 70 });
    spinBtn.disabled = false;
    window.LoudLibrary.award("spin");
  }

  /* ---------- Reading calendar (month by month, like the app) ---------- */
  const heat = document.getElementById("heat");
  const calMonth = document.getElementById("calMonth");
  const calDays = document.getElementById("calDays");
  const calPages = document.getElementById("calPages");
  const calPrev = document.getElementById("calPrev");
  const calNext = document.getElementById("calNext");
  const MAX_BACK = 3;
  let back = 0;
  // Pretend pages for a day: the same every visit, with the odd quiet day.
  const pagesOn = d => {
    let h = Math.imul(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate(), 2654435761);
    h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
    const x = (h >>> 0) / 4294967296;
    return x < .15 ? 0 : Math.round(6 + Math.pow((x - .15) / .85, 1.4) * 70);
  };
  const levelOf = p => p === 0 ? 0 : p < 20 ? 1 : p < 45 ? 2 : 3;
  function drawCalendar() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    calMonth.textContent = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    heat.innerHTML = "";
    let days = 0, pages = 0, freezes = 0, prevRead = false;
    for (let i = 0; i < 42; i++) {
      const c = document.createElement("i");
      const n = i - lead + 1;
      if (n >= 1 && n <= count) {
        const d = new Date(first.getFullYear(), first.getMonth(), n);
        const today = back === 0 && n === now.getDate();
        const future = back === 0 && n > now.getDate();
        let p = future ? 0 : pagesOn(d);
        if (today && p === 0) p = 25;
        // A freeze covers the odd single missed day after a day of reading, like the app.
        const frozen = !future && p === 0 && prevRead && freezes < 2;
        if (frozen) freezes++;
        prevRead = p > 0;
        if (future) c.className = "future";
        else if (frozen) c.className = "frozen";
        else if (levelOf(p)) c.className = "l" + levelOf(p);
        if (today) c.classList.add("today");
        c.textContent = frozen ? "❄" : n;
        if (p) { days++; pages += p; }
      } else c.className = "blank";
      c.style.transitionDelay = (Math.floor(i / 7) * 45 + (i % 7) * 15) + "ms";
      heat.appendChild(c);
    }
    calDays.textContent = days;
    calPages.textContent = pages.toLocaleString("en-GB");
    calPrev.disabled = back >= MAX_BACK;
    calNext.disabled = back === 0;
  }
  drawCalendar();
  const flip = n => {
    back = Math.min(MAX_BACK, Math.max(0, back + n));
    drawCalendar();
    heat.classList.remove("in"); void heat.offsetWidth; heat.classList.add("in");
  };
  calPrev.addEventListener("click", () => flip(1));
  calNext.addEventListener("click", () => flip(-1));
  heat.addEventListener("inview", () => heat.classList.add("in"));

  /* ---------- Reader level ---------- */
  const LEVELS = ["Page Turner", "Bookworm", "Chapter Chaser", "Plot Hunter", "Story Hoarder", "Shelf Sage", "Library Legend"];
  const STEP = 300; // pages per level in this demo
  let pages = 634;
  const ladder = document.getElementById("ladder");
  LEVELS.forEach(n => { const li = document.createElement("li"); li.textContent = n; ladder.appendChild(li); });
  const levelNum = document.getElementById("levelNum"), levelName = document.getElementById("levelName");
  const levelBar = document.getElementById("levelBar"), levelPages = document.getElementById("levelPages");
  function renderLevel(bump) {
    const lv = Math.min(LEVELS.length - 1, Math.floor(pages / STEP));
    const into = lv === LEVELS.length - 1 ? 1 : (pages % STEP) / STEP;
    const prev = Number(levelNum.textContent);
    levelNum.textContent = lv + 1;
    levelName.textContent = LEVELS[lv];
    levelBar.style.width = Math.max(4, into * 100) + "%";
    levelPages.textContent = lv === LEVELS.length - 1
      ? `${pages.toLocaleString()} pages logged · top level!`
      : `${pages.toLocaleString()} pages logged · ${STEP - (pages % STEP)} to level ${lv + 2}`;
    [...ladder.children].forEach((li, i) => { li.className = i < lv ? "done" : i === lv ? "now" : ""; });
    if (bump && lv + 1 > prev) {
      levelNum.classList.remove("bump"); void levelNum.offsetWidth; levelNum.classList.add("bump");
      confetti(levelNum, { count: 100 });
      toast(`Level up! You're now a ${LEVELS[lv]}.`);
      window.LoudLibrary.award("level");
    }
  }
  renderLevel(false);
  document.getElementById("logBtn").addEventListener("click", e => {
    if (pages >= STEP * (LEVELS.length - 1)) { pages = 634; renderLevel(false); toast("Back to level 3. Climb it again!"); return; }
    pages += 25;
    renderLevel(true);
    e.currentTarget.animate([{ transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 250 });
  });

  /* ---------- Badges ---------- */
  const BADGES = [
    { n: "First pages", i: "i-book", how: "Log any pages." },
    { n: "On a roll", i: "i-flame", how: "Read 3 days in a row." },
    { n: "Week warrior", i: "i-cal", how: "Read 7 days in a row." },
    { n: "Finisher", i: "i-star", how: "Finish a book." },
    { n: "Hat trick", i: "i-books", how: "Finish 3 books." },
    { n: "Big day", i: "i-bolt", how: "Read 100 pages in one day." },
    { n: "Fate's pick", i: "i-dice", how: "Spin the shelf and start the book it picks." },
    { n: "Goal getter", i: "i-target", how: "Hit your yearly reading goal." }
  ];
  const badgeWrap = document.getElementById("badges"), tip = document.getElementById("badgeTip");
  const fills = ["var(--lemon)", "var(--pink)", "var(--mint)", "var(--sky)", "var(--lilac)", "var(--tomato)", "var(--paper)", "var(--orange)"];
  BADGES.forEach((b, k) => {
    const btn = document.createElement("button");
    btn.className = "badge pop";
    btn.style.setProperty("--d", (k * 0.07) + "s");
    btn.innerHTML = `<span class="disc" style="background:${fills[k]}"><svg style="color:#fff"><use href="#${b.i}"/></svg></span><span>${b.n}</span>`;
    btn.addEventListener("click", () => {
      btn.classList.remove("jig"); void btn.offsetWidth; btn.classList.add("jig");
      tip.innerHTML = `<b>${b.n}:</b> ${b.how}`;
    });
    badgeWrap.appendChild(btn);
  });
  // Badges were added after site.js set up its observer, so watch them here.
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .3 });
    badgeWrap.querySelectorAll(".pop").forEach(el => io.observe(el));
  } else badgeWrap.querySelectorAll(".pop").forEach(el => el.classList.add("in"));

  /* ---------- Wrapped fan-out ---------- */
  const wrapped = document.getElementById("wrapped");
  wrapped.addEventListener("inview", () => setTimeout(() => wrapped.classList.add("in"), 250));

  /* ---------- Live Activity timer ---------- */
  const clock = document.getElementById("clock");
  let secs = 23 * 60 + 7;
  const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  clock.textContent = fmt(secs);
  setInterval(() => { secs = (secs + 1) % 3600; clock.textContent = fmt(secs); }, 1000);
  const lockTime = document.getElementById("lockTime");
  const now = new Date();
  lockTime.textContent = now.getHours() % 12 || 12;
  lockTime.textContent += ":" + String(now.getMinutes()).padStart(2, "0");

  /* ---------- Goodreads import ---------- */
  const importShelf = document.getElementById("importShelf");
  BOOKS.slice(0, 8).forEach((b, i) => importShelf.appendChild(makeSpine(b, i, { h: 90 + ((i * 23) % 40), w: 26 })));

  /* ---------- Finish celebration ---------- */
  const finishBtn = document.getElementById("finishBtn"), finishCount = document.getElementById("finishCount");
  let finished = 0;
  const cheers = ["Brilliant!", "Another one down!", "You're on fire!", "Bookworm behaviour.", "The shelf is shaking!", "Legendary."];
  finishBtn.addEventListener("click", () => {
    finished++;
    rain(220);
    confetti(finishBtn, { count: 80 });
    finishCount.innerHTML = `${cheers[(finished - 1) % cheers.length]} Books finished: <b>${finished}</b>`;
    window.LoudLibrary.award("finish");
    if (finished === 3) setTimeout(() => toast("Hat trick! Three books in a row."), 600);
  });
})();
