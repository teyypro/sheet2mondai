import React, { useState, useEffect, useRef } from 'react';

function MultipleChoice({
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
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const questionsPoolRef = useRef([]);
  const speakTimerRef = useRef(null);

  const clearAllTimers = () => {
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
  };

  // Hàm phát âm tiện ích, ngắt phát âm dở dang cũ nếu có
  const triggerSpeak = (text) => {
    clearAllTimers();
    if (text && typeof speakText === 'function') {
      setIsSpeaking(true);
      speakText(text);

      speakTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
    } else {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (!data?.length) return;

    const generated = data.map((row) => {
      const correctAns = row[ansCol];
      const uniqueAnswers = [...new Set(data.map((r) => r[ansCol]))];
      const options = uniqueAnswers.filter((ans) => ans !== correctAns);

      const selectedOpts = options.sort(() => Math.random() - 0.5).slice(0, 3);
      const shuffledOpts = [...selectedOpts, correctAns].sort(() => Math.random() - 0.5);

      return {
        ques: row[quesCol],
        opt: shuffledOpts.map((opt) => {
          const originalIndex = data.findIndex((r) => r[ansCol] === opt);
          return {
            opt,
            info_id: originalIndex,
            optionRow: data[originalIndex],
          };
        }),
        ans: shuffledOpts.indexOf(correctAns),
        hira: row[hiraCol],
        originalRow: row,
      };
    });

    setDataToDisplay(generated);
    questionsPoolRef.current = [];
  }, [data, quesCol, ansCol, hiraCol]);

  const generatePractiseQuestions = (fullData) => {
    const dataset = fullData || dataToDisplay;
    if (!dataset.length) return;

    let pool = [...questionsPoolRef.current];
    if (pool.length < 5) {
      const newPool = Array.from({ length: dataset.length }, (_, i) => i).sort(
        () => Math.random() - 0.5
      );
      pool = [...pool, ...newPool];
    }

    const selectedIndices = pool.slice(0, 5);
    questionsPoolRef.current = pool.slice(5);

    setCurrentQuestions(selectedIndices.map((index) => dataset[index]));
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResult(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (!dataToDisplay.length) return;

    if (practiseMode) {
      generatePractiseQuestions(dataToDisplay);
    } else {
      setCurrentQuestions(dataToDisplay);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResult(false);
      setIsSpeaking(false);
    }

    return () => {
      clearAllTimers();
    };
  }, [dataToDisplay, practiseMode]);

  // Tự động phát âm câu hiện tại khi load hoặc khi chuyển Back/Forward
  useEffect(() => {
    if (currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      if (currentQ?.hira) {
        triggerSpeak(currentQ.hira);
      }
    }
  }, [currentIndex, currentQuestions, showResult]);

  const handleFinishQuiz = (finalAnswers) => {
    setResults(
      currentQuestions.map((q, idx) => ({
        correct: finalAnswers[idx] === q.ans,
        selected: finalAnswers[idx],
        ...q,
      }))
    );
    setShowResult(true);
    setIsSpeaking(false);
  };

  const handleAnswer = (optIndex) => {
    if (selectedAnswers[currentIndex] !== undefined) return;

    const newSelected = { ...selectedAnswers, [currentIndex]: optIndex };
    setSelectedAnswers(newSelected);

    const currentQ = currentQuestions[currentIndex];
    if (currentQ?.hira) {
      triggerSpeak(currentQ.hira);
    }
  };

  const handleNextManual = () => {
    clearAllTimers();
    setIsSpeaking(false);

    if (currentIndex === currentQuestions.length - 1) {
      handleFinishQuiz(selectedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBackManual = () => {
    if (currentIndex <= 0) return;
    clearAllTimers();
    setIsSpeaking(false);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleContinue = () => {
    if (practiseMode) {
      generatePractiseQuestions();
    } else {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResult(false);
      setIsSpeaking(false);
    }
  };

  const renderOptionDetail = (rowObj) => {
    if (!rowObj) return <span className="text-on-surface-variant text-sm">—</span>;

    if (typeof rowObj === 'object' && !Array.isArray(rowObj)) {
      const entries = Object.entries(rowObj);
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-sm">
          {entries.map(([key, val], idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/15"
            >
              <span className="font-medium text-on-surface-variant/70 text-xs capitalize">
                {key}:
              </span>
              <span className="font-semibold text-on-surface break-words">
                {String(val ?? '—')}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(rowObj)) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-sm">
          {rowObj.map((val, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/15 font-semibold text-on-surface"
            >
              {String(val)}
            </span>
          ))}
        </div>
      );
    }

    return <span className="font-semibold text-sm">{String(rowObj)}</span>;
  };

  if (!currentQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary flex items-center justify-center">
          progress_activity
        </span>
        <p className="text-xs font-medium">Initializing quiz...</p>
      </div>
    );
  }

  if (showResult) {
    const totalCorrect = results.filter((r) => r.correct).length;
    const accuracy = Math.round((totalCorrect / results.length) * 100);

    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center gap-1">
          <div className="flex items-center justify-center p-3 rounded-full bg-primary-container/40 text-primary">
            <span className="material-symbols-outlined text-4xl flex items-center justify-center">
              quiz
            </span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">Quiz Results</h3>
          <p className="text-xs text-on-surface-variant">
            Completed {results.length} questions.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Accuracy
            </span>
            <div className="text-xl font-extrabold text-primary mt-0.5">
              {accuracy}%
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Correct
            </span>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {totalCorrect} / {results.length}
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Incorrect
            </span>
            <div className="text-xl font-extrabold text-error mt-0.5">
              {results.length - totalCorrect}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base flex items-center justify-center">
              task_alt
            </span>
            Detailed Review
          </span>

          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
            {results.map((r, idx) => {
              const selectedOptObj = r.opt[r.selected];
              const correctOptObj = r.opt[r.ans];

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    r.correct
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-error-container/20 border-error/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">
                      Question {idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="text-on-surface">
                      <span className="text-on-surface-variant/70 block mb-1">Question context:</span>
                      <div className="font-semibold text-on-surface bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/10 break-words">
                        {renderOptionDetail(r.originalRow)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/10 mt-1">
                      <div className="text-on-surface">
                        <span className="text-on-surface-variant/70 block mb-0.5">Selected:</span>
                        <div className={`font-semibold p-2 rounded-lg border ${
                          r.correct 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
                            : 'bg-error-container/10 border-error/20 text-error'
                        } break-words`}>
                          {selectedOptObj ? renderOptionDetail(selectedOptObj.optionRow) : 'Unanswered'}
                        </div>
                      </div>

                      {!r.correct && (
                        <div className="text-on-surface">
                          <span className="text-on-surface-variant/70 block mb-0.5">Correct answer:</span>
                          <div className="font-semibold p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 break-words">
                            {correctOptObj ? renderOptionDetail(correctOptObj.optionRow) : '—'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              replay
            </span>
            <span>Start New Session</span>
          </button>
        </div>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  const hasAnswered = selectedAnswers[currentIndex] !== undefined;

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-2xl border border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl flex items-center justify-center">
            checklist
          </span>
          <span className="text-xs font-bold text-on-surface">
            Multiple Choice
          </span>
        </div>

        <div className="text-xs font-semibold text-on-surface-variant">
          Question {currentIndex + 1} / {currentQuestions.length}
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

      <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center gap-3 min-h-[120px]">
        {mode === 'listening' ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Listening Mode
            </span>
            <button
              onClick={() => {
                if (currentQ?.hira) {
                  triggerSpeak(currentQ.hira);
                }
              }}
              disabled={isSpeaking}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary-container/80 transition-all cursor-pointer active:scale-95 shadow-sm ${
                isSpeaking ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="material-symbols-outlined text-xl flex items-center justify-center">
                volume_up
              </span>
              <span>{isSpeaking ? 'Speaking...' : 'Replay Audio'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            <div className="text-3xl font-medium text-on-surface tracking-wide break-words w-full">
              {currentQ.ques}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {currentQ.opt.map((opt, idx) => {
          const isSelected = selectedAnswers[currentIndex] === idx;
          const isCorrect = idx === currentQ.ans;

          let buttonStyle =
            'bg-surface border-outline-variant/30 hover:bg-surface-container-high text-on-surface';

          if (hasAnswered) {
            if (isCorrect) {
              buttonStyle =
                'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold';
            } else if (isSelected && !isCorrect) {
              buttonStyle =
                'bg-error-container/30 border-error/50 text-error font-bold';
            } else {
              buttonStyle = 'bg-surface/50 border-outline-variant/20 opacity-50';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={hasAnswered}
              className={`w-full p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 ${buttonStyle} ${
                !hasAnswered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                    hasAnswered && isCorrect
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : hasAnswered && isSelected && !isCorrect
                      ? 'border-error bg-error text-white'
                      : isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant'
                  }`}
                >
                  {(isSelected || (hasAnswered && isCorrect)) && (
                    <span className="w-2 h-2 rounded-full bg-current" />
                  )}
                </span>

                <div className="flex flex-col flex-1 min-w-0">
                  {hasAnswered ? (
                    renderOptionDetail(opt.optionRow)
                  ) : (
                    <div className="text-base font-semibold break-words whitespace-normal">
                      {opt.opt}
                    </div>
                  )}
                </div>
              </div>

              {hasAnswered && (
                <span className="shrink-0 flex items-center justify-center mt-0.5">
                  {isCorrect && (
                    <span className="material-symbols-outlined text-emerald-600 text-xl flex items-center justify-center">
                      check_circle
                    </span>
                  )}
                  {isSelected && !isCorrect && (
                    <span className="material-symbols-outlined text-error text-xl flex items-center justify-center">
                      cancel
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleBackManual}
          disabled={currentIndex === 0}
          className={`inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-outline-variant/30 text-sm font-semibold transition-all shadow-sm ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : 'hover:bg-surface-container-high text-on-surface cursor-pointer active:scale-95'
          }`}
        >
          <span className="material-symbols-outlined text-lg flex items-center justify-center">
            arrow_back
          </span>
          <span>Back</span>
        </button>

        {hasAnswered && (
          <button
            onClick={handleNextManual}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95 animate-fade-in"
          >
            <span>{currentIndex === currentQuestions.length - 1 ? 'Finish' : 'Next'}</span>
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              arrow_forward
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default MultipleChoice;