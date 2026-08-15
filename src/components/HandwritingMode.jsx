import React, { useState, useEffect, useRef } from 'react';

function HandwritingMode({
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
  const [userInput, setUserInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const questionsPoolRef = useRef([]);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!data?.length) return;

    const generated = data.map((row) => ({
      ques: row[quesCol],
      ans: row[ansCol],
      hira: row[hiraCol],
      originalRow: row,
    }));

    setDataToDisplay(generated);
    questionsPoolRef.current = [];
  }, [data, quesCol, ansCol, hiraCol]);

  const generatePractiseQuestions = (fullData) => {
    const dataset = fullData || dataToDisplay;
    if (!dataset.length) return;

    let pool = [...questionsPoolRef.current];
    if (pool.length < 5) {
      const newPool = Array.from({ length: dataset.length }, (_, i) => i);
      pool = [...pool, ...newPool.sort(() => Math.random() - 0.5)];
    }

    const selectedIndices = pool.slice(0, 5);
    questionsPoolRef.current = pool.slice(5);

    setCurrentQuestions(selectedIndices.map((index) => dataset[index]));
    setCurrentIndex(0);
    setUserInput('');
    setIsSubmitted(false);
    setShowHint(false);
    setResults([]);
    setShowResult(false);
  };

  useEffect(() => {
    if (!dataToDisplay.length) return;

    if (practiseMode) {
      generatePractiseQuestions(dataToDisplay);
    } else {
      setCurrentQuestions(dataToDisplay);
      setCurrentIndex(0);
      setUserInput('');
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
    if (mode === 'listening' && currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      const textToSpeak = currentQ?.hira || currentQ?.ans;
      if (textToSpeak && typeof speakText === 'function') {
        speakText(textToSpeak);
      }
    }
  }, [currentIndex, currentQuestions, mode, showResult]);

  useEffect(() => {
    if (!isSubmitted && !showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isSubmitted, showResult]);

  const checkAnswerCorrectness = (input, targetAns) => {
    if (targetAns == null) return false;

    const cleanInput = String(input)
      .trim()
      .replace(/[\u3000\s]+/g, ' ')
      .toLowerCase();

    const validAnswers = String(targetAns)
      .split(/[,;/|]/)
      .map((ans) => ans.trim().replace(/[\u3000\s]+/g, ' ').toLowerCase());

    return validAnswers.includes(cleanInput);
  };

  const moveToNextQuestion = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentIndex === currentQuestions.length - 1) {
      setShowResult(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setIsSubmitted(false);
      setShowHint(false);
    }
  };

  const handleCheck = () => {
    if (isSubmitted) return;

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = checkAnswerCorrectness(userInput, currentQ.ans);

    setResults((prev) => [
      ...prev,
      { ...currentQ, userAnswer: userInput, correct: isCorrect },
    ]);
    setIsSubmitted(true);

    const textToSpeak = currentQ?.hira || currentQ?.ans;
    if (textToSpeak && typeof speakText === 'function') {
      speakText(textToSpeak);
    }

    timerRef.current = setTimeout(moveToNextQuestion, 3000);
  };

  const handleRestart = () => {
    if (practiseMode) {
      generatePractiseQuestions();
    } else {
      setCurrentIndex(0);
      setUserInput('');
      setIsSubmitted(false);
      setShowHint(false);
      setResults([]);
      setShowResult(false);
    }
  };

  if (!currentQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">
          progress_activity
        </span>
        <p className="text-sm">Initializing exercise...</p>
      </div>
    );
  }

  if (showResult) {
    const totalCorrect = results.filter((r) => r.correct).length;
    const accuracy = Math.round((totalCorrect / results.length) * 100);

    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-3xl">analytics</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">Results Overview</h3>
          <p className="text-xs text-on-surface-variant">
            Completed {results.length} questions
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center p-3 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
              Accuracy
            </span>
            <span className="text-xl font-extrabold text-primary mt-0.5">
              {accuracy}%
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
              Correct
            </span>
            <span className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {totalCorrect} / {results.length}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-surface-container rounded-xl border border-outline-variant/20">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
              Incorrect
            </span>
            <span className="text-xl font-extrabold text-error mt-0.5">
              {results.length - totalCorrect}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-base">list_alt</span>
            <span>Detailed Review</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {results.map((r, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border space-y-2 ${
                  r.correct
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-error-container/20 border-error/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-on-surface-variant">
                    Q{idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      r.correct
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-error/10 text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {r.correct ? 'check_circle' : 'cancel'}
                    </span>
                    {r.correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-on-surface">
                    <span className="text-on-surface-variant">Prompt: </span>
                    {mode === 'listening' ? (
                      <span className="italic text-on-surface-variant">
                        [Listening Mode]
                      </span>
                    ) : (
                      r.ques
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="text-on-surface">
                      <span className="text-on-surface-variant">Your answer: </span>
                      <span
                        className={`font-semibold ${
                          r.correct ? 'text-emerald-600' : 'text-error line-through'
                        }`}
                      >
                        {r.userAnswer || '(Empty)'}
                      </span>
                    </div>

                    <div className="text-on-surface">
                      <span className="text-on-surface-variant">Correct: </span>
                      <span className="font-semibold text-primary">{r.ans}</span>
                    </div>
                  </div>

                  {r.originalRow && (
                    <div className="pt-2 border-t border-outline-variant/15 mt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {Object.entries(r.originalRow).map(([key, val]) => (
                          <div
                            key={key}
                            className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-surface-container-high text-[11px] border border-outline-variant/20 font-semibold text-on-surface"
                          >
                            {val != null ? String(val) : '—'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-md"
        >
          <span className="material-symbols-outlined text-lg">replay</span>
          <span>Restart</span>
        </button>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  const currentResult = results[results.length - 1];

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-xl border border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            draw
          </span>
          <span className="text-xs font-bold text-on-surface">
            Handwriting Mode
          </span>
        </div>
        <span className="text-xs font-semibold text-on-surface-variant">
          {currentIndex + 1} / {currentQuestions.length}
        </span>
      </div>

      <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-1.5 transition-all duration-300 rounded-full"
          style={{
            width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`,
          }}
        />
      </div>

      <div className="p-5 bg-surface rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center gap-3 min-h-[140px]">
        {mode === 'listening' ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Listening Mode
            </span>
            <button
              onClick={() => speakText(currentQ.hira || currentQ.ans)}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary-container/80 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-xl">volume_up</span>
              <span>Replay Audio</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              Question
            </span>
            <div className="text-2xl font-bold text-on-surface tracking-wide">
              {currentQ.ques}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              {showHint ? 'visibility_off' : 'lightbulb'}
            </span>
            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
          </button>

          {showHint && (
            <div className="mt-2 py-1 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium border border-amber-500/20">
              Hint: <span className="font-bold">{currentQ.ans}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your answer..."
            disabled={isSubmitted}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!isSubmitted) {
                  handleCheck();
                } else {
                  moveToNextQuestion();
                }
              }
            }}
            className="flex-1 py-3 px-4 bg-surface rounded-xl border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base disabled:opacity-70 transition-all"
          />

          {!isSubmitted ? (
            <button
              onClick={handleCheck}
              disabled={!userInput.trim()}
              className="py-3 px-5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Check</span>
              <span className="material-symbols-outlined text-lg">check</span>
            </button>
          ) : (
            <button
              onClick={moveToNextQuestion}
              className="py-3 px-5 rounded-xl bg-surface-container-high text-on-surface font-semibold text-sm hover:bg-surface-container-highest transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </button>
          )}
        </div>

        {isSubmitted && currentResult && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              currentResult.correct
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-error-container/30 border-error/30 text-error'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 shrink-0 font-bold">
              <span className="material-symbols-outlined text-lg">
                {currentResult.correct ? 'check_circle' : 'cancel'}
              </span>
              <span>{currentResult.correct ? 'Correct' : 'Incorrect'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right text-on-surface">
              <span className="inline-flex items-center justify-center gap-1">
                <span className="text-on-surface-variant">Your answer:</span>
                <span
                  className={`font-semibold ${
                    currentResult.correct
                      ? 'text-emerald-600'
                      : 'text-error line-through'
                  }`}
                >
                  {userInput || '(Empty)'}
                </span>
              </span>

              {currentQ.originalRow &&
                Object.entries(currentQ.originalRow).map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-flex items-center justify-center gap-1"
                  >
                    <span className="text-outline-variant/60">•</span>
                    <span className="font-semibold text-on-surface">
                      {val != null ? String(val) : ''}
                    </span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HandwritingMode;