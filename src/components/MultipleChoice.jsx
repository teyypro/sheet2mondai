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

  const questionsPoolRef = useRef([]);
  const timerRef = useRef(null);

  const formatRowData = (row) => {
    if (!row) return '—';
    if (Array.isArray(row)) return row.join(' · ');
    if (typeof row === 'object') return Object.values(row).join(' · ');
    return String(row);
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
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dataToDisplay, practiseMode]);

  useEffect(() => {
    if (mode === 'listening' && currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      if (currentQ?.hira && typeof speakText === 'function') {
        speakText(currentQ.hira);
      }
    }
  }, [currentIndex, currentQuestions, mode, showResult]);

  const moveToNextQuestion = (updatedAnswers) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentIndex === currentQuestions.length - 1) {
      setResults(
        currentQuestions.map((q, idx) => ({
          correct: updatedAnswers[idx] === q.ans,
          selected: updatedAnswers[idx],
          ...q,
        }))
      );
      setShowResult(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAnswer = (optIndex) => {
    if (selectedAnswers[currentIndex] !== undefined) return;

    const newSelected = { ...selectedAnswers, [currentIndex]: optIndex };
    setSelectedAnswers(newSelected);

    const currentQ = currentQuestions[currentIndex];
    if (currentQ?.hira && typeof speakText === 'function') {
      speakText(currentQ.hira);
    }

    timerRef.current = setTimeout(() => moveToNextQuestion(newSelected), 2000);
  };

  const handleNextManual = () => moveToNextQuestion(selectedAnswers);

  const handleContinue = () => {
    if (practiseMode) {
      generatePractiseQuestions();
    } else {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResult(false);
    }
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

                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="text-on-surface font-medium">
                      <span className="text-on-surface-variant/70">Question context: </span>
                      <span className="font-semibold text-on-surface">
                        {formatRowData(r.originalRow)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 pt-1 border-t border-outline-variant/10 mt-1">
                      <div className="text-on-surface">
                        <span className="text-on-surface-variant/70">Selected: </span>
                        <span
                          className={`font-semibold ${
                            r.correct ? 'text-emerald-600' : 'text-error'
                          }`}
                        >
                          {selectedOptObj ? formatRowData(selectedOptObj.optionRow) : 'Unanswered'}
                        </span>
                      </div>

                      {!r.correct && (
                        <div className="text-on-surface">
                          <span className="text-on-surface-variant/70">Correct answer: </span>
                          <span className="font-semibold text-emerald-600">
                            {correctOptObj ? formatRowData(correctOptObj.optionRow) : ''}
                          </span>
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
              onClick={() => speakText(currentQ.hira)}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary-container/80 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-xl flex items-center justify-center">
                volume_up
              </span>
              <span>Replay Audio</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl font-medium text-on-surface tracking-wide">
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
              className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all duration-200 flex items-center justify-between gap-3 ${buttonStyle} ${
                !hasAnswered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
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

                <div className="flex flex-col truncate flex-1">
                  <span className="text-base font-semibold truncate">
                    {hasAnswered ? formatRowData(opt.optionRow) : opt.opt}
                  </span>
                </div>
              </div>

              {hasAnswered && (
                <span className="shrink-0 flex items-center justify-center">
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

      {hasAnswered && (
        <div className="flex justify-end pt-1 animate-fade-in">
          <button
            onClick={handleNextManual}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              arrow_forward
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MultipleChoice;