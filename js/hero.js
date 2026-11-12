// The big 3D head behind the landing page. It reacts to the mouse and to scroll.
import { HEAD_C, buildHead, heartbeat } from "./anatomy.js";

const BASE = { outline: 0.55, muscles: 0.5, cranium: 1, jaw: 1, eyes: 0.9, cerebrum: 0.36, hindbrain: 0.6 };
const WKEY = { outline: "outline", muscles: "muscles", cranium: "skull", jaw: "skull", eyes: "eyes", cerebrum: "brain", hindbrain: "brain" };
const DIST = 62, FOV = 35;

export function createHero(canvas, THREE, A) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(FOV, 1, 1, 500);
  const H = buildHead(THREE, A, { veil: false, autoUpdate: true });
  H.parts.outline.mesh.material.uniforms.uEdge.value = 0.2;
  const pivot = new THREE.Group(); pivot.position.set(-HEAD_C[0], -HEAD_C[1], -HEAD_C[2]); pivot.add(H.headGroup);
  const root = new THREE.Group(); root.add(pivot); scene.add(root);

  const cur = { x: 0.4, y: 0, s: 1, ry: 0.3, rx: 0, op: 1, w: { outline: 1, muscles: 0.2, skull: 0.85, brain: 0.8, eyes: 1 } };
  let tgt = JSON.parse(JSON.stringify(cur));
  let mx = 0, my = 0, tmx = 0, tmy = 0, halfW = 20, halfH = 20, DPR = 1;
  window.addEventListener("pointermove", e => { tmx = e.clientX / innerWidth * 2 - 1; tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(DPR); renderer.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    halfH = DIST * Math.tan(FOV * Math.PI / 360); halfW = halfH * cam.aspect;
  }
  resize(); window.addEventListener("resize", resize);

  const lerp = (a, b, k) => a + (b - a) * k;
  function frame(now) {
    const k = 0.075, t = now / 1000;
    for (const key of ["x", "y", "s", "ry", "rx", "op"]) cur[key] = lerp(cur[key], tgt[key], k);
    for (const key in cur.w) cur.w[key] = lerp(cur.w[key], tgt.w[key], 0.12);
    mx = lerp(mx, tmx, 0.06); my = lerp(my, tmy, 0.06);
    canvas.style.opacity = Math.max(0, Math.min(1, cur.op)).toFixed(3);
    if (cur.op < 0.02) return;

    root.position.set(cur.x * halfW, cur.y * halfH, -DIST);
    root.scale.setScalar(cur.s);
    root.rotation.set(cur.rx + my * 0.16 + 0.04 * Math.sin(t * 0.7), cur.ry + mx * 0.5 + 0.12 * Math.sin(t * 0.4), 0, "YXZ");
    H.jawPivot.rotation.x = (0.5 + 0.5 * Math.sin(t * 0.9)) * 0.1 * (Math.sin(t * 0.25) > 0.6 ? 1 : 0.2);

    const beat = 0.12 * heartbeat(t), tm = t % 9, sweep = tm < 4.5 ? 13 - tm / 4.5 * 27 : -999;
    for (const name in H.parts) {
      const { mesh } = H.parts[name], u = mesh.material.uniforms, w = cur.w[WKEY[name]];
      mesh.visible = w > 0.015;
      u.uGain.value = BASE[name] * w * (innerWidth < 820 ? 0.55 : 0.8); u.uTime.value = t; u.uBeat.value = beat; u.uSweepY.value = sweep;
    }
    const su = H.sparks.material.uniforms;
    H.sparks.visible = cur.w.brain > 0.05; su.uTime.value = t; su.uDPR.value = DPR; su.uOpacity.value = Math.min(1, cur.w.brain * 1.2);
    renderer.render(scene, cam);
  }
  return { frame, resize, setTarget: s => { tgt = s; }, snap: () => { Object.assign(cur, tgt, { w: { ...tgt.w } }); }, current: cur, setAccent() {} };
}
