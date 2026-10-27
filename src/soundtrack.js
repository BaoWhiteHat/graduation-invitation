import { T, toStoryTime } from './story.js';
import { activeSoundCues, AUDIO_FILES, MUSIC_FILE, musicLevel, cueOffset } from './audio-cues.js';

export function prepareAudioCut(ctx, buffer, cue) {
  const from = Math.round(cue.offset * buffer.sampleRate);
  const frames = Math.min(Math.round(cue.length * buffer.sampleRate), buffer.length - from);
  const cut = ctx.createBuffer(buffer.numberOfChannels, frames, buffer.sampleRate);
  const fade = Math.min(Math.round(.005 * buffer.sampleRate), frames / 2);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = cut.getChannelData(channel);
    data.set(buffer.getChannelData(channel).subarray(from, from + frames));
    for (let i = 0; i < fade; i++) {
      data[i] *= i / fade;
      data[frames - 1 - i] *= i / fade;
    }
  }
  return cut;
}

export function scoreCue(t) {
  if (t < T.hack || t >= T.reveal) return null;
  if (t < 4.45) return { phase: 'terminal', level: .8 };
  if (t < T.alert) return { phase: 'breach', level: .65 };
  if (t < T.mascot) return { phase: 'alert', level: 1 };
  if (t < T.yank) return { phase: 'rescue', level: .3 };
  return { phase: 'resolved', level: .65 * (1 - (t - T.yank) / (T.reveal - T.yank)) };
}

export function createSoundtrack(button) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const preferenceKey = 'grad2026-sound';
  let enabled = true;
  try { enabled = localStorage.getItem(preferenceKey) !== 'off'; } catch { /* optional storage */ }
  let ctx, master, ready, phase = '';
  let musicVoice;
  const buffers = new Map();
  const cuts = new Map();
  const voices = new Map();
  let painted = '';
  // Fetch during check-in; decoding and playback still require a gesture.
  const files = new Map(Object.entries({ ...AUDIO_FILES, music: MUSIC_FILE }).map(([name, url]) => [name,
    fetch(`${import.meta.env.BASE_URL}${url.slice(1)}`).then(response => { if (!response.ok) throw Error(`Audio ${response.status}`); return response.arrayBuffer(); }).catch(() => null)
  ]));

  function paint() {
    const playing = Boolean(musicVoice && !musicVoice.ended) || [...voices.values()].some(voice => !voice.ended);
    const key = `${enabled}:${playing}`;
    if (key === painted) return;
    painted = key;
    button.dataset.enabled = String(enabled);
    button.dataset.playing = String(playing);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Tắt nhạc' : 'Bật nhạc');
    button.querySelector('span').textContent = enabled ? 'Tắt nhạc' : 'Bật nhạc';
  }

  function release(voice) {
    if (voice.ended) return;
    voice.ended = true;
    voice.gain.gain.cancelScheduledValues(ctx.currentTime);
    voice.gain.gain.setTargetAtTime(0, ctx.currentTime, voice.fade || .012);
    voice.source.stop(ctx.currentTime + (voice.fade ? voice.fade * 4 : .065));
  }

  function stop() {
    for (const voice of voices.values()) release(voice);
    voices.clear();
    if (musicVoice) release(musicVoice);
    musicVoice = undefined;
    phase = '';
    paint();
  }

  function unlock() {
    if (!enabled || !AudioContextClass) return;
    try {
      if (!ctx) {
        ctx = new AudioContextClass();
        master = ctx.createGain();
        master.gain.value = .65;
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 16;
        compressor.ratio.value = 4;
        master.connect(compressor).connect(ctx.destination);
        ready = Promise.allSettled([...files].map(async ([name, bytes]) => {
          const data = await bytes;
          if (data) buffers.set(name, await ctx.decodeAudioData(data));
        }));
      }
      ctx.resume().catch(() => { enabled = false; stop(); });
    } catch {
      enabled = false;
      stop();
    }
  }

  function play(cue, t, level) {
    const buffer = buffers.get(cue.clip);
    if (!buffer) return;
    const offset = cueOffset(cue, t) - cue.offset;
    if (!cuts.has(cue.id)) cuts.set(cue.id, prepareAudioCut(ctx, buffer, cue));
    const cut = cuts.get(cue.id);
    const remaining = cut.duration - offset;
    if (!cue.loop && remaining <= .015) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = cut;
    source.playbackRate.value = cue.rate;
    source.loop = cue.loop;
    source.loopStart = 0;
    source.loopEnd = cut.duration;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(cue.gain * level, ctx.currentTime, .01);
    source.connect(gain).connect(master);
    const voice = { source, gain, ended: false };
    voices.set(cue.id, voice);
    source.onended = () => { voice.ended = true; source.disconnect(); gain.disconnect(); paint(); };
    if (cue.loop) source.start(ctx.currentTime, offset);
    else source.start(ctx.currentTime, offset, remaining);
  }

  function updateMusic(t) {
    const buffer = buffers.get('music');
    if (!buffer) return;
    if (!musicVoice) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = 0;
      source.connect(gain).connect(master);
      const voice = { source, gain, ended: false, fade: .045 };
      musicVoice = voice;
      source.onended = () => {
        voice.ended = true;
        source.disconnect(); gain.disconnect();
        if (musicVoice === voice) musicVoice = undefined;
        paint();
      };
      source.start(ctx.currentTime, Math.max(0, toStoryTime(t) - toStoryTime(T.hack)) % buffer.duration);
    }
    musicVoice.gain.gain.setTargetAtTime(musicLevel(t), ctx.currentTime, .18);
  }

  function update(t, playing) {
    const score = playing && !document.hidden ? scoreCue(t) : null;
    if (!enabled || !score || !ctx || ctx.state !== 'running') {
      if (phase || voices.size) stop();
      return;
    }
    phase = score.phase;
    updateMusic(t);
    const cues = activeSoundCues(t);
    const wanted = new Set(cues.map(cue => cue.id));
    for (const [id, voice] of voices) {
      if (!wanted.has(id)) { release(voice); voices.delete(id); }
    }
    for (const cue of cues) {
      if (!voices.has(cue.id)) play(cue, t, score.level);
    }
    paint();
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch { /* optional storage */ }
    if (enabled) unlock(); else stop();
    paint();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  if (!AudioContextClass) button.hidden = true;
  paint();

  return {
    unlock, update, stop,
    dispose() { stop(); ctx?.close().catch(() => {}); },
    get ready() { return ready; },
    get status() { return { enabled, playing: Boolean(musicVoice && !musicVoice.ended) || [...voices.values()].some(voice => !voice.ended), music: Boolean(musicVoice && !musicVoice.ended), musicLevel: musicVoice?.gain.gain.value || 0, phase, context: ctx?.state || 'locked', assets: [...buffers.keys()], cues: [...voices.keys()] }; }
  };
}
