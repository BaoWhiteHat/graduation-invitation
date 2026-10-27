import { HACK_AUDIO, T, toDesignTime, toStoryTime } from './story.js';

export const AUDIO_FILES = {
  typing: '/audio/binary-data.wav',
  warning: '/audio/binary-alert.wav',
  confirm: '/audio/binary-release.wav',
  intrusion: '/audio/hacking-burst.wav'
};

export const MUSIC_FILE = '/audio/crypto-bed.mp3';

export function musicLevel(t) {
  if (t < T.hack || t >= T.reveal) return 0;
  const fadeIn = Math.min(1, (toStoryTime(t) - toStoryTime(T.hack)) / 1.2);
  if (t < T.alert) return .38 * fadeIn;
  if (t < T.mascot) return .5;
  if (t < T.yank) return .14;
  return .12 * (1 - (t - T.yank) / (T.reveal - T.yank));
}

function cut(id, from, clip, offset, length, gain, rate = 1) {
  return { id, from, to: toDesignTime(toStoryTime(from) + length / rate), clip, offset, length, gain, rate, loop: false };
}

export const AUDIO_CUES = [
  ...HACK_AUDIO.lines.flatMap((line, i) => [
    { ...cut(`type-${i}`, line.at, 'typing', .12 + i % 4 * 1.12, .94, .38, .96 + i % 3 * .04), to: line.until, loop: true },
    cut(`confirm-${i}`, line.tagAt, 'confirm', .15 + i % 5 * .7, .12, .18)
  ]),
  cut('upload-complete', HACK_AUDIO.done, 'confirm', 1.9, .48, .34),
  cut('access-granted', HACK_AUDIO.access, 'confirm', 3.6, .72, .32),
  { ...cut('red-intrusion', T.alert, 'intrusion', .25, 2.6, .32, .88), to: T.mascot, loop: true },
  ...HACK_AUDIO.popups.map((at, i) => cut(`popup-${i}`, at, 'warning', .1 + i % 8 * .62, .16, .22, .95 + i % 3 * .05)),
  ...HACK_AUDIO.glitches.filter(at => at < T.mascot).map((at, i) => cut(`glitch-${i}`, at, 'warning', 1.1 + i * .8, .19, .24, .83)),
  cut('rescue-arrives', T.mascot + .25, 'intrusion', 5.8, .4, .24, 1.12),
  cut('threat-removed', T.yank + .1, 'confirm', 4.4, .85, .36, .92)
];

export function activeSoundCues(t) {
  return AUDIO_CUES.filter(cue => t >= cue.from && t < cue.to);
}

export function cueOffset(cue, t) {
  const elapsed = Math.max(0, toStoryTime(t) - toStoryTime(cue.from)) * cue.rate;
  return cue.offset + (cue.loop ? elapsed % cue.length : Math.min(elapsed, cue.length));
}
