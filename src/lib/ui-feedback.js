let audioContext = null;

function getAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playTone(context, {
  startAt,
  frequency,
  duration,
  volume = 0.035,
  type = "sine",
}) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function vibrate(pattern) {
  if (typeof navigator.vibrate !== "function") return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported vibration calls.
  }
}

export function playSuccessFeedback() {
  vibrate([24]);

  const context = getAudioContext();
  if (!context) return;

  const startAt = context.currentTime;
  playTone(context, {
    startAt,
    frequency: 1046,
    duration: 0.06,
    volume: 0.028,
    type: "triangle",
  });
  playTone(context, {
    startAt: startAt + 0.045,
    frequency: 1318,
    duration: 0.08,
    volume: 0.022,
    type: "sine",
  });
}

export function playErrorFeedback() {
  vibrate([42, 36, 70]);

  const context = getAudioContext();
  if (!context) return;

  const startAt = context.currentTime;
  playTone(context, {
    startAt,
    frequency: 220,
    duration: 0.08,
    volume: 0.03,
    type: "triangle",
  });
  playTone(context, {
    startAt: startAt + 0.12,
    frequency: 185,
    duration: 0.1,
    volume: 0.028,
    type: "sawtooth",
  });
}
