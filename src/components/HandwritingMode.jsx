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

  // Khởi tạo dữ liệu từ props
  useEffect(() => {
    if (!data || data.length === 0) return;

    const generated = data.map((row) => ({
      ques: row[quesCol],
      ans: row[ansCol],
      hira: row[hiraCol],
      originalRow: row,
    }));

    setDataToDisplay(generated);
    questionsPoolRef.current = [];
  }, [data, quesCol, ansCol, hiraCol]);

  // Tạo danh sách câu hỏi luyện tập (5 câu)
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
    setUserInput('');
    setIsSubmitted(false);
    setShowHint(false);
    setResults([]);
    setShowResult(false);
  };

  // Thiết lập danh sách câu hỏi khi dataToDisplay hoặc practiseMode thay đổi
  useEffect(() => {
    if (dataToDisplay.length === 0) return;

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

  // Tự động phát âm thanh ở chế độ nghe khi chuyển câu
  useEffect(() => {
    if (mode === 'listening' && currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      const textToSpeak = currentQ?.hira || currentQ?.ans;
      if (textToSpeak && typeof speakText === 'function') {
        speakText(textToSpeak);
      }
    }
  }, [currentIndex, currentQuestions, mode, showResult]);

  // Focus vào ô input khi chuyển sang câu hỏi mới
  useEffect(() => {
    if (!isSubmitted && !showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isSubmitted, showResult]);

  // Kiểm tra tính đúng đắn của đáp án
  const checkAnswerCorrectness = (input, targetAns) => {
    if (targetAns === undefined || targetAns === null) return false;

    const cleanInput = String(input)
      .trim()
      .replace(/[\u3000\s]+/g, ' ')
      .toLowerCase();

    const validAnswers = String(targetAns)
      .split(/[,;/|]/)
      .map((ans) => ans.trim().replace(/[\u3000\s]+/g, ' ').toLowerCase());

    return validAnswers.includes(cleanInput);
  };

  // Chuyển sang câu hỏi tiếp theo
  const moveToNextQuestion = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setUserInput('');
      setIsSubmitted(false);
      setShowHint(false);
    }
  };

  // Nộp bài và kiểm tra đáp án
  const handleCheck = () => {
    if (isSubmitted) return;

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = checkAnswerCorrectness(userInput, currentQ.ans);

    const updatedResultItem = {
      ...currentQ,
      userAnswer: userInput,
      correct: isCorrect,
    };

    const newResults = [...results, updatedResultItem];
    setResults(newResults);
    setIsSubmitted(true);

    const textToSpeak = currentQ?.hira || currentQ?.ans;
    if (textToSpeak && typeof speakText === 'function') {
      speakText(textToSpeak);
    }

    timerRef.current = setTimeout(() => {
      moveToNextQuestion();
    }, 3000);
  };

  const handleNextManual = () => {
    moveToNextQuestion();
  };

  const handleContinue = () => {
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

  // Trạng thái đang tải dữ liệu
  if (currentQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">
          progress_activity
        </span>
        <p className="text-sm">Đang khởi tạo bài tập...</p>
      </div>
    );
  }

  // Màn hình tổng kết kết quả
  if (showResult) {
    const totalCorrect = results.filter((r) => r.correct).length;
    const accuracyPercentage = Math.round(
      (totalCorrect / results.length) * 100
    );

    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        {/* Header kết quả */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary-container/40 text-primary">
            <span className="material-symbols-outlined text-4xl">
              analytics
            </span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            Kết quả Handwriting
          </h3>
          <p className="text-xs text-on-surface-variant">
            Hoàn thành {results.length} câu hỏi tự luận.
          </p>
        </div>

        {/* Tổng quan chỉ số */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Chính xác
            </span>
            <div className="text-xl font-extrabold text-primary mt-0.5">
              {accuracyPercentage}%
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Số câu đúng
            </span>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {totalCorrect} / {results.length}
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Số câu sai
            </span>
            <div className="text-xl font-extrabold text-error mt-0.5">
              {results.length - totalCorrect}
            </div>
          </div>
        </div>

        {/* Danh sách câu hỏi và kết quả chi tiết */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base">
              list_alt
            </span>
            Chi tiết các câu đã làm
          </span>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {results.map((r, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  r.correct
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-error-container/20 border-error/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">
                      Câu {idx + 1}
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
                      {r.correct ? 'Đúng' : 'Sai'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-on-surface font-medium">
                    <span className="text-on-surface-variant/70">Câu hỏi: </span>
                    {mode === 'listening' ? (
                      <span className="italic text-on-surface-variant">
                        [Chế độ nghe]
                      </span>
                    ) : (
                      r.ques
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div className="text-on-surface">
                      <span className="text-on-surface-variant/70">
                        Bạn viết:{' '}
                      </span>
                      <span
                        className={`font-semibold ${
                          r.correct
                            ? 'text-emerald-600'
                            : 'text-error line-through'
                        }`}
                      >
                        {r.userAnswer || '(Bỏ trống)'}
                      </span>
                    </div>

                    <div className="text-on-surface">
                      <span className="text-on-surface-variant/70">
                        Đáp án đúng:{' '}
                      </span>
                      <span className="font-semibold text-primary">
                        {r.ans}
                      </span>
                    </div>
                  </div>

                  {/* Hiển thị chi tiết toàn bộ dữ liệu của Row */}
                  {r.originalRow && (
                    <div className="pt-2 border-t border-outline-variant/15 mt-2">

                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(r.originalRow).map(([key, val]) => (
                          <div
                            key={key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] border border-outline-variant/20"
                          >

                            <span className="font-semibold text-on-surface">
                              {val !== null && val !== undefined
                                ? String(val)
                                : '—'}
                            </span>
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

        {/* Nút hành động */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg">replay</span>
            Tiếp tục ván mới
          </button>
        </div>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  const currentResult = results[results.length - 1];

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
      {/* Header thanh tiến trình */}
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-2xl border border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            draw
          </span>
          <span className="text-xs font-bold text-on-surface">
            Handwriting Mode
          </span>
        </div>

        <div className="text-xs font-semibold text-on-surface-variant">
          Câu {currentIndex + 1} / {currentQuestions.length}
        </div>
      </div>

      {/* Tiến độ phần trăm */}
      <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-1.5 transition-all duration-300 rounded-full"
          style={{
            width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`,
          }}
        />
      </div>

      {/* Thẻ chứa câu hỏi chính */}
      <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center gap-3 min-h-[140px] relative">
        {mode === 'listening' ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Chế độ luyện nghe
            </span>
            <button
              onClick={() => speakText(currentQ.hira || currentQ.ans)}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary-container/80 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-xl">volume_up</span>
              Nghe lại phát âm
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block">
              Câu hỏi
            </span>
            <div className="text-2xl font-bold text-on-surface tracking-wide">
              {currentQ.ques}
            </div>
          </div>
        )}

        {/* Nút bật/tắt gợi ý */}
        <div className="pt-1">
          <button
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              {showHint ? 'visibility_off' : 'lightbulb'}
            </span>
            {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
          </button>

          {showHint && (
            <div className="mt-2 py-1.5 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-medium border border-amber-500/20 animate-fade-in">
              Gợi ý đáp án: <span className="font-bold">{currentQ.ans}</span>
            </div>
          )}
        </div>
      </div>

      {/* Khu vực nhập đáp án */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Nhập câu trả lời..."
            disabled={isSubmitted}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!isSubmitted) {
                  handleCheck();
                } else {
                  handleNextManual();
                }
              }
            }}
            className="flex-1 py-3 px-4 bg-surface rounded-xl border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base disabled:opacity-70 transition-all"
          />

          {!isSubmitted ? (
            <button
              onClick={handleCheck}
              disabled={!userInput.trim()}
              className="py-3 px-5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>Kiểm tra</span>
              <span className="material-symbols-outlined text-lg">check</span>
            </button>
          ) : (
            <button
              onClick={handleNextManual}
              className="py-3 px-5 rounded-xl bg-surface-container-high text-on-surface font-semibold text-sm hover:bg-surface-container-highest transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Tiếp</span>
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </button>
          )}
        </div>

        {/* Phản hồi ngang liên tục sau khi bấm Kiểm tra */}
        {isSubmitted && currentResult && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-fade-in ${
              currentResult.correct
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-error-container/30 border-error/30 text-error'
            }`}
          >
            <div className="flex items-center gap-2 shrink-0 font-bold">
              <span className="material-symbols-outlined text-lg">
                {currentResult.correct ? 'check_circle' : 'cancel'}
              </span>
              <span>{currentResult.correct ? 'Chính xác' : 'Chưa đúng'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right text-on-surface">
              <span className="inline-flex items-center gap-1">
                <span className="text-on-surface-variant/70">Bạn viết:</span>
                <span
                  className={`font-semibold ${
                    currentResult.correct
                      ? 'text-emerald-600'
                      : 'text-error line-through'
                  }`}
                >
                  {userInput || '(Bỏ trống)'}
                </span>
              </span>

              {currentQ.originalRow &&
                Object.entries(currentQ.originalRow).map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1">
                    <span className="text-outline-variant/60">•</span>
                    <span className="font-semibold text-on-surface">
                      {val !== null && val !== undefined ? String(val) : ''}
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