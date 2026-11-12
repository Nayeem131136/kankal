// English / Bangla strings. Elements use data-i18n="key"; code uses t("key").
const EN = {
  "nav.layers": "Layers", "nav.features": "Features", "nav.how": "How it works", "nav.mirror": "Mirror", "nav.privacy": "Privacy", "nav.cta": "Launch",
  "hero.kicker": "LIVE ANATOMY · RIGHT IN YOUR BROWSER",
  "hero.tag": "See your own skeleton. Live.",
  "hero.desc": "Point your webcam at yourself. Kankal pins a real 3D skull, brain, muscles and hand bones onto you in real time. Nothing is uploaded anywhere.",
  "hero.cta1": "Launch the mirror", "hero.cta2": "Explore in 3D", "hero.scroll": "Scroll to peel the layers",
  "stat.1": "labelled parts", "stat.2": "hands tracked", "stat.3": "bytes uploaded",
  "mq": "Frontal bone · Masseter · Cerebellum · Mandible · Zygomatic bone · Temporal lobe · Orbicularis oculi · Metacarpal · Occipital bone · Pons · ",
  "layers.title": "Peel yourself, one layer at a time",
  "layers.s0.t": "Surface", "layers.s0.d": "Your outline, the part a camera sees. Everything else hides just beneath it.",
  "layers.s1.t": "Muscles", "layers.s1.d": "Frontalis, masseter, orbicularis. The expressions you make all day, pulling on bone.",
  "layers.s2.t": "Skull", "layers.s2.d": "The bony frame that protects your brain, with a hinged jaw that opens when you speak.",
  "layers.s3.t": "Brain", "layers.s3.d": "Cerebrum, cerebellum and brainstem, with signals firing. Illustrative, not a scan of you.",
  "feat.title": "Everything a skeleton mirror should do",
  "f1.t": "Live face tracking", "f1.d": "Hundreds of face points follow every turn, nod and tilt of your head.",
  "f2.t": "Hand bone X-ray", "f2.d": "Hold up a hand and watch every bone move with your fingers.",
  "f3.t": "Moving jaw and blinking", "f3.d": "Open your mouth and the jaw opens. Blink and the eyes blink with you.",
  "f4.t": "Reveal modes", "f4.d": "Cut the head in half, scan top to bottom, or use your fingertip as an X-ray lens.",
  "f5.t": "Two languages", "f5.d": "Every part named in English and বাংলা. Switch any time.",
  "f6.t": "Quiz mode", "f6.d": "\"Find the masseter.\" Tap the right part, build a streak, learn anatomy.",
  "f7.t": "Record and share", "f7.d": "Save snapshots or video with a Kankal watermark, ready to post.",
  "f8.t": "Gesture control", "f8.d": "Close an open palm into a fist to cycle skull, brain and muscles.",
  "f9.t": "Private by design", "f9.d": "Everything runs on your device. No account, no upload, no tracking.",
  "how.title": "Three steps",
  "how.1.t": "Allow the camera", "how.1.d": "Your browser asks once. Video stays on your device.",
  "how.2.t": "Face the light", "how.2.d": "Sit about an arm's length away with light on your face.",
  "how.3.t": "Peel, cut, quiz", "how.3.d": "Toggle layers, slice the head, hold up a hand, or take the quiz.",
  "mirror.title": "The Mirror", "mirror.sub": "Start your camera, or explore the 3D model without one.",
  "intro.p": "See the skull, brain and muscles inside your own head, tracked live. Hold up a hand to see its bones.",
  "intro.real": "Not a real X-ray: a generic 3D anatomy model fitted to you, for learning and fun.",
  "intro.priv": "Everything runs in your browser. Your video never leaves your device.",
  "btn.camera": "Start camera", "btn.explore": "Explore in 3D", "btn.stop": "Stop", "btn.shot": "Snapshot", "btn.rec": "Record", "btn.recstop": "Stop recording",
  "btn.full": "Fullscreen", "btn.quiz": "Quiz mode", "btn.quizstop": "End quiz", "btn.reset": "Reset all",
  "dock.skull": "Skull", "dock.brain": "Brain", "dock.muscles": "Muscles", "dock.eyes": "Eyes", "dock.hands": "Hands", "dock.labels": "Labels",
  "p.presets": "Presets", "p.skull": "Skull", "p.brain": "Brain", "p.muscles": "Muscles", "p.all": "All",
  "p.look": "Look", "p.xray": "X-ray", "p.solid": "Solid", "p.bright": "Brightness", "p.real": "Real me showing", "p.soft": "Edge softness", "p.outline": "Head outline",
  "p.theme": "Colour theme",
  "p.reveal": "Reveal", "p.mode": "Mode", "p.cut": "Cut position", "p.lens": "Lens size",
  "r.whole": "Whole head", "r.left": "Left half only", "r.right": "Right half only", "r.top": "Top of head only", "r.bottom": "Lower face only",
  "r.sweep": "Scanner sweep (auto)", "r.lens": "X-ray lens (follows fingertip)",
  "p.alive": "Alive effects", "p.sparks": "Neuron sparks and brain pulse", "p.beat": "Heartbeat glow", "p.blink": "Blink and jaw follow me",
  "p.gesture": "Gesture control (palm to fist)", "p.dots": "Show tracking points",
  "p.fit": "Fit to my head", "fit.size": "Size", "fit.w": "Width", "fit.h": "Height", "fit.d": "Depth", "fit.x": "Left / right", "fit.y": "Up / down", "fit.z": "Forward / back",
  "fit.tip": "Tip: switch to Solid, set \"Real me showing\" to about half, then line the skull up with your face.",
  "note.1": "The anatomy is a 3D dataset of one adult, scaled and pinned to your head. It shows where structures typically sit. It is not a scan of you and not a medical tool.",
  "note.2": "Anatomy models: BodyParts3D, © The Database Center for Life Science, licensed under CC BY-SA 2.1 Japan; simplified and re-aligned. Tracking: Google MediaPipe (Apache 2.0). 3D: three.js (MIT).",
  "note.3": "Anatomy pack adapted from X-Ray Mirror by masterofvfx2070.",
  "s.ready": "Ready", "s.asking": "Asking for the camera…", "s.l3d": "Loading 3D anatomy…", "s.ltr": "Loading face and hand trackers (a few seconds the first time)…",
  "s.track": "Tracking", "s.trackh": "Tracking · hand bones on", "s.hand": "Hand found. Face the camera too.", "s.noface": "No face found. Face the camera with light on your face.",
  "s.orbit": "3D explorer · drag to rotate, scroll to zoom", "s.demo": "Demo scene (no camera)",
  "s.blocked": "Camera blocked. Allow it for this page, then click Start again.", "s.err": "Could not start",
  "s.rec": "Recording", "s.saved": "Saved",
  "q.find": "Find", "q.score": "Score", "q.right": "Correct!", "q.wrong": "Not quite, that one is here", "q.done": "Quiz finished", "q.again": "Press Quiz mode to play again.", "q.tap": "Tap the part on the model",
  "g.next": "Layer", "toast.nomedia": "Recording is not supported in this browser",
};
const BN = {
  "nav.layers": "লেয়ার", "nav.features": "ফিচার", "nav.how": "কীভাবে কাজ করে", "nav.mirror": "আয়না", "nav.privacy": "গোপনীয়তা", "nav.cta": "শুরু করো",
  "hero.kicker": "লাইভ অ্যানাটমি · সরাসরি তোমার ব্রাউজারে",
  "hero.tag": "নিজের কঙ্কাল দেখো। লাইভ।",
  "hero.desc": "ওয়েবক্যামটা নিজের দিকে ধরো। কঙ্কাল রিয়েল-টাইমে তোমার মুখে বসিয়ে দেয় আসল ৩ডি খুলি, মস্তিষ্ক, পেশি আর হাতের হাড়। কিছুই কোথাও আপলোড হয় না।",
  "hero.cta1": "আয়না চালু করো", "hero.cta2": "৩ডি-তে ঘুরে দেখো", "hero.scroll": "স্ক্রল করে স্তর খোলো",
  "stat.1": "চিহ্নিত অংশ", "stat.2": "হাত ট্র্যাক হয়", "stat.3": "বাইট আপলোড",
  "mq": "ফ্রন্টাল অস্থি · ম্যাসেটার · সেরিবেলাম · ম্যান্ডিবল · গালের হাড় · টেম্পোরাল লোব · চোখের পেশি · মেটাকার্পাল · অক্সিপিটাল অস্থি · পনস · ",
  "layers.title": "নিজেকে খোলো, এক এক স্তরে",
  "layers.s0.t": "ত্বকের রেখা", "layers.s0.d": "তোমার বাইরের আকার, যেটুকু ক্যামেরা দেখে। বাকি সব এর ঠিক নিচে লুকিয়ে আছে।",
  "layers.s1.t": "পেশি", "layers.s1.d": "ফ্রন্টালিস, ম্যাসেটার, চোখ-মুখের বৃত্তাকার পেশি। সারাদিন যত ভাব-ভঙ্গি করো, সব এদের কাজ।",
  "layers.s2.t": "খুলি", "layers.s2.d": "মস্তিষ্ক বাঁচায় যে হাড়ের কাঠামো, আর কথা বললে যে চোয়াল খোলে।",
  "layers.s3.t": "মস্তিষ্ক", "layers.s3.d": "সেরিব্রাম, সেরিবেলাম আর ব্রেনস্টেম, সংকেত জ্বলছে। এটা বোঝানোর জন্য, তোমার স্ক্যান নয়।",
  "feat.title": "কঙ্কাল-আয়নায় যা যা থাকা দরকার",
  "f1.t": "লাইভ মুখ ট্র্যাকিং", "f1.d": "শত শত পয়েন্ট তোমার প্রতিটা ঘোরানো, ঝোঁকানো আর কাত করা অনুসরণ করে।",
  "f2.t": "হাতের হাড়ের এক্স-রে", "f2.d": "হাত তুললেই দেখো আঙুলের সঙ্গে প্রতিটা হাড় নড়ছে।",
  "f3.t": "নড়ন্ত চোয়াল আর পলক", "f3.d": "মুখ খুললে চোয়াল খোলে। চোখ পিটপিট করলে মডেলের চোখও করে।",
  "f4.t": "রিভিল মোড", "f4.d": "মাথা অর্ধেক করে কাটো, ওপর থেকে নিচে স্ক্যান করো, বা আঙুলের ডগাকেই এক্স-রে লেন্স বানাও।",
  "f5.t": "দুই ভাষা", "f5.d": "প্রতিটা অংশের নাম English আর বাংলায়। যখন খুশি বদলাও।",
  "f6.t": "কুইজ মোড", "f6.d": "\"ম্যাসেটার খুঁজে বের করো।\" ঠিক অংশে ট্যাপ করো, স্ট্রিক বানাও, অ্যানাটমি শেখো।",
  "f7.t": "রেকর্ড আর শেয়ার", "f7.d": "কঙ্কাল ওয়াটারমার্ক সহ স্ন্যাপশট বা ভিডিও সেভ করো, পোস্টের জন্য তৈরি।",
  "f8.t": "জেসচার কন্ট্রোল", "f8.d": "খোলা হাত মুঠো করলেই খুলি, মস্তিষ্ক আর পেশির মধ্যে স্তর বদলে যায়।",
  "f9.t": "প্রাইভেসি আগে", "f9.d": "সব কাজ তোমার ডিভাইসেই হয়। অ্যাকাউন্ট নেই, আপলোড নেই, ট্র্যাকিং নেই।",
  "how.title": "তিন ধাপ",
  "how.1.t": "ক্যামেরা চালু দাও", "how.1.d": "ব্রাউজার একবার অনুমতি চাইবে। ভিডিও তোমার ডিভাইসেই থাকে।",
  "how.2.t": "আলোর দিকে মুখ করো", "how.2.d": "হাতখানেক দূরে বসো, মুখে যেন আলো পড়ে।",
  "how.3.t": "খোলো, কাটো, কুইজ দাও", "how.3.d": "স্তর অন-অফ করো, মাথা কাটো, হাত তোলো, বা কুইজ খেলো।",
  "mirror.title": "আয়না", "mirror.sub": "ক্যামেরা চালু করো, অথবা ক্যামেরা ছাড়াই ৩ডি মডেল ঘুরে দেখো।",
  "intro.p": "নিজের মাথার ভেতরের খুলি, মস্তিষ্ক আর পেশি লাইভ দেখো। হাত তুললে হাতের হাড়ও দেখা যাবে।",
  "intro.real": "আসল এক্স-রে নয়: তোমার সঙ্গে মেলানো সাধারণ ৩ডি অ্যানাটমি মডেল, শেখা আর মজার জন্য।",
  "intro.priv": "সবকিছু তোমার ব্রাউজারেই চলে। ভিডিও কখনো তোমার ডিভাইস ছাড়ে না।",
  "btn.camera": "ক্যামেরা চালু করো", "btn.explore": "৩ডি-তে ঘুরে দেখো", "btn.stop": "বন্ধ করো", "btn.shot": "স্ন্যাপশট", "btn.rec": "রেকর্ড", "btn.recstop": "রেকর্ড বন্ধ",
  "btn.full": "ফুলস্ক্রিন", "btn.quiz": "কুইজ মোড", "btn.quizstop": "কুইজ শেষ", "btn.reset": "সব রিসেট",
  "dock.skull": "খুলি", "dock.brain": "মস্তিষ্ক", "dock.muscles": "পেশি", "dock.eyes": "চোখ", "dock.hands": "হাত", "dock.labels": "নাম",
  "p.presets": "প্রিসেট", "p.skull": "খুলি", "p.brain": "মস্তিষ্ক", "p.muscles": "পেশি", "p.all": "সব",
  "p.look": "লুক", "p.xray": "এক্স-রে", "p.solid": "সলিড", "p.bright": "উজ্জ্বলতা", "p.real": "আসল আমি কতটা দেখা যাবে", "p.soft": "কিনারা নরম", "p.outline": "মাথার রেখা",
  "p.theme": "রঙের থিম",
  "p.reveal": "রিভিল", "p.mode": "মোড", "p.cut": "কাটার জায়গা", "p.lens": "লেন্সের মাপ",
  "r.whole": "পুরো মাথা", "r.left": "শুধু বাঁ দিক", "r.right": "শুধু ডান দিক", "r.top": "শুধু মাথার ওপর", "r.bottom": "শুধু মুখের নিচ",
  "r.sweep": "স্ক্যানার সুইপ (অটো)", "r.lens": "এক্স-রে লেন্স (আঙুলের ডগা ধরে)",
  "p.alive": "জীবন্ত ইফেক্ট", "p.sparks": "নিউরন স্পার্ক আর মস্তিষ্কের স্পন্দন", "p.beat": "হার্টবিট গ্লো", "p.blink": "পলক আর চোয়াল আমাকে অনুসরণ করুক",
  "p.gesture": "জেসচার কন্ট্রোল (খোলা হাত থেকে মুঠো)", "p.dots": "ট্র্যাকিং পয়েন্ট দেখাও",
  "p.fit": "আমার মাথার সঙ্গে মেলাও", "fit.size": "মাপ", "fit.w": "প্রস্থ", "fit.h": "উচ্চতা", "fit.d": "গভীরতা", "fit.x": "বাঁ / ডান", "fit.y": "ওপর / নিচ", "fit.z": "সামনে / পিছনে",
  "fit.tip": "টিপ: সলিড বেছে \"আসল আমি\" প্রায় অর্ধেক করো, তারপর খুলিটা মুখের সঙ্গে মেলাও।",
  "note.1": "এই অ্যানাটমি একজন প্রাপ্তবয়স্কের ৩ডি ডেটাসেট, তোমার মাথার মাপে বসানো। অংশগুলো সাধারণত কোথায় থাকে সেটাই দেখায়। এটা তোমার স্ক্যান নয়, চিকিৎসার যন্ত্রও নয়।",
  "note.2": "অ্যানাটমি মডেল: BodyParts3D, © The Database Center for Life Science, CC BY-SA 2.1 Japan লাইসেন্সে; সহজ ও পুনঃসাজানো। ট্র্যাকিং: Google MediaPipe (Apache 2.0)। ৩ডি: three.js (MIT)।",
  "note.3": "অ্যানাটমি প্যাক masterofvfx2070-এর X-Ray Mirror থেকে নেওয়া ও রূপান্তরিত।",
  "s.ready": "প্রস্তুত", "s.asking": "ক্যামেরার অনুমতি চাওয়া হচ্ছে…", "s.l3d": "৩ডি অ্যানাটমি লোড হচ্ছে…", "s.ltr": "মুখ আর হাতের ট্র্যাকার লোড হচ্ছে (প্রথমবার কয়েক সেকেন্ড লাগে)…",
  "s.track": "ট্র্যাক হচ্ছে", "s.trackh": "ট্র্যাক হচ্ছে · হাতের হাড় চালু", "s.hand": "হাত পাওয়া গেছে। ক্যামেরার দিকে মুখও করো।", "s.noface": "মুখ পাওয়া যায়নি। ক্যামেরার দিকে তাকাও, মুখে আলো রাখো।",
  "s.orbit": "৩ডি এক্সপ্লোরার · টেনে ঘোরাও, স্ক্রলে জুম", "s.demo": "ডেমো দৃশ্য (ক্যামেরা ছাড়া)",
  "s.blocked": "ক্যামেরা ব্লক করা। এই পেজের জন্য অনুমতি দিয়ে আবার চালু করো।", "s.err": "চালু করা যায়নি",
  "s.rec": "রেকর্ড হচ্ছে", "s.saved": "সেভ হয়েছে",
  "q.find": "খুঁজে বের করো", "q.score": "স্কোর", "q.right": "ঠিক!", "q.wrong": "হয়নি, ওটা এখানে", "q.done": "কুইজ শেষ", "q.again": "আবার খেলতে কুইজ মোড চাপো।", "q.tap": "মডেলের ঠিক অংশে ট্যাপ করো",
  "g.next": "স্তর", "toast.nomedia": "এই ব্রাউজারে রেকর্ড চলে না",
};
// Anatomy label names, keyed by the English name stored in the dataset.
const LABEL_BN = {
  "Frontal bone": "ফ্রন্টাল অস্থি (কপাল)", "Parietal bone": "প্যারাইটাল অস্থি", "Temporal bone": "টেম্পোরাল অস্থি", "Occipital bone": "অক্সিপিটাল অস্থি",
  "Nasal bone": "নাসা অস্থি", "Zygomatic bone (cheekbone)": "গালের হাড় (জাইগোমেটিক)", "Maxilla (upper jaw)": "ঊর্ধ্ব চোয়াল (ম্যাক্সিলা)",
  "Teeth": "দাঁত", "Mandible (lower jaw)": "নিম্ন চোয়াল (ম্যান্ডিবল)", "Eyeball": "অক্ষিগোলক (চোখ)",
  "Frontal lobe": "ফ্রন্টাল লোব", "Parietal lobe": "প্যারাইটাল লোব", "Temporal lobe": "টেম্পোরাল লোব", "Occipital lobe": "অক্সিপিটাল লোব",
  "Cerebellum": "সেরিবেলাম (অনুমস্তিষ্ক)", "Pons (brainstem)": "পনস (ব্রেনস্টেম)", "Medulla oblongata": "মেডুলা অবলংগেটা",
  "Frontalis": "ফ্রন্টালিস পেশি", "Temporalis": "টেম্পোরালিস পেশি", "Orbicularis oculi": "চোখের বৃত্তাকার পেশি", "Nasalis": "নাসালিস পেশি",
  "Zygomaticus major": "জাইগোমেটিকাস মেজর (হাসির পেশি)", "Masseter": "ম্যাসেটার (চিবানোর পেশি)", "Orbicularis oris": "মুখের বৃত্তাকার পেশি",
  "Depressor anguli oris": "ডিপ্রেসর অ্যাঙ্গুলি ওরিস", "Mentalis": "মেন্টালিস (থুতনির পেশি)",
  "Distal phalanx": "ডিস্টাল ফ্যালানক্স (ডগার হাড়)", "Middle phalanx": "মধ্য ফ্যালানক্স", "Proximal phalanx": "প্রক্সিমাল ফ্যালানক্স",
  "Metacarpal": "মেটাকার্পাল (করতলের হাড়)", "Carpal bones (wrist)": "কার্পাল (কব্জির হাড়)",
};

const DICT = { en: EN, bn: BN };
let lang = "en";
try { lang = (navigator.language || "").toLowerCase().startsWith("bn") ? "bn" : "en"; } catch {}
try { const s = localStorage.getItem("kankal_lang"); if (s === "bn" || s === "en") lang = s; } catch {}
const subs = new Set();

export const getLang = () => lang;
export const t = (k, v) => { let s = (DICT[lang] && DICT[lang][k]) || EN[k] || k; if (v) for (const x in v) s = s.replace("{" + x + "}", v[x]); return s; };
export const tl = name => (lang === "bn" && LABEL_BN[name]) || name;
export const onLang = fn => { subs.add(fn); };

export function applyDom() {
  document.documentElement.lang = lang;
  document.body.classList.toggle("bn", lang === "bn");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
}
export function setLang(l) {
  lang = l; try { localStorage.setItem("kankal_lang", l); } catch {}
  applyDom(); subs.forEach(fn => fn(l));
}
