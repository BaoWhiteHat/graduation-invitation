import { clamp, ease, flightPath, lerp, monotoneCurve, pulseAt, range } from './motion.js';
import { alertLayout } from './alert-layout.js';

// One timeline, in seconds from the moment the link is tapped. Every moving thing
// below is a pure function of `t`, so skip, replay and seeking can never drift apart.
export const T = {
  collapseStart: 0.5,
  hack: 0.9,
  alert: 5.6,
  mascot: 11.0,
  lunge: 13.95,
  pull: 14.2,
  yank: 14.55,
  reveal: 17.5,
  flight: 20.6,
  flightLength: 4.6,
  release: 23.4,
  fall: 3.8,
  grad: 27.4,
  ticket: 29.4
};

// Hacker terminal, laid out in real seconds so it reads at a human pace: each line types at a
// steady 24 characters per second, then holds long enough to read before the next one starts.
const TERM_SCRIPT = [
  { text: '$ sudo hack --muc-tieu "{call}"', tag: 'OK', tone: 'ok' },
  { text: '> vượt tường lửa…', tag: 'XONG', tone: 'ok' },
  { text: '> truy cập camera trước… 📸', tag: 'ĐÃ BẬT', tone: 'danger' },
  { text: '> bẻ khóa mật khẩu… là "123456" 🤦', tag: 'XONG', tone: 'ok' },
  { text: '> tìm thấy 4.269 ảnh selfie', tag: '😳', tone: 'warn' },
  { text: '> đọc ghi chú: "deadline 3h sáng"', tag: 'ĐAU', tone: 'warn' },
  { text: '> 37 file "final_final_that_su_final.docx"', tag: 'TRỜI', tone: 'warn' },
  { text: '$ tải hết lên máy chủ…', tag: 'XONG', tone: 'ok' }
];
const TERM_END = 4.45; // design time where the terminal hands over to the "access granted" banner
const TERM_REAL = (() => {
  let at = 0.9; // let the panel switch on first
  const rows = TERM_SCRIPT.map((line, index) => {
    const length = Array.from(line.text).length;
    const type = Math.max(0.5, length / 24);
    const row = { ...line, start: at, type };
    at += type + (index < TERM_SCRIPT.length - 1 ? 0.6 + length * 0.01 : 0);
    return row;
  });
  // The movie beat: the bar hangs on 99% with only the cursor blinking, then snaps to 100%.
  const hang = [at + 0.15, at + 1.35];
  const done = hang[1] + 0.1;
  return { rows, hang, done, total: done + 0.9 };
})();
// The whole terminal stretch plays at this speed, so design time maps linearly onto the real schedule.
const TERM_SPEED = (TERM_END - T.hack) / TERM_REAL.total;
const termTime = (real) => T.hack + real * TERM_SPEED;
const TERM_LINES = TERM_REAL.rows.map((row, index, rows) => ({
  ...row,
  at: termTime(row.start),
  until: termTime(row.start + row.type),
  // The last tag waits for the upload to hit 100%.
  tagAt: index === rows.length - 1 ? termTime(TERM_REAL.done) : 0
}));
const HANG = TERM_REAL.hang.map(termTime);
const DONE = termTime(TERM_REAL.done);
const TERM_BLINK = 0.5 * TERM_SPEED; // design seconds per cursor blink (half a real second)

// Upload bar: steps forward as each line lands, stalls near 31% and 68%, reaches 99% with the
// last line, hangs there for the beat, then completes.
const UPLOAD_AT = [0.05, 0.13, 0.26, 0.31, 0.49, 0.63, 0.68, 0.95];
const UPLOAD = monotoneCurve([
  [TERM_LINES[0].at, 0],
  ...TERM_LINES.map((line, index) => [line.until, UPLOAD_AT[index]]),
  [HANG[0], 0.99],
  [HANG[1], 0.99],
  [DONE, 1]
]);
const SCRAMBLE = '01#$%&*<>/|{}[]=+?ABCDEFXZ';

// The beats above are written in "design time". Real playback runs each stretch at its own
// speed: unhurried for the hack (so people can read it) and the mascot's lines (so they can read them).
const SPEEDS = [
  [0, 1],
  [T.hack, TERM_SPEED],
  [TERM_END, 0.45],
  [T.alert, 1.1],
  [T.mascot, 0.45],
  [T.reveal, 0.75],
  [T.flight, 0.7]
];

function warp(realT) {
  let real = 0;
  for (let index = 0; index < SPEEDS.length; index += 1) {
    const [start, speed] = SPEEDS[index];
    const next = SPEEDS[index + 1];
    const realLength = next ? (next[0] - start) / speed : Infinity;
    if (realT <= real + realLength) return start + (realT - real) * speed;
    real += realLength;
  }
  return realT;
}

function unwarp(designT) {
  let real = 0;
  for (let index = 0; index < SPEEDS.length; index += 1) {
    const [start, speed] = SPEEDS[index];
    const next = SPEEDS[index + 1];
    if (!next || designT <= next[0]) return real + (designT - start) / speed;
    real += (next[0] - start) / speed;
  }
  return real;
}

// Real seconds from the link tap until the ticket is settled.
export const END = unwarp(T.ticket) + 0.001;
export const toStoryTime = unwarp;
export const toDesignTime = warp;
const RELEASE_PROGRESS = (T.release - T.flight) / T.flightLength;

const ENC_FILES = ['IMG_2031.jpg', 'do_an_cuoi_ky_nop_tre.docx', 'CV_final_v7.pdf', 'selfie_(3).png', 'meme_luc_2h_sang.mp4', 'bao_cao_nhom_(1 mình làm).pptx', 'anh_crush_luu_tru.zip', 'ghi_chu_3h_sang.txt'];

const LINES = [
  { from: 11.35, to: 13.9, type: [11.45, 12.65], text: 'Bình tĩnh{n}! Chuyên viên an ninh mạng có mặt rồi! 🕶️' },
  { from: 14.2, to: 17.45, type: [14.3, 15.8], text: 'Mối đe dọa đã bị vô hiệu hóa! Thật ra tui đùa thôi 😆' },
  { from: 18.5, to: 21.2, type: [18.6, 19.6], text: 'Đổi vai: cơ trưởng đây! Sắp cất cánh ✈️' },
  { from: 21.4, to: 24.8, type: [21.5, 22.6], text: 'Máy bay đang giao hàng, khỏi trả ship nha ✈️' },
  { from: 29.4, to: 35.2, type: [29.55, 31.0], text: 'Tui tốt nghiệp rồi nè! 🎓 Nhớ tới nha, không là tui hack thiệt đó 😤' }
].map((line) => ({ ...line, template: line.text, chars: Array.from(line.text) }));

// The visitor's name threads through the hack: "{call}" is the name or "bạn", "{n}" an optional " Name".
let guestName = '';
const fill = (text) => text.replaceAll('{call}', guestName || 'bạn').replaceAll('{n}', guestName ? ` ${guestName}` : '');

// Pop-up storm: a dozen small system alerts slam in, each a little faster than the last.
const POP_MESSAGES = [
  { tone: 'bad', title: 'Bảo mật', text: 'Phát hiện virus trên thiết bị!' },
  { tone: 'warn', title: 'Thư viện ảnh', text: 'Đã tìm thấy 4.269 ảnh selfie 😳' },
  { tone: 'bad', title: 'Mật khẩu', text: 'Mật khẩu "123456" đã bị lộ' },
  { tone: 'info', title: 'Tin nhắn', text: 'Bạn có 1.337 tin nhắn chưa trả lời' },
  { tone: 'bad', title: 'Tường lửa', text: 'Tường lửa đã bị vô hiệu hóa' },
  { tone: 'warn', title: 'Pin', text: 'Pin còn 1% (do đang bị hack)' },
  { tone: 'bad', title: 'Lỗi nghiêm trọng', text: 'Deadline 3h sáng chưa nộp!' },
  { tone: 'warn', title: 'Chia sẻ', text: 'Đang gửi ảnh selfie cho cả lớp…' },
  { tone: 'info', title: 'Crush', text: 'Crush đã xem tin nhắn của bạn 👀' },
  { tone: 'bad', title: 'Tải xuống', text: 'final_final_that_su_final.docx' },
  { tone: 'warn', title: 'Wi-Fi', text: 'Có người đang dùng chùa Wi-Fi nhà bạn' },
  { tone: 'bad', title: 'Hệ thống', text: 'Hệ thống sập sau 3… 2… 1…' }
];
const POP_TIMES = (() => {
  const times = [];
  let at = T.alert + 0.12;
  let gap = 0.2;
  for (let index = 0; index < POP_MESSAGES.length; index += 1) {
    times.push(at);
    at += gap;
    gap = Math.max(0.06, gap - 0.014);
  }
  return times;
})();
const POPS = [T.alert, T.alert + 0.15, T.alert + 0.75, T.alert + 1.4, T.yank, ...POP_TIMES];
const seeded = (index, salt) => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const GLITCHES = [8.2, 9.6, 10.35, 11.55];

// Sound cuts share the exact typing and popup timings used by the picture.
export const HACK_AUDIO = {
  lines: TERM_LINES.map(line => ({ at: line.at, until: line.until, tagAt: line.tagAt || line.until })),
  hang: HANG,
  done: DONE,
  access: 4.58,
  popups: POP_TIMES,
  glitches: GLITCHES
};

const cache = new WeakMap();
function setStyle(el, prop, value) {
  let entry = cache.get(el);
  if (!entry) cache.set(el, (entry = {}));
  if (entry[prop] !== value) {
    entry[prop] = value;
    el.style[prop] = value;
  }
}
const fx = (value) => value.toFixed(2);

export function sceneAt(realT) {
  const t = warp(realT);
  if (t < T.hack) return 'glitch';
  if (t < T.alert) return 'hack';
  if (t < T.mascot) return 'alert';
  if (t < T.pull) return 'character';
  if (t < T.reveal) return 'pull';
  if (t < T.flight) return 'reveal';
  if (t < T.ticket) return 'flight';
  return 'ticket';
}

export function createStory({ onBurst, onHaptic, onPoof }) {
  const $ = (selector) => document.querySelector(selector);
  const el = {
    gate: $('#nameForm'),
    flash: $('#whiteFlash'),
    warmth: $('#warmth'),
    alarm: $('#alarm'),
    terminal: $('#terminal'),
    termPanel: $('#termPanel'),
    access: $('#access'),
    accessSub: $('#accessSub'),
    termLines: $('#termLines'),
    termBar: $('#termBar'),
    termPct: $('#termPct'),
    termHead: $('#termHead'),
    termFiles: $('#termFiles'),
    termRate: $('#termRate'),
    banner: $('#alarmBanner'),
    winA: $('#winA'),
    winB: $('#winB'),
    winC: $('#winC'),
    haloC: $('#haloC'),
    traceLoc: $('#traceLoc'),
    traceText: $('#traceText'),
    encBar: $('#encBar'),
    encPct: $('#encPct'),
    encEta: $('#encEta'),
    encFiles: $('#encFiles'),
    countdown: $('#countdown'),
    actor: $('#actor'),
    redHacker: $('#redHacker'),
    flybyClouds: $('#flybyClouds'),
    actorSvg: $('#actor svg'),
    morph: $('#morph'),
    morphRays: $('#morph .morph-rays'),
    morphBeam: $('#morph .morph-beam'),
    morphRing: $('#morph .morph-ring'),
    shades: $('#mShades'),
    grip: $('#mGrip'),
    wave: $('#mWave'),
    holo: $('#mHolo'),
    hat: $('#mHat'),
    face: $('#mFace'),
    eyeL: $('#mEyeL'),
    eyeR: $('#mEyeR'),
    smile: $('#mSmile'),
    mouth: $('#mMouth'),
    bubble: $('#bubble'),
    bubbleText: $('#bubbleText'),
    reveal: $('#revealIn'),
    ticketWrap: $('#ticketWrap'),
    ticketFly: $('#ticketFly'),
    stamp: $('#ticketStamp')
  };
  el.termCursor = document.createElement('i');
  const passingClouds = [...el.flybyClouds.children];
  el.termCursor.className = 'term-cursor';
  el.termScramble = document.createElement('em');
  el.termScramble.className = 'term-scramble';
  const bubbleShown = document.createElement('span');
  const bubbleGhost = document.createElement('span');
  bubbleGhost.className = 'ghost';
  el.bubbleText.replaceChildren(bubbleShown, bubbleGhost);

  const icons = {
    bad: '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="7" fill="#d83a3a"/><path d="m5.3 5.3 5.4 5.4m0-5.4-5.4 5.4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>',
    warn: '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 1.6 15 14H1L8 1.6Z" fill="#f0b429"/><path d="M8 6v4m0 1.7v.1" stroke="#3b2a00" stroke-width="1.5" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="7" fill="#3a7bd5"/><path d="M8 7v4.2M8 4.8v.1" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };
  const pops = POP_MESSAGES.map((message) => {
    const node = document.createElement('div');
    node.className = `win win-pop tone-${message.tone}`;
    const bar = document.createElement('div');
    bar.className = 'win-bar';
    bar.innerHTML = `${icons[message.tone]}<span></span><span class="win-ctl"><i>✕</i></span>`;
    bar.children[1].textContent = message.title;
    const body = document.createElement('div');
    body.className = 'win-pop-body';
    body.textContent = message.text;
    const foot = document.createElement('div');
    foot.className = 'win-foot';
    foot.innerHTML = '<span class="btn">OK</span>';
    node.append(bar, body, foot);
    el.winA.before(node);
    return { node, x: 0, y: 0, rotation: 0 };
  });

  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let mobile = vw <= 700;
  let ticketFit = 1;
  let sideFit = 1;
  let rest = { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, C: { x: 0, y: 0 } };
  let ticketRest = { x: 0, y: 0, rot: -2.8 };
  let prev = -1;
  let termShown = 0;
  let termRows = [];
  let encShown = -1;
  let bubbleKey = '';
  const state = { t: 0, dt: 0.016, matrix: false, red: 0, flush: 0, alert: 0, warm: 0, sky: 1, push: 0, drift: 4, impulse: 0, flight: null };

  // Shrinks the ticket and its button to fit the free area of the ticket layer (inside its padding),
  // so short screens such as a phone held sideways never push the button off-screen.
  function fitTicket() {
    const wrap = el.ticketWrap;
    const layer = wrap.parentElement;
    const style = getComputedStyle(layer);
    const freeH = layer.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const freeW = layer.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (!wrap.offsetHeight || !wrap.offsetWidth) return;
    const angle = Math.abs(mobile ? -1.75 : -2.8) * Math.PI / 180;
    const paperW = el.ticketFly.offsetWidth;
    const paperH = el.ticketFly.offsetHeight;
    const rotatedW = paperW * Math.cos(angle) + paperH * Math.sin(angle);
    const extraH = paperW * Math.sin(angle) + paperH * Math.cos(angle) - paperH;
    ticketFit = clamp(Math.min(1, freeH / (wrap.offsetHeight + extraH), freeW / Math.max(wrap.offsetWidth, rotatedW)), 0.45, 1);
    wrap.style.setProperty('--fit', ticketFit.toFixed(4));
  }

  function measureTicket() {
    // The wrap only scales about its centre outside of the details view, so its centre is the true rest pose.
    if (document.querySelector('#app').dataset.scene === 'details') return;
    fitTicket();
    const wrap = el.ticketWrap.getBoundingClientRect();
    if (!wrap.width) return;
    const flyCenter = el.ticketFly.offsetTop + el.ticketFly.offsetHeight / 2 - el.ticketWrap.offsetHeight / 2;
    ticketRest = {
      x: wrap.left + wrap.width / 2 - vw / 2,
      y: wrap.top + wrap.height / 2 + flyCenter * ticketFit - vh / 2,
      rot: mobile ? -1.75 : -2.8
    };
  }

  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    mobile = vw <= 700;
    const alerts = alertLayout(vw, vh, el.winC.offsetHeight || 360, pops.length);
    rest = alerts.rest;
    sideFit = alerts.sideScale;
    pops.forEach((pop, index) => {
      Object.assign(pop, alerts.pops[index]);
    });
    measureTicket();
  }

  function renderTerminal(t) {
    let shown = 0;
    while (shown < TERM_LINES.length && t >= TERM_LINES[shown].at) shown += 1;
    if (shown < termShown) {
      el.termLines.replaceChildren();
      termRows = [];
      termShown = 0;
    }
    while (termShown < shown) {
      const line = TERM_LINES[termShown];
      const row = document.createElement('div');
      row.className = `term-line ${line.tone}`;
      const text = document.createElement('span');
      const textNode = document.createTextNode('');
      text.append(textNode);
      row.append(text);
      let tag = null;
      if (line.tag) {
        tag = document.createElement('b');
        tag.textContent = line.tag;
        tag.style.visibility = 'hidden';
        row.append(tag);
      }
      el.termLines.append(row);
      termRows.push({ line, text, textNode, tag, chars: Array.from(fill(line.text)), count: -1, done: false });
      termShown += 1;
    }
    // Each line types itself out, and its tag lands when the line is finished.
    for (const row of termRows) {
      if (row.done) continue;
      const count = Math.floor(row.chars.length * range(t, row.line.at, row.line.until));
      if (count !== row.count) {
        row.count = count;
        row.textNode.data = row.chars.slice(0, count).join('');
      }
      if (count >= row.chars.length && t >= (row.line.tagAt ?? 0)) {
        row.done = true;
        if (row.tag) {
          row.tag.style.visibility = 'visible';
          row.tag.classList.add('on');
        }
      }
    }
    // A block cursor rides the newest line: solid while typing, blinking while it waits.
    // Ahead of it, a few glyphs flicker as if the next characters are still being decrypted.
    const last = termRows[termRows.length - 1];
    if (last && el.termCursor.parentNode !== last.text) last.text.append(el.termScramble, el.termCursor);
    const typing = last && last.count < last.chars.length;
    const cursorOn = last && t < DONE + 0.2 && (typing || Math.floor(t / TERM_BLINK) % 2 === 0);
    setStyle(el.termCursor, 'opacity', cursorOn ? '1' : '0');
    const tick = Math.floor(t / (0.05 * TERM_SPEED));
    const ahead = typing ? Math.min(3, last.chars.length - last.count) : 0;
    let noise = '';
    for (let index = 0; index < ahead; index += 1) noise += SCRAMBLE[Math.floor(seeded(tick, index + 7) * SCRAMBLE.length)];
    if (el.termScramble.textContent !== noise) el.termScramble.textContent = noise;
    const progress = UPLOAD(t);
    setStyle(el.termBar, 'clipPath', `inset(0 ${((1 - progress) * 100).toFixed(2)}% 0 0)`);
    setStyle(el.termHead, 'left', `${(progress * 100).toFixed(2)}%`);
    setStyle(el.termHead, 'opacity', progress > 0.005 && progress < 0.995 ? '1' : '0');
    const pct = `${Math.floor(progress * 100)}%`;
    if (el.termPct.textContent !== pct) el.termPct.textContent = pct;
    // Files sent and transfer speed follow the same curve, so stalls show as a speed drop.
    const files = `Đã gửi ${Math.floor(progress * 4269).toLocaleString('vi-VN')} / 4.269 tệp`;
    if (el.termFiles.textContent !== files) el.termFiles.textContent = files;
    const slice = Math.floor(t * 6) / 6;
    const hanging = t >= HANG[0] && t < DONE;
    const speed = progress > 0 && progress < 1 && !hanging ? Math.max(0.4, ((UPLOAD(slice + 0.1) - UPLOAD(slice)) / 0.1) * 46) : 0;
    el.termPanel.classList.toggle('hanging', hanging);
    el.termPanel.classList.toggle('complete', t >= DONE);
    const rate = `${speed.toFixed(1).replace('.', ',')} MB/s`;
    if (el.termRate.textContent !== rate) el.termRate.textContent = rate;
  }

  function windowPose(key, popAt, flyDelay, destination, spin, t, bobSeed) {
    const pop = range(t, popAt, popAt + 0.55);
    let scale = lerp(0.7, 1, ease.spring(pop, 1.5, 7)) * (key === 'C' ? 1 : sideFit);
    let opacity = range(t, popAt, popAt + 0.1);
    const float = pop >= 1 ? Math.sin(t * 1.3 + bobSeed) * 3 : 0;
    let x = rest[key].x;
    let y = rest[key].y + float;
    let rotation = 0;
    const fly = range(t, T.yank + flyDelay, T.yank + flyDelay + 0.95);
    if (fly > 0) {
      // Short recoil against the pull, then accelerate away toward the mascot.
      const recoil = ease.outCubic(range(fly, 0, 0.2)) * (1 - range(fly, 0.2, 0.3));
      const go = ease.inCubic(range(fly, 0.2, 1));
      x += -16 * recoil + (destination.x - rest[key].x) * go;
      y += -6 * recoil + (destination.y - rest[key].y) * go;
      rotation = spin * ease.inQuad(fly);
      scale *= 1 - 0.4 * go;
      opacity *= 1 - range(fly, 0.8, 1);
    }
    return { x, y, rotation, scale, opacity };
  }

  function applyWindow(node, pose) {
    setStyle(node, 'transform', `translate3d(${fx(pose.x)}px, ${fx(pose.y)}px, 0) translate(-50%, -50%) rotate(${pose.rotation.toFixed(2)}deg) scale(${pose.scale.toFixed(4)})`);
    setStyle(node, 'opacity', pose.opacity.toFixed(3));
  }

  function apply(realT, dt) {
    const t = warp(realT);
    const natural = t - prev >= 0 && t - prev < 0.25;
    const hit = (at) => natural && prev < at && t >= at;

    // --- Glitch: the name page itself jitters, then collapses like an old screen switching off.
    if (t < T.hack) {
      const rise = range(t, 0, T.collapseStart);
      const collapse = ease.inCubic(range(t, T.collapseStart, T.hack));
      const jx = Math.sin(t * 160) * 7 * rise * (1 - collapse);
      const skew = Math.sin(t * 95) * 3.5 * rise * (1 - collapse);
      setStyle(el.gate, 'transform', `translate3d(${fx(jx)}px, 0, 0) skewX(${skew.toFixed(2)}deg) scale(${(1 + collapse * 0.04).toFixed(3)}, ${(1 - collapse * 0.996).toFixed(4)})`);
      setStyle(el.gate, 'filter', `brightness(${(1 + rise * 0.5 + collapse * 2).toFixed(2)}) saturate(${(1 - rise * 0.7).toFixed(2)})`);
      const flash = Math.max(pulseAt(t, 0.16, 0.025), pulseAt(t, 0.34, 0.02), pulseAt(t, 0.62, 0.03)) * 0.28;
      setStyle(el.flash, 'opacity', flash.toFixed(3));
    } else {
      setStyle(el.gate, 'transform', 'scale(1, 0)');
      setStyle(el.gate, 'filter', 'none');
      // A hard white-red cut as the green hack flips into the alarm.
      setStyle(el.flash, 'opacity', (pulseAt(t, T.alert + 0.03, 0.035) * 0.6).toFixed(3));
    }

    // --- Terminal turns on, prints its lines, then dims behind the alerts.
    const on = ease.outCubic(range(t, T.hack, T.hack + 0.45 * TERM_SPEED));
    setStyle(el.terminal, 'transform', `scale(1, ${Math.max(0.004, on).toFixed(4)})`);
    renderTerminal(t);

    // "TRUY CẬP THÀNH CÔNG" slams in over the dimmed terminal just before the alarm turns it red.
    const accessIn = ease.spring(range(t, 4.5, 5.0), 1.3, 7);
    const accessOut = range(t, 5.56, 5.68);
    // From 5.1 the green banner breaks up and its hue is dragged from green to red, then it cuts out under the flash.
    const breach = range(t, 5.1, 5.55);
    const accessGlitch = t > 4.5 && t < 5.6 ? Math.sin(t * 90) * (3 * Math.max(0, Math.sin(t * 7)) + breach * 16) : 0;
    setStyle(el.access, 'opacity', (range(t, 4.5, 4.62) * (1 - accessOut)).toFixed(3));
    setStyle(el.access, 'transform', `translate3d(${fx(accessGlitch)}px, 0, 0) skewX(${fx(Math.sin(t * 120) * breach * 6)}deg) scale(${(lerp(1.35, 1, accessIn) + breach * 0.06).toFixed(4)})`);
    setStyle(el.access, 'filter', breach > 0 ? `hue-rotate(${fx(-145 * ease.inCubic(breach))}deg) saturate(${fx(1 + breach)})` : 'none');
    // 100% lands with a green pulse and a held breath before the banner.
    const doneHit = pulseAt(t, DONE, 0.25 * TERM_SPEED);
    let kick = 0;
    for (const line of TERM_LINES) kick += pulseAt(t, line.until, 0.05 * TERM_SPEED);
    const jolt = Math.sin(t * 900) * (2.5 * kick + 4 * doneHit);
    setStyle(el.termPanel, 'opacity', (1 - 0.8 * range(t, 4.5, 4.7)).toFixed(3));
    setStyle(el.termPanel, 'transform', `translate3d(${fx(jolt)}px, 0, 0) scale(${(1 + 0.025 * doneHit).toFixed(4)})`);

    // --- Alert: banner, three system windows, double heartbeat.
    const alertIn = ease.outCubic(range(t, T.alert, T.alert + 0.35));
    const alertOut = range(t, T.yank + 0.2, T.reveal + 0.2);
    const redness = alertIn * (1 - alertOut);
    const beatTime = t >= T.alert ? ((t - T.alert) % 1.08) / 1.08 : 0;
    const heartbeat = t >= T.alert
      ? Math.min(1, pulseAt(beatTime, 0.075, 0.074) + pulseAt(beatTime, 0.245, 0.085) * 0.64) * (1 - range(t, T.yank, T.yank + 0.7))
      : 0;
    const flash = t >= T.alert ? Math.exp(-(t - T.alert) * 5) * 0.9 : 0;
    setStyle(el.alarm, 'opacity', clamp(redness * (0.1 + heartbeat * 0.32) + flash, 0, 1).toFixed(3));
    setStyle(el.haloC, 'opacity', (heartbeat * 0.9).toFixed(3));
    setStyle(el.banner, 'transform', `translate3d(0, ${fx(lerp(-100, 0, ease.outCubic(range(t, T.alert, T.alert + 0.35))))}%, 0)`);

    const toMascot = { x: vw * 0.46, y: vh * 0.7 };
    const poseA = windowPose('A', T.alert + 0.15, 0.32, toMascot, 20, t, 0);
    const poseB = windowPose('B', T.alert + 0.75, 0.16, { x: vw * 0.4, y: vh * 0.8 }, -16, t, 2);
    const poseC = windowPose('C', T.alert + 1.4, 0, { x: vw * 0.44, y: vh * 0.68 }, 26, t, 4);
    const glitchHit = GLITCHES.some((at) => t >= at && t < at + 0.12);
    if (glitchHit) {
      poseC.x += Math.sin(t * 300) * 9;
      el.winC.classList.add('glitch');
    } else {
      el.winC.classList.remove('glitch');
    }
    applyWindow(el.winA, poseA);
    applyWindow(el.winB, poseB);
    applyWindow(el.winC, poseC);

    // Pop-up storm: each slams in big and shrinks to size, throbs with the heartbeat, then gets swept away.
    pops.forEach((pop, index) => {
      const at = POP_TIMES[index];
      const slam = ease.outCubic(range(t, at, at + 0.2));
      const fly = ease.inCubic(range(t, T.yank + index * 0.03, T.yank + index * 0.03 + 0.7));
      const pose = {
        x: pop.x + (vw * 0.46 - pop.x) * fly,
        y: pop.y + (vh * 0.72 - pop.y) * fly,
        rotation: pop.rotation + fly * (index % 2 ? 24 : -24),
        scale: lerp(1.24, 1, slam) * pop.scale * (1 + 0.012 * heartbeat) * (1 - 0.45 * fly),
        opacity: range(t, at, at + 0.04) * (1 - range(fly, 0.8, 1))
      };
      applyWindow(pop.node, pose);
    });

    const encProgress = 0.08 + 0.88 * ease.inOutSine(range(t, T.alert + 0.75, T.yank));
    setStyle(el.encBar, 'transform', `scaleX(${encProgress.toFixed(4)})`);
    const encPct = `${Math.round(encProgress * 100)}%`;
    if (el.encPct.textContent !== encPct) el.encPct.textContent = encPct;
    const eta = `Còn lại 00:0${Math.max(1, Math.ceil(9 - (t - T.alert - 0.75) * 0.9))}`;
    if (el.encEta.textContent !== eta) el.encEta.textContent = eta;
    const filesShown = clamp(Math.floor((t - (T.alert + 0.9)) / 0.45) + 1, 0, ENC_FILES.length);
    if (filesShown !== encShown) {
      encShown = filesShown;
      el.encFiles.replaceChildren(...ENC_FILES.slice(Math.max(0, filesShown - 4), filesShown).map((name) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = name;
        const mark = document.createElement('em');
        mark.textContent = 'đã mã hóa';
        item.append(label, mark);
        return item;
      }));
    }
    const remaining = Math.max(0, 10 - Math.max(0, t - (T.alert + 1.4)));
    const whole = Math.floor(remaining);
    const centis = Math.floor((remaining - whole) * 100);
    const clock = `00:${String(whole).padStart(2, '0')}:${String(centis).padStart(2, '0')}`;
    if (el.countdown.textContent !== clock) el.countdown.textContent = clock;
    const location = t < 9.2 ? 'Đang xác định…' : 'Ngay trong túi quần bạn 😏';
    if (el.traceLoc.textContent !== location) el.traceLoc.textContent = location;

    // The intruder occupies the lower-right corner and retreats off that same edge.
    const intruderIn = ease.outCubic(range(t, T.hack, T.hack + .1));
    const intruderOut = ease.inCubic(range(t, T.mascot - .45, T.mascot + .05));
    setStyle(el.redHacker, 'opacity', (intruderIn * (1 - intruderOut)).toFixed(3));
    setStyle(el.redHacker, 'transform', `translate3d(${fx((1 - intruderIn) * 48 + intruderOut * 260)}px, ${fx((1 - intruderIn) * 24 + intruderOut * 20)}px, 0) scale(${(1 - intruderOut * .08).toFixed(4)})`);

    // --- Mascot
    const enter = range(t, T.mascot, T.mascot + 0.95);
    const arrive = ease.spring(enter, 1.1, 5.5);
    const impact = T.mascot + 0.3;
    const squash = t > impact ? Math.exp(-(t - impact) * 9) : 0;
    const lunge = ease.outCubic(range(t, T.lunge, T.lunge + 0.5));
    const yank = ease.inOutCubic(range(t, T.yank, T.yank + 0.6));
    const reach = Math.min(vw * 0.3, 260);
    let actorX = (1 - arrive) * (vw * 0.5 + 120) - reach * lunge * (1 - yank);
    let actorY = -Math.abs(Math.sin(enter * Math.PI * 3.5)) * 26 * (1 - enter);
    // The cap is tossed twice. Each costume change happens at the top of a toss, hidden by a poof.
    const toss = (start) => {
      const p = range(t, start, start + 1.45);
      const landed = range(t, start + 1.45, start + 1.95);
      return {
        p,
        bounce: p >= 1 ? Math.exp(-landed * 8) * Math.sin(landed * 28) : 0,
        jump: -Math.sin(range(t, start - 0.05, start + 0.3) * Math.PI) * 38
      };
    };
    const tossA = toss(T.reveal + 0.15);
    const tossB = toss(T.grad);
    const hatNow = t >= T.grad - 0.05 ? tossB : tossA;
    const hatP = hatNow.p;
    const apexA = T.reveal + 0.15 + 0.725;
    const apexB = T.grad + 0.725;
    const fit = t < apexA ? 'security' : t < apexB ? 'captain' : 'grad';
    if (el.actor.dataset.fit !== fit) el.actor.dataset.fit = fit;
    actorY += tossA.jump + tossB.jump;
    // Idle life once settled: a slow bob, breathing and a gentle side-to-side sway.
    const idle = range(t, T.mascot + 0.9, T.mascot + 1.4);
    const breath = Math.sin(t * 2.6) * idle;
    actorY += Math.sin(t * 2.4) * 2.2 * idle;
    // Each hat toss: crouch to load the hop, then a soft squash on landing.
    const hop = (start) => {
      const crouch = Math.sin(range(t, start - 0.22, start - 0.02) * Math.PI);
      const land = t > start + 0.3 ? Math.exp(-(t - start - 0.3) * 10) : 0;
      return crouch + land;
    };
    const hopSquash = hop(T.reveal + 0.15) + hop(T.grad);

    // Transformation: rise, spin twice while glowing white-hot, and swap costumes at the exact
    // moment the spin is edge-on (450deg). Two halves with matched speed so the spin never hitches.
    const apex = t < (apexA + apexB) / 2 ? apexA : apexB;
    const spinIn = range(t, apex - 0.42, apex);
    const spinOut = range(t, apex, apex + 0.25);
    const spin = t < apex ? 450 * spinIn * spinIn : 450 + 270 * (1 - (1 - spinOut) * (1 - spinOut));
    const spinning = spinIn > 0 && spinOut < 1;
    const glow = t < apex ? ease.inCubic(range(t, apex - 0.4, apex)) : 1 - ease.outCubic(range(t, apex, apex + 0.45));
    actorY -= Math.sin(range(t, apex - 0.45, apex + 0.45) * Math.PI) * 34;
    const landT = range(t, apex + 0.45, apex + 1.15);
    const landPop = landT > 0 ? Math.exp(-landT * 6) * Math.sin(landT * Math.PI * 2.5) : 0;
    setStyle(el.actorSvg, 'transform', spinning ? `perspective(900px) rotateY(${spin.toFixed(1)}deg)` : '');
    const tone = apex === apexA ? '255, 190, 70' : '255, 211, 107';
    setStyle(el.actorSvg, 'filter', glow > 0.005 ? `brightness(${(1 + 4.5 * glow).toFixed(3)}) saturate(${(1 - 0.8 * glow).toFixed(3)}) drop-shadow(0 0 ${fx(4 + 10 * glow)}px rgba(${tone}, ${glow.toFixed(3)})) drop-shadow(0 0 ${fx(26 * glow)}px rgba(${tone}, ${(0.85 * glow).toFixed(3)}))` : '');

    // Light show behind the mascot: rays and a light pillar charge up, then a ring rolls out along the ground.
    const charge = ease.inOutSine(range(t, apex - 0.55, apex));
    const after = range(t, apex, apex + 0.95);
    const ringP = range(t, apex, apex + 0.8);
    const morphOn = charge > 0 && after < 1;
    setStyle(el.morph, 'opacity', morphOn ? '1' : '0');
    if (morphOn) {
      if (el.morph.dataset.tone !== (apex === apexA ? 'captain' : 'grad')) el.morph.dataset.tone = apex === apexA ? 'captain' : 'grad';
      const fade = 1 - ease.outCubic(after);
      setStyle(el.morphRays, 'opacity', (charge * fade).toFixed(3));
      setStyle(el.morphRays, 'transform', `rotate(${(t * 140).toFixed(1)}deg) scale(${(lerp(0.45, 1.05, charge) + 0.45 * ease.outCubic(after)).toFixed(4)})`);
      setStyle(el.morphBeam, 'opacity', (charge * fade).toFixed(3));
      setStyle(el.morphBeam, 'transform', `scale(${(lerp(0.15, 1, charge) * (1 + 0.7 * ease.outCubic(after))).toFixed(4)}, ${lerp(0.3, 1, charge).toFixed(4)})`);
      setStyle(el.morphRing, 'opacity', ringP > 0 ? (1 - ringP).toFixed(3) : '0');
      setStyle(el.morphRing, 'transform', `scale(${lerp(0.35, 2.1, ease.outCubic(ringP)).toFixed(4)})`);
    }

    const hatBounce = hatNow.bounce;
    const rotate = lerp(16, -3, arrive) - 9 * lunge * (1 - yank) + 9 * Math.sin(yank * Math.PI) + Math.sin(t * 1.25) * 1.3 * idle;
    const scaleX = 1 + 0.09 * squash + 0.05 * hopSquash + 0.08 * landPop - 0.006 * breath;
    const scaleY = 1 - 0.12 * squash - hatBounce * 0.02 - 0.07 * hopSquash - 0.1 * landPop + 0.014 * breath;
    setStyle(el.actor, 'transform', `translate3d(${fx(actorX)}px, ${fx(actorY)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`);

    const flail = (Math.sin(t * 9) * 7 - 2) * (1 - 0.7 * range(t, T.mascot + 1.2, T.mascot + 2.0));
    const calm = Math.sin(t * 3.2) * 4 + 1;
    const waveDeg = lerp(lerp(t >= T.mascot + 0.2 ? flail : 0, -18, range(t, T.lunge - 0.05, T.lunge + 0.25)), calm, range(t, T.yank + 1.0, T.yank + 1.5));
    setStyle(el.wave, 'transform', `rotate(${waveDeg.toFixed(2)}deg)`);
    // Positive swings the left hand out and up, reaching toward the alert board.
    const gripDeg = 40 * lunge * (1 - range(t, T.yank + 0.4, T.yank + 0.95));
    setStyle(el.grip, 'transform', `rotate(${gripDeg.toFixed(2)}deg)`);
    setStyle(el.holo, 'opacity', (1 - gripDeg / 40).toFixed(2));

    // Hat: up in a spinning arc, back down onto the head with a small bounce.
    const arc = Math.sin(hatP * Math.PI);
    const hatY = -arc * 360 + (hatP >= 1 ? hatBounce * 5 : 0);
    const hatX = Math.sin(hatP * Math.PI * 2) * 30;
    const hatSpin = ease.inOutSine(hatP) * 360;
    setStyle(el.hat, 'transform', `translate(${fx(hatX)}px, ${fx(hatY)}px) rotate(${hatSpin.toFixed(1)}deg)`);

    // Sunglasses sit up on the forehead, then snap down right before the specialist deals with the threat.
    const shadesDrop = ease.outBack(range(t, T.yank - 0.45, T.yank - 0.25));
    setStyle(el.shades, 'transform', `translateY(${fx(-38 * (1 - shadesDrop))}px)`);

    const shock = range(t, 11.3, 11.5) * (1 - 0.6 * range(t, 12.3, 13.1)) * (1 - range(t, T.yank + 0.05, T.yank + 0.45));
    const eye = (5 + 1.9 * shock).toFixed(2);
    if (el.eyeL.getAttribute('r') !== eye) {
      el.eyeL.setAttribute('r', eye);
      el.eyeR.setAttribute('r', eye);
    }
    setStyle(el.face, 'transform', `translateY(${fx(-4 * shock)}px)`);

    // --- Speech bubble: typed text, pop-in, mouth follows the typing.
    const line = LINES.find((entry) => t >= entry.from && t < entry.to);
    let talking = 0;
    if (line) {
      const typed = range(t, line.type[0], line.type[1]);
      const count = Math.floor(line.chars.length * typed);
      const key = `${line.from}:${count}`;
      if (key !== bubbleKey) {
        bubbleKey = key;
        bubbleShown.textContent = line.chars.slice(0, count).join('');
        bubbleGhost.textContent = line.chars.slice(count).join('');
      }
      talking = typed > 0 && typed < 1 ? 0.35 + 0.65 * Math.abs(Math.sin(t * 17)) : 0;
      const pop = range(t, line.from, line.from + 0.2);
      const bubbleScale = lerp(0.96, 1, ease.outCubic(pop));
      const fade = range(t, line.from, line.from + 0.16) * (1 - range(t, line.to - 0.22, line.to));
      setStyle(el.bubble, 'opacity', fade.toFixed(3));
      setStyle(el.bubble, 'transform', `translate3d(${fx(actorX * 0.8)}px, ${fx((1 - pop) * 10)}px, 0) scale(${bubbleScale.toFixed(4)})`);
    } else {
      bubbleKey = '';
      setStyle(el.bubble, 'opacity', '0');
    }
    setStyle(el.mouth, 'opacity', talking > 0.05 ? '1' : '0');
    setStyle(el.smile, 'opacity', talking > 0.05 ? '0' : '1');
    if (talking > 0.05) el.mouth.setAttribute('ry', (1 + 7 * talking).toFixed(2));

    // --- Reveal
    const warm = ease.inOutCubic(range(t, T.reveal - 0.4, T.reveal + 1.0));
    // Daylight sky: on at the name page, snapped off as the page glitches, back on at takeoff.
    const sky = t < T.hack ? 1 - ease.inOutCubic(range(t, 0.15, 0.9)) : warm;
    setStyle(el.warmth, 'opacity', sky.toFixed(3));
    const title = range(t, T.reveal + 0.5, T.reveal + 1.4);
    setStyle(el.reveal, 'opacity', (ease.outCubic(title) * (1 - range(t, T.flight - 0.5, T.flight + 0.05))).toFixed(3));
    setStyle(el.reveal, 'transform', `translate3d(0, ${fx((1 - ease.outCubic(title)) * 22)}px, 0)`);

    // --- Ticket: a small paper leaves the aircraft; it grows only after the plane passes.
    const fall = range(t, T.release, T.release + T.fall);
    if (t < T.release) {
      setStyle(el.ticketFly, 'opacity', '0');
    } else {
      const plane = flightPath(RELEASE_PROGRESS, vw, vh);
      const startX = plane.x - 34 * plane.scale - ticketRest.x;
      const startY = -plane.y + 32 - ticketRest.y;
      const sway = Math.sin(fall * Math.PI) * (1 - fall);
      const drift = ease.inOutCubic(fall);
      const x = startX * (1 - drift) + 10 * sway;
      const y = startY * (1 - ease.outCubic(fall));
      const rot = lerp(-7, ticketRest.rot, drift) + 2 * sway;
      const scale = lerp(0.18, 1, ease.inOutCubic(range(fall, 0.45, 1)));
      setStyle(el.ticketFly, 'opacity', range(t, T.release, T.release + 0.2).toFixed(3));
      setStyle(el.ticketFly, 'transform', `translate3d(${fx(x / ticketFit)}px, ${fx(y / ticketFit)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`);
    }
    el.stamp.classList.toggle('stamped', t >= T.ticket);

    // --- Discrete beats
    if (hit(POPS[1]) || hit(POPS[2]) || hit(POPS[3])) onHaptic([70]);
    if (hit(T.reveal + 0.55)) {
      const rect = el.actor.getBoundingClientRect();
      onBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.12, 46, 1);
    }
    if (hit(apexA) || hit(apexB)) {
      const rect = el.actor.getBoundingClientRect();
      onPoof(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, hit(apexA) ? 'captain' : 'grad');
      onHaptic([30, 40, 70]);
    }
    if (hit(T.ticket)) onBurst(vw / 2, vh * 0.28, 24, 0.55);

    let shake = 0;
    POPS.forEach((at, index) => {
      if (t >= at) shake += Math.exp(-(t - at) * 7) * (index < 5 ? 0.8 : 0.3);
    });

    // --- Background stage state
    const flightProgress = range(t, T.flight, T.flight + T.flightLength);
    const cloudPass = range(flightProgress, 0, .08) * (1 - range(flightProgress, .86, 1));
    setStyle(el.flybyClouds, 'opacity', cloudPass.toFixed(3));
    passingClouds.forEach((cloud, index) => {
      const x = lerp(vw * (1.12 + index * .36), -vw * (.7 + index * .4), flightProgress);
      setStyle(cloud, 'transform', `translate3d(${fx(x)}px, 0, 0)`);
    });
    state.t = t;
    state.dt = dt;
    // The falling-glyph rain lives on its own 2D canvas (matrix.js); main.js reads these two.
    state.matrix = t >= T.hack && t < T.reveal;
    state.red = range(t, T.alert - 0.05, T.alert + 0.15);
    // Briefly wipes the green trails so the red takes over at once instead of fading in.
    state.flush = range(t, T.alert - 0.05, T.alert + 0.02) * (1 - range(t, T.alert + 0.02, T.alert + 0.3));
    state.alert = redness;
    state.warm = warm;
    state.sky = sky;
    state.push = (34 * range(t, T.hack, T.hack + 0.8) + 44 * range(t, T.alert, T.alert + 0.8)) * (1 - range(t, T.reveal - 1.2, T.reveal));
    state.drift = t < T.reveal ? 15 : 4;
    state.impulse = Math.min(1, shake);
    state.flight = t >= T.flight && flightProgress < 1 ? flightProgress : null;

    prev = t;
    return state;
  }

  function reset() {
    prev = -1;
    termShown = 0;
    termRows = [];
    encShown = -1;
    bubbleKey = '';
    el.termLines.replaceChildren();
    el.encFiles.replaceChildren();
    el.stamp.classList.remove('stamped');
    el.actor.dataset.fit = 'security';
    el.winC.classList.remove('glitch');
    // The name page is shown again on replay, so clear what the glitch left on it.
    cache.delete(el.gate);
    el.gate.style.transform = '';
    el.gate.style.filter = '';
    setStyle(el.warmth, 'opacity', '1');
    setStyle(el.access, 'opacity', '0');
    setStyle(el.alarm, 'opacity', '0');
    setStyle(el.flash, 'opacity', '0');
    setStyle(el.ticketFly, 'opacity', '0');
  }

  function setGuest(name) {
    guestName = name;
    for (const line of LINES) line.chars = Array.from(fill(line.template));
    el.traceText.textContent = `Có người đang điều khiển điện thoại của ${name || 'bạn'} từ xa.`;
    el.accessSub.textContent = `ĐÃ VÀO ĐƯỢC ĐIỆN THOẠI CỦA ${(name || 'BẠN').toUpperCase()}`;
    bubbleKey = '';
  }

  layout();
  return { apply, reset, layout, measureTicket, sceneAt, setGuest };
}
