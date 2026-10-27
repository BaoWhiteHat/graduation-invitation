import test from 'node:test';
import assert from 'node:assert/strict';
import { alertLayout } from '../src/alert-layout.js';

for (const [width, height] of [[1440, 900], [1280, 800], [844, 390], [390, 844]]) {
  test(`alert storm reaches both sides without mirrored rows at ${width}x${height}`, () => {
    const { rest, pops } = alertLayout(width, height);
    assert.ok(pops.filter(pop => pop.x < 0).length >= 5);
    assert.ok(pops.filter(pop => pop.x > 0).length >= 5);
    assert.ok(new Set(pops.map(pop => pop.y)).size >= 10);
    assert.ok(pops.some((pop, i) => i % 2 === 0 && pop.y !== pops[i + 1].y));
    assert.ok(new Set(pops.map(pop => pop.scale)).size >= 3);
    assert.deepEqual(alertLayout(width, height), alertLayout(width, height), 'replay keeps the authored cascade');
    assert.equal(rest.C.x, 0);
  });
}
