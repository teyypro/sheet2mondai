// components/FlashCard.jsx
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
      id: `${index}-${Date.now()}`
    }));

    setCards(cardData);
    setCurrentIndex(0);
    setDisplayIndex(null);
    setIsComplete(false);
  }, [data]);

  // Xử lý click - MỖI LẦN CLICK ĐỀU ĐỌC HIRAGANA
  const handleCardClick = () => {
    const currentCard = getCurrentCard();
    if (!currentCard || isComplete) return;

    const row = currentCard.row;
    
    // LUÔN ĐỌC HIRAGANA MỖI LẦN CLICK
    speakText(row[hiraCol]);
    
    // Xử lý hiển thị
    if (displayIndex === null) {
      setDisplayIndex(0);
    } else if (displayIndex >= row.length - 1) {
      setDisplayIndex(null);
    } else {
      setDisplayIndex(displayIndex + 1);
    }
  };

  // Chuyển thẻ tiếp theo
  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setDisplayIndex(null);
      // Đọc Hiragana của thẻ mới
      const newCard = cards[nextIndex];
      if (newCard) {
        speakText(newCard.row[hiraCol]);
      }
    } else {
      setIsComplete(true);
    }
  };

  // Quay lại thẻ trước
  const prevCard = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setDisplayIndex(null);
      // Đọc Hiragana của thẻ trước
      const newCard = cards[prevIndex];
      if (newCard) {
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
    // Đọc Hiragana của thẻ random
    const card = cards[randomIndex];
    if (card) {
      speakText(card.row[hiraCol]);
    }
  };

  // Phím tắt
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          handleCardClick();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextCard();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          prevCard();
          break;
        case "r":
        case "R":
          e.preventDefault();
          reshuffle();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, displayIndex, cards]);

  const currentCard = getCurrentCard();

  // Không có dữ liệu
  if (!cards.length) {
    return (
      <div>
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  // Hoàn thành
  if (isComplete) {
    return (
      <div>
        <h2>Hoàn thành!</h2>
        <button onClick={resetCards}>Học lại</button>
        <button onClick={reshuffle}>Xáo trộn</button>
      </div>
    );
  }

  const row = currentCard.row;
  const isShowingAll = displayIndex === null;

  return (
    <div>
      <div>
        <span>{currentIndex + 1} / {cards.length}</span>
        <button onClick={reshuffle}>🔀</button>
        <button onClick={randomCard}>🎲</button>
      </div>

      <div onClick={handleCardClick}>
        <div>
          {isShowingAll ? (
            <div>
              {row.map((cell, idx) => (
                <div key={idx}>
                  <span>Cột {idx + 1}:</span>
                  <span>{String(cell || '—')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {row[displayIndex] || '—'}
            </div>
          )}
        </div>
      </div>

      <div>
        <button onClick={prevCard} disabled={currentIndex === 0}>
          ◀ Trước
        </button>
        <button onClick={nextCard} disabled={currentIndex === cards.length - 1}>
          Sau ▶
        </button>
      </div>

      <div>
        <div style={{ 
          width: `${((currentIndex + 1) / cards.length) * 100}%`,
          height: '4px',
          backgroundColor: '#007bff'
        }} />
      </div>
    </div>
  );
}

export default FlashCard;