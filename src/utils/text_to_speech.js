// utils/text_to_speech.js hoặc utils/ultis.js
export const speakText = (text) => {
  if ('speechSynthesis' in window) {
    // Nếu hệ thống đang đọc hoặc có văn bản trong hàng đợi, dừng ngay lập tức
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }

    // Khởi tạo đối tượng đọc văn bản mới
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  } else {
    alert('Web Speech API không được hỗ trợ trong trình duyệt này');
  }
};