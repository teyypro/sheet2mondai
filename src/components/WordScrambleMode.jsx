import React, { useState, useEffect, useRef } from 'react';

function WordScrambleMode({
  data,
  quesCol,
  ansCol,
  hiraCol,
  mode,
  practiseMode,
  speakText,
}) {
  const [dataToDisplay, setDataToDisplay] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChars, setSelectedChars] = useState([]);
  const [availableChars, setAvailableChars] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const questionsPoolRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const generated = data.map((row) => {
      const ans = String(row[ansCol] || '');
      const chars = [...ans];
      const allChars = data.map((r) => [...String(r[ansCol] || '')]).flat();
      const extraChars = allChars.filter((c) => !chars.includes(c));
      const shuffledExtra = extraChars.sort(() => Math.random() - 0.5);
      const selectedExtra = shuffledExtra.slice(0, 2);

      const rawOpts = [...chars, ...selectedExtra].sort(
        () => Math.random() - 0.5
      );

      const optWithId = rawOpts.map((char, index) => ({
        id: `${char}_${index}_${Math.random()}`,
        char: char,
      }));

      return {
        ques: row[quesCol],
        ans: ans,
        hira: row[hiraCol],
        opt: optWithId,
        originalRow: row,
      };
    });

    setDataToDisplay(generated);
    questionsPoolRef.current = [];
  }, [data, quesCol, ansCol, hiraCol]);

  const generatePractiseQuestions = (fullData) => {
    const dataset = fullData || dataToDisplay;
    if (dataset.length === 0) return;

    let pool = [...questionsPoolRef.current];
    if (pool.length < 5) {
      const newPool = Array.from({ length: dataset.length }, (_, i) => i);
      const shuffledNewPool = newPool.sort(() => Math.random() - 0.5);
      pool = [...pool, ...shuffledNewPool];
    }

    const selectedIndices = pool.slice(0, 5);
    questionsPoolRef.current = pool.slice(5);

    const selectedQuestions = selectedIndices.map((index) => dataset[index]);

    setCurrentQuestions(selectedQuestions);
    setCurrentIndex(0);
    setSelectedChars([]);
    setAvailableChars([]);
    setIsSubmitted(false);
    setShowHint(false);
    setResults([]);
    setShowResult(false);
  };

  useEffect(() => {
    if (dataToDisplay.length === 0) return;

    if (practiseMode) {
      generatePractiseQuestions(dataToDisplay);
    } else {
      setCurrentQuestions(dataToDisplay);
      setCurrentIndex(0);
      setSelectedChars([]);
      setAvailableChars([]);
      setIsSubmitted(false);
      setShowHint(false);
      setResults([]);
      setShowResult(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dataToDisplay, practiseMode]);

  useEffect(() => {
    if (
      currentQuestions.length > 0 &&
      currentIndex < currentQuestions.length &&
      !showResult
    ) {
      const currentQ = currentQuestions[currentIndex];
      if (currentQ) {
        setAvailableChars([...currentQ.opt]);
        setSelectedChars([]);
        setIsSubmitted(false);
        setShowHint(false);
      }
    }
  }, [currentIndex, currentQuestions, showResult]);

  useEffect(() => {
    if (mode === 'listening' && currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      const textToSpeak = currentQ?.hira || currentQ?.ans;
      if (textToSpeak && typeof speakText === 'function') {
        speakText(textToSpeak);
      }
    }
  }, [currentIndex, currentQuestions, mode, showResult]);

  const handleSelectChar = (charObj) => {
    if (isSubmitted) return;
    setSelectedChars([...selectedChars, charObj]);
    setAvailableChars(availableChars.filter((c) => c.id !== charObj.id));
  };

  const handleRemoveChar = (index) => {
    if (isSubmitted) return;
    const charObj = selectedChars[index];
    setSelectedChars(selectedChars.filter((_, i) => i !== index));
    setAvailableChars([...availableChars, charObj]);
  };

  const moveToNextQuestion = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handleCheck = () => {
    if (isSubmitted) return;

    const currentQ = currentQuestions[currentIndex];
    const userAnswer = selectedChars.map((item) => item.char).join('');

    const cleanUserAns = userAnswer
      .trim()
      .replace(/[\u3000\s]+/g, '')
      .toLowerCase();
    const cleanTargetAns = currentQ.ans
      .trim()
      .replace(/[\u3000\s]+/g, '')
      .toLowerCase();

    const isCorrect = cleanUserAns === cleanTargetAns;

    const updatedResultItem = {
      ...currentQ,
      userAnswer: userAnswer,
      correct: isCorrect,
    };

    setResults((prev) => [...prev, updatedResultItem]);
    setIsSubmitted(true);

    const textToSpeak = currentQ?.hira || currentQ?.ans;
    if (textToSpeak && typeof speakText === 'function') {
      speakText(textToSpeak);
    }

    timerRef.current = setTimeout(() => {
      moveToNextQuestion();
    }, 2500);
  };

  const handleNextManual = () => {
    moveToNextQuestion();
  };

  const handleContinue = () => {
    if (practiseMode) {
      generatePractiseQuestions();
    } else {
      setCurrentIndex(0);
      setSelectedChars([]);
      setAvailableChars([]);
      setIsSubmitted(false);
      setShowHint(false);
      setResults([]);
      setShowResult(false);
    }
  };

  const RenderRowData = ({ rowData }) => {
    if (!rowData || typeof rowData !== 'object') return null;
    const entries = Object.entries(rowData);

    return (
      <div className="mt-2.5 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/15 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface/80 border border-outline-variant/10"
            >
              <span className="text-on-surface-variant font-medium uppercase text-[10px]">
                {key}:
              </span>
              <span className="text-on-surface break-all text-right text-sm">
                {value !== null && value !== undefined ? String(value) : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (currentQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary flex items-center justify-center">
          progress_activity
        </span>
        <p className="text-sm">Loading questions...</p>
      </div>
    );
  }

  if (showResult) {
    const totalCorrect = results.filter((r) => r.correct).length;
    const accuracyPercentage = Math.round(
      (totalCorrect / results.length) * 100
    );

    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        <div className="text-center space-y-2 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary-container/40 text-primary">
            <span className="material-symbols-outlined text-4xl flex items-center justify-center">
              sort_by_alpha
            </span>
          </div>
          <h3 className="text-xl text-on-surface">Word Scramble Results</h3>
          <p className="text-xs text-on-surface-variant">
            Completed {results.length} items.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase text-on-surface-variant/70">
              Accuracy
            </span>
            <div className="text-xl text-primary mt-0.5">
              {accuracyPercentage}%
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase text-on-surface-variant/70">
              Correct
            </span>
            <div className="text-xl text-emerald-600 mt-0.5">
              {totalCorrect} / {results.length}
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase text-on-surface-variant/70">
              Incorrect
            </span>
            <div className="text-xl text-error mt-0.5">
              {results.length - totalCorrect}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base flex items-center justify-center">
              task_alt
            </span>
            Breakdown
          </span>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {results.map((r, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  r.correct
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-error-container/20 border-error/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-on-surface-variant">
                    Question {idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                      r.correct
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-error/10 text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs flex items-center justify-center">
                      {r.correct ? 'check_circle' : 'cancel'}
                    </span>
                    {r.correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-on-surface">
                    <span className="text-on-surface-variant/70">
                      Question:{' '}
                    </span>
                    {mode === 'listening' ? (
                      <span className="italic text-on-surface-variant">
                        [Audio Query]
                      </span>
                    ) : (
                      r.ques
                    )}
                  </div>

                  <div className="text-on-surface">
                    <span className="text-on-surface-variant/70">
                      Your answer:{' '}
                    </span>
                    <span
                      className={r.correct ? 'text-emerald-600' : 'text-error'}
                    >
                      {r.userAnswer || '(Empty)'}
                    </span>
                  </div>

                  {!r.correct && (
                    <div className="text-on-surface">
                      <span className="text-on-surface-variant/70">
                        Correct answer:{' '}
                      </span>
                      <span className="text-emerald-600">{r.ans}</span>
                    </div>
                  )}

                  {r.originalRow && (
                    <RenderRowData rowData={r.originalRow} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              replay
            </span>
            <span>Play Again</span>
          </button>
        </div>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  const lastResult = results[results.length - 1];

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-2xl border border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl flex items-center justify-center">
            extension
          </span>
          <span className="text-xs text-on-surface">Word Scramble</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-on-surface-variant">
            {currentIndex + 1} / {currentQuestions.length}
          </div>
        </div>
      </div>

      <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-1.5 transition-all duration-300 rounded-full"
          style={{
            width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`,
          }}
        />
      </div>

      <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center gap-2 min-h-[110px] relative">
        {mode === 'listening' ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] text-on-surface-variant/70 uppercase tracking-wider">
              Listening Mode
            </span>
            <button
              onClick={() => speakText(currentQ.hira || currentQ.ans)}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-primary-container text-on-primary-container text-sm hover:bg-primary-container/80 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg flex items-center justify-center">
                volume_up
              </span>
              <span>Replay Audio</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1 flex flex-col items-center justify-center">
            <span className="text-[11px] text-on-surface-variant/70 uppercase tracking-wider block">
              Question
            </span>
            <div className="text-2xl text-on-surface tracking-wide">
              {currentQ.ques}
            </div>
          </div>
        )}

        <div className="mt-1 flex-col items-center justify-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center justify-center gap-1 text-[11px] text-primary"
          >
            <span className="material-symbols-outlined text-sm flex items-center justify-center">
              {showHint ? 'visibility_off' : 'lightbulb'}
            </span>
            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
          </button>

          {showHint && (
            <div className="mt-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs animate-fade-in border border-amber-500/20">
              Hint: {currentQ.ans}
            </div>
          )}
        </div>
      </div>

      {isSubmitted && (
        <div
          className={`p-4 rounded-2xl border space-y-2 animate-fade-in ${
            lastResult?.correct
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-error-container/30 border-error/30 text-error'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-xl flex items-center justify-center">
              {lastResult?.correct ? 'check_circle' : 'cancel'}
            </span>
            <span>{lastResult?.correct ? 'Correct!' : 'Incorrect.'}</span>
          </div>

          <div className="text-xs text-on-surface">
            Correct answer:{' '}
            <strong className="text-emerald-600 text-sm">
              {currentQ.ans}
            </strong>
          </div>

          {currentQ.originalRow && (
            <RenderRowData rowData={currentQ.originalRow} />
          )}
        </div>
      )}

      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 min-h-[88px] flex flex-col justify-center gap-1.5">
        <span className="text-[11px] text-on-surface-variant/70 uppercase tracking-wider block">
          Your Answer:
        </span>
        <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
          {selectedChars.length === 0 ? (
            <span className="text-xs text-on-surface-variant/40 italic">
              Select characters below to form the word...
            </span>
          ) : (
            selectedChars.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleRemoveChar(idx)}
                disabled={isSubmitted}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-primary text-on-primary text-base shadow-sm hover:bg-error hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-90 disabled:cursor-default"
              >
                <span>{item.char}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="p-4 bg-surface rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
        <span className="text-[11px] text-on-surface-variant/70 uppercase tracking-wider block">
          Available Characters:
        </span>
        <div className="flex flex-wrap gap-2 min-h-[48px]">
          {availableChars.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectChar(item)}
              disabled={isSubmitted}
              className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant/30 text-lg text-on-surface flex items-center justify-center shadow-xs hover:bg-primary-container hover:border-primary/40 hover:text-on-primary-container transition-all cursor-pointer active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{item.char}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1 flex justify-end items-center">
        {!isSubmitted ? (
          <button
            onClick={handleCheck}
            disabled={selectedChars.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-on-primary text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              check
            </span>
            <span>Check</span>
          </button>
        ) : (
          <button
            onClick={handleNextManual}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-on-primary text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              arrow_forward
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default WordScrambleMode;