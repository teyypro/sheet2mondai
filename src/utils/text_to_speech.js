// utils/text_to_speech.js

let voicesCache = [];

// Khai báo trước danh sách voice
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const speakText = (text) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API không được hỗ trợ trong trình duyệt này');
    return;
  }

  if (!text) return;

  // Lấy lại danh sách giọng đọc nếu cache trống
  if (!voicesCache.length) {
    voicesCache = window.speechSynthesis.getVoices();
  }

  // Tìm giọng đọc tiếng Nhật phù hợp
  const jaVoice = voicesCache.find((voice) => voice.lang.includes('ja'));

  // Tạo đối tượng phát âm
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;

  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  // Trên di động, gán sự kiện end/error để giải phóng bộ nhớ
  utterance.onend = () => {};
  utterance.onerror = (e) => {
    console.error('TTS Error:', e);
  };

  // Khắc phục lỗi treo voice engine trên iOS bằng cách hủy và nói ngay trong microtask
  window.speechSynthesis.cancel();

  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 10);
};