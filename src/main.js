import { createScene } from './scene.js';
import { createMatrix } from './matrix.js';
import { createStory, sceneAt, toStoryTime, END, T } from './story.js';
import { sendRsvp, flushOutbox } from './rsvp.js';
import { saveVenueCard } from './venue.js';
import { createSoundtrack } from './soundtrack.js';
import { createArrivalDance } from './arrival-dance.js';

const app = document.querySelector('#app');
const canvas = document.querySelector('#sceneCanvas');
const confetti = document.querySelector('#confetti');
const announcer = document.querySelector('#announcer');
const terminal = document.querySelector('#terminal');
const alertStage = document.querySelector('#alertStage');
const lobby = document.querySelector('#lobby');
const actor = document.querySelector('#actor');
const bubble = document.querySelector('#bubble');
const ticket = document.querySelector('#ticket');
const details = document.querySelector('#details');
const feedback = document.querySelector('#feedback');
const nameGate = document.querySelector('#nameGate');
const nameForm = document.querySelector('#nameForm');
const nameInput = document.querySelector('#nameInput');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const soundtrack = createSoundtrack(document.querySelector('#soundToggle'));

// Reuse the approved graduate artwork without duplicating SVG IDs or its story controls.
function cloneMascot(prefix) {
  const copy = actor.querySelector('svg').cloneNode(true);
  copy.querySelectorAll('[id]').forEach(node => { node.id = `${prefix}-${node.id}`; });
  copy.querySelectorAll('*').forEach(node => {
    for (const attribute of [...node.attributes]) {
      const value = attribute.value.replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }
  });
  return copy;
}
createArrivalDance(document.querySelector('#arrivalMascot'), cloneMascot('arrival'));
document.querySelector('#lobbyHeroStep').append(cloneMascot('lobby'));

let scene;
try {
  scene = createScene({ canvas });
} catch (error) {
  console.warn('3D stage unavailable, continuing without it.', error);
  scene = { available: false, render() {}, resize() {}, dispose() {} };
}
const matrix = createMatrix(document.querySelector('#matrix'));
if (!scene.available) app.classList.add('no-webgl');

const DEFAULT_GUEST = 'Vị khách đặc biệt';
// ?guest=Tên still works, but only to prefill the box; the visitor confirms it.
nameInput.value = (new URLSearchParams(window.location.search).get('guest') || '').trim().slice(0, 30);

let guestLabel = DEFAULT_GUEST;

function applyGuest(name) {
  const label = name || DEFAULT_GUEST;
  guestLabel = label;
  document.querySelector('#ticketGuest').textContent = label;
  document.querySelector('#detailGuest').textContent = label;
}
applyGuest('');

const announcements = {
  name: 'Nhập tên của bạn để bắt đầu.',
  glitch: 'Màn hình bắt đầu nhiễu.',
  hack: 'Trò đùa hư cấu: màn hình giả vờ bị xâm nhập.',
  alert: 'Cảnh báo giả: BẠN ĐÃ BỊ HACK! Đây chỉ là trò đùa.',
  character: 'Một chuyên viên an ninh mạng chạy vào.',
  pull: 'Chuyên viên gỡ các cảnh báo ra khỏi màn hình. Điện thoại vẫn an toàn.',
  reveal: 'Nhân vật tung mũ lên và đổi sang đồng phục cơ trưởng, chuyến bay được phép cất cánh.',
  flight: 'Máy bay kéo băng rôn bay ngang và thả xuống một tấm vé.',
  ticket: 'Thẻ lên máy bay đã xuất hiện. Nhân vật đổi sang áo cử nhân.',
  details: 'Bản tóm tắt chuyến bay: thông tin buổi lễ.'
};

// Flight bar: which phase of the trip each scene belongs to (the hack hides the bar).
const flightbar = document.querySelector('#flightbar');
const flightSteps = [...flightbar.querySelectorAll('li')];
const flightPhase = { name: 0, glitch: 0, character: 1, pull: 1, reveal: 2, flight: 3, ticket: 4, details: 4 };

function updateFlightbar(name) {
  const phase = flightPhase[name];
  if (phase === undefined) return;
  flightbar.style.setProperty('--fb', String(phase * 25));
  flightSteps.forEach((step, index) => {
    step.classList.toggle('done', index < phase);
    step.classList.toggle('active', index === phase);
  });
}

function haptic(pattern) {
  if (!navigator.userActivation?.hasBeenActive) return;
  try { navigator.vibrate?.(pattern); } catch { /* vibration is optional */ }
}

function burst(x, y, count = 40, power = 1) {
  if (reducedMotion.matches) return;
  const colors = ['#ffc233', '#ff6b6b', '#4cc9f0', '#7ae582', '#ffffff', '#b794f6'];
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('i');
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.width = `${5 + Math.random() * 4}px`;
    piece.style.height = `${9 + Math.random() * 6}px`;
    confetti.append(piece);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.05;
    const speed = (240 + Math.random() * 430) * power;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 900;
    const animation = piece.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${vx * 0.6}px, ${vy * 0.6}px, 0) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.38, easing: 'cubic-bezier(0.5, 0, 0.9, 0.55)' },
      { transform: `translate3d(${vx * 0.95}px, ${vy * 0.6 + 760}px, 0) rotate(${spin}deg)`, opacity: 0 }
    ], { duration: 1700 + Math.random() * 1000, easing: 'cubic-bezier(0.15, 0.7, 0.35, 1)', fill: 'forwards' });
    animation.onfinish = () => piece.remove();
  }
}

// Costume change: a white-hot flash, a ring of twinkling stars and a burst where the mascot stands.
const poof = document.querySelector('#poof');
function sparkle(x, y, count, colors) {
  for (let i = 0; i < count; i += 1) {
    const star = document.createElement('i');
    star.className = 'sparkle';
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    star.style.color = colors[i % colors.length];
    confetti.append(star);
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 90 + Math.random() * 120;
    const size = 0.6 + Math.random() * 0.9;
    const animation = star.animate([
      { transform: 'translate3d(0,0,0) scale(0) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${Math.cos(angle) * distance * 0.7}px, ${Math.sin(angle) * distance * 0.7}px, 0) scale(${size}) rotate(90deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate3d(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 30}px, 0) scale(0) rotate(180deg)`, opacity: 0 }
    ], { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' });
    animation.onfinish = () => star.remove();
  }
}
function playPoof(x, y, tone) {
  if (reducedMotion.matches) return;
  poof.style.left = `${x}px`;
  poof.style.top = `${y}px`;
  poof.classList.remove('go');
  void poof.offsetWidth;
  poof.classList.add('go');
  sparkle(x, y, 18, tone === 'captain' ? ['#ffffff', '#ffbe46', '#ffe9a8'] : ['#ffffff', '#ffd36b', '#ffe9a8']);
  burst(x, y, 30, 0.75);
}

const story = createStory({ onBurst: burst, onHaptic: haptic, onPoof: playPoof });

// 'gate' = waiting for a name, 'story' = the timeline is running (or finished).
let mode = 'gate';
let storyT = 0;
let frozen = false;
let currentScene = '';
let detailsOpen = false;

function setScene(name) {
  if (name === currentScene) return;
  currentScene = name;
  app.dataset.scene = name;
  announcer.textContent = announcements[name] || '';
  updateFlightbar(name);
  if (name === 'reveal' || name === 'character') story.measureTicket();

  const actorActive = ['character', 'pull', 'reveal', 'flight', 'ticket'].includes(name);
  nameGate.inert = name !== 'name';
  terminal.setAttribute('aria-hidden', 'true');
  alertStage.setAttribute('aria-hidden', 'true');
  actor.setAttribute('aria-hidden', String(!actorActive));
  bubble.setAttribute('aria-hidden', 'true');
  ticket.inert = name !== 'ticket';
  ticket.setAttribute('aria-hidden', String(name !== 'ticket'));
  details.inert = name !== 'details';
  details.setAttribute('aria-hidden', String(name !== 'details'));
}

function startStory(jumpToEnd) {
  mode = 'story';
  detailsOpen = false;
  frozen = false;
  story.reset();
  storyT = jumpToEnd || reducedMotion.matches ? END : 0;
}

function resetAll() {
  soundtrack.stop();
  closeHonor();
  mode = 'gate';
  detailsOpen = false;
  frozen = false;
  storyT = 0;
  currentScene = '';
  confetti.replaceChildren();
  feedback.classList.remove('show');
  lobby.classList.remove('typing', 'stamp');
  rsvpSent = false;
  rsvpRun += 1; // a send still in flight no longer owns the button
  yesButton.disabled = false;
  yesButton.innerHTML = yesDefault;
  story.reset();
  setScene('name');
}

const calmState = { t: 0, dt: 0.016, matrix: false, red: 0, flush: 0, alert: 0, warm: 0, sky: 1, push: 0, drift: 4, impulse: 0, flight: null };
let last = performance.now();
let clock = 0;
let matrixWasOn = false;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  clock += dt;

  let state = calmState;
  calmState.t = clock;
  calmState.dt = dt;
  if (mode === 'gate') {
    setScene('name');
  } else {
    if (!frozen) storyT += dt;
    state = story.apply(storyT, dt);
    setScene(detailsOpen ? 'details' : sceneAt(storyT));
  }
  if (state.matrix) {
    if (!matrixWasOn) matrix.warm(110, state.red);
    matrix.render(dt, state.red, state.flush);
  }
  matrixWasOn = state.matrix;
  soundtrack.update(state.t, mode === 'story' && !detailsOpen && !frozen);
  scene.render(state);
  window.requestAnimationFrame(frame);
}

nameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  soundtrack.unlock();
  const name = nameInput.value.replace(/\s+/g, ' ').trim().slice(0, 30);
  // The ticket, briefing, RSVP mail and PDF all carry this name, so an empty one is not accepted.
  if (!name) {
    nameForm.classList.remove('need-name');
    void nameForm.offsetWidth;
    nameForm.classList.add('need-name');
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.placeholder = 'Bạn nhập tên giúp mình nhé';
    nameInput.value = '';
    nameInput.focus();
    return;
  }
  applyGuest(name);
  story.setGuest(name);
  window.clearTimeout(typingTimer);
  lobby.classList.remove('typing');
  lobby.classList.add('stamp');
  // iOS: drop the keyboard and undo any scroll or zoom-pan it left behind before the show starts.
  nameInput.blur();
  window.scrollTo(0, 0);
  startStory(false);
});

document.querySelector('#skip').addEventListener('click', () => {
  soundtrack.stop();
  if (mode === 'story') storyT = Math.max(storyT, END);
});
document.querySelector('#replay').addEventListener('click', resetAll);
document.querySelector('#acceptTicket').addEventListener('click', () => {
  soundtrack.stop();
  detailsOpen = true;
  window.requestAnimationFrame(() => document.querySelector('#detailsTitle').focus({ preventScroll: true }));
});
const yesButton = document.querySelector('#yes');
const yesDefault = yesButton.innerHTML;
let rsvpSent = false;

// The mail relay can take 30+ s, so the guest is confirmed on the spot and the email travels in the
// background. If it ends up failing, the button comes back so they can try again.
let rsvpRun = 0;
yesButton.addEventListener('click', () => {
  if (rsvpSent || yesButton.disabled) return;
  const run = ++rsvpRun;
  rsvpSent = true;
  yesButton.disabled = true;
  yesButton.innerHTML = 'Đã giữ ghế <span aria-hidden="true">✓</span>';
  feedback.textContent = 'Đã giữ ghế 1A cho bạn! Thư xác nhận đang bay tới cơ trưởng, bạn không cần chờ đâu.';
  feedback.classList.add('show');
  const rect = yesButton.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top, 40, 0.9);
  sendRsvp({ guest: guestLabel }).then(() => {
    if (run !== rsvpRun) return;
    feedback.textContent = 'Đã giữ ghế 1A cho bạn! Cơ trưởng đã nhận được xác nhận, hẹn gặp ở cổng UIT nhé.';
  }, () => {
    if (run !== rsvpRun) return;
    rsvpSent = false;
    yesButton.disabled = false;
    yesButton.innerHTML = yesDefault;
    feedback.textContent = 'Chưa gửi được xác nhận (mạng yếu?). Bạn thử bấm lại nhé.';
  });
});
flushOutbox();
// A discovery on the ticket, independent from the wording on the graduate's sash.
const honor = document.querySelector('#honor');
const honorWrap = document.querySelector('#honorWrap');
const honorMessage = document.querySelector('#honorMessage');
const HONOR_KEY = 'grad2026-star-found';
let honorTimer;
try { honorWrap.classList.toggle('found', Boolean(localStorage.getItem(HONOR_KEY))); } catch { /* optional storage */ }
function closeHonor() {
  window.clearTimeout(honorTimer);
  honor.setAttribute('aria-expanded', 'false');
  honorMessage.hidden = true;
}
honor.addEventListener('click', () => {
  const open = honor.getAttribute('aria-expanded') !== 'true';
  closeHonor();
  if (!open) return;
  const firstDiscovery = !honorWrap.classList.contains('found');
  honorWrap.classList.add('found');
  honor.setAttribute('aria-expanded', 'true');
  honorMessage.hidden = false;
  try { localStorage.setItem(HONOR_KEY, '1'); } catch { /* optional storage */ }
  if (firstDiscovery) {
    const rect = honor.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, 0.4);
  }
  honorTimer = window.setTimeout(closeHonor, 4800);
});
document.addEventListener('click', event => { if (!honorWrap.contains(event.target)) closeHonor(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeHonor(); });

document.querySelector('#venueSave').addEventListener('click', () => {
  saveVenueCard(guestLabel).catch(() => {
    feedback.textContent = 'Chưa tạo được file PDF, bạn thử lại nhé.';
    feedback.classList.add('show');
  });
});
document.querySelector('#maybe').addEventListener('click', () => {
  feedback.textContent = 'Ok, ghế vẫn giữ cho bạn đó. (Nút này không gửi gì cả.)';
  feedback.classList.add('show');
});

reducedMotion.addEventListener('change', (event) => {
  if (event.matches && mode === 'story') storyT = Math.max(storyT, END);
});

let resizeFrame = 0;
window.addEventListener('resize', () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    scene.resize();
    matrix.resize();
    story.layout();
    fitLobby();
  });
}, { passive: true });
// Phones resize the visible area when the URL bar or keyboard slides; re-measure then too.
window.visualViewport?.addEventListener('resize', () => window.dispatchEvent(new Event('resize')), { passive: true });

window.addEventListener('pagehide', () => { soundtrack.dispose(); scene.dispose(); });

// Check-in hall: the traveller walks in and the attendant greets before the name card arrives. Any tap, key
// press or typing skips straight to the card, and replays (or reduced motion) go straight there.
const INTRO_MS = 3100;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
let introTimer = 0;

// On portrait phones the card leaves only a strip below it; size the two characters to stand in that strip.
function fitLobby() {
  if (window.innerWidth >= 700) { lobby.style.removeProperty('--char'); return; }
  const room = window.innerHeight - document.querySelector('.name-card').getBoundingClientRect().bottom - 18;
  lobby.style.setProperty('--char', `${Math.round(Math.min(150, Math.max(64, room)))}px`);
}

function endIntro() {
  if (!app.classList.contains('lobby-intro')) return;
  window.clearTimeout(introTimer);
  app.classList.remove('lobby-intro');
  lobby.classList.remove('playing');
  nameGate.inert = currentScene !== 'name';
  if (!coarsePointer) nameInput.focus({ preventScroll: true });
  fitLobby();
}

setScene('name');
fitLobby();
if (reducedMotion.matches) {
  if (!coarsePointer) nameInput.focus({ preventScroll: true });
} else {
  app.classList.add('lobby-intro');
  lobby.classList.add('playing');
  nameGate.inert = true;
  introTimer = window.setTimeout(endIntro, INTRO_MS);
  app.addEventListener('pointerdown', endIntro, { once: true });
  window.addEventListener('keydown', endIntro, { once: true });
}

// While the guest types, the attendant looks down and taps her terminal.
let typingTimer = 0;
nameInput.addEventListener('input', () => {
  endIntro();
  nameForm.classList.remove('need-name');
  nameInput.removeAttribute('aria-invalid');
  lobby.classList.add('typing');
  window.clearTimeout(typingTimer);
  typingTimer = window.setTimeout(() => lobby.classList.remove('typing'), 900);
});
window.requestAnimationFrame(frame);

if (import.meta.env.DEV) {
  window.__card = {
    seek(t) {
      soundtrack.stop();
      if (mode !== 'story') startStory(false);
      story.reset();
      storyT = toStoryTime(t); // `t` is design time; playback is warped
      frozen = true;
    },
    play() { frozen = false; },
    // Runs the rain forward so a slow preview shows how it looks at full frame rate.
    stepMatrix(frames, red = 0) {
      matrix.warm(frames, red);
    },
    get time() { return storyT; },
    get sound() { return soundtrack.status; }
  };
  const preview = new URLSearchParams(window.location.search).get('preview');
  const previewStart = { flight: T.reveal, hacker: T.mascot, graduate: T.ticket }[preview];
  if (previewStart !== undefined) {
    window.__card.seek(previewStart);
    window.__card.play();
  }
}
