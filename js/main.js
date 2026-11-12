// Page wiring: language, scroll-driven 3D hero, reveal animations, and launching the Mirror.
import { applyDom, setLang, onLang } from "./i18n.js";
import { loadThree, loadAnatomy } from "./anatomy.js";
import { createHero } from "./hero.js";

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = x => x * x * (3 - 2 * x);
const lerp = (a, b, k) => a + (b - a) * k;

/* language */
applyDom();
document.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => setLang(b.dataset.lang));

/* cursor glow + card spotlight */
addEventListener("pointermove", e => {
  document.documentElement.style.setProperty("--mx", e.clientX + "px");
  document.documentElement.style.setProperty("--my", e.clientY + "px");
}, { passive: true });
document.querySelectorAll(".card").forEach(c => c.addEventListener("pointermove", e => {
  const r = c.getBoundingClientRect(); c.style.setProperty("--cx", (e.clientX - r.left) + "px"); c.style.setProperty("--cy", (e.clientY - r.top) + "px");
}));

/* reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* the brand name scrambles into place */
const brand = $("brandEn");
function scramble() {
  const final = brand.dataset.text, chars = "01X#RAYKNL%/", t0 = performance.now();
  (function step(now) {
    const p = (now - t0) / 750;
    brand.textContent = [...final].map((ch, i) => p > (i + 1) / final.length ? ch : chars[Math.floor(Math.random() * chars.length)]).join("");
    if (p < 1) requestAnimationFrame(step); else brand.textContent = final;
  })(t0);
}
scramble(); brand.addEventListener("pointerenter", scramble);

/* engine: three.js + anatomy, shared by the hero and the Mirror */
const engine = (async () => { const THREE = await loadThree(); const A = await loadAnatomy(THREE); return { THREE, A }; })();
let mirrorMod = null;
const mirrorReady = engine.then(async ({ THREE, A }) => {
  mirrorMod = await import("./mirror.js");
  mirrorMod.init(THREE, A);
  return mirrorMod;
});
mirrorReady.catch(e => console.error("Mirror failed to initialise", e));

async function launch(kind) {
  try { const m = await mirrorReady; kind === "camera" ? m.startCamera() : m.startOrbit(); }
  catch (e) { const s = $("status"); if (s) { s.textContent = "3D engine failed to load: " + (e.message || e); s.className = "pill bad"; } }
}
document.querySelectorAll("[data-launch]").forEach(a => a.addEventListener("click", () => launch("camera")));
document.querySelectorAll("[data-explore]").forEach(a => a.addEventListener("click", () => launch("orbit")));
$("start").onclick = () => launch("camera");
$("explore").onclick = () => launch("orbit");

/* hero + scroll-driven layers */
const layersEl = $("layers"), steps = [...document.querySelectorAll("#layerSteps li")], bar = $("layerBar");
let hero = null;
function stateFromScroll() {
  const vh = innerHeight, mobile = innerWidth < 820;
  const r = layersEl.getBoundingClientRect();
  const enter = ease(clamp(1 - r.top / vh, 0, 1));
  const lp = clamp(-r.top / (r.height - vh), 0, 1);
  const leave = clamp(1 - r.bottom / vh, 0, 1);
  const s3 = lp * 3, f = i => clamp(1 - Math.abs(s3 - i), 0, 1);
  const heroW = { outline: 1, muscles: 0.22, skull: 0.85, brain: 0.8, eyes: 1 };
  const peelW = { outline: 0.4 + 0.6 * f(0), muscles: 0.06 + 0.94 * f(1), skull: 0.06 + 0.94 * f(2), brain: 0.06 + 0.94 * f(3), eyes: 0.15 + 0.85 * Math.max(f(2), f(1) * 0.5) };
  const w = {}; for (const k in heroW) w[k] = lerp(heroW[k], peelW[k], enter);
  const idx = Math.round(lp * 3);
  steps.forEach((li, i) => li.classList.toggle("on", i === idx && enter > 0.6));
  bar.style.width = (lp * 100).toFixed(1) + "%";
  return {
    x: lerp(mobile ? 0 : 0.45, mobile ? 0 : -0.52, enter), y: lerp(mobile ? 0.42 : 0, mobile ? 0.45 : 0, enter),
    s: lerp(mobile ? 0.6 : 1.1, mobile ? 0.55 : 0.82, enter),
    ry: 0.35 + scrollY * 0.0011 + lp * 1.2, rx: 0, op: clamp(1 - leave * 1.25, 0, 1), w,
  };
}
engine.then(({ THREE, A }) => {
  try {
    hero = createHero($("bg3d"), THREE, A);
    hero.setTarget(stateFromScroll()); hero.snap();
    addEventListener("resize", () => hero.resize());
    (function loop(now) { requestAnimationFrame(loop); hero.setTarget(stateFromScroll()); hero.frame(now); })(performance.now());
  } catch (e) { console.warn("Hero 3D unavailable", e); $("bg3d").style.display = "none"; }
}).catch(e => { console.warn(e); $("bg3d").style.display = "none"; });

onLang(() => {});
