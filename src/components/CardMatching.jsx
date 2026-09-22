import React, { useState, useEffect, useRef } from 'react';

// Fisher-Yates shuffle algorithm
function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Chọn ngẫu nhiên có trọng số - ưu tiên các mục ít được chọn
 */
function weightedRandomSelect(items, count, stats) {
  if (items.length === 0) return [];
  if (count >= items.length) return [...items];

  const maxCount = Math.max(...items.map((item) => stats[item.idx] || 0), 1);
  const weighted = items.map((item) => {
    const selectedCount = stats[item.idx] || 0;
    const weight = Math.pow(maxCount - selectedCount + 1, 2);
    return { item, weight };
  });

  const selected = [];
  const pool = [...weighted];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedIndex = 0;
    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    selected.push(pool[selectedIndex].item);
    pool.splice(selectedIndex, 1);
  }

  return selected;
}

function CardMatching({
  data,
  card1_col,
  card2_col,
  hiraCol,
  speakText,
  onClose,
  selectedTime = 20,
}) {
  const [timeLeft, setTimeLeft] = useState(selectedTime);
  const [gameStatus, setGameStatus] = useState('idle');

  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const maxWrongAttempts = 3;

  const [baseList, setBaseList] = useState([]);
  const [displayCards, setDisplayCards] = useState([]);

  const [firstCard, setFirstCard] = useState(null);
  const [secondCard, setSecondCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);

  // Card đang trong trạng thái "tan biến" (đã match, chờ animation xong)
  const [vanishingIds, setVanishingIds] = useState([]);
  // Card đang "pop" (2 card vừa khớp)
  const [poppingIds, setPoppingIds] = useState([]);

  const [currentRoundPairs, setCurrentRoundPairs] = useState([]);
  const [isWrongPair, setIsWrongPair] = useState(false);
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [speakingRowIdx, setSpeakingRowIdx] = useState(null);

  // Toast thông tin match đúng - hiển thị fixed ngoài vùng nội dung
  const [matchToast, setMatchToast] = useState(null);
  const toastTimerRef = useRef(null);

  const selectionStatsRef = useRef({});
  const timerRef = useRef(null);
  const speakRowTimerRef = useRef(null);
  const matchTimeoutsRef = useRef([]);

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
    selectionStatsRef.current = {};
  }, [data, card1_col, card2_col, hiraCol]);

  // Cleanup tất cả timers
  useEffect(() => {
    return () => {
      if (speakRowTimerRef.current) clearTimeout(speakRowTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      matchTimeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const clearMatchTimeouts = () => {
    matchTimeoutsRef.current.forEach((t) => clearTimeout(t));
    matchTimeoutsRef.current = [];
  };

  const getNextPairs = (count = 6) => {
    if (baseList.length === 0) return [];

    const stats = selectionStatsRef.current;

    const minSelectCount = Math.min(
      ...baseList.map((item) => stats[item.idx] || 0)
    );

    const candidates = baseList.filter(
      (item) => (stats[item.idx] || 0) === minSelectCount
    );

    let selected;
    if (candidates.length >= count) {
      selected = weightedRandomSelect(candidates, count, stats);
    } else {
      const remaining = baseList.filter(
        (item) => !candidates.some((c) => c.idx === item.idx)
      );
      const extra = weightedRandomSelect(
        remaining,
        count - candidates.length,
        stats
      );
      selected = [...candidates, ...extra];
    }

    selected.forEach((item) => {
      stats[item.idx] = (stats[item.idx] || 0) + 1;
    });

    return selected;
  };

  const setupGameWithPairs = (pairs, resetScore = true) => {
    clearMatchTimeouts();
    setCurrentRoundPairs(pairs);

    const cards = [];
    pairs.forEach((pair) => {
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

    setDisplayCards(fisherYatesShuffle(cards));
    setFirstCard(null);
    setSecondCard(null);
    setMatchedIds([]);
    setVanishingIds([]);
    setPoppingIds([]);
    setWrongAnswers(0);
    setIsWrongPair(false);
    setFloatingPoints(null);
    setSpeakingRowIdx(null);
    setMatchToast(null);
    if (resetScore) setScore(0);
    setTimeLeft(selectedTime);
    setGameStatus('playing');
  };

  const startNewGame = (resetScore = true) => {
    if (baseList.length === 0) return;
    const selected6Pairs = getNextPairs(6);
    setupGameWithPairs(selected6Pairs, resetScore);
  };

  const retryCurrentRound = () => {
    if (currentRoundPairs.length === 0) return;
    setupGameWithPairs(currentRoundPairs, true);
  };

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
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  useEffect(() => {
    if (baseList.length > 0 && gameStatus === 'idle') {
      startNewGame(true);
    }
  }, [baseList]);

  const calculatePoints = (secondsLeft) => {
    if (secondsLeft <= 0) return 0;
    return Math.ceil(secondsLeft / 5) * 5;
  };

  const handleCardClick = (card) => {
    if (gameStatus !== 'playing') return;
    if (matchedIds.includes(card.matchId)) return;
    if (vanishingIds.includes(card.cardId)) return;
    if (firstCard && firstCard.cardId === card.cardId) return;
    if (firstCard && secondCard) return;

    if (!firstCard) {
      setFirstCard(card);
    } else {
      setSecondCard(card);

      if (firstCard.matchId === card.matchId && firstCard.type !== card.type) {
        // ============ MATCH THÀNH CÔNG ============
        const matchedCardIds = [firstCard.cardId, card.cardId];

        // ===== 1. NGAY LẬP TỨC: pop + đọc + toast =====
        setPoppingIds(matchedCardIds);

        const textToSpeak = card.hira || card.text;
        if (textToSpeak && typeof speakText === 'function') {
          speakText(textToSpeak);
        }

        const gainedPoints = calculatePoints(timeLeft);

        // Toast chỉ hiện 2 card match nhau
        setMatchToast({
          id: Date.now(),
          card1: firstCard.text,
          card2: card.text,
        });

        // Tự ẩn sau 2.5s
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
          setMatchToast(null);
        }, 2500);

        setFloatingPoints(`+${gainedPoints}`);

        // ===== 2. Sau 250ms: bắt đầu tan biến =====
        const t1 = setTimeout(() => {
          setVanishingIds(matchedCardIds);
          setPoppingIds([]);
        }, 250);
        matchTimeoutsRef.current.push(t1);

        // ===== 3. Sau 900ms: chốt matched + cộng điểm =====
        const t2 = setTimeout(() => {
          setMatchedIds((prev) => [...prev, card.matchId]);
          setVanishingIds([]);

          setScore((prev) => prev + gainedPoints);
          setTimeout(() => setFloatingPoints(null), 800);

          // Kiểm tra thắng
          setMatchedIds((current) => {
            if (current.length === 6) {
              clearInterval(timerRef.current);
              setGameStatus('won');
            }
            return current;
          });

          setFirstCard(null);
          setSecondCard(null);
        }, 900);
        matchTimeoutsRef.current.push(t2);
      } else {
        // ============ MATCH SAI ============
        setIsWrongPair(true);
        const newWrongCount = wrongAnswers + 1;
        setWrongAnswers(newWrongCount);

        if (newWrongCount >= maxWrongAttempts) {
          clearInterval(timerRef.current);
          setGameStatus('lost');
        }

        const t = setTimeout(() => {
          setFirstCard(null);
          setSecondCard(null);
          setIsWrongPair(false);
        }, 600);
        matchTimeoutsRef.current.push(t);
      }
    }
  };

  const handleRowClick = (pair, rowIdx) => {
    if (typeof speakText !== 'function') return;

    const textToSpeak = pair.hira || pair.card1 || pair.card2;
    if (!textToSpeak) return;

    if (speakRowTimerRef.current) {
      clearTimeout(speakRowTimerRef.current);
      speakRowTimerRef.current = null;
    }

    speakText(textToSpeak);
    setSpeakingRowIdx(rowIdx);

    speakRowTimerRef.current = setTimeout(() => {
      setSpeakingRowIdx(null);
    }, 1500);
  };

  if (baseList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary flex items-center justify-center">
          progress_activity
        </span>
        <p className="text-xs">Loading data...</p>
      </div>
    );
  }

  // ============ SUMMARY VIEW ============
  if (gameStatus === 'won' || gameStatus === 'lost') {
    const currentRoundRows = currentRoundPairs.map((pair) => pair.originalRow);
    const columnCount = currentRoundRows.length > 0 ? currentRoundRows[0].length : 0;

    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <div className="text-center space-y-1">
          <div
            className={`inline-flex items-center justify-center p-3 rounded-full ${
              gameStatus === 'won'
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-error-container/40 text-error'
            }`}
          >
            <span className="material-symbols-outlined text-3xl flex items-center justify-center">
              {gameStatus === 'won' ? 'emoji_events' : 'cancel'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-on-surface">
            {gameStatus === 'won' ? 'Completed!' : 'Game Over'}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {gameStatus === 'won'
              ? 'All card pairs matched successfully.'
              : wrongAnswers >= maxWrongAttempts
              ? 'Maximum wrong attempts reached (3/3).'
              : 'Time limit expired.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center p-2.5 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Score
            </span>
            <span className="text-lg font-extrabold text-primary mt-0.5">
              {score}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Errors
            </span>
            <span className="text-lg font-extrabold text-error mt-0.5">
              {wrongAnswers}/{maxWrongAttempts}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Matched
            </span>
            <span className="text-lg font-extrabold text-on-surface mt-0.5">
              {matchedIds.length}/6
            </span>
          </div>
        </div>

        {currentRoundRows.length > 0 && (
          <div className="max-h-80 overflow-auto border border-outline-variant/20 rounded-xl bg-surface">
            <table className="w-full text-left border-collapse min-w-full">
              <thead className="bg-surface-container sticky top-0 border-b border-outline-variant/20 text-[10px] font-bold text-on-surface-variant uppercase z-10">
                <tr>
                  {Array.from({ length: columnCount }).map((_, idx) => (
                    <th key={idx} className="p-2.5 whitespace-nowrap">
                      Col {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs text-on-surface">
                {currentRoundPairs.map((pair, rowIndex) => {
                  const row = pair.originalRow;
                  const isSpeaking = speakingRowIdx === rowIndex;
                  const hasAudio = !!(pair.hira || pair.card1 || pair.card2);

                  return (
                    <tr
                      key={rowIndex}
                      onClick={() => handleRowClick(pair, rowIndex)}
                      title={hasAudio ? 'Nhấn để nghe phát âm' : ''}
                      className={`transition-all duration-200 ${
                        hasAudio ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isSpeaking
                          ? 'bg-primary/10 ring-1 ring-primary/30'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="p-2.5 text-xl whitespace-nowrap relative"
                        >
                          {cell}
                          {cellIndex === row.length - 1 && hasAudio && (
                            <span
                              className={`material-symbols-outlined text-xs ml-2 align-middle transition-colors ${
                                isSpeaking
                                  ? 'text-primary animate-pulse'
                                  : 'text-on-surface-variant/30'
                              }`}
                            >
                              volume_up
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {gameStatus === 'lost' ? (
            <>
              <button
                onClick={retryCurrentRound}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-base flex items-center justify-center">
                  replay
                </span>
                <span>Try again</span>
              </button>

              <button
                onClick={() => startNewGame(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base flex items-center justify-center">
                  skip_next
                </span>
                <span>New round</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => startNewGame(false)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-base flex items-center justify-center">
                arrow_forward
              </span>
              <span>Ván tiếp theo</span>
            </button>
          )}

          {typeof onClose === 'function' && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center py-2 px-4 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============ ACTIVE GAMEPLAY ============
  const matchedCount = matchedIds.length;
  const totalPairs = 6;
  const timePercent = Math.max(0, (timeLeft / selectedTime) * 100);

  // Đổi màu thanh thời gian theo % còn lại
  const timeBarColor =
    timePercent > 60
      ? 'bg-emerald-500'
      : timePercent > 30
      ? 'bg-amber-500'
      : 'bg-error';

  return (
    <div className="flex flex-col gap-3 max-w-xl mx-auto relative">
      <style>{`
        @keyframes cardShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: cardShake 0.4s ease-in-out;
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(10px) scale(0.8); }
          50% { opacity: 1; transform: translateY(-10px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-25px) scale(1); }
        }
        .animate-float-points {
          animation: floatUp 0.8s forwards ease-out;
        }
        @keyframes cardPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.12); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3); }
          100% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
        .animate-pop {
          animation: cardPop 0.4s ease-out;
        }
        @keyframes cardVanish {
          0% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0px); }
          50% { transform: scale(1.15) rotate(3deg); opacity: 0.7; filter: blur(1px); }
          100% { transform: scale(0.3) rotate(10deg); opacity: 0; filter: blur(6px); }
        }
        .animate-vanish {
          animation: cardVanish 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        .animate-skeleton {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        @keyframes sparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        .animate-sparkle {
          animation: sparkle 0.6s ease-out forwards;
        }
        /* Toast match trượt xuống từ trên */
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast-in {
          animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* ============ MATCH TOAST - FIXED NGOÀI VÙNG NỘI DUNG ============ */}
      {matchToast && (
        <div
          key={matchToast.id}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[99] animate-toast-in"
        >
          <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-surface-container-lowest border border-primary/40 shadow-lg">
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-2xl font-semibold">
              {matchToast.card1}
            </span>
            <span className="material-symbols-outlined text-[10px] text-on-surface-variant/50 flex items-center justify-center">
              sync_alt
            </span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-2xl font-semibold">
              {matchToast.card2}
            </span>
          </div>
        </div>
      )}

      {/* ============ HEADER BAR + TIME PROGRESS BACKGROUND ============ */}
      <div className="relative overflow-hidden bg-surface-container rounded-xl border border-outline-variant/20">
        {/* Thanh thời gian chạy ngang - background bar tụt dần */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${timeBarColor} opacity-20`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        <div className="relative flex items-center justify-between p-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-base flex items-center justify-center">
                timer
              </span>
              <span className="tabular-nums">{timeLeft}s</span>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-base text-amber-500 flex items-center justify-center">
                star
              </span>
              <span>{score}</span>

              {floatingPoints && (
                <span className="absolute -top-6 left-4 text-sm font-extrabold text-amber-500 animate-float-points pointer-events-none">
                  {floatingPoints}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-semibold text-error">
              <span className="material-symbols-outlined text-base flex items-center justify-center">
                error
              </span>
              <span>
                {wrongAnswers}/{maxWrongAttempts}
              </span>
            </div>
            <button
              onClick={() => startNewGame(true)}
              title="Restart"
              className="flex items-center justify-center p-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base flex items-center justify-center">
                refresh
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress dots - hiển thị tiến độ match */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: totalPairs }).map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx < matchedCount
                ? 'w-6 bg-emerald-500'
                : 'w-3 bg-surface-container-high'
            }`}
          />
        ))}
        <span className="ml-2 text-[10px] font-semibold text-on-surface-variant">
          {matchedCount}/{totalPairs}
        </span>
      </div>

      {/* 12-Card Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {displayCards.map((card) => {
          const isMatched = matchedIds.includes(card.matchId);
          const isVanishing = vanishingIds.includes(card.cardId);
          const isPopping = poppingIds.includes(card.cardId);
          const isSelected =
            firstCard?.cardId === card.cardId ||
            secondCard?.cardId === card.cardId;

          const isWrong = isSelected && isWrongPair;

          if (isMatched) {
            return (
              <div
                key={card.cardId}
                className="min-h-[64px] p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center animate-skeleton"
              >
                <span className="material-symbols-outlined text-lg text-emerald-500/30 flex items-center justify-center">
                  check_circle
                </span>
              </div>
            );
          }

          if (isVanishing) {
            return (
              <div
                key={card.cardId}
                className="min-h-[64px] p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center text-center select-none animate-vanish relative overflow-visible"
              >
                {card.text}
                <span className="absolute -top-2 -right-2 material-symbols-outlined text-amber-400 text-lg animate-sparkle">
                  auto_awesome
                </span>
              </div>
            );
          }

          return (
            <button
              key={card.cardId}
              onClick={() => handleCardClick(card)}
              disabled={isVanishing || gameStatus !== 'playing'}
              className={`min-h-[64px] p-2 rounded-xl text-md font-base transition-all duration-150 flex items-center justify-center text-center select-none cursor-pointer relative ${
                isPopping
                  ? 'bg-emerald-500/20 text-emerald-700 border-2 border-emerald-500 animate-pop shadow-lg'
                  : isWrong
                  ? 'bg-error/20 text-error border-2 border-error animate-shake shadow-md'
                  : isSelected
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary shadow-sm scale-95'
                  : 'bg-surface border border-outline-variant/30 text-on-surface hover:bg-surface-container-high hover:border-outline-variant/50 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {card.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CardMatching;