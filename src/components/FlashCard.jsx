import React, { useState, useEffect, useRef } from 'react';

function FlashCard({ data, hiraCol, speakText }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(null); // null = hiển thị tất cả
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const autoPlayTimerRef = useRef(null);

  const clearAutoPlayTimer = () => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Chuẩn bị dữ liệu
  useEffect(() => {
    if (!data || !data.length) {
      setCards([]);
      return;
    }

    const cardData = data.map((row, index) => ({
      row: row,
      index: index,
      id: `${index}-${Date.now()}`,
    }));

    setCards(cardData);
    setCurrentIndex(0);
    setDisplayIndex(null);
    setIsComplete(false);
    setIsPlaying(false);
  }, [data]);

  // Hàm phát âm dựa trên sự kiện thực tế (onend) của Web Speech API
  const speakAndExecuteReal = (text, onFinished) => {
    if (!text) {
      autoPlayTimerRef.current = setTimeout(() => {
        if (onFinished) onFinished();
      }, 1000);
      return;
    }

    // Kiểm tra nếu hệ thống dùng Web Speech API chuẩn
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Dừng câu phát âm trước đó
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP'; // Mặc định tiếng Nhật cho Hiragana

      utterance.onend = () => {
        // Sau khi đọc xong thực tế, chờ thêm đúng 1 giây rồi mới thực thi tiếp
        autoPlayTimerRef.current = setTimeout(() => {
          if (onFinished) onFinished();
        }, 1000);
      };

      utterance.onerror = () => {
        autoPlayTimerRef.current = setTimeout(() => {
          if (onFinished) onFinished();
        }, 1000);
      };

      window.speechSynthesis.speak(utterance);
    } else if (typeof speakText === 'function') {
      // Trường hợp speakText là hàm tùy biến bên ngoài truyền vào
      speakText(text);
      // Dự phòng nếu speakText không trả về Promise hay callback
      autoPlayTimerRef.current = setTimeout(() => {
        if (onFinished) onFinished();
      }, 2000);
    } else {
      autoPlayTimerRef.current = setTimeout(() => {
        if (onFinished) onFinished();
      }, 1000);
    }
  };

  // Vòng lặp Auto Play
  useEffect(() => {
    clearAutoPlayTimer();

    if (!isPlaying || isComplete || !cards.length) return;

    const currentCard = cards[currentIndex];
    const textToSpeak = currentCard?.row?.[hiraCol];

    speakAndExecuteReal(textToSpeak, () => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        // Giữ nguyên displayIndex, không reset khi chuyển thẻ
      } else {
        setIsPlaying(false);
        setIsComplete(true);
      }
    });

    return () => clearAutoPlayTimer();
  }, [isPlaying, currentIndex, cards, isComplete, hiraCol]);

  // Bật/Tắt Auto Play
  const toggleAutoPlay = () => {
    if (isComplete) return;

    if (isPlaying) {
      clearAutoPlayTimer();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  // Xử lý click thẻ - Duy nhất nơi này thay đổi displayIndex
  const handleCardClick = () => {
    if (isPlaying) setIsPlaying(false);

    const currentCard = getCurrentCard();
    if (!currentCard || isComplete) return;

    const row = currentCard.row;

    if (speakText && row[hiraCol]) {
      speakText(row[hiraCol]);
    }

    if (displayIndex === null) {
      setDisplayIndex(0);
    } else if (displayIndex >= row.length - 1) {
      setDisplayIndex(null);
    } else {
      setDisplayIndex(displayIndex + 1);
    }
  };

  const nextCard = () => {
    if (isPlaying) setIsPlaying(false);

    if (currentIndex < cards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      // Không can thiệp displayIndex

      const newCard = cards[nextIndex];
      if (newCard && speakText && newCard.row[hiraCol]) {
        speakText(newCard.row[hiraCol]);
      }
    } else {
      setIsComplete(true);
    }
  };

  const prevCard = () => {
    if (isPlaying) setIsPlaying(false);

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      // Không can thiệp displayIndex

      const newCard = cards[prevIndex];
      if (newCard && speakText && newCard.row[hiraCol]) {
        speakText(newCard.row[hiraCol]);
      }
    }
  };

  const getCurrentCard = () => {
    if (!cards.length) return null;
    return cards[currentIndex];
  };

  const resetCards = () => {
    clearAutoPlayTimer();
    setIsPlaying(false);
    setCurrentIndex(0);
    setDisplayIndex(null);
    setIsComplete(false);
  };

  const reshuffle = () => {
    clearAutoPlayTimer();
    setIsPlaying(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setDisplayIndex(null);
    setIsComplete(false);
  };

  const randomCard = () => {
    if (isPlaying) setIsPlaying(false);
    if (cards.length === 0) return;

    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentIndex(randomIndex);

    const card = cards[randomIndex];
    if (card && speakText && card.row[hiraCol]) {
      speakText(card.row[hiraCol]);
    }
  };

  // Phím tắt điều khiển
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          handleCardClick();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextCard();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevCard();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          reshuffle();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, displayIndex, cards, isPlaying]);

  const currentCard = getCurrentCard();

  // Trạng thái trống
  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/20">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">
          inbox
        </span>
        <p className="text-sm font-medium text-on-surface-variant">
          Không có dữ liệu thẻ học
        </p>
      </div>
    );
  }

  // Trạng thái hoàn thành
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
        <div className="p-4 rounded-full bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-5xl">emoji_events</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-on-surface">Hoàn thành bài học!</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Bạn đã xem hết tất cả {cards.length} thẻ ghi nhớ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetCards}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
            Học lại
          </button>
          <button
            onClick={reshuffle}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg">shuffle</span>
            Xáo trộn & Học lại
          </button>
        </div>
      </div>
    );
  }

  const row = currentCard.row;
  const isShowingAll = displayIndex === null;

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">
      {/* Top Controls & Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
          <span className="material-symbols-outlined text-base text-primary">
            style
          </span>
          <span>
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút Auto Play */}
          <button
            onClick={toggleAutoPlay}
            title={isPlaying ? 'Tạm dừng Auto Play' : 'Tự động phát'}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-primary text-on-primary shadow-sm animate-pulse'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
            <span>{isPlaying ? 'Playing...' : 'Auto'}</span>
          </button>

          <button
            onClick={reshuffle}
            title="Xáo trộn (Phím R)"
            className="flex p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">shuffle</span>
          </button>
          <button
            onClick={randomCard}
            title="Ngẫu nhiên"
            className="flex p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">casino</span>
          </button>
        </div>
      </div>

      {/* Main Flashcard Card */}
      <div
        onClick={handleCardClick}
        className="group relative min-h-[260px] p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center select-none overflow-hidden"
      >
        <div className="w-full my-auto flex flex-col items-center justify-center space-y-3 font-semibold text-4xl wrap-break-word">
          {isShowingAll ? (
            <div className="flex flex-wrap gap-2 w-full flex-col text-2xl">
              {row.map((cell, idx) => {
                const hasValue = cell !== null && cell !== undefined && cell !== '';
                return (
                  <span key={idx}>
                    {hasValue ? String(cell) : '—'}
                    <br />
                  </span>
                );
              })}
            </div>
          ) : (
            row[displayIndex] || '—'
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>

        <button
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{
            width: `${((currentIndex + 1) / cards.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

export default FlashCard;