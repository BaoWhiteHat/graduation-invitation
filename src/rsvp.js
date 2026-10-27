// RSVP delivery. A browser can't speak SMTP, so the confirmation goes through a form relay that
// emails the host. Two relays are supported:
//  - Web3Forms (set VITE_WEB3FORMS_KEY): usually answers in about a second, so the host gets the mail fast.
//  - FormSubmit (default): needs no key, but it sends the mail before it answers and often takes
//    30-40 s from Vietnam. The first-ever submission makes it email the host an activation link.
// Whichever is used, the guest never has to wait for it: main.js confirms on screen at once and this
// module delivers in the background, retrying on network trouble and surviving a closed tab.
const HOST_EMAIL = 'lequocbao2222005@gmail.com';
const FLIGHT = 'GRAD-2026 · BCU × UIT · Hội trường A, UIT · 16/11/2026 · 13:00 – 16:00';

const FORMSUBMIT = { url: `https://formsubmit.co/ajax/${HOST_EMAIL}`, timeoutMs: 75000 };
const WEB3FORMS = { url: 'https://api.web3forms.com/submit', timeoutMs: 15000 };

const OUTBOX_KEY = 'grad2026-rsvp-outbox';
const OUTBOX_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const RETRY_DELAYS_MS = [1500, 4000];

function defaultKey() {
  return import.meta.env?.VITE_WEB3FORMS_KEY || '';
}

function newId() {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/\W/g, '').slice(0, 8);
}

function buildRequest(entry, key) {
  const fields = {
    'Khách mời': entry.guest,
    'Phản hồi': 'Xác nhận có mặt',
    'Chuyến bay': FLIGHT,
    'Gửi lúc': new Date(entry.at).toLocaleString('vi-VN'),
    // Same code on every retry, so the host can spot a duplicate.
    'Mã xác nhận': entry.id
  };
  if (entry.resent) fields['Ghi chú'] = 'Gửi lại vì lần trước có thể chưa tới';
  const subject = `[GRAD-2026] ${entry.guest} xác nhận có mặt`;
  return key
    ? { ...WEB3FORMS, body: { access_key: key, subject, from_name: 'Thiệp mời GRAD-2026', ...fields } }
    : { ...FORMSUBMIT, body: { _subject: subject, _template: 'table', _captcha: 'false', ...fields } };
}

function retryable(message) {
  return Object.assign(new Error(message), { retryable: true });
}

async function attempt(entry, { fetchImpl, key }) {
  const request = buildRequest(entry, key);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs);
  try {
    let response;
    try {
      response = await fetchImpl(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request.body),
        signal: controller.signal,
        // Lets the request finish even if the guest closes the page right after confirming.
        keepalive: true
      });
    } catch {
      throw retryable('RSVP network error');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || `RSVP failed (${response.status})`);
      error.retryable = response.status >= 500 || response.status === 429;
      throw error;
    }
    // The relays answer 200 even when they refuse (inactive form, bad key), and retrying won't help.
    if (data.success === 'false' || data.success === false) throw new Error(data.message || 'RSVP refused');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function deliver(entry, options) {
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const delays = options.delays ?? RETRY_DELAYS_MS;
  for (let tries = 0; ; tries += 1) {
    try {
      return await attempt(entry, options);
    } catch (error) {
      if (!error.retryable || tries >= delays.length) throw error;
      await sleep(delays[tries]);
    }
  }
}

// The outbox only holds RSVPs that were still in flight; a page that is closed mid-send leaves its entry
// behind and the next visit sends it again.
function readOutbox(storage) {
  try { return JSON.parse(storage.getItem(OUTBOX_KEY)) || []; } catch { return []; }
}

function writeOutbox(storage, entries) {
  try { storage.setItem(OUTBOX_KEY, JSON.stringify(entries)); } catch { /* optional storage */ }
}

function defaultStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

function withDefaults(options = {}) {
  return {
    fetchImpl: options.fetchImpl ?? ((...args) => fetch(...args)),
    storage: options.storage ?? defaultStorage(),
    key: options.key ?? defaultKey(),
    sleep: options.sleep,
    delays: options.delays,
    now: options.now ?? Date.now()
  };
}

export async function sendRsvp({ guest }, options) {
  const settings = withDefaults(options);
  const entry = { id: newId(), guest, at: settings.now };
  writeOutbox(settings.storage, [...readOutbox(settings.storage), entry]);
  try {
    return await deliver(entry, settings);
  } finally {
    // Delivered or failed for good, the page now owns the outcome (the guest can press the button again).
    writeOutbox(settings.storage, readOutbox(settings.storage).filter((item) => item.id !== entry.id));
  }
}

export async function flushOutbox(options) {
  const settings = withDefaults(options);
  const pending = readOutbox(settings.storage).filter((entry) => settings.now - entry.at < OUTBOX_MAX_AGE_MS);
  writeOutbox(settings.storage, pending);
  await Promise.allSettled(pending.map(async (entry) => {
    try {
      await deliver({ ...entry, resent: true }, settings);
      writeOutbox(settings.storage, readOutbox(settings.storage).filter((item) => item.id !== entry.id));
    } catch { /* stays queued for the next visit */ }
  }));
}
