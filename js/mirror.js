// The Mirror: live camera X-ray, 3D explorer, quiz, recording, gestures.
import { HEAD_C, BONES, buildHead, heartbeat, applyTheme, THEMES, makeMat } from "./anatomy.js";
import { t, tl, onLang } from "./i18n.js";

const $ = id => document.getElementById(id);
const stage = $("stage"), cam$ = $("cam");
const ease = x => x * x * (3 - 2 * x);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const MP_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL_CDN = "https://storage.googleapis.com/mediapipe-models/";
const MODELS = {
  face: ["models/face_landmarker.task", MODEL_CDN + "face_landmarker/face_landmarker/float16/1/face_landmarker.task"],
  hand: ["models/hand_landmarker.task", MODEL_CDN + "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"],
};

/* ---------------------------- settings ---------------------------- */
const DEF = { skull: true, brain: false, muscles: false, eyes: true, hands: true, labels: false, outline: true,
  look: "xray", bright: 1, real: 0.12, soft: 0.25, reveal: "whole", cut: 0.5, dots: false,
  sparks: true, beat: true, blink: true, gesture: false, theme: "ice",
  fs: 1, fw: 1, fh: 1, fd: 1, fx: 0, fy: 0, fz: 0 };
let S = { ...DEF };
try { Object.assign(S, JSON.parse(localStorage.getItem("kankal_v1") || "{}")); } catch {}
const persist = () => { try { localStorage.setItem("kankal_v1", JSON.stringify(S)); } catch {} };
const RANGES = ["bright", "real", "soft", "cut", "fs", "fw", "fh", "fd", "fx", "fy", "fz"];
const CHECKS = ["outline", "dots", "sparks", "beat", "blink", "gesture"];

/* ---------------------------- state ---------------------------- */
let THREE, A, built = false;
let renderer, headScene, handScene, camP, camO, baseProj;
let headGroup, jawPivot, parts, sparks, eyesMesh, eyeCY, jawMat4;
let W = 640, H = 360, DPR = 1;
const rigs = [];
let mode = "idle", token = 0, stream = null;
let faceTracker = null, handTracker = null, trackersP = null;
const head = { found: false, pos: null, quat: null, scl: null, fs: 1, fx: 0, fy: 0, jaw: 0, blink: 0 };
const orbit = { yaw: 0.5, pitch: -0.05, dist: 38, last: 0, drag: false };
let introAt = -1e9, pointer = null, wantShot = false, rec = null, lastStatus = ["s.ready", "", ""];
let m4, v3a, v3b, qa, sa, fitM, corr, tmp4, hA, hB, hC, hD, hE, hF, hM;
const clip = { on: 0, x: 1, y: 0, w: 0 };

/* ---------------------------- status / toast ---------------------------- */
function setStatus(key, cls = "", detail = "") {
  lastStatus = [key, cls, detail];
  const el = $("status"); el.textContent = t(key) + (detail ? ": " + detail : ""); el.className = "pill " + cls;
}
let toastTimer = 0;
function toast(text, cls = "", ms = 1100) {
  const el = $("toast"); el.textContent = text; el.className = "toast " + cls; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}
const setKey = (el, key) => { el.dataset.i18n = key; el.textContent = t(key); };

/* ---------------------------- UI ---------------------------- */
function syncUI() {
  document.querySelectorAll("[data-layer]").forEach(b => b.classList.toggle("on", !!S[b.dataset.layer]));
  document.querySelectorAll("#look button").forEach(b => b.classList.toggle("on", b.dataset.s === S.look));
  document.querySelectorAll("#themes button").forEach(b => b.classList.toggle("on", b.dataset.theme === S.theme));
  for (const k of RANGES) $(k).value = S[k];
  for (const k of CHECKS) $(k).checked = !!S[k];
  for (const k of ["fs", "fw", "fh", "fd"]) $(k + "v").textContent = Math.round(S[k] * 100) + "%";
  for (const k of ["fx", "fy", "fz"]) $(k + "v").textContent = (S[k] > 0 ? "+" : "") + S[k].toFixed(1) + " cm";
  $("realv").textContent = Math.round(S.real * 100) + "%";
  $("reveal").value = S.reveal;
  $("cutrow").hidden = S.reveal === "whole" || S.reveal === "sweep";
  $("cutlabel").dataset.i18n = S.reveal === "lens" ? "p.lens" : "p.cut"; $("cutlabel").textContent = t($("cutlabel").dataset.i18n);
}
function bindUI() {
  document.querySelectorAll("[data-layer]").forEach(b => b.onclick = () => { S[b.dataset.layer] = !S[b.dataset.layer]; persist(); syncUI(); });
  document.querySelectorAll("#look button").forEach(b => b.onclick = () => { S.look = b.dataset.s; persist(); syncUI(); applyLook(); });
  document.querySelectorAll("#themes button").forEach(b => b.onclick = () => { S.theme = b.dataset.theme; persist(); syncUI(); doTheme(); });
  for (const k of RANGES) $(k).oninput = e => { S[k] = parseFloat(e.target.value); persist(); syncUI(); };
  for (const k of CHECKS) $(k).onchange = e => { S[k] = e.target.checked; persist(); };
  $("reveal").onchange = e => { S.reveal = e.target.value; S.cut = 0.5; persist(); syncUI(); };
  document.querySelectorAll("#presets button").forEach(b => b.onclick = () => applyPreset(b.dataset.p));
  $("reset").onclick = () => { S = { ...DEF }; persist(); syncUI(); applyLook(); doTheme(); };
  $("shot").onclick = () => { wantShot = true; if (mode === "idle") toast(t("s.ready")); };
  $("rec").onclick = toggleRec; $("full").onclick = toggleFull; $("quiz").onclick = toggleQuiz; $("stop").onclick = stopAll;
  if (!window.MediaRecorder) $("rec").hidden = true;
  stage.addEventListener("pointermove", e => { const r = stage.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  stage.addEventListener("pointerleave", () => { pointer = null; });
  bindOrbitInput();
  syncUI();
}
function applyPreset(p) {
  Object.assign(S, { skull: p === "skull" || p === "all", brain: p === "brain" || p === "all", muscles: p === "muscles" || p === "all", eyes: p !== "brain", outline: true });
  persist(); syncUI();
}
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen(); else if (stage.requestFullscreen) stage.requestFullscreen();
}

/* ---------------------------- 3D engine ---------------------------- */
function buildEngine() {
  renderer = new THREE.WebGLRenderer({ canvas: $("gl"), alpha: true, antialias: true });
  renderer.setClearColor(0, 0); renderer.autoClear = false;
  headScene = new THREE.Scene(); handScene = new THREE.Scene();
  camP = new THREE.PerspectiveCamera(63, W / H, 1, 10000);        // MediaPipe's face pose assumes a 63 degree camera
  camO = new THREE.OrthographicCamera(0, W, H, 0, -5000, 5000);   // hands live in plain pixel space
  const HB = buildHead(THREE, A, { veil: true, autoUpdate: false });
  ({ headGroup, jawPivot, parts, sparks, eyes: eyesMesh, eyeCY } = HB);
  headGroup.visible = false; headScene.add(headGroup);
  for (let h = 0; h < 2; h++) {
    const group = new THREE.Group(); group.visible = false; handScene.add(group);
    const mk = g => { const m = new THREE.Mesh(g, makeMat(THREE, THEMES.ice.hand, 0xe9e2cf)); m.material.uniforms.uOrtho.value = 1;
      m.matrixAutoUpdate = false; m.frustumCulled = false; group.add(m); return m; };
    rigs.push({ group, palm: mk(A.geos.hand_palm), bones: BONES.map(([a, b]) => mk(A.geos["hand_b_" + a + "_" + b])), pts: null });
  }
  jawMat4 = new THREE.Matrix4();
  m4 = new THREE.Matrix4(); tmp4 = new THREE.Matrix4(); fitM = new THREE.Matrix4(); corr = new THREE.Matrix4();
  v3a = new THREE.Vector3(); v3b = new THREE.Vector3(); qa = new THREE.Quaternion(); sa = new THREE.Vector3();
  hA = new THREE.Vector3(); hB = new THREE.Vector3(); hC = new THREE.Vector3(); hD = new THREE.Vector3(); hE = new THREE.Vector3(); hF = new THREE.Vector3(); hM = new THREE.Matrix4();
  head.pos = new THREE.Vector3(); head.quat = new THREE.Quaternion(); head.scl = new THREE.Vector3(1, 1, 1);
  built = true; fit(); applyLook(); doTheme();
}
function eachMat(fn) {
  for (const k in parts) fn(parts[k].mesh.material, parts[k]);
  for (const r of rigs) { fn(r.palm.material, {}); r.bones.forEach(b => fn(b.material, {})); }
}
function applyLook() {
  if (!built) return;
  const solid = S.look === "solid";
  eachMat((m, info) => {
    if (info.fixed !== undefined) return;
    m.uniforms.uMode.value = solid ? 1 : 0;
    m.blending = solid ? THREE.NormalBlending : THREE.AdditiveBlending;
    m.depthTest = m.depthWrite = solid; m.needsUpdate = true;
  });
}
function doTheme() {
  if (!built) return;
  const hm = []; rigs.forEach(r => { hm.push(r.palm.material); r.bones.forEach(b => hm.push(b.material)); });
  applyTheme(parts, hm, S.theme);
}
function fit() {
  const r = stage.getBoundingClientRect();
  W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height));
  DPR = Math.min(window.devicePixelRatio || 1, innerWidth < 820 ? 1.5 : 2);
  for (const id of ["shade", "hud"]) { const c = $(id); c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
  if (!built) return;
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false);
  camP.aspect = W / H; camP.updateProjectionMatrix(); baseProj = camP.projectionMatrix.clone();
  camO.right = W; camO.top = H; camO.updateProjectionMatrix();
}
new ResizeObserver(() => fit()).observe(stage);

/* ---------------------------- head pose ---------------------------- */
const FIT = () => Object.keys(A.meta.fit).map(Number);
function poseHead(arr, lms, jawOpen, blink, now) {
  m4.fromArray(arr);
  const e = m4.elements;                        // accept either memory layout
  if (Math.abs(e[12]) + Math.abs(e[13]) + Math.abs(e[14]) < 1e-6 && Math.abs(e[3]) + Math.abs(e[7]) + Math.abs(e[11]) > 1e-3) m4.transpose();
  m4.decompose(v3a, qa, sa);
  if (!head.found) { head.pos.copy(v3a); head.quat.copy(qa); head.scl.copy(sa); head.fs = 1; head.fx = head.fy = 0; introAt = now; }
  else { head.pos.lerp(v3a, 0.6); head.quat.slerp(qa, 0.55); head.scl.lerp(sa, 0.5); }
  head.found = true;
  head.jaw += (jawOpen - head.jaw) * 0.6; head.blink += (blink - head.blink) * 0.7;
  m4.compose(head.pos, head.quat, head.scl);

  // Solve a uniform scale + shift so the model lands on the tracker's face points.
  const P = [], T = [];
  for (const id of FIT()) {
    const q = lms[id]; if (!q) continue;
    v3b.fromArray(A.meta.fit[id]).applyMatrix4(m4).applyMatrix4(baseProj);
    P.push(v3b.x, v3b.y); T.push(q.x * 2 - 1, 1 - q.y * 2);
  }
  const n = P.length / 2; let pmx = 0, pmy = 0, tmx = 0, tmy = 0;
  for (let i = 0; i < n; i++) { pmx += P[2 * i]; pmy += P[2 * i + 1]; tmx += T[2 * i]; tmy += T[2 * i + 1]; }
  pmx /= n; pmy /= n; tmx /= n; tmy /= n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const ax = P[2 * i] - pmx, ay = P[2 * i + 1] - pmy;
    num += ax * (T[2 * i] - tmx) + ay * (T[2 * i + 1] - tmy); den += ax * ax + ay * ay;
  }
  const s = clamp(den > 1e-9 ? num / den : 1, 0.6, 1.6);
  head.fs += (s - head.fs) * 0.5;
  head.fx += (tmx - head.fs * pmx - head.fx) * 0.7;
  head.fy += (tmy - head.fs * pmy - head.fy) * 0.7;
  corr.set(head.fs, 0, 0, head.fx, 0, head.fs, 0, head.fy, 0, 0, 1, 0, 0, 0, 0, 1);
  camP.projectionMatrix.copy(baseProj).premultiply(corr);
  camP.projectionMatrixInverse.copy(camP.projectionMatrix).invert();
  fitM.makeScale(S.fs * S.fw, S.fs * S.fh, S.fs * S.fd).setPosition(-S.fx, S.fy, S.fz);   // local +x is the user's left; the view is mirrored
  headGroup.matrix.copy(m4).multiply(fitM);
  headGroup.matrixWorldNeedsUpdate = true; headGroup.visible = true;
}
function poseOrbit(now) {
  if (!head.found) introAt = now;
  head.found = true;
  if (!orbit.drag && now - orbit.last > 2500) orbit.yaw += 0.006;
  qa.setFromEuler(new THREE.Euler(orbit.pitch, orbit.yaw, 0, "YXZ"));
  m4.compose(v3a.set(0, 0, -orbit.dist), qa, sa.set(1, 1, 1));
  m4.multiply(tmp4.makeTranslation(-HEAD_C[0], -HEAD_C[1], -HEAD_C[2]));
  camP.projectionMatrix.copy(baseProj); camP.projectionMatrixInverse.copy(baseProj).invert();
  headGroup.matrix.copy(m4); headGroup.matrixWorldNeedsUpdate = true; headGroup.visible = true;
  head.jaw = 0.18 * (0.5 + 0.5 * Math.sin(now / 900)) * (Math.sin(now / 4000) > 0.2 ? 1 : 0.1);
  head.blink = Math.pow(Math.max(0, Math.sin(now / 2300)), 40);
}
function bindOrbitInput() {
  let sx = 0, sy = 0, down = false, moved = 0;
  stage.addEventListener("pointerdown", e => { down = true; moved = 0; sx = e.clientX; sy = e.clientY; orbit.drag = mode === "orbit"; orbit.last = performance.now(); });
  addEventListener("pointermove", e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = e.clientX; sy = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (mode === "orbit") { orbit.yaw += dx * 0.008; orbit.pitch = clamp(orbit.pitch + dy * 0.006, -0.9, 0.9); orbit.last = performance.now(); }
  });
  addEventListener("pointerup", e => {
    if (!down) return; down = false; orbit.drag = false;
    if (moved < 7 && quiz.active && stage.contains(e.target)) { const r = stage.getBoundingClientRect(); quizAnswer(e.clientX - r.left, e.clientY - r.top); }
  });
  stage.addEventListener("wheel", e => { if (mode !== "orbit") return; e.preventDefault(); orbit.dist = clamp(orbit.dist + e.deltaY * 0.04, 22, 80); orbit.last = performance.now(); }, { passive: false });
}

/* ---------------------------- layers / reveal ---------------------------- */
const GAIN = { outline: 0.55, muscles: 0.5, cerebrum: 0.36, hindbrain: 0.6, eyes: 0.9 };
function applyLayers(now) {
  let m = S.reveal, cut = S.cut, sweepY = -999;
  if (m === "sweep") { m = "top"; cut = 0.5 + 0.5 * Math.sin(now / 1300); }
  const ip = (now - introAt) / 2200;
  if (ip >= 0 && ip < 1) { m = "top"; cut = ease(ip); sweepY = -9 + (1 - cut) * 22; }       // the scan-in when a head is first found
  let on = 0, cx = 1, cy = 0, cw = 0;
  if (m === "left")   { on = 1; cx = 1;  cw = (cut - 0.5) * 16; }
  if (m === "right")  { on = 1; cx = -1; cw = (cut - 0.5) * 16; }
  if (m === "top")    { on = 1; cx = 0; cy = 1;  cw = -9 + (1 - cut) * 22; }
  if (m === "bottom") { on = 1; cx = 0; cy = -1; cw = 9 - cut * 22; }
  clip.on = on; clip.x = cx; clip.y = cy; clip.w = cw;
  jawPivot.rotation.x = S.blink ? clamp(head.jaw, 0, 1) * 0.36 : 0;
  jawPivot.updateMatrix(); parts.jaw.mesh.updateMatrix();
  jawMat4.copy(jawPivot.matrix).multiply(parts.jaw.mesh.matrix);
  const k = S.blink ? clamp(head.blink, 0, 1) : 0;
  eyesMesh.scale.y = 1 - 0.9 * k; eyesMesh.position.y = eyeCY * (1 - eyesMesh.scale.y);
  const heavy = (S.skull ? 1 : 0) + (S.brain ? 1 : 0) + (S.muscles ? 1 : 0);
  const share = 1 / (0.4 + 0.6 * Math.max(1, heavy));       // stacked additive layers would wash out to white
  const solid = S.look === "solid", beat = S.beat ? 0.12 * heartbeat(now / 1000) : 0, veilOn = mode === "live" || mode === "demo";
  for (const name in parts) {
    const { mesh, layer } = parts[name], u = mesh.material.uniforms;
    mesh.visible = layer === "veil" ? veilOn : (layer === "outline" ? S.outline : !!S[layer]);
    u.uGain.value = (solid && name !== "outline") ? Math.min(1.25, 0.6 + 0.4 * S.bright) : S.bright * (GAIN[name] || 1) * (layer === "outline" ? 1 : share);
    u.uOpacity.value = layer === "veil" ? 1 - S.real : 1;
    u.uClipOn.value = on; u.uClip.value.set(cx, cy, 0, cw);
    u.uEdge.value = S.soft * 0.75; u.uCutSoft.value = S.soft * 5; u.uTime.value = now / 1000;
    u.uBeat.value = beat; u.uSweepY.value = sweepY;
    if (layer === "brain") u.uPulse.value = S.sparks ? 1 : 0;
    if (name === "jaw") u.uToHead.value.copy(jawMat4); else u.uToHead.value.identity();
  }
  const su = sparks.material.uniforms;
  sparks.visible = S.brain && S.sparks; su.uTime.value = now / 1000; su.uDPR.value = DPR;
  su.uClipOn.value = on; su.uClip.value.set(cx, cy, 0, cw);
}

/* ---------------------------- hands ---------------------------- */
function poseHand(rig, lms, isRight) {
  if (!rig.pts) rig.pts = lms.map(() => new THREE.Vector3());
  const fresh = !rig.group.visible;
  lms.forEach((p, i) => { hA.set(p.x * W, (1 - p.y) * H, -p.z * W); fresh ? rig.pts[i].copy(hA) : rig.pts[i].lerp(hA, 0.65); });
  const P = rig.pts, sign = isRight ? 1 : -1;
  hD.subVectors(P[5], P[0]); hE.subVectors(P[17], P[0]);       // palm block: wrist at origin, index knuckle +x, little knuckle +y
  hF.crossVectors(hD, hE).normalize().multiplyScalar(sign * Math.sqrt(hD.length() * hE.length()));
  rig.palm.matrix.makeBasis(hD, hE, hF).setPosition(P[0]); rig.palm.matrixWorldNeedsUpdate = true;
  hC.subVectors(P[17], P[5]).normalize();                      // roll of each finger bone follows the line across the knuckles
  BONES.forEach(([a, b], i) => {
    hA.subVectors(P[b], P[a]);
    const len = hA.length() || 1e-6; hA.divideScalar(len);
    hB.copy(hC).addScaledVector(hA, -hC.dot(hA));
    if (hB.lengthSq() < 1e-6) hB.set(1, 0, 0);
    hB.normalize();
    hF.crossVectors(hA, hB).multiplyScalar(sign);
    const L = len * (b % 4 === 0 ? 0.8 : 1);                   // fingertip points sit past the end of the bone
    hM.makeBasis(hD.copy(hA).multiplyScalar(L), hE.copy(hB).multiplyScalar(L), hF.multiplyScalar(L)).setPosition(P[a]);
    rig.bones[i].matrix.copy(hM); rig.bones[i].matrixWorldNeedsUpdate = true;
  });
  rig.group.visible = true;
}
const scratch = document.createElement("canvas");
function drawHandVeil(g, lms, alpha) {
  const px = i => lms[i].x * W, py = i => lms[i].y * H;
  const d = Math.hypot(px(5) - px(17), py(5) - py(17)) || 1;
  if (scratch.width !== W || scratch.height !== H) { scratch.width = W; scratch.height = H; }
  const s = scratch.getContext("2d");
  s.clearRect(0, 0, W, H); s.fillStyle = s.strokeStyle = "#04070d"; s.lineJoin = s.lineCap = "round";
  s.beginPath(); [0, 1, 2, 5, 9, 13, 17].forEach((i, k) => k ? s.lineTo(px(i), py(i)) : s.moveTo(px(i), py(i))); s.closePath();
  s.lineWidth = d * 0.34; s.fill(); s.stroke(); s.lineWidth = d * 0.36;
  for (const c of [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]) {
    s.beginPath(); c.forEach((i, k) => k ? s.lineTo(px(i), py(i)) : s.moveTo(px(i), py(i))); s.stroke();
  }
  const blur = S.soft * d * 0.22;
  g.filter = blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none";
  g.globalAlpha = alpha; g.drawImage(scratch, 0, 0, W, H); g.globalAlpha = 1; g.filter = "none";
}

/* ---------------------------- gestures ---------------------------- */
const gest = { open: 0, armed: false, last: 0, idx: -1 };
const CYCLE = ["skull", "brain", "muscles", "all"];
function fingersUp(l) {
  let n = 0; const d = (a, b) => Math.hypot(l[a].x - l[b].x, l[a].y - l[b].y);
  for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) if (d(tip, 0) > d(pip, 0) * 1.1) n++;
  return n;
}
function handleGesture(hands, now) {
  if (!S.gesture || !hands.length) { gest.open = 0; gest.armed = false; return; }
  const n = fingersUp(hands[0]);
  if (n >= 4) { if (++gest.open > 6) gest.armed = true; }
  else { gest.open = 0; if (n === 0 && gest.armed && now - gest.last > 900) {
    gest.armed = false; gest.last = now; gest.idx = (gest.idx + 1) % CYCLE.length; applyPreset(CYCLE[gest.idx]);
    toast(t("g.next") + ": " + t("p." + CYCLE[gest.idx]), "ok", 900);
  } }
}

/* ---------------------------- labels ---------------------------- */
const LCOL = { skull: "#d9f0ff", brain: "#ffc2d6", muscles: "#ffb3aa", eyes: "#fff3a8", hands: "#d9f0ff" };
const lstate = {}; let tick = 0, split = 0;
function toScreen(v) { v3b.copy(v).applyMatrix4(camP.projectionMatrix); return { x: W - (v3b.x + 1) / 2 * W, y: (1 - v3b.y) / 2 * H }; }
function headLabels(lens, ignoreLayers) {
  const out = [], solid = S.look === "solid", M = headGroup.matrix, p = new THREE.Vector3(), n = new THREE.Vector3();
  for (const L of A.meta.labels) {
    if (!ignoreLayers && !S[L.layer]) continue;
    if (!ignoreLayers && solid && S.muscles && (L.layer === "skull" || L.layer === "brain")) continue;
    if (!ignoreLayers && solid && S.skull && L.layer === "brain") continue;
    let best = null;
    for (const pt of L.pts) {
      p.fromArray(pt); if (L.jaw) p.applyMatrix4(jawMat4);
      if (clip.on && clip.x * p.x + clip.y * p.y < clip.w) continue;
      n.set(p.x - HEAD_C[0], p.y - HEAD_C[1], p.z - HEAD_C[2]).transformDirection(M);
      p.applyMatrix4(M);
      const facing = -(n.x * p.x + n.y * p.y + n.z * p.z) / (p.length() || 1);
      if (solid && !ignoreLayers && facing < 0.12) continue;
      const s = toScreen(p);
      if (lens && Math.hypot(s.x - lens.x, s.y - lens.y) > lens.r) continue;
      if (!best || facing > best.facing) best = { name: L.t, text: tl(L.t), color: LCOL[L.layer], ax: s.x, ay: s.y, facing };
    }
    if (best) out.push(best);
  }
  return out;
}
function placeLabels(g, items, cx, half, key, splitX) {
  const cols = { left: [], right: [] };
  for (const it of items) {
    const st = lstate[key + it.name] || (lstate[key + it.name] = { side: it.ax < splitX ? "left" : "right", y: it.ay, seen: 0 });
    if (st.side === "left" && it.ax > splitX + half * 0.15) st.side = "right";
    else if (st.side === "right" && it.ax < splitX - half * 0.15) st.side = "left";
    if (tick - st.seen > 3) st.y = it.ay;
    st.seen = tick; it.st = st; cols[st.side].push(it);
  }
  g.font = "600 12.5px 'Inter','Hind Siliguri',system-ui,sans-serif"; g.textBaseline = "middle"; g.lineJoin = "round";
  for (const side of ["left", "right"]) {
    const list = cols[side].sort((a, b) => a.ay - b.ay);
    let prev = -1e9;
    for (const it of list) { it.ty = Math.max(it.ay, prev + 18); prev = it.ty; }
    const over = prev - (H - 14); if (over > 0) for (const it of list) it.ty -= over;
    const tw = list.reduce((mx, it) => Math.max(mx, g.measureText(it.text).width), 0);
    const tx = side === "left" ? Math.max(8 + tw, cx - half - 22) : Math.min(W - 8 - tw, cx + half + 22);
    for (const it of list) {
      it.st.y += (it.ty - it.st.y) * 0.35; const y = it.st.y;
      g.strokeStyle = it.color; g.globalAlpha = 0.75; g.lineWidth = 1;
      g.beginPath(); g.moveTo(it.ax, it.ay); g.lineTo(tx + (side === "left" ? 5 : -5), y); g.stroke();
      g.globalAlpha = 1; g.fillStyle = it.color; g.beginPath(); g.arc(it.ax, it.ay, 2.6, 0, 6.3); g.fill();
      g.textAlign = side === "left" ? "right" : "left";
      g.strokeStyle = "rgba(4,7,13,.9)"; g.lineWidth = 3.5; g.strokeText(it.text, tx, y); g.fillText(it.text, tx, y);
    }
  }
}
function drawLabels(g, lens) {
  tick++;
  let hx = W / 2, half = W * 0.16;
  if (head.found && headGroup.visible) {
    v3a.fromArray(HEAD_C).applyMatrix4(headGroup.matrix);
    const c = toScreen(v3a); v3a.x += 10.5 * S.fs * S.fw; const e = toScreen(v3a);
    hx = c.x; half = Math.abs(e.x - c.x);
    const items = headLabels(lens);
    const xs = items.map(i => i.ax).sort((a, b) => a - b), med = xs.length ? xs[xs.length >> 1] : hx;
    split += ((hx + med) / 2 - split) * 0.2;
    placeLabels(g, items, hx, half, "h:", split);
  }
  if (S.hands) rigs.forEach((rig, i) => {
    if (!rig.group.visible || !rig.pts) return;
    const P = rig.pts, at = (a, b, k) => ({ ax: W - (P[a].x + (P[b].x - P[a].x) * k), ay: H - (P[a].y + (P[b].y - P[a].y) * k) });
    const items = [["Distal phalanx", 11, 12, .5], ["Middle phalanx", 10, 11, .5], ["Proximal phalanx", 9, 10, .5], ["Metacarpal", 0, 9, .62], ["Carpal bones (wrist)", 0, 9, .1]]
      .map(([name, a, b, k]) => ({ name, text: tl(name), color: LCOL.hands, ...at(a, b, k) }))
      .filter(it => !lens || Math.hypot(it.ax - lens.x, it.ay - lens.y) <= lens.r);
    let lo = 1e9, hi = -1e9; for (const p of P) { lo = Math.min(lo, W - p.x); hi = Math.max(hi, W - p.x); }
    const mid = (lo + hi) / 2, outerRight = mid > hx, far = outerRight ? lo - 1e4 : hi + 1e4;
    placeLabels(g, items, far, outerRight ? hi - far : far - lo, "hand" + i + ":", far);
  });
}

/* ---------------------------- quiz ---------------------------- */
const quiz = { active: false, order: [], i: 0, score: 0, target: null, revealUntil: 0, locked: false };
function quizText() {
  if (!quiz.active) return;
  if (quiz.done) { $("quizq").textContent = t("q.done"); $("quizs").textContent = t("q.score") + ": " + quiz.score + " / " + quiz.order.length + " · " + t("q.again"); return; }
  $("quizq").textContent = t("q.find") + ": " + tl(quiz.target);
  $("quizs").textContent = t("q.score") + ": " + quiz.score + " / " + quiz.i + " · " + t("q.tap");
}
async function toggleQuiz() {
  if (quiz.active) return endQuiz();
  if (mode === "idle") startOrbit();
  Object.assign(S, { skull: true, brain: true, muscles: true, eyes: true, look: "xray", reveal: "whole", labels: false }); applyLook(); syncUI();
  const names = A.meta.labels.map(l => l.t).sort(() => Math.random() - 0.5).slice(0, 8);
  Object.assign(quiz, { active: true, done: false, order: names, i: 0, score: 0, target: names[0], revealUntil: 0, locked: false });
  $("quizbar").hidden = false; setKey($("quiz").firstElementChild, "btn.quizstop"); $("quiz").classList.add("on"); quizText();
}
function endQuiz() {
  quiz.active = false; $("quizbar").hidden = true; setKey($("quiz").firstElementChild, "btn.quiz"); $("quiz").classList.remove("on");
}
function quizAnswer(x, y) {
  if (!quiz.active || quiz.done || quiz.locked || !head.found) return;
  const items = headLabels(null, true);
  let best = null, bd = 1e9;
  for (const it of items) { const d = Math.hypot(it.ax - x, it.ay - y); if (d < bd) { bd = d; best = it; } }
  if (!best || bd > 52) return;
  quiz.locked = true;
  const ok = best.name === quiz.target;
  if (ok) { quiz.score++; toast(t("q.right"), "ok", 700); } else { toast(t("q.wrong"), "bad", 1300); quiz.revealUntil = performance.now() + 1400; }
  setTimeout(() => {
    quiz.i++;
    if (quiz.i >= quiz.order.length) quiz.done = true; else quiz.target = quiz.order[quiz.i];
    quiz.locked = false; quizText();
  }, ok ? 700 : 1500);
}
function drawQuizRing(g, now) {
  if (!quiz.active || quiz.done || now > quiz.revealUntil) return;
  const it = headLabels(null, true).find(i => i.name === quiz.target); if (!it) return;
  g.strokeStyle = "#5ee6a0"; g.lineWidth = 3; g.beginPath(); g.arc(it.ax, it.ay, 16 + 4 * Math.sin(now / 90), 0, 6.3); g.stroke();
}

/* ---------------------------- render ---------------------------- */
function render(now, faceLms, hands, sides) {
  const sg = $("shade").getContext("2d"); sg.setTransform(DPR, 0, 0, DPR, 0, 0); sg.clearRect(0, 0, W, H);
  const solid = S.look === "solid";
  rigs.forEach((rig, i) => {
    const lms = hands[i];
    if (lms && S.hands) {
      poseHand(rig, lms, sides[i]); drawHandVeil(sg, lms, (1 - S.real) * 0.92);
      for (const m of [rig.palm, ...rig.bones]) {
        const u = m.material.uniforms;
        u.uGain.value = solid ? Math.min(1.25, 0.6 + 0.4 * S.bright) : S.bright * 1.15;
        u.uEdge.value = S.soft * 0.75; u.uTime.value = now / 1000; u.uScan.value = 0;
      }
    } else rig.group.visible = false;
  });
  if (!head.found) headGroup.visible = false;
  applyLayers(now);

  let mask = "none", lens = null;
  if (S.reveal === "lens") {
    const r = (0.07 + 0.38 * S.cut) * W; let cx, cy;
    if (hands[0]) { cx = hands[0][8].x * W; cy = hands[0][8].y * H; }
    else if (pointer) { cx = W - pointer.x; cy = pointer.y; }
    else if (faceLms) { cx = faceLms[1].x * W; cy = faceLms[1].y * H; }
    else { cx = W / 2; cy = H / 2; }
    mask = `radial-gradient(circle ${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px,#000 ${(98 - 78 * S.soft).toFixed(0)}%,transparent 100%)`;
    lens = { x: W - cx, y: cy, r, ux: cx };
  }
  for (const id of ["gl", "shade"]) { $(id).style.maskImage = mask; $(id).style.webkitMaskImage = mask; }

  renderer.clear(); renderer.render(headScene, camP);
  renderer.clearDepth(); renderer.render(handScene, camO);

  const g = $("hud").getContext("2d"); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
  if (lens) { g.strokeStyle = "rgba(94,225,255,.85)"; g.lineWidth = 2; g.beginPath(); g.arc(lens.x, lens.y, lens.r, 0, 6.3); g.stroke(); }
  if (S.labels) drawLabels(g, lens);
  drawQuizRing(g, now);
  if (S.dots) {
    if (faceLms) { g.fillStyle = "rgba(120,255,170,.85)"; for (const p of faceLms) g.fillRect((1 - p.x) * W - 1, p.y * H - 1, 2, 2); }
    g.strokeStyle = "rgba(255,183,3,.9)"; g.fillStyle = "#ffb703"; g.lineWidth = 1.5;
    for (const lms of hands) {
      for (const c of [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [5, 9, 10, 11, 12], [9, 13, 14, 15, 16], [13, 17, 18, 19, 20], [0, 17]]) {
        g.beginPath(); c.forEach((i, k) => { const x = (1 - lms[i].x) * W, y = lms[i].y * H; k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      }
      for (const p of lms) { g.beginPath(); g.arc((1 - p.x) * W, p.y * H, 3, 0, 6.3); g.fill(); }
    }
  }
  if (wantShot) { wantShot = false; const c = document.createElement("canvas"); c.width = $("gl").width; c.height = $("gl").height; composite(c.getContext("2d"), c, lens); download(c.toDataURL("image/png"), "png"); }
  if (rec) { composite(rec.ctx, rec.c, lens); if (now - rec.shown > 500) { rec.shown = now; const s = Math.floor((now - rec.start) / 1000); $("rectime").textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); } }
}

/* snapshot + recording share one compositor */
function composite(x, c, lens) {
  const k = c.width / W;
  x.fillStyle = "#04060a"; x.fillRect(0, 0, c.width, c.height);
  x.save(); x.translate(c.width, 0); x.scale(-1, 1);
  if ((mode === "live" || mode === "demo") && cam$.videoWidth) x.drawImage(cam$, 0, 0, c.width, c.height);
  if (lens) { x.beginPath(); x.arc(lens.ux * k, lens.y * k, lens.r * k, 0, 6.3); x.clip(); }
  x.drawImage($("shade"), 0, 0, c.width, c.height); x.drawImage($("gl"), 0, 0, c.width, c.height);
  x.restore(); x.drawImage($("hud"), 0, 0, c.width, c.height);
  x.font = `800 ${Math.round(14 * k)}px 'Unbounded','Hind Siliguri',system-ui,sans-serif`; x.textBaseline = "bottom"; x.fillStyle = "rgba(255,255,255,.9)";
  x.shadowColor = "#000"; x.shadowBlur = 8 * k; x.fillText("KANKAL · কঙ্কাল", 14 * k, c.height - 12 * k); x.shadowBlur = 0;
}
function download(url, ext) { const a = document.createElement("a"); a.download = "kankal-" + Date.now() + "." + ext; a.href = url; a.click(); }
function toggleRec() {
  if (rec) { rec.mr.stop(); return; }
  if (!window.MediaRecorder || mode === "idle") { if (!window.MediaRecorder) toast(t("toast.nomedia"), "bad"); return; }
  const c = document.createElement("canvas"); c.width = $("gl").width; c.height = $("gl").height;
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find(m => MediaRecorder.isTypeSupported(m));
  const mr = new MediaRecorder(c.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : undefined), chunks = [];
  mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  mr.onstop = () => {
    const ext = (mr.mimeType || mime || "").includes("mp4") ? "mp4" : "webm";
    download(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || mime })), ext);
    rec = null; $("recdot").hidden = true; setKey($("rec").firstElementChild, "btn.rec"); $("rec").classList.remove("on"); toast(t("s.saved"), "ok");
  };
  rec = { mr, c, ctx: c.getContext("2d"), start: performance.now(), shown: 0 };
  mr.start(); $("recdot").hidden = false; $("rectime").textContent = "0:00"; setKey($("rec").firstElementChild, "btn.recstop"); $("rec").classList.add("on");
}

/* ---------------------------- trackers + loops ---------------------------- */
async function pick(urls) {
  try { const r = await fetch(urls[0], { method: "HEAD" }); if (r.ok && !(r.headers.get("content-type") || "").includes("html")) return urls[0]; } catch {}
  return urls[1];
}
async function loadTrackers() {
  let vision, wasm;
  try { vision = await import("../vendor/tasks-vision/vision_bundle.mjs"); wasm = new URL("../vendor/tasks-vision/wasm", import.meta.url).href; }
  catch { vision = await import(MP_CDN + "/vision_bundle.mjs"); wasm = MP_CDN + "/wasm"; }
  const files = await vision.FilesetResolver.forVisionTasks(wasm);
  const [faceUrl, handUrl] = await Promise.all([pick(MODELS.face), pick(MODELS.hand)]);
  const make = async (Cls, path, extra) => {
    for (const delegate of ["GPU", "CPU"]) {
      try { return await Cls.createFromOptions(files, { baseOptions: { modelAssetPath: path, delegate }, runningMode: "VIDEO", ...extra }); }
      catch (e) { if (delegate === "CPU") throw e; }
    }
  };
  faceTracker = await make(vision.FaceLandmarker, faceUrl, { numFaces: 1, outputFacialTransformationMatrixes: true, outputFaceBlendshapes: true });
  try { handTracker = await make(vision.HandLandmarker, handUrl, { numHands: 2 }); } catch { handTracker = null; }   // the head still works without hands
}

function liveLoop(myToken) {
  let lastT = -1, lostAt = 0;
  (function frame() {
    if (myToken !== token) return;
    requestAnimationFrame(frame);
    if (cam$.readyState < 2 || cam$.currentTime === lastT) return;
    lastT = cam$.currentTime;
    const now = performance.now();
    let faceLms = null, hands = [], sides = [];
    try {
      const fr = faceTracker.detectForVideo(cam$, now);
      faceLms = fr.faceLandmarks && fr.faceLandmarks[0];
      const mat = fr.facialTransformationMatrixes && fr.facialTransformationMatrixes[0];
      if (faceLms && mat) {
        let jaw = 0, bl = 0, bn = 0; const bs = fr.faceBlendshapes && fr.faceBlendshapes[0];
        if (bs) for (const c of bs.categories) {
          if (c.categoryName === "jawOpen") jaw = c.score;
          else if (c.categoryName === "eyeBlinkLeft" || c.categoryName === "eyeBlinkRight") { bl += c.score; bn++; }
        }
        poseHead(mat.data, faceLms, jaw, bn ? bl / bn : 0, now); lostAt = 0;
      } else { faceLms = null; if (!lostAt) lostAt = now; if (now - lostAt > 250) head.found = false; }
      if (handTracker && (S.hands || S.reveal === "lens" || S.dots || S.gesture)) {
        const hr = handTracker.detectForVideo(cam$, now);
        hands = hr.landmarks || [];
        const hd = hr.handedness || hr.handednesses || [];
        sides = hands.map((h, i) => !!(hd[i] && hd[i][0] && hd[i][0].categoryName === "Left"));     // the tracker assumes a mirrored picture; ours isn't
      }
    } catch (e) { setStatus("s.err", "bad", e.message); return; }
    handleGesture(hands, now);
    if (head.found) setStatus(hands.length ? "s.trackh" : "s.track", "ok");
    else setStatus(hands.length ? "s.hand" : "s.noface", hands.length ? "ok" : "bad");
    render(now, faceLms, hands, sides);
  })();
}
function orbitLoop(myToken) {
  (function frame(now) {
    if (myToken !== token) return;
    requestAnimationFrame(frame);
    poseOrbit(now); render(now, null, [], []);
  })(performance.now());
}

/* ---------------------------- start / stop ---------------------------- */
function showRunning() { $("intro").hidden = true; $("dock").hidden = false; $("stop").hidden = false; }
export async function startCamera() {
  if (!built || mode === "live") return;
  stopAll(true);
  const my = ++token; let step = "camera";
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("camera needs https or localhost, in Chrome / Edge / Safari");
    setStatus("s.asking");
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    if (my !== token) return;
    cam$.srcObject = stream; await cam$.play();
    if (cam$.videoWidth && cam$.videoHeight) stage.style.setProperty("--ar", (cam$.videoWidth / cam$.videoHeight).toFixed(4));
    mode = "live"; showRunning(); fit();
    step = "trackers"; setStatus("s.ltr");
    await (trackersP || (trackersP = loadTrackers()));
    if (my !== token) return;
    if (!handTracker) document.querySelector('[data-layer="hands"]').hidden = true;
    fit(); head.found = false; liveLoop(my);
  } catch (err) {
    trackersP = null; stopAll();
    const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
    setStatus(denied ? "s.blocked" : "s.err", "bad", denied ? "" : (step + ": " + (err && err.message || err)));
  }
}
export function startOrbit() {
  if (!built || mode === "orbit") return;
  stopAll(true);
  const my = ++token; mode = "orbit"; head.found = false; showRunning(); $("stage").style.setProperty("--ar", "1.7778");
  fit(); setStatus("s.orbit", "ok"); orbitLoop(my);
}
export function startDemo() {   // test scene, no camera or trackers needed (open the page with #demo)
  const my = ++token; mode = "demo"; showRunning(); head.found = false; setStatus("s.demo", "ok"); fit();
  const base = A.meta.demoHand, c = base[9], ids = FIT();
  (function frame() {
    if (my !== token) return; requestAnimationFrame(frame);
    const now = performance.now(), tt = now / 1000;
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.06 + 0.05 * Math.sin(tt * 0.7), 0.42 * Math.sin(tt * 0.5 + 0.9), 0.04, "YXZ"));
    m.setPosition(-5 + 2 * Math.sin(tt * 0.4), 1.5, -46);
    const lms = [];
    for (const id of ids) { const v = new THREE.Vector3().fromArray(A.meta.fit[id]).applyMatrix4(m).applyMatrix4(baseProj); lms[id] = { x: (v.x + 1) / 2, y: (1 - v.y) / 2, z: 0 }; }
    poseHead(m.elements, lms, 0.5 + 0.5 * Math.sin(tt * 1.3), Math.pow(Math.max(0, Math.sin(tt * 2.1)), 30), now);
    const k = 0.0021 * H / W * (4 / 3);
    const hand = base.map(p => ({ x: 0.2 - (p[0] - c[0]) * k, y: 0.56 + (p[2] - c[2]) * k * W / H, z: (p[1] - c[1]) * k }));
    render(now, ids.map(id => lms[id]), [hand], [true]);
    window.__frames = (window.__frames || 0) + 1;
  })();
}
export function stopAll(quiet) {
  token++;
  if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; }
  cam$.srcObject = null;
  if (rec) rec.mr.stop();
  if (quiz.active) endQuiz();
  mode = "idle"; head.found = false;
  if (built) { headGroup.visible = false; rigs.forEach(r => { r.group.visible = false; }); }
  for (const id of ["shade", "hud"]) { const c = $(id); c.getContext("2d").clearRect(0, 0, c.width, c.height); }
  if (built) { renderer.clear(); }
  $("dock").hidden = true; $("stop").hidden = true; $("intro").hidden = false; $("quizbar").hidden = true;
  if (!quiet) setStatus("s.ready");
}

export function init(T, Anat) {
  THREE = T; A = Anat; buildEngine(); bindUI();
  onLang(() => { setStatus(...lastStatus); quizText(); syncUI(); });
  setStatus("s.ready");
  if (location.hash === "#demo") startDemo();
}
