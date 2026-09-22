// utils/text_to_speech.js

let voicesCache = [];
let currentUtterance = null;
let currentResolve = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const cancelSpeak = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}
  if (currentResolve) {
    const r = currentResolve;
    currentResolve = null;
    currentUtterance = null;
    r();
  }
};

/**
 * @param {string} text
 * @param {{ speed?: number, rate?: number, pitch?: number, volume?: number }} [opts]
 * @returns {Promise<void>}
 */
export const speakText = (text, opts = {}) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API không được hỗ trợ trong trình duyệt này');
    return Promise.resolve();
  }

  if (!text) return Promise.resolve();

  cancelSpeak();

  if (!voicesCache.length) {
    voicesCache = window.speechSynthesis.getVoices();
  }

  const jaVoice = voicesCache.find((voice) => voice.lang.includes('ja'));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  // speed: bội số (1 = bình thường). rate là giá trị engine dùng.
  utterance.rate = opts.rate ?? opts.speed ?? 0.9;
  if (opts.pitch != null) utterance.pitch = opts.pitch;
  if (opts.volume != null) utterance.volume = opts.volume;

  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  currentUtterance = utterance;

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (currentUtterance === utterance) {
        currentUtterance = null;
        currentResolve = null;
      }
      resolve();
    };

    currentResolve = finish;

    utterance.onend = finish;
    utterance.onerror = (e) => {
      if (e?.error && e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('TTS Error:', e);
      }
      finish();
    };

    setTimeout(() => {
      if (done || currentUtterance !== utterance) {
        finish();
        return;
      }
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('TTS speak() failed:', e);
        finish();
      }
    }, 10);
  });
};