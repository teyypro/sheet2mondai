import React, { useState, useEffect, useRef } from 'react';

// Hàm Fisher-Yates shuffle
function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function CardMatching({
  data,
  card1_col,
  card2_col,
  hiraCol,
  speakText,
  onClose,
  selectedTime,
}) {
  // Cấu hình thời gian đếm ngược
  const [selectedTimeOption] = useState(selectedTime || 20);
  const [timeLeft, setTimeLeft] = useState(selectedTime || 20);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'

  // Cơ chế tính điểm và lượt sai
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const maxWrongAttempts = 3;

  // Dữ liệu danh sách câu hỏi và danh sách 12 thẻ hiển thị
  const [baseList, setBaseList] = useState([]);
  const [displayCards, setDisplayCards] = useState([]);

  // Trạng thái chọn thẻ và ghép cặp
  const [firstCard, setFirstCard] = useState(null);
  const [secondCard, setSecondCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [lastMatchedRow, setLastMatchedRow] = useState(null);
  
  // Lưu danh sách tất cả các row xuất hiện trong lượt chơi hiện tại
  const [currentRoundRows, setCurrentRoundRows] = useState([]);

  const poolRef = useRef([]);
  const timerRef = useRef(null);

  // Khởi tạo danh sách baseList từ prop data
  useEffect(() => {
    if (!data || data.length === 0) return;

    const list = data.map((row, index) => ({
      idx: index,
      card1: row[card1_col],
      card2: row[card2_col],
      hira: hiraCol !== undefined ? row[hiraCol] : null,
      originalRow: row,
    }));

    setBaseList(list);
    poolRef.current = [];
  }, [data, card1_col, card2_col, hiraCol]);

  // Lấy 6 cặp ngẫu nhiên phân bố đều từ baseList
  const getNext6Pairs = () => {
    if (baseList.length === 0) return [];

    let pool = poolRef.current;

    if (pool.length < 6) {
      const newPool = Array.from({ length: baseList.length }, (_, i) => i);
      pool = fisherYatesShuffle(newPool);
    }

    const selectedIndices = pool.slice(0, 6);
    poolRef.current = pool.slice(6);

    return selectedIndices.map((index) => baseList[index]);
  };

  // Khởi tạo ván chơi mới
  const startNewGame = (resetScore = true) => {
    if (baseList.length === 0) return;

    const selected6Pairs = getNext6Pairs();
    
    // Lưu lại danh sách các originalRow của ván đấu hiện tại
    setCurrentRoundRows(selected6Pairs.map((pair) => pair.originalRow));

    const cards = [];

    selected6Pairs.forEach((pair) => {
      cards.push({
        cardId: `c1_${pair.idx}_${Math.random()}`,
        matchId: pair.idx,
        text: pair.card1,
        type: 'card1',
        originalRow: pair.originalRow,
        hira: pair.hira,
      });
      cards.push({
        cardId: `c2_${pair.idx}_${Math.random()}`,
        matchId: pair.idx,
        text: pair.card2,
        type: 'card2',
        originalRow: pair.originalRow,
        hira: pair.hira,
      });
    });

    const shuffled12Cards = fisherYatesShuffle(cards);

    setDisplayCards(shuffled12Cards);
    setFirstCard(null);
    setSecondCard(null);
    setMatchedIds([]);
    setLastMatchedRow(null);
    setWrongAnswers(0);
    if (resetScore) {
      setScore(0);
    }
    setTimeLeft(selectedTimeOption);
    setGameStatus('playing');
  };

  // Quản lý bộ đếm thời gian
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameStatus('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Tự động bắt đầu khi danh sách baseList sẵn sàng
  useEffect(() => {
    if (baseList.length > 0 && gameStatus === 'idle') {
      startNewGame(true);
    }
  }, [baseList]);

  // Tính điểm thưởng theo giây còn lại
  const calculatePoints = (secondsLeft) => {
    if (secondsLeft <= 0) return 0;
    return Math.ceil(secondsLeft / 5) * 5;
  };

  // Xử lý lật thẻ
  const handleCardClick = (card) => {
    if (gameStatus !== 'playing') return;
    if (matchedIds.includes(card.matchId)) return;
    if (firstCard && firstCard.cardId === card.cardId) return;
    if (firstCard && secondCard) return;

    if (!firstCard) {
      setFirstCard(card);
    } else {
      setSecondCard(card);

      if (firstCard.matchId === card.matchId && firstCard.type !== card.type) {
        const newMatchedIds = [...matchedIds, card.matchId];
        setMatchedIds(newMatchedIds);
        setLastMatchedRow(card.originalRow);

        const gainedPoints = calculatePoints(timeLeft);
        setScore((prevScore) => prevScore + gainedPoints);

        const textToSpeak = card.hira || card.text;
        if (textToSpeak && typeof speakText === 'function') {
          speakText(textToSpeak);
        }

        setFirstCard(null);
        setSecondCard(null);

        if (newMatchedIds.length === 6) {
          clearInterval(timerRef.current);
          setGameStatus('won');
        }
      } else {
        const newWrongCount = wrongAnswers + 1;
        setWrongAnswers(newWrongCount);

        if (newWrongCount >= maxWrongAttempts) {
          clearInterval(timerRef.current);
          setGameStatus('lost');
        }

        setTimeout(() => {
          setFirstCard(null);
          setSecondCard(null);
        }, 600);
      }
    }
  };

  if (baseList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">
          progress_activity
        </span>
        <p className="text-sm">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Màn hình tổng kết ván chơi
  if (gameStatus === 'won' || gameStatus === 'lost') {
    const columnCount = currentRoundRows.length > 0 ? currentRoundRows[0].length : 0;

    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        <div className="text-center space-y-2">
          <div
            className={`inline-flex p-3 rounded-full ${
              gameStatus === 'won'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-error-container/40 text-error'
            }`}
          >
            <span className="material-symbols-outlined text-4xl">
              {gameStatus === 'won' ? 'emoji_events' : 'cancel'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            {gameStatus === 'won' ? 'Xuất sắc hoàn thành!' : 'Rất tiếc, thử lại nhé!'}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {gameStatus === 'won'
              ? 'Bạn đã ghép đúng tất cả các cặp thẻ trong thời gian quy định.'
              : wrongAnswers >= maxWrongAttempts
              ? 'Bạn đã hết lượt trả lời sai tối đa (3/3).'
              : 'Thời gian thực hiện bài tập đã kết thúc.'}
          </p>
        </div>

        {/* Chỉ số kết quả */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Tổng điểm
            </span>
            <div className="text-xl font-extrabold text-primary mt-0.5">
              {score}
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Lượt sai
            </span>
            <div className="text-xl font-extrabold text-error mt-0.5">
              {wrongAnswers} / {maxWrongAttempts}
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Đã ghép
            </span>
            <div className="text-xl font-extrabold text-on-surface mt-0.5">
              {matchedIds.length} / 6
            </div>
          </div>
        </div>

        {/* Bảng chi tiết toàn bộ các từ trong lượt chơi */}
        {currentRoundRows.length > 0 && (
          <div className="space-y-2">

            <div className="max-h-48 overflow-y-auto border border-outline-variant/20 rounded-2xl bg-surface">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container sticky top-0 border-b border-outline-variant/20 text-[11px] font-bold text-on-surface-variant">
                  <tr>
                    {Array.from({ length: columnCount }).map((_, idx) => (
                      <th key={idx} className="p-2.5">
                        Col {idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-xs text-on-surface">
                  {currentRoundRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-surface-container-low">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2.5">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nút thao tác */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => startNewGame(gameStatus === 'lost')}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg">replay</span>
            {gameStatus === 'won' ? 'Tiếp tục ván mới' : 'Chơi lại từ đầu'}
          </button>
          {typeof onClose === 'function' && (
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              Thoát
            </button>
          )}
        </div>
      </div>
    );
  }

  // Giao diện chính trò chơi
  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      {/* Header trạng thái */}
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-2xl border border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-base">timer</span>
            <span>{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-base text-amber-500">
              star
            </span>
            <span>{score} điểm</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-medium text-error">
            <span className="material-symbols-outlined text-base">error</span>
            <span>
              {wrongAnswers}/{maxWrongAttempts}
            </span>
          </div>
          <button
            onClick={() => startNewGame(true)}
            title="Làm mới bài tập"
            className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Thông tin cặp từ vừa ghép */}
      {lastMatchedRow && (
        <div className="text-xs text-center py-1 px-3 bg-emerald-500/10 text-emerald-600 rounded-xl font-medium border border-emerald-500/20 flex items-center justify-center gap-1.5 animate-fade-in">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {lastMatchedRow[card1_col]} — {lastMatchedRow[card2_col]}
        </div>
      )}


      {/* Lưới 12 thẻ card */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {displayCards.map((card) => {
          const isMatched = matchedIds.includes(card.matchId);
          const isSelected =
            firstCard?.cardId === card.cardId ||
            secondCard?.cardId === card.cardId;

          return (
            <button
              key={card.cardId}
              onClick={() => handleCardClick(card)}
              disabled={isMatched || gameStatus !== 'playing'}
              className={`min-h-[72px] p-3 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center text-center select-none cursor-pointer ${
                isMatched
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 opacity-60 cursor-default'
                  : isSelected
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary shadow-md scale-95'
                  : 'bg-surface border border-outline-variant/30 text-on-surface hover:bg-surface-container-high hover:border-outline-variant/50'
              }`}
            >
              {isMatched ? (
                <span className="material-symbols-outlined text-xl">check</span>
              ) : (
                card.text
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CardMatching;