// Shared 3D pieces: loading three.js, decoding the anatomy pack, shaders, and the head model builder.
export const HEAD_C = [0, 3.2, -4.8];   // rough centre of the head in model space (cm)
export const BONES = [[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[9,10],[10,11],[11,12],[13,14],[14,15],[15,16],[17,18],[18,19],[19,20]];

export const THEMES = {
  ice:     { name: "Ice",         accent: "#5ee1ff", bone: 0xbfe3ff, line: 0x6fb6ff, hand: 0xd9f0ff },
  matrix:  { name: "Matrix",      accent: "#4dff94", bone: 0xbfffd6, line: 0x39ff88, hand: 0xd2ffe2 },
  thermal: { name: "Thermal",     accent: "#ff8a3d", bone: 0xffd9a8, line: 0xff7a30, hand: 0xffe6c4 },
  violet:  { name: "Ultraviolet", accent: "#b58bff", bone: 0xe3d3ff, line: 0xa066ff, hand: 0xeadfff },
};

export async function loadThree() {
  try { return await import("../vendor/three.module.js"); }
  catch (e) { return await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"); }
}

// A heartbeat curve: a sharp beat, a softer second beat, then rest.
export const heartbeat = t => { const p = (t * 1.15) % 1; return Math.exp(-Math.pow((p - 0.08) * 16, 2)) + 0.55 * Math.exp(-Math.pow((p - 0.3) * 13, 2)); };

export async function loadAnatomy(THREE) {
  const base = new URL("../assets/", import.meta.url);
  const [meta, buf] = await Promise.all([
    fetch(new URL("anatomy.json", base)).then(r => { if (!r.ok) throw new Error("anatomy.json " + r.status); return r.json(); }),
    fetch(new URL("anatomy.bin", base)).then(r => { if (!r.ok) throw new Error("anatomy.bin " + r.status); return r.arrayBuffer(); }),
  ]);
  const geos = {};
  for (const m of meta.meshes) {
    const q = new Uint16Array(buf, m.offV, m.nv * 3), pos = new Float32Array(m.nv * 3);
    for (let i = 0; i < q.length; i++) pos[i] = m.min[i % 3] + q[i] / 65535 * m.size[i % 3];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, m.offI, m.ni).slice(), 1));
    g.computeVertexNormals();
    geos[m.name] = g;
  }
  return { meta, geos };
}

/* ------------------------------ shaders ------------------------------ */
const VERT = `
uniform mat4 uToHead; uniform float uOrtho;
varying vec3 vN, vV, vL;
void main(){
  vL = (uToHead * vec4(position,1.0)).xyz;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vV = uOrtho > 0.5 ? vec3(0.,0.,1.) : normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
uniform vec3 uColor, uSolid; uniform vec4 uClip;
uniform float uOpacity, uGain, uMode, uClipOn, uFade, uEdge, uCutSoft, uTime, uScan, uPulse, uBeat, uSweepY;
varying vec3 vN, vV, vL;
void main(){
  float k = 1.0;
  if (uClipOn > .5){
    float d = dot(uClip.xyz, vL) - uClip.w;
    if (d < 0.) discard;
    if (uCutSoft > .001) k *= smoothstep(0., uCutSoft, d);
  }
  vec3 n = normalize(vN);
  float ndv = abs(dot(n, normalize(vV)));
  if (uEdge > .001) k *= smoothstep(0., uEdge, ndv);
  float fade = uFade > .5 ? smoothstep(-12.4, -9.2, vL.y) : 1.0;
  if (uMode > 1.5){ gl_FragColor = vec4(uColor, uOpacity * fade * k); }
  else if (uMode > .5){
    vec3 fn = gl_FrontFacing ? n : -n;
    float lit = max(dot(fn, normalize(vec3(.35,.55,.76))), 0.);
    float rim = pow(1. - ndv, 2.5);
    gl_FragColor = vec4(uSolid * (.28 + .78*lit) * uGain + vec3(.25)*rim, uOpacity * k);
  } else {
    float rim  = pow(1. - ndv, 2.1);
    float scan = 1.0 + uScan * (0.22 * sin(vL.y * 5.0 - uTime * 2.2));
    float wave = 1.0 + uPulse * 0.9 * pow(max(0., sin(length(vL - vec3(0.,5.,-5.)) * 1.5 - uTime * 2.6)), 6.0);
    float band = 1.0 + 3.0 * exp(-pow((vL.y - uSweepY) * 0.9, 2.0));
    float a = clamp((.035 + .95*rim) * uGain * uOpacity * fade * scan * wave * band * (1.0 + uBeat), 0., 1.);
    gl_FragColor = vec4(uColor, a * k);
  }
}`;

export function makeMat(THREE, xray, solid, mode) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor:{value:new THREE.Color(xray)}, uSolid:{value:new THREE.Color(solid)}, uOpacity:{value:1}, uGain:{value:1},
      uMode:{value:mode||0}, uOrtho:{value:0}, uFade:{value:0}, uEdge:{value:0}, uCutSoft:{value:0}, uTime:{value:0}, uScan:{value:1},
      uPulse:{value:0}, uBeat:{value:0}, uSweepY:{value:-999},
      uClipOn:{value:0}, uClip:{value:new THREE.Vector4(1,0,0,0)}, uToHead:{value:new THREE.Matrix4()} },
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false,
    blending: mode === 2 ? THREE.NormalBlending : THREE.AdditiveBlending });
}

// Twinkling "neuron" sparks scattered inside the brain.
function makeSparks(THREE, geo, n = 240) {
  const src = geo.getAttribute("position"), c = new THREE.Vector3(), tmp = new THREE.Vector3();
  geo.computeBoundingBox(); geo.boundingBox.getCenter(c);
  const pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    tmp.fromBufferAttribute(src, Math.floor(Math.random() * src.count));
    tmp.sub(c).multiplyScalar(0.5 + 0.42 * Math.random()).add(c);
    pos.set([tmp.x, tmp.y, tmp.z], i * 3); ph[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime:{value:0}, uSize:{value:7}, uDPR:{value:1}, uColor:{value:new THREE.Color(0xfff0a8)}, uOpacity:{value:1},
                uClipOn:{value:0}, uClip:{value:new THREE.Vector4(1,0,0,0)} },
    vertexShader: `attribute float aPh; uniform float uTime,uSize,uDPR; varying float vA; varying vec3 vL;
      void main(){ vL=position; vec4 mv=modelViewMatrix*vec4(position,1.);
        float tw=pow(.5+.5*sin(uTime*(2.0+aPh*3.0)+aPh*40.),5.); vA=tw;
        gl_PointSize=uSize*uDPR*(0.5+tw)*clamp(46./-mv.z,.3,4.); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform vec4 uClip; uniform float uClipOn,uOpacity; varying float vA; varying vec3 vL;
      void main(){ if(uClipOn>.5 && dot(uClip.xyz,vL)-uClip.w<0.) discard;
        float r=length(gl_PointCoord-.5)*2.; if(r>1.) discard;
        float a=(1.-r)*(1.-r)*vA*uOpacity; gl_FragColor=vec4(uColor,a); }`,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 6;
  return pts;
}

// Builds the full head: skin veil + outline, muscles, skull, jaw (hinged), eyes, brain, sparks.
export function buildHead(THREE, A, { veil = true, autoUpdate = true } = {}) {
  const { meta, geos } = A;
  const headGroup = new THREE.Group(); headGroup.matrixAutoUpdate = autoUpdate;
  const jawPivot = new THREE.Group(); jawPivot.position.fromArray(meta.jawPivot); headGroup.add(jawPivot);
  const parts = {};
  const put = (name, g, layer, xray, solid, order, parent, mode) => {
    const mesh = new THREE.Mesh(g, makeMat(THREE, xray, solid, mode));
    mesh.renderOrder = order; mesh.frustumCulled = false; (parent || headGroup).add(mesh);
    parts[name] = { mesh, layer, fixed: mode }; return mesh;
  };
  if (veil) put("veil", geos.skin, "veil", 0x04070d, 0x04070d, -10, null, 2).material.uniforms.uFade.value = 1;
  put("outline", geos.skin, "outline", THEMES.ice.line, THEMES.ice.line, 1, null, 0).material.uniforms.uFade.value = 1;
  put("muscles", geos.muscles, "muscles", 0xff6b5e, 0xb5453c, 2);
  put("cranium", geos.cranium, "skull", THEMES.ice.bone, 0xe9e2cf, 3);
  put("jaw", geos.jaw, "skull", THEMES.ice.bone, 0xe9e2cf, 3, jawPivot).position.fromArray(meta.jawPivot).multiplyScalar(-1);
  const eyes = put("eyes", geos.eyes, "eyes", 0xfff3a8, 0xf4f4ee, 4);
  put("cerebrum", geos.cerebrum, "brain", 0xff9fc0, 0xe2a39d, 5).material.uniforms.uPulse.value = 1;
  put("hindbrain", geos.hindbrain, "brain", 0xffc37a, 0xd6ad84, 5).material.uniforms.uPulse.value = 1;
  geos.eyes.computeBoundingBox();
  const eyeCY = (geos.eyes.boundingBox.min.y + geos.eyes.boundingBox.max.y) / 2;
  const sparks = makeSparks(THREE, geos.cerebrum); headGroup.add(sparks);
  return { headGroup, jawPivot, parts, sparks, eyes, eyeCY };
}

export function applyTheme(parts, handMats, key) {
  const th = THEMES[key] || THEMES.ice;
  parts.outline.mesh.material.uniforms.uColor.value.set(th.line);
  parts.cranium.mesh.material.uniforms.uColor.value.set(th.bone);
  parts.jaw.mesh.material.uniforms.uColor.value.set(th.bone);
  for (const m of handMats) m.uniforms.uColor.value.set(th.hand);
  document.documentElement.style.setProperty("--a", th.accent);
}
