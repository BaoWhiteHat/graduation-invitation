import test from 'node:test';
import assert from 'node:assert/strict';
import { sendRsvp, flushOutbox } from '../src/rsvp.js';

const OUTBOX_KEY = 'grad2026-rsvp-outbox';
const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const makeStorage = (initial) => {
  const data = new Map(initial ? [[OUTBOX_KEY, JSON.stringify(initial)]] : []);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    outbox: () => JSON.parse(data.get(OUTBOX_KEY) || '[]')
  };
};
const instant = { sleep: async () => {}, delays: [0, 0] };

test('uses Web3Forms when a key is configured and FormSubmit otherwise', async () => {
  const urls = [];
  const fetchImpl = async (url) => { urls.push(url); return reply({ success: true }); };
  await sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage: makeStorage(), key: 'abc' });
  await sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage: makeStorage(), key: '' });
  assert.equal(urls[0], 'https://api.web3forms.com/submit');
  assert.match(urls[1], /^https:\/\/formsubmit\.co\/ajax\//);
});

test('the mail carries the guest and a confirmation code, and the outbox is empty after delivery', async () => {
  const storage = makeStorage();
  let sent;
  const fetchImpl = async (url, init) => { sent = JSON.parse(init.body); assert.equal(init.keepalive, true); return reply({ success: 'true' }); };
  await sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage, key: '' });
  assert.equal(sent['Khách mời'], 'An');
  assert.match(sent['Mã xác nhận'], /^\w{8}$/);
  assert.deepEqual(storage.outbox(), []);
});

test('retries network errors and server errors with the same confirmation code', async () => {
  const codes = [];
  const outcomes = [() => { throw new TypeError('offline'); }, () => reply({}, 503), () => reply({ success: true })];
  const fetchImpl = async (url, init) => { codes.push(JSON.parse(init.body)['Mã xác nhận']); return outcomes[codes.length - 1](); };
  await sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage: makeStorage(), key: '' });
  assert.equal(codes.length, 3);
  assert.equal(new Set(codes).size, 1);
});

test('does not retry a refusal, and rejects so the page can offer another try', async () => {
  let calls = 0;
  const storage = makeStorage();
  const fetchImpl = async () => { calls += 1; return reply({ success: 'false', message: 'not activated' }); };
  await assert.rejects(sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage, key: '' }), /not activated/);
  assert.equal(calls, 1);
  assert.deepEqual(storage.outbox(), [], 'the page owns a failed send, so nothing is replayed later');
});

test('gives up after the retries run out', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new TypeError('offline'); };
  await assert.rejects(sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage: makeStorage(), key: '' }));
  assert.equal(calls, 3);
});

test('a send cut off by a closed tab is replayed on the next visit and marked as a resend', async () => {
  const now = Date.now();
  const storage = makeStorage([{ id: 'abc12345', guest: 'An', at: now - 60000 }, { id: 'old00000', guest: 'Bo', at: now - 8 * 24 * 3600 * 1000 }]);
  const bodies = [];
  const fetchImpl = async (url, init) => { bodies.push(JSON.parse(init.body)); return reply({ success: true }); };
  await flushOutbox({ ...instant, fetchImpl, storage, key: '', now });
  assert.equal(bodies.length, 1, 'week-old entries are dropped');
  assert.equal(bodies[0]['Mã xác nhận'], 'abc12345');
  assert.ok(bodies[0]['Ghi chú']);
  assert.deepEqual(storage.outbox(), []);
});

test('a replay that fails stays queued', async () => {
  const now = Date.now();
  const storage = makeStorage([{ id: 'abc12345', guest: 'An', at: now }]);
  const fetchImpl = async () => { throw new TypeError('offline'); };
  await flushOutbox({ ...instant, fetchImpl, storage, key: '', now });
  assert.equal(storage.outbox().length, 1);
});

test('works without any storage', async () => {
  const fetchImpl = async () => reply({ success: true });
  await sendRsvp({ guest: 'An' }, { ...instant, fetchImpl, storage: undefined, key: '' });
  await flushOutbox({ ...instant, fetchImpl, storage: undefined, key: '' });
});
