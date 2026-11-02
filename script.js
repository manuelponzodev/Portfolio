const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const body = document.body;

// Año y hora local
$("#year").textContent = new Date().getFullYear();
const clockFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
const tickClock = () => $$(".clock").forEach((el) => { el.textContent = clockFormat.format(new Date()) + " GMT-3"; });
tickClock();
setInterval(tickClock, 30000);

// Trazos SVG con largo normalizado para animar stroke-dashoffset
$$(".ln, .spark path, .t-hot, .net-ln, .route").forEach((p) => p.setAttribute("pathLength", "1"));
$$(".pills span").forEach((el, i) => el.style.setProperty("--i", i));

// Scroll suave (Lenis si cargó desde el CDN)
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new window.Lenis({ lerp: 0.09 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  lenis.stop();
}
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = link.getAttribute("href") === "#" ? null : $(link.getAttribute("href"));
  if (!target || !lenis) return;
  e.preventDefault();
  lenis.scrollTo(target, { duration: 1.6 });
});

// Saludo inicial en los idiomas que hablo
const greetings = ["Hola", "Hello", "Bonjour", "Hallo", "Manu"];
const start = () => {
  body.classList.add("ready");
  body.classList.remove("is-loading");
  lenis?.start();
  startCounters();
};
let seen = false;
try { seen = sessionStorage.getItem("greeted") === "1"; sessionStorage.setItem("greeted", "1"); } catch (_) {}
if (reduceMotion || seen) {
  body.classList.add("skip-loader");
  start();
} else {
  const word = $(".loader-word span");
  greetings.forEach((g, i) => setTimeout(() => { word.textContent = g; }, 380 + i * 260));
  setTimeout(start, 380 + greetings.length * 260 + 250);
}

// Header: se esconde al bajar, vuelve al subir
const topbar = $(".topbar");
let lastY = window.scrollY;
let scrollDir = 1;

// Rotador de roles
const rotWords = $$(".rot-word");
let rotIndex = 0;
if (!reduceMotion) {
  setInterval(() => {
    const current = rotWords[rotIndex];
    rotIndex = (rotIndex + 1) % rotWords.length;
    const next = rotWords[rotIndex];
    current.classList.remove("on");
    current.classList.add("out");
    next.classList.add("on");
    // Volver a la posición de espera (abajo) sin animar, para que no cruce por la vista
    setTimeout(() => {
      current.classList.add("reset");
      current.classList.remove("out");
      void current.offsetHeight;
      current.classList.remove("reset");
    }, 750);
  }, 2400);
}

// Contadores
function animateCount(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = target; return; }
  const t0 = performance.now();
  const step = (t) => {
    const p = clamp((t - t0) / 1400);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function startCounters() {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { animateCount(en.target); io.unobserve(en.target); }
  }), { threshold: 0.6 });
  $$("[data-count]").forEach((el) => io.observe(el));
}

// Recorrido del hero: cada caso real pasa por negocio → producto → mercado
const journey = $(".journey");
if (journey) {
  // Ilustraciones (viewBox 48×48): .d se dibuja, .p aparece, .g crece; --d es el retraso
  const svg = (inner) => `<svg viewBox="0 0 48 48">${inner}</svg>`;
  const grid16 = [...Array(16)].map((_, i) => `<circle class="p${i === 15 ? " of" : ""}" cx="${12 + (i % 4) * 8}" cy="${12 + Math.floor(i / 4) * 8}" r="2.4" style="--d:${(i * 0.035).toFixed(2)}s;${i === 15 ? "" : "fill:currentColor;stroke:none"}"/>`).join("");
  const icons = {
    inflation: svg('<path class="d" d="M6 41h36M6 41V7"/><path class="d o" style="--d:.2s" d="M10 35l8-7 6 3 8-11 8-9"/><path class="d o" style="--d:.7s" d="M34 11h6v6"/>'),
    bars: svg('<path class="d" d="M6 41h36"/><rect class="g" x="10" y="24" width="7" height="17" rx="1"/><rect class="g" x="21" y="16" width="7" height="25" rx="1" style="--d:.15s"/><rect class="g of" x="32" y="9" width="7" height="32" rx="1" style="--d:.3s"/>'),
    live: svg('<circle class="ring" cx="24" cy="24" r="15"/><circle class="d" cx="24" cy="24" r="15"/><path class="d o" style="--d:.5s" d="M17 24.5l5 5 9.5-10.5"/>'),
    sixteen: svg(grid16),
    hub: svg('<path class="d" d="M24 24L24 7M24 24L39 15M24 24L39 33M24 24L24 41M24 24L9 33M24 24L9 15"/><circle class="p" cx="24" cy="7" r="3" style="--d:.5s"/><circle class="p" cx="39" cy="15" r="3" style="--d:.6s"/><circle class="p" cx="39" cy="33" r="3" style="--d:.7s"/><circle class="p" cx="24" cy="41" r="3" style="--d:.8s"/><circle class="p" cx="9" cy="33" r="3" style="--d:.9s"/><circle class="p" cx="9" cy="15" r="3" style="--d:1s"/><circle class="p of" cx="24" cy="24" r="6"/>'),
    chat: svg('<path class="d" d="M7 11h34v21H21l-8 7v-7H7z"/><circle class="dot" cx="17" cy="21.5" r="2.2"/><circle class="dot" cx="24" cy="21.5" r="2.2" style="--d:.15s"/><circle class="dot o" cx="31" cy="21.5" r="2.2" style="--d:.3s;fill:var(--orange)"/>'),
    phone: svg('<rect class="d" x="14" y="5" width="20" height="38" rx="4"/><path class="d" style="--d:.3s" d="M21 38h6"/><path class="d o" style="--d:.6s" d="M18 14h12v9h-6l-3 3v-3h-3z"/>'),
    talk: svg('<path class="d" d="M5 9h23v13H15l-5 4v-4H5z"/><path class="d o" style="--d:.5s" d="M43 21H20v13h14l5 4v-4h4z"/>'),
    calendar: svg('<rect class="d" x="6" y="10" width="36" height="31" rx="4"/><path class="d" style="--d:.3s" d="M6 18h36M15 6v8M33 6v8"/><rect class="p of" x="27" y="25" width="9" height="9" rx="2" style="--d:.8s"/>'),
    factory: svg('<path class="d" d="M5 41V23l9 6v-6l9 6v-6l9 6V9h7v32z"/><path class="d" style="--d:.4s" d="M3 41h42"/><circle class="p o" cx="36" cy="5" r="2" style="--d:1s"/>'),
    blocks: svg('<rect class="pin" x="6" y="29" width="16" height="12" rx="2"/><rect class="pin" x="26" y="29" width="16" height="12" rx="2" style="animation-delay:.35s"/><rect class="pin of" x="12" y="13" width="24" height="13" rx="2" style="animation-delay:.6s"/>'),
    pin: svg('<path class="d" d="M6 42h36"/><ellipse class="p" cx="24" cy="42" rx="6" ry="1.6" style="--d:.7s;fill:currentColor;stroke:none;opacity:.3"/><path class="pin o" d="M24 37s-10-10-10-17a10 10 0 0 1 20 0c0 7-10 17-10 17z"/><circle class="p" cx="24" cy="20" r="3.4" style="--d:.8s"/>'),
    rain: svg('<path class="d" d="M14 29a7 7 0 0 1 .5-14 10 10 0 0 1 19.3 2.2A6 6 0 0 1 34 29z"/><path class="rain" style="--d:0s" d="M17 34v5"/><path class="rain" style="--d:.35s" d="M24 34v5"/><path class="rain" style="--d:.7s" d="M31 34v5"/>'),
    fork: svg('<path class="d" d="M24 43V27"/><path class="d" style="--d:.4s" d="M24 27L11 14"/><path class="d o" style="--d:.4s" d="M24 27l13-13"/><path class="d o" style="--d:.9s" d="M30 14h7v7"/><circle class="p" cx="11" cy="14" r="2.6" style="--d:1s"/>'),
    sprout: svg('<path class="d" d="M9 42h30"/><path class="d" style="--d:.3s" d="M24 42V22"/><path class="d o" style="--d:.8s" d="M24 29c-8 0-12-5-12-12 8 0 12 5 12 12z"/><path class="d o" style="--d:1.1s" d="M24 24c0-7 5-12 12-12 0 7-5 12-12 12z"/>'),
  };
  const cases = [
    { name: "Envi", steps: [["inflation", "La inflación esconde el costo real"], ["bars", "Costeo FIFO y CPP"], ["live", "En producción"]] },
    { name: "Settler", steps: [["sixteen", "Una demo, 16 pasos"], ["hub", "Agente con 13 tools"], ["chat", "Una sola conversación"]] },
    { name: "Agente de turnos", steps: [["phone", "Reservar desde WhatsApp"], ["talk", "Un agente que conversa"], ["calendar", "Turno en el calendario"]] },
    { name: "Industrially", steps: [["factory", "Cada planta es distinta"], ["blocks", "Módulo productivo a medida"], ["pin", "Puerta por puerta"]] },
    { name: "FieldOps AI", steps: [["rain", "El clima manda"], ["fork", "Agentes para decidir"], ["sprout", "En desarrollo"]] },
  ];
  const nodes = $$(".jr-node", journey);
  const texts = $$(".jr-t", journey);
  const icoEls = $$(".jr-ico", journey);
  const nameEl = $(".jr-name", journey);
  const countEl = $(".jr-count", journey);
  const pulse = $(".jr-pulse", journey);
  let caseIndex = 0;

  const render = (c, i) => {
    nameEl.textContent = c.name;
    countEl.textContent = `0${i + 1} / 0${cases.length}`;
    texts.forEach((t, k) => { t.textContent = c.steps[k][1]; });
    icoEls.forEach((el, k) => {
      el.innerHTML = icons[c.steps[k][0]];
      $$(".d", el).forEach((p) => p.setAttribute("pathLength", "1"));
    });
  };
  render(cases[0], 0);

  const dots = $$(".jr-dots button", journey);
  let litTimers = [];
  let autoTimer = null;
  let hovering = false;

  const play = () => {
    litTimers.forEach(clearTimeout);
    pulse.classList.remove("run");
    void pulse.offsetWidth;
    pulse.classList.add("run");
    litTimers = nodes.map((n, k) => setTimeout(() => n.classList.add("lit"), 150 + k * 900));
  };
  // Avanza solo cada 6,2 s; se pausa mientras el mouse está encima
  const schedule = (delay = 6200) => {
    clearTimeout(autoTimer);
    if (!reduceMotion) autoTimer = setTimeout(() => { if (!hovering) goTo(caseIndex + 1); else schedule(); }, delay);
  };
  const goTo = (i) => {
    litTimers.forEach(clearTimeout);
    journey.classList.add("swap");
    nodes.forEach((n) => n.classList.remove("lit"));
    setTimeout(() => {
      caseIndex = (i + cases.length) % cases.length;
      render(cases[caseIndex], caseIndex);
      dots.forEach((d, k) => d.classList.toggle("on", k === caseIndex));
      journey.classList.remove("swap");
      if (reduceMotion) nodes.forEach((n) => n.classList.add("lit"));
      else play();
    }, 350);
    schedule();
  };

  dots.forEach((d, k) => d.addEventListener("click", () => { if (k !== caseIndex) goTo(k); }));
  journey.addEventListener("mouseenter", () => { hovering = true; journey.classList.add("paused"); });
  journey.addEventListener("mouseleave", () => { hovering = false; journey.classList.remove("paused"); schedule(2500); });

  if (reduceMotion) {
    nodes.forEach((n) => n.classList.add("lit"));
  } else {
    setTimeout(play, 1400);
    schedule(1400 + 6200);
  }
}

// Brillo del hero que sigue al cursor
const hero = $(".hero");
const glow = $(".hero-glow");
if (hero && glow && finePointer && !reduceMotion) {
  let gx = 0.7, gy = 0.3, tx = gx, ty = gy, running = false;
  const move = () => {
    gx += (tx - gx) * 0.08;
    gy += (ty - gy) * 0.08;
    glow.style.setProperty("--gx", (gx * 100).toFixed(2) + "%");
    glow.style.setProperty("--gy", (gy * 100).toFixed(2) + "%");
    if (Math.abs(tx - gx) > 0.001 || Math.abs(ty - gy) > 0.001) requestAnimationFrame(move);
    else running = false;
  };
  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = (e.clientY - r.top) / r.height;
    if (!running) { running = true; requestAnimationFrame(move); }
  });
}

// Tarjetas con inclinación 3D y luz que sigue al cursor
if (finePointer && !reduceMotion) {
  $$(".agent, .own-vis, .stage").forEach((el) => {
    const tilt = !el.classList.contains("stage");
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      if (tilt) el.style.transform = `perspective(1100px) rotateX(${((0.5 - py) * 5).toFixed(2)}deg) rotateY(${((px - 0.5) * 6).toFixed(2)}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => { if (tilt) el.style.transform = ""; });
  });
}

// Título de contacto: cada letra reacciona al pasar el mouse
$$(".contact-title .ct-line > span").forEach((line) => {
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          if (ch === " ") { frag.appendChild(document.createTextNode(" ")); return; }
          const s = document.createElement("span");
          s.className = "lt";
          s.textContent = ch;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else wrap(child);
    });
  };
  wrap(line);
});

// Texto que se enciende palabra por palabra
const lit = $("[data-lit]");
let litWords = [];
if (lit) {
  lit.innerHTML = lit.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  litWords = $$(".w", lit);
}

// Banda de rubros que acompaña la velocidad del scroll
const band = $(".band-track");
let bandX = 0, velocity = 0;
if (band && !reduceMotion) {
  const loop = () => {
    const half = band.scrollWidth / 2;
    bandX -= (0.6 + Math.min(Math.abs(velocity), 40) * 0.25) * scrollDir;
    velocity *= 0.9;
    if (bandX <= -half) bandX += half;
    if (bandX > 0) bandX -= half;
    band.style.transform = `translate3d(${bandX}px,0,0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// Capítulos: el escenario cambia según el paso que estás leyendo
const chapters = $$(".chapter").map((ch) => ({
  steps: $$(".step", ch),
  scenes: $$(".scene", ch),
  path: $(".stage-path b", ch),
  current: -1,
}));
function updateChapters(vh) {
  // Desktop: cuando el centro del paso cruza el 62%. Mobile: cuando el paso asoma debajo del escenario fijo.
  const mobile = window.innerWidth <= 820;
  chapters.forEach((ch) => {
    let active = 0;
    ch.steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if ((mobile ? r.top : r.top + r.height / 2) < vh * (mobile ? 0.85 : 0.62)) active = i;
    });
    if (active === ch.current) return;
    ch.current = active;
    ch.steps.forEach((s, i) => s.classList.toggle("active", i === active));
    ch.scenes.forEach((s, i) => s.classList.toggle("on", i === active));
    if (ch.path && ch.scenes[active]) ch.path.textContent = ch.scenes[active].dataset.label;
  });
}

// Agentes: los íconos se dibujan al entrar en pantalla y se repiten al pasar el mouse
$$(".agent .jr-ico .d").forEach((p) => p.setAttribute("pathLength", "1"));
const agentIO = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("lit");
  agentIO.unobserve(en.target);
}), { threshold: 0.35 });
$$(".agent").forEach((card) => {
  agentIO.observe(card);
  card.addEventListener("mouseenter", () => {
    if (!card.classList.contains("lit")) return;
    card.classList.remove("lit");
    void card.offsetWidth;
    card.classList.add("lit");
  });
});

// Navegación flotante entre proyectos
const projNav = $(".proj-nav");
const projLinks = projNav ? $$("a", projNav) : [];
const projSections = projLinks.map((a) => $(a.getAttribute("href")));
function updateProjNav(vh) {
  if (!projNav) return;
  const first = projSections[0].getBoundingClientRect();
  const last = projSections[projSections.length - 1].getBoundingClientRect();
  projNav.classList.toggle("show", first.top < vh * 0.5 && last.bottom > vh * 0.6);
  let active = 0;
  projSections.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.45) active = i; });
  projLinks.forEach((a, i) => a.classList.toggle("on", i === active));
}

// Línea de tiempo que se completa con el scroll
const timeline = $(".timeline");
const tlBar = $(".tl-progress i");

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const delta = y - lastY;
  if (delta !== 0) scrollDir = delta > 0 ? 1 : -1;
  velocity = delta;
  topbar.classList.toggle("scrolled", y > 60);
  topbar.classList.toggle("hidden", delta > 0 && y > 500);
  lastY = y;

  if (litWords.length) {
    const r = lit.getBoundingClientRect();
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3));
    const count = Math.round(p * litWords.length);
    litWords.forEach((w, i) => w.classList.toggle("on", i < count));
  }

  updateChapters(vh);
  updateProjNav(vh);

  if (timeline && tlBar) {
    const r = timeline.getBoundingClientRect();
    tlBar.parentElement.style.setProperty("--p", clamp((vh * 0.6 - r.top) / r.height).toFixed(3));
  }
}
let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// Aparición de bloques
const revealEls = $$(".work-head > *, .ch-head > :not(.ch-num), .own-card, .horus, .about-main > *, .tl-item, .intro-foot, .contact-row");
revealEls.forEach((el) => el.classList.add("rv"));
const revealIO = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  revealIO.unobserve(en.target);
}), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
[...revealEls, $(".contact-title")].forEach((el) => el && revealIO.observe(el));

// Índice: preview que sigue al cursor
const preview = $(".preview");
const strip = $(".preview-strip");
const index = $(".index");
if (preview && index && finePointer) {
  let tx = 0, ty = 0, cx = 0, cy = 0, s = 0, ts = 0, running = false;
  const follow = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    s += (ts - s) * 0.14;
    preview.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
    if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 || Math.abs(ts - s) > 0.005) requestAnimationFrame(follow);
    else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(follow); } };
  index.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; kick(); });
  $$("a", index).forEach((a) => a.addEventListener("mouseenter", (e) => {
    if (ts === 0) { cx = tx = e.clientX; cy = ty = e.clientY; }
    strip.style.transform = `translateY(-${Number(a.dataset.preview) * 100}%)`;
    ts = 1;
    kick();
  }));
  index.addEventListener("mouseleave", () => { ts = 0; kick(); });
}

// Botones magnéticos
if (finePointer && !reduceMotion) {
  $$(".magnetic").forEach((btn) => {
    const label = $("span", btn);
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transition = "transform .2s ease-out";
      btn.style.transform = `translate(${dx * 0.35}px, ${dy * 0.35}px)`;
      label.style.transform = `translate(${dx * 0.15}px, ${dy * 0.15}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transition = "transform .8s cubic-bezier(.2,1.6,.4,1)";
      label.style.transition = btn.style.transition;
      btn.style.transform = "";
      label.style.transform = "";
    });
  });
}

// Cursor
const cursor = $(".cursor");
if (cursor && finePointer) {
  const label = $(".cursor-label", cursor);
  let mx = 0, my = 0, x = 0, y = 0;
  window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("visible"); });
  document.addEventListener("mouseleave", () => cursor.classList.remove("visible"));
  const loop = () => {
    x += (mx - x) * 0.2;
    y += (my - y) * 0.2;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  $$("[data-cursor]").forEach((el) => {
    el.addEventListener("mouseenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("big"); });
    el.addEventListener("mouseleave", () => cursor.classList.remove("big"));
  });
}

// Copiar el mail
const mailBtn = $(".mail-btn");
mailBtn?.addEventListener("click", async () => {
  const hint = $(".mail-hint", mailBtn);
  try {
    await navigator.clipboard.writeText(mailBtn.dataset.email);
    hint.textContent = "¡Copiado! Te espero en el inbox";
  } catch (_) {
    window.location.href = "mailto:" + mailBtn.dataset.email;
    return;
  }
  setTimeout(() => { hint.textContent = "Click para copiar"; }, 2400);
});
