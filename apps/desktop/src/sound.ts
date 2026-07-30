// Synthesized sound effects — no external audio assets, generated on the fly
// with the Web Audio API so the app stays self-contained.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function envelopeGain(audioCtx: AudioContext, peak: number, attack: number, decay: number, startTime: number): GainNode {
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);
  return gain;
}

function playTone(freq: number, startOffset: number, duration: number, peak = 0.25, type: OscillatorType = 'sine'): void {
  const audioCtx = getCtx();
  const start = audioCtx.currentTime + startOffset;
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = envelopeGain(audioCtx, peak, 0.005, duration, start);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** A short burst of filtered noise — reads as a wood-on-wood tap, fitting the piece tiles. */
function playNoiseTap(startOffset: number, duration: number, filterFreq: number, peak = 0.3): void {
  const audioCtx = getCtx();
  const start = audioCtx.currentTime + startOffset;
  const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 1.2;
  const gain = envelopeGain(audioCtx, peak, 0.002, duration, start);
  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start(start);
  noise.stop(start + duration + 0.02);
}

export function playMoveSound(): void {
  playNoiseTap(0, 0.08, 1150, 0.35);
}

export function playDropSound(): void {
  playNoiseTap(0, 0.13, 600, 0.42);
  playTone(170, 0.01, 0.09, 0.15, 'sine');
}

export function playCheckSound(): void {
  playTone(740, 0, 0.09, 0.22, 'triangle');
  playTone(988, 0.09, 0.13, 0.22, 'triangle');
}

export function playCheckmateSound(): void {
  playTone(880, 0, 0.16, 0.25, 'triangle');
  playTone(660, 0.15, 0.16, 0.25, 'triangle');
  playTone(440, 0.3, 0.35, 0.28, 'triangle');
}

export function playMoveOutcomeSounds(applied: { move: { kind: 'move' | 'drop' }; check: boolean; checkmate: boolean }): void {
  if (applied.move.kind === 'drop') playDropSound();
  else playMoveSound();

  if (applied.checkmate) playCheckmateSound();
  else if (applied.check) playCheckSound();
}
