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

  // 1. Khởi tạo dữ liệu hiển thị kèm thông tin hàng gốc (originalRow)
  useEffect(() => {
    if (!data || data.length === 0) return;

    const generated = data.map((row) => {
      const ans = String(row[ansCol] || '');

      // Bóc tách từng ký tự Kanji/Kana bằng spread operator
      const chars = [...ans];

      // Thu thập toàn bộ các ký tự từ cột đáp án để tạo kho chữ nhiễu
      const allChars = data.map((r) => [...String(r[ansCol] || '')]).flat();

      // Lọc các ký tự không trùng với đáp án hiện tại để làm chữ nhiễu
      const extraChars = allChars.filter((c) => !chars.includes(c));
      const shuffledExtra = extraChars.sort(() => Math.random() - 0.5);
      const selectedExtra = shuffledExtra.slice(0, 2);

      // Trộn chữ chuẩn và chữ nhiễu
      const rawOpts = [...chars, ...selectedExtra].sort(
        () => Math.random() - 0.5
      );

      // Gán định danh duy nhất cho từng chữ Kanji/Kana
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

  // Thuật toán lấy 5 câu hỏi ngẫu nhiên phân bố đều
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

  // 2. Thiết lập danh sách câu hỏi dựa trên practiseMode
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

  // Khởi tạo trạng thái các ký tự của câu hỏi hiện tại
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

  // 3. Tự động phát âm thanh ở chế độ Nghe (Listening Mode) khi chuyển câu
  useEffect(() => {
    if (mode === 'listening' && currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      const textToSpeak = currentQ?.hira || currentQ?.ans;
      if (textToSpeak && typeof speakText === 'function') {
        speakText(textToSpeak);
      }
    }
  }, [currentIndex, currentQuestions, mode, showResult]);

  // Thao tác chọn ký tự đưa vào hàng đáp án
  const handleSelectChar = (charObj) => {
    if (isSubmitted) return;
    setSelectedChars([...selectedChars, charObj]);
    setAvailableChars(availableChars.filter((c) => c.id !== charObj.id));
  };

  // Thao tác gỡ ký tự khỏi hàng đáp án trả về hàng đợi
  const handleRemoveChar = (index) => {
    if (isSubmitted) return;
    const charObj = selectedChars[index];
    setSelectedChars(selectedChars.filter((_, i) => i !== index));
    setAvailableChars([...availableChars, charObj]);
  };

  // Điều phối chuyển đổi câu hỏi kế tiếp
  const moveToNextQuestion = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  // 4. Xử lý kích hoạt nút "Kiểm tra"
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

    const newResults = [...results, updatedResultItem];
    setResults(newResults);
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

  // Component phụ trách hiển thị dữ liệu dòng gốc khoa học
  const RenderRowData = ({ rowData }) => {
    if (!rowData || typeof rowData !== 'object') return null;

    const entries = Object.entries(rowData);

    return (
      <div className="mt-2.5 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/15 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-surface/80 border border-outline-variant/10"
            >
              <span className="font-semibold text-on-surface break-all text-left text-xl">
                {value !== null && value !== undefined ? String(value) : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Trạng thái tải dữ liệu
  if (currentQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary">
          progress_activity
        </span>
        <p className="text-sm">Đang tải câu hỏi sắp xếp...</p>
      </div>
    );
  }

  // Màn hình kết quả
  if (showResult) {
    const totalCorrect = results.filter((r) => r.correct).length;
    const accuracyPercentage = Math.round(
      (totalCorrect / results.length) * 100
    );

    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        {/* Header Kết quả */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary-container/40 text-primary">
            <span className="material-symbols-outlined text-4xl">
              sort_by_alpha
            </span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            Kết quả Ghép từ (Word Scramble)
          </h3>
          <p className="text-xs text-on-surface-variant">
            Hoàn thành {results.length} câu ghép ký tự.
          </p>
        </div>

        {/* Thống kê chỉ số */}
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
              Đúng
            </span>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {totalCorrect} / {results.length}
            </div>
          </div>
          <div className="p-3 bg-surface-container rounded-2xl border border-outline-variant/20 text-center">
            <span className="text-[10px] font-semibold uppercase text-on-surface-variant/70">
              Sai
            </span>
            <div className="text-xl font-extrabold text-error mt-0.5">
              {results.length - totalCorrect}
            </div>
          </div>
        </div>

        {/* Chi tiết từng câu */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base">
              task_alt
            </span>
            Chi tiết các câu đã sắp xếp
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

                <div className="space-y-1.5 text-xs">
                  <div className="text-on-surface font-medium">
                    <span className="text-on-surface-variant/70">
                      Câu hỏi:{' '}
                    </span>
                    {mode === 'listening' ? (
                      <span className="italic text-on-surface-variant">
                        [Chế độ nghe]
                      </span>
                    ) : (
                      r.ques
                    )}
                  </div>

                  <div className="text-on-surface">
                    <span className="text-on-surface-variant/70">
                      Bạn ghép:{' '}
                    </span>
                    <span
                      className={`font-bold ${
                        r.correct ? 'text-emerald-600' : 'text-error'
                      }`}
                    >
                      {r.userAnswer || '(Bỏ trống)'}
                    </span>
                  </div>

                  {!r.correct && (
                    <div className="text-on-surface">
                      <span className="text-on-surface-variant/70">
                        Đáp án chuẩn:{' '}
                      </span>
                      <span className="font-bold text-emerald-600">
                        {r.ans}
                      </span>
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

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg">replay</span>
            Luyện tập ván mới
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
      {/* Header Tiến trình */}
      <div className="flex items-center justify-between bg-surface-container p-3 rounded-2xl border border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">
            extension
          </span>
          <span className="text-xs font-bold text-on-surface">
            Word Scramble Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-on-surface-variant">
            Câu {currentIndex + 1} / {currentQuestions.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-1.5 transition-all duration-300 rounded-full"
          style={{
            width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`,
          }}
        />
      </div>

      {/* Khung Câu hỏi */}
      <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center gap-2 min-h-[110px] relative">
        {mode === 'listening' ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Chế độ nghe
            </span>
            <button
              onClick={() => speakText(currentQ.hira || currentQ.ans)}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary-container/80 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">
                volume_up
              </span>
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

        {/* Nút bật/tắt Gợi ý */}
        <div className="mt-1">
          <button
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {showHint ? 'visibility_off' : 'lightbulb'}
            </span>
            {showHint ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
          </button>

          {showHint && (
            <div className="mt-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold animate-fade-in border border-amber-500/20">
              Gợi ý: {currentQ.ans}
            </div>
          )}
        </div>
      </div>
  {/* Khung phản hồi kết quả sau khi Submit */}
      {isSubmitted && (
        <div
          className={`p-4 rounded-2xl border space-y-2 animate-fade-in ${
            lastResult?.correct
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-error-container/30 border-error/30 text-error'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined text-xl">
              {lastResult?.correct ? 'check_circle' : 'cancel'}
            </span>
            <span>
              {lastResult?.correct
                ? 'Đúng chính xác!'
                : 'Rất tiếc, chưa chính xác.'}
            </span>
          </div>

          <div className="text-xs text-on-surface">
            Đáp án đúng:{' '}
            <strong className="text-emerald-600 font-extrabold text-sm">
              {currentQ.ans}
            </strong>
          </div>

          {currentQ.originalRow && (
            <RenderRowData rowData={currentQ.originalRow} />
          )}
        </div>
      )}
      {/* Vùng các ký tự đã chọn (Hàng đáp án) */}
      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 min-h-[88px] flex flex-col justify-center gap-1.5">
        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block">
          Đáp án của bạn:
        </span>
        <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
          {selectedChars.length === 0 ? (
            <span className="text-xs text-on-surface-variant/40 italic">
              Chạm vào các ký tự bên dưới để ghép từ...
            </span>
          ) : (
            selectedChars.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleRemoveChar(idx)}
                disabled={isSubmitted}
                className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-base shadow-sm hover:bg-error hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-90 disabled:cursor-default"
              >
                <span>{item.char}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Kho ký tự có sẵn để chọn */}
      <div className="p-4 bg-surface rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider block">
          Kho ký tự:
        </span>
        <div className="flex flex-wrap gap-2 min-h-[48px]">
          {availableChars.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectChar(item)}
              disabled={isSubmitted}
              className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant/30 font-bold text-lg text-on-surface flex items-center justify-center shadow-xs hover:bg-primary-container hover:border-primary/40 hover:text-on-primary-container transition-all cursor-pointer active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {item.char}
            </button>
          ))}
        </div>
      </div>

    

      {/* Nút Kiểm tra / Chuyển tiếp */}
      <div className="pt-1 flex justify-end">
        {!isSubmitted ? (
          <button
            onClick={handleCheck}
            disabled={selectedChars.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">check</span>
            <span>Kiểm tra</span>
          </button>
        ) : (
          <button
            onClick={handleNextManual}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <span>Chuyển tiếp</span>
            <span className="material-symbols-outlined text-lg">
              arrow_forward
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default WordScrambleMode;