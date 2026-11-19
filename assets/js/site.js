/* Been Meaning To — shared site behaviour: menu, scroll reveals, count-ups, confetti, toasts. */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#FF5A36", "#4DA3FF", "#FFD23F", "#3DDC97", "#C9A7FF", "#FF8FB1"];

  /* ---------- Header ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav-links a").forEach(a =>
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll(".reveal, .pop, [data-count], [data-on-view]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        if (e.target.hasAttribute("data-count")) countUp(e.target);
        if (e.target.hasAttribute("data-on-view")) e.target.dispatchEvent(new CustomEvent("inview"));
        io.unobserve(e.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => {
      el.classList.add("in");
      if (el.hasAttribute("data-count")) el.textContent = Number(el.dataset.count).toLocaleString();
      if (el.hasAttribute("data-on-view")) el.dispatchEvent(new CustomEvent("inview"));
    });
  }

  function countUp(el) {
    const target = Number(el.dataset.count);
    const dur = Number(el.dataset.duration || 1400);
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Confetti ---------- */
  let canvas, ctx, pieces = [], running = false;
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.id = "confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
  }

  /** Burst confetti from a point (or an element's centre). */
  function confetti(origin, opts = {}) {
    if (reduceMotion) return;
    ensureCanvas();
    let x = innerWidth / 2, y = innerHeight / 2;
    if (origin instanceof Element) {
      const r = origin.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    } else if (origin && typeof origin.x === "number") { x = origin.x; y = origin.y; }
    const count = opts.count || 120;
    for (let i = 0; i < count; i++) {
      const angle = (opts.spread ? -Math.PI / 2 : 0) + (Math.random() - .5) * (opts.spread || Math.PI * 2);
      const speed = 6 + Math.random() * (opts.power || 10);
      pieces.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (opts.spread ? 0 : 5),
        w: 7 + Math.random() * 8, h: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .35,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        shape: Math.random() < .25 ? "circle" : "rect",
        life: 0, max: 140 + Math.random() * 60
      });
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  /** Confetti raining from the top of the screen. */
  function rain(count = 160) {
    if (reduceMotion) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => confetti({ x: Math.random() * innerWidth, y: -20 }, { count: count / 6, spread: Math.PI * .9, power: 4 }), i * 90);
    }
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces = pieces.filter(p => p.life < p.max && p.y < innerHeight + 40);
    for (const p of pieces) {
      p.life++;
      p.vx *= .985; p.vy = p.vy * .985 + .32;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const fade = Math.min(1, (p.max - p.life) / 30);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.strokeStyle = "#1A1A1A"; ctx.lineWidth = 1.5;
      if (p.shape === "circle") {
        ctx.beginPath(); ctx.arc(0, 0, p.h / 2 + 1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        const sq = Math.abs(Math.cos(p.life * .12)); // paper flutter
        ctx.fillRect(-p.w / 2, -p.h * sq / 2, p.w, p.h * sq);
        ctx.strokeRect(-p.w / 2, -p.h * sq / 2, p.w, p.h * sq);
      }
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  /* ---------- App Store buttons (placeholder until launch) ---------- */
  document.querySelectorAll("[data-store]").forEach(btn =>
    btn.addEventListener("click", e => {
      if (btn.getAttribute("href") === "#") e.preventDefault();
      confetti(btn, { count: 90 });
      toast("Coming soon to the App Store. Watch this space!");
    })
  );

  /* Anything with data-confetti bursts on click */
  document.querySelectorAll("[data-confetti]").forEach(el =>
    el.addEventListener("click", () => confetti(el))
  );

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));

  /* =================================================================
     Extra fun
     ================================================================= */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  /* ---------- Visitor badges (kept for this browser tab only) ---------- */
  const BADGES = [
    { id: "spin",    icon: "🎲", name: "Fate's pick",  how: "Spin the shelf" },
    { id: "finish",  icon: "⭐", name: "Finisher",      how: "Finish a (pretend) book" },
    { id: "level",   icon: "🚀", name: "Level up",      how: "Climb a reader level" },
    { id: "bottom",  icon: "📜", name: "Page turner",   how: "Read a page to the very end" },
    { id: "curious", icon: "🐱", name: "Curious cat",   how: "Open three FAQ answers" },
    { id: "poke",    icon: "👉", name: "Fidget",        how: "Click the logo a few times on the home page" }
  ];
  const store = {
    get() { try { return JSON.parse(sessionStorage.getItem("pc-badges") || "[]"); } catch (e) { return []; } },
    set(v) { try { sessionStorage.setItem("pc-badges", JSON.stringify(v)); } catch (e) { /* fine without */ } }
  };
  let earned = store.get();
  let chip, list;

  function buildChip() {
    if (chip) return;
    chip = document.createElement("button");
    chip.className = "badge-chip";
    chip.setAttribute("aria-expanded", "false");
    list = document.createElement("div");
    list.className = "badge-list";
    list.setAttribute("role", "dialog");
    list.setAttribute("aria-label", "Your badges");
    document.body.append(chip, list);
    chip.addEventListener("click", e => {
      e.stopPropagation();
      const open = list.classList.toggle("open");
      chip.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", e => {
      if (!list.contains(e.target)) { list.classList.remove("open"); chip.setAttribute("aria-expanded", "false"); }
    });
  }
  function renderChip(bump) {
    if (!earned.length) return;
    buildChip();
    chip.textContent = `🏅 ${earned.length} of ${BADGES.length} badges`;
    list.innerHTML = `<h4>Website badges</h4><ul>${BADGES.map(b => {
      const got = earned.includes(b.id);
      return `<li class="${got ? "" : "locked"}"><i>${got ? b.icon : "?"}</i><div><b>${got ? b.name : "???"}</b><br>${b.how}</div></li>`;
    }).join("")}</ul>`;
    requestAnimationFrame(() => chip.classList.add("show"));
    if (bump) { chip.classList.remove("bump"); void chip.offsetWidth; chip.classList.add("bump"); }
  }
  renderChip(false);

  let awardEl, awardTimer;
  function award(id) {
    const b = BADGES.find(x => x.id === id);
    if (!b || earned.includes(id)) return;
    earned.push(id);
    store.set(earned);
    if (!awardEl) {
      awardEl = document.createElement("div");
      awardEl.className = "award";
      awardEl.setAttribute("role", "status");
      document.body.appendChild(awardEl);
    }
    awardEl.innerHTML = `<div class="disc">${b.icon}</div><div><small>Badge unlocked</small><b>${b.name}</b><span>${b.how}</span></div>`;
    awardEl.classList.remove("show"); void awardEl.offsetWidth; awardEl.classList.add("show");
    setTimeout(() => confetti(awardEl.querySelector(".disc"), { count: 60, power: 7 }), 350);
    clearTimeout(awardTimer);
    awardTimer = setTimeout(() => awardEl.classList.remove("show"), 3600);
    renderChip(true);
    if (earned.length === BADGES.length) setTimeout(() => { rain(260); toast("You collected every badge. Legendary!"); }, 1200);
  }

  // Read to the very end of any page
  window.addEventListener("scroll", () => {
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 40) award("bottom");
  }, { passive: true });

  // Poke the logo
  let pokes = 0, pokeTimer;
  document.querySelectorAll(".logo").forEach(logo => logo.addEventListener("click", e => {
    // On other pages the logo just goes home. On the home page it stays put so the pokes can add up.
    const home = new URL(logo.href, location.href).pathname.replace(/index\.html$/, "");
    if (location.pathname.replace(/index\.html$/, "") !== home) return;
    e.preventDefault();
    if (pokes === 0 && scrollY > 0) scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    pokes++;
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => (pokes = 0), 1500);
    const img = logo.querySelector("img");
    if (img && !reduceMotion) img.animate(
      [{ transform: "rotate(0) scale(1)" }, { transform: `rotate(${pokes * 120}deg) scale(1.25)` }, { transform: "rotate(0) scale(1)" }],
      { duration: 600, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );
    if (pokes >= 4) { award("poke"); pokes = 0; }
  }));

  /* ---------- Floating doodles ---------- */
  const DOODLES = [
    c => `<svg viewBox="0 0 24 24"><path d="M12 1.5c.8 5.6 2.9 7.7 8.5 8.5v.1c-5.6.8-7.7 2.9-8.5 8.5h-.1C11.1 13 9 10.9 3.4 10.1V10c5.6-.8 7.7-2.9 8.5-8.5z" fill="${c}" stroke="#1A1A1A" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    c => `<svg viewBox="0 0 40 16"><path d="M2 8c4-8 8 8 12 0s8 8 12 0 8 8 12 0" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/></svg>`,
    c => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="4"/></svg>`,
    c => `<svg viewBox="0 0 24 24"><path d="M12 3 21 20H3z" fill="${c}" stroke="#1A1A1A" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    c => `<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="${c}" stroke-width="5" stroke-linecap="round"/></svg>`,
    c => `<svg viewBox="0 0 24 30"><rect x="3" y="2" width="18" height="26" rx="3" fill="${c}" stroke="#1A1A1A" stroke-width="2"/><path d="M7 7h10M7 23h10" stroke="#1A1A1A" stroke-width="2" opacity=".35"/></svg>`
  ];
  const doodles = [];
  document.querySelectorAll("main section").forEach((sec, si) => {
    const n = sec.matches(".hero, .page-hero") ? 4 : 2;
    for (let k = 0; k < n; k++) {
      const d = document.createElement("div");
      d.className = "doodle";
      d.setAttribute("aria-hidden", "true");
      // Alternate sides; anchor right-side doodles with `right` so they never widen the page.
      const side = k % 2 === 0 ? "left" : "right";
      d.style.cssText = `${side}:${(0.5 + Math.random() * 2.5).toFixed(1)}%; top:${8 + Math.random() * 78}%; --s:${30 + Math.random() * 26}px; --rot:${Math.round(Math.random() * 60 - 30)}deg`;
      const color = pick(["#FF5A36", "#4DA3FF", "#FFD23F", "#3DDC97", "#C9A7FF", "#FF8FB1"]);
      d.innerHTML = DOODLES[(si * 3 + k) % DOODLES.length](color);
      d.dataset.speed = (0.06 + Math.random() * 0.14) * (Math.random() < .5 ? -1 : 1);
      sec.prepend(d);
      doodles.push(d);
    }
  });
  if (!reduceMotion && doodles.length) {
    let ticking = false;
    const drift = () => {
      const mid = innerHeight / 2;
      for (const d of doodles) {
        const r = d.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        const off = (r.top + r.height / 2 - mid) * Number(d.dataset.speed);
        d.style.setProperty("--py", off.toFixed(1) + "px");
        d.style.setProperty("--pr", (off * 0.6).toFixed(1) + "deg");
      }
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  /* ---------- Scissors along zigzag edges ---------- */
  const SCISSORS = `<svg class="scissors" viewBox="0 0 64 44" aria-hidden="true">
    <g class="blade-b"><path d="M26 22 62 30 58 34z" fill="#fff" stroke="#1A1A1A" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="32" r="8" fill="#FF5A36" stroke="#1A1A1A" stroke-width="2.5"/><circle cx="12" cy="32" r="3.5" fill="#FFF4DE" stroke="#1A1A1A" stroke-width="1.5"/><path d="M18 27 26 22" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/></g>
    <g class="blade-a"><path d="M26 22 62 14 58 10z" fill="#fff" stroke="#1A1A1A" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="8" fill="#FF5A36" stroke="#1A1A1A" stroke-width="2.5"/><circle cx="12" cy="12" r="3.5" fill="#FFF4DE" stroke="#1A1A1A" stroke-width="1.5"/><path d="M18 17 26 22" stroke="#1A1A1A" stroke-width="5" stroke-linecap="round"/></g>
    <circle cx="26" cy="22" r="2.5" fill="#1A1A1A"/></svg>`;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const snipIO = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelector(".snip-track").classList.add("go");
      snipIO.unobserve(e.target);
    }), { threshold: 0, rootMargin: "0px 0px -35% 0px" });
    document.querySelectorAll(".zig").forEach(sec => {
      const track = document.createElement("div");
      track.className = "snip-track";
      track.innerHTML = SCISSORS;
      sec.appendChild(track);
      snipIO.observe(sec);
    });
  }

  /* ---------- Headline letters that hop ---------- */
  document.querySelectorAll("h1, h2").forEach(h => {
    if (h.closest(".award, .badge-list")) return;
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        const w = document.createElement("span");
        w.className = "w";
        w.setAttribute("aria-hidden", "true");
        for (const c of part) {
          const s = document.createElement("span");
          s.className = "ch";
          s.textContent = c;
          w.appendChild(s);
        }
        frag.appendChild(w);
      });
      node.replaceWith(frag);
    });
  });
  if (!reduceMotion) {
    const HOP = ["#FF5A36", "#4DA3FF", "#FF8FB1", "#C9A7FF", "#3DDC97"];
    document.addEventListener("mouseover", e => {
      const ch = e.target.closest && e.target.closest(".ch");
      if (!ch || ch.classList.contains("hop")) return;
      ch.style.setProperty("--hr", (Math.random() * 20 - 10).toFixed(0) + "deg");
      ch.style.color = pick(HOP);
      ch.classList.add("hop");
      setTimeout(() => ch.classList.remove("hop"), 220);
      setTimeout(() => (ch.style.color = ""), 900);
    });
  }

  /* ---------- Cards tilt towards the pointer ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".stat, .extra, .plan, .support-card, .palette, .privacy-tldr .chunky, .cta-card, .spin-demo, .faq details").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        const max = card.matches(".faq details, .cta-card, .spin-demo") ? 2.5 : 6;
        card.classList.add("tilting");
        card.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("tilting");
        card.style.transform = "";
      });
    });
  }


  window.LoudLibrary = { confetti, rain, toast, award, reduceMotion, COLORS };
})();
