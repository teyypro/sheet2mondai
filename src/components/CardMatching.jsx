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
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'

  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const maxWrongAttempts = 3;

  const [baseList, setBaseList] = useState([]);
  const [displayCards, setDisplayCards] = useState([]);

  const [firstCard, setFirstCard] = useState(null);
  const [secondCard, setSecondCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [lastMatchedRow, setLastMatchedRow] = useState(null);

  const [currentRoundRows, setCurrentRoundRows] = useState([]);

  const poolRef = useRef([]);
  const timerRef = useRef(null);

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

  const startNewGame = (resetScore = true) => {
    if (baseList.length === 0) return;

    const selected6Pairs = getNext6Pairs();
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

    setDisplayCards(fisherYatesShuffle(cards));
    setFirstCard(null);
    setSecondCard(null);
    setMatchedIds([]);
    setLastMatchedRow(null);
    setWrongAnswers(0);
    if (resetScore) setScore(0);
    setTimeLeft(selectedTime);
    setGameStatus('playing');
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
        setScore((prev) => prev + gainedPoints);

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
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary flex items-center justify-center">
          progress_activity
        </span>
        <p className="text-xs">Loading data...</p>
      </div>
    );
  }

  // Summary View
  if (gameStatus === 'won' || gameStatus === 'lost') {
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

        {/* Stats */}
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

        {/* Data Table */}
        {currentRoundRows.length > 0 && (
          <div className="max-h-80 overflow-x-auto overflow-y-auto border border-outline-variant/20 rounded-xl bg-surface">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container sticky top-0 border-b border-outline-variant/20 text-[10px] font-bold text-on-surface-variant uppercase">
                <tr>
                  {Array.from({ length: columnCount }).map((_, idx) => (
                    <th key={idx} className="p-2">
                      Col {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs text-on-surface">
                {currentRoundRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-surface-container-low">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => startNewGame(gameStatus === 'lost')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base flex items-center justify-center">
              replay
            </span>
            <span>{gameStatus === 'won' ? 'Next Round' : 'Retry'}</span>
          </button>
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

  // Active Gameplay
  return (
    <div className="flex flex-col gap-3 max-w-xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-xl border border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-base flex items-center justify-center">
              timer
            </span>
            <span>{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-base text-amber-500 flex items-center justify-center">
              star
            </span>
            <span>{score}</span>
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

      {/* Last Match Banner */}
      {lastMatchedRow && (
        <div className="text-xs text-center py-1 px-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg font-medium border border-emerald-500/20 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm flex items-center justify-center">
            check_circle
          </span>
          <span>
            {lastMatchedRow[card1_col]} — {lastMatchedRow[card2_col]}
          </span>
        </div>
      )}

      {/* 12-Card Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
              className={`min-h-[64px] p-2 rounded-xl text-md font-base transition-all duration-150 flex items-center justify-center text-center select-none cursor-pointer ${
                isMatched
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 opacity-50 cursor-default'
                  : isSelected
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary shadow-sm scale-95'
                  : 'bg-surface border border-outline-variant/30 text-on-surface hover:bg-surface-container-high hover:border-outline-variant/50'
              }`}
            >
              {isMatched ? (
                <span className="material-symbols-outlined text-lg flex items-center justify-center">
                  check
                </span>
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