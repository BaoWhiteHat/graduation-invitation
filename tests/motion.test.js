import test from 'node:test';
import assert from 'node:assert/strict';
import { flightPath } from '../src/motion.js';
import { T, toStoryTime } from '../src/story.js';

for (const [width, height] of [[1440, 1000], [844, 390], [390, 844]]) {
  test(`aircraft holds its delivery position around the letter drop at ${width}x${height}`, () => {
    const release = (T.release - T.flight) / T.flightLength;
    const dropPose = flightPath(release, width, height);
    for (const p of [.34, .45, release, .65, .66]) {
      const pose = flightPath(p, width, height);
      assert.ok(Math.abs(pose.x - dropPose.x) < .001, 'delivery must not drift horizontally');
      assert.ok(Math.abs(pose.y - dropPose.y) < .001, 'delivery must not drift vertically');
      assert.equal(pose.scale, dropPose.scale);
      assert.ok(Math.abs(pose.angle) < .01);
      assert.ok(pose.x - 552 * pose.scale >= -width / 2 + 16);
      assert.ok(pose.x + 90 * pose.scale <= width / 2 - 16);
    }
    assert.ok(toStoryTime(T.flight + T.flightLength * .66) - toStoryTime(T.flight + T.flightLength * .34) >= 2);
    assert.ok(flightPath(.2, width, height).x < dropPose.x);
    assert.ok(flightPath(.85, width, height).x > dropPose.x);
  });
}

test('hacker dialogue leaves enough time to read before it disappears', () => {
  assert.ok(toStoryTime(13.9) - toStoryTime(11.35) >= 5.5);
  assert.ok(toStoryTime(17.45) - toStoryTime(14.2) >= 6.5);
});

test('phone tracking shot holds the entire banner in view long enough to read', () => {
  for (let p = .34; p <= .66; p += .01) {
    const pose = flightPath(p, 390, 844);
    assert.ok(pose.x - 552 * pose.scale >= -195 + 16);
    assert.ok(pose.x + 90 * pose.scale <= 195 - 16);
    assert.ok(Math.abs(pose.angle) < .01);
  }
  assert.ok(toStoryTime(20.6 + 4.6 * .66) - toStoryTime(20.6 + 4.6 * .34) >= 2);
});

for (const [width, height] of [[1440, 1000], [390, 844], [844, 390]]) {
  test(`plane stays in the upper flight lane at ${width}x${height}`, () => {
    let bannerFullyVisible = false;
    for (let step = 0; step <= 100; step++) {
      const pose = flightPath(step / 100, width, height);
      const screenY = height / 2 - pose.y;
      assert.ok(screenY >= height * .18 && screenY <= height * .38);
      assert.ok(Math.abs(pose.angle) <= .15);
      assert.ok(pose.scale <= 1.02);
      if (pose.x - 552 * pose.scale >= -width / 2 + 16 && pose.x + 90 * pose.scale <= width / 2 - 16) bannerFullyVisible = true;
    }
    assert.ok(flightPath(0, width, height).x < -width / 2);
    assert.ok(flightPath(1, width, height).x > width / 2);
    assert.ok(bannerFullyVisible, 'the complete banner and plane must fit together at least once');
    assert.ok(flightPath(.5, width, height).scale > flightPath(0, width, height).scale, 'plane approaches then recedes');
  });
}
