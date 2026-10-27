import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scoreCue } from '../src/soundtrack.js';
import { T } from '../src/story.js';
import { HACK_AUDIO, toStoryTime } from '../src/story.js';
import { AUDIO_CUES, activeSoundCues, cueOffset } from '../src/audio-cues.js';
import { AUDIO_FILES, MUSIC_FILE, musicLevel } from '../src/audio-cues.js';

test('a separate music track continues under SFX pauses and ducks for the rescue', () => {
  const bytes = readFileSync(new URL(`../public${MUSIC_FILE}`, import.meta.url));
  assert.ok(bytes.length > 100000);
  assert.ok(musicLevel((HACK_AUDIO.hang[0] + HACK_AUDIO.hang[1]) / 2) > 0);
  assert.ok(musicLevel(T.mascot) < musicLevel(T.alert) * .4);
  assert.equal(musicLevel(0), 0);
  assert.equal(musicLevel(T.reveal), 0);
});

test('all edited audio cuts fit inside playable PCM source files', () => {
  const durations = {};
  for (const [name, path] of Object.entries(AUDIO_FILES)) {
    const bytes = readFileSync(new URL(`../public${path}`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
    assert.equal(bytes.readUInt16LE(20), 1);
    durations[name] = bytes.readUInt32LE(40) / bytes.readUInt32LE(28);
  }
  for (const cue of AUDIO_CUES) {
    assert.ok(cue.offset + cue.length <= durations[cue.clip], cue.id);
    assert.ok(cue.to > cue.from, cue.id);
  }
});

test('score is confined to the hacking story, leaving check-in and invitation quiet', () => {
  for (const t of [-1, 0, T.hack - .001, T.reveal, T.ticket, 100]) {
    assert.equal(scoreCue(t), null);
  }
  assert.equal(scoreCue(T.hack).phase, 'terminal');
});

test('access granted leaves a breath before the red alarm', () => {
  const terminal = scoreCue(4);
  const breach = scoreCue(5);
  assert.equal(breach.phase, 'breach');
  assert.ok(breach.level < terminal.level);
});

test('red malware has its own sound and the mascot ducks it', () => {
  const alert = scoreCue(T.alert);
  const rescue = scoreCue(T.mascot);
  assert.equal(alert.phase, 'alert');
  assert.ok(activeSoundCues(T.alert).some(cue => cue.clip === 'intrusion'));
  assert.ok(rescue.level < alert.level * .4);
});

test('typing clips follow each visible line and stop in the pauses', () => {
  for (const line of HACK_AUDIO.lines) {
    assert.ok(activeSoundCues((line.at + line.until) / 2).some(cue => cue.id.startsWith('type-')));
    assert.ok(!activeSoundCues(line.until + .001).some(cue => cue.id.startsWith('type-')));
  }
  assert.equal(activeSoundCues((HACK_AUDIO.hang[0] + HACK_AUDIO.hang[1]) / 2).length, 0);
});

test('each popup receives a short cut at the same timestamp', () => {
  HACK_AUDIO.popups.forEach((at, i) => assert.ok(activeSoundCues(at).some(cue => cue.id === `popup-${i}`)));
});

test('loop resumes at its story position rather than restarting the source', () => {
  const cue = AUDIO_CUES.find(cue => cue.id === 'type-0');
  const t = (cue.from + cue.to) / 2;
  const elapsed = (toStoryTime(t) - toStoryTime(cue.from)) * cue.rate;
  assert.ok(Math.abs(cueOffset(cue, t) - (cue.offset + elapsed % cue.length)) < .00001);
});

test('removing the threat resolves the score and fades it away', () => {
  assert.equal(scoreCue(T.yank - .001).phase, 'rescue');
  assert.equal(scoreCue(T.yank).phase, 'resolved');
  assert.ok(scoreCue(T.reveal - .01).level < .005);
});
