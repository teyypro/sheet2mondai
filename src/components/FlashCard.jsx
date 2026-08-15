import React, { useState, useEffect } from 'react';

function FlashCard({ data, hiraCol, speakText }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(null); // null = hiển thị tất cả
  const [isComplete, setIsComplete] = useState(false);

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
  }, [data]);

  // Xử lý click - Đọc Hiragana mỗi lần click
  const handleCardClick = () => {
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
    if (currentIndex < cards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setDisplayIndex(null);

      const newCard = cards[nextIndex];
      if (newCard && speakText && newCard.row[hiraCol]) {
        speakText(newCard.row[hiraCol]);
      }
    } else {
      setIsComplete(true);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setDisplayIndex(null);

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
    setCurrentIndex(0);
    setDisplayIndex(null);
    setIsComplete(false);
  };

  const reshuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setDisplayIndex(null);
    setIsComplete(false);
  };

  const randomCard = () => {
    if (cards.length === 0) return;
    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentIndex(randomIndex);
    setDisplayIndex(null);

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
  }, [currentIndex, displayIndex, cards]);

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