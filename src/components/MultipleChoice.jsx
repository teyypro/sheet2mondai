import React, { useState, useEffect, useRef } from 'react';
import { speakText, cancelSpeak } from '../utils/text_to_speech';

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

// Component review item có thể thu gọn
function ReviewItem({ result, index, onSpeak, isMastered }) {
  const [expanded, setExpanded] = useState(false);
  const selectedOptObj = result.opt[result.selected];
  const correctOptObj = result.opt[result.ans];

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

  return (
    <div
      className={`rounded-2xl border transition-all ${
        result.correct
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-error-container/20 border-error/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              result.correct
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-error/10 text-error'
            }`}
          >
            <span className="material-symbols-outlined text-xs flex items-center justify-center">
              {result.correct ? 'check_circle' : 'cancel'}
            </span>
            {result.correct ? 'Correct' : 'Incorrect'}
          </span>
          <span className="text-xs font-bold text-on-surface-variant shrink-0">
            Q{index + 1}
          </span>
          {isMastered && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[10px] flex items-center justify-center">
                school
              </span>
              Đã thuộc
            </span>
          )}
          <span className="text-sm font-semibold text-on-surface truncate">
            {result.ques}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {result.hira && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSpeak(result.hira);
              }}
              title="Nghe phát âm"
              className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base flex items-center justify-center">
                volume_up
              </span>
            </button>
          )}

          <button
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? 'Thu gọn' : 'Xem chi tiết'}
            className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-base flex items-center justify-center transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2 text-xs border-t border-outline-variant/10 pt-3 animate-fade-in">
          <div className="text-on-surface">
            <span className="text-on-surface-variant/70 block mb-1">
              Question context:
            </span>
            <div className="font-semibold text-on-surface bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/10 break-words">
              {renderOptionDetail(result.originalRow)}
            </div>
          </div>

          <div className="text-on-surface">
            <span className="text-on-surface-variant/70 block mb-0.5">Selected:</span>
            <div
              className={`font-semibold p-2 rounded-lg border break-words ${
                result.correct
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                  : 'bg-error-container/10 border-error/20 text-error'
              }`}
            >
              {selectedOptObj
                ? renderOptionDetail(selectedOptObj.optionRow)
                : 'Unanswered'}
            </div>
          </div>

          {!result.correct && (
            <div className="text-on-surface">
              <span className="text-on-surface-variant/70 block mb-0.5">
                Correct answer:
              </span>
              <div className="font-semibold p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 break-words">
                {correctOptObj
                  ? renderOptionDetail(correctOptObj.optionRow)
                  : '—'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MultipleChoice({
  data,
  quesCol,
  ansCol,
  hiraCol,
  mode,
  practiseMode,
}) {
  const [dataToDisplay, setDataToDisplay] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChanting, setIsChanting] = useState(false);

  const QUESTIONS_PER_ROUND = 5;

  const selectionStatsRef = useRef({});
  const [masteredIds, setMasteredIds] = useState(new Set());
  const isChantingRef = useRef(false);
  const chantAbortRef = useRef(false);

  // Ref để tụng kinh xuyên qua các câu - luôn đọc câu mới nhất
  const currentQuestionsRef = useRef([]);
  const currentIndexRef = useRef(0);

  // Đồng bộ ref với state
  useEffect(() => {
    currentQuestionsRef.current = currentQuestions;
  }, [currentQuestions]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Dừng tụng kinh
  const stopChanting = () => {
    isChantingRef.current = false;
    chantAbortRef.current = true;
    setIsChanting(false);
    cancelSpeak();
  };

  const triggerSpeak = async (text, speed) => {
    if (!text) {
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      await speakText(text, speed != null ? { speed } : undefined);
    } finally {
      setIsSpeaking(false);
    }
  };

  /**
   * Tụng kinh: đọc liên hồi câu HIỆN TẠI (theo ref).
   * Dùng await speakText(...) để chờ đọc xong mới đọc tiếp -> không chồng tiếng.
   * Khi Next/Back hoặc sang ván mới -> vòng lặp tự đọc câu mới qua ref.
   */
  const startChanting = async () => {
    if (!currentQuestionsRef.current.length) return;
    const firstQ = currentQuestionsRef.current[currentIndexRef.current];
    if (!firstQ?.hira) return;

    isChantingRef.current = true;
    chantAbortRef.current = false;
    setIsChanting(true);

    while (isChantingRef.current && !chantAbortRef.current) {
      const q = currentQuestionsRef.current[currentIndexRef.current];

      if (q?.hira) {
        try {
          // Tụng thì đọc nhanh hơn: speed 1.2
          await speakText(q.hira, { speed: 1.2 });
        } catch (e) {
          // ignore
        }
      } else {
        // Câu không có hira -> nghỉ ngắn rồi thử lại
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!isChantingRef.current || chantAbortRef.current) break;

      // Nghỉ ngắn giữa các lần đọc
      await new Promise((r) => setTimeout(r, 250));
    }

    setIsChanting(false);
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      isChantingRef.current = false;
      chantAbortRef.current = true;
      cancelSpeak();
    };
  }, []);

  // KHÔNG dừng tụng khi showResult nữa -> tụng xuyên suốt.
  // Nếu muốn dừng khi showResult, bật lại effect này:
  // useEffect(() => { if (showResult) stopChanting(); }, [showResult]);

  // Khởi tạo data câu hỏi
  useEffect(() => {
    if (!data?.length) return;

    const uniqueAnswers = [...new Set(data.map((r) => r[ansCol]))];

    const generated = data.map((row, rowIdx) => {
      const correctAns = row[ansCol];
      const options = uniqueAnswers.filter((ans) => ans !== correctAns);
      const selectedOpts = options.sort(() => Math.random() - 0.5).slice(0, 3);
      const shuffledOpts = [...selectedOpts, correctAns].sort(
        () => Math.random() - 0.5
      );

      return {
        idx: rowIdx,
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
    selectionStatsRef.current = {};
    setMasteredIds(new Set());
  }, [data, quesCol, ansCol, hiraCol]);

  const generatePractiseQuestions = (fullData) => {
    const dataset = fullData || dataToDisplay;
    if (!dataset.length) return;

    const available = dataset.filter((q) => !masteredIds.has(q.idx));

    if (available.length === 0) {
      setCurrentQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResult(false);
      setIsSpeaking(false);
      // KHÔNG dừng tụng -> giữ trạng thái
      return;
    }

    const stats = selectionStatsRef.current;
    const minSelectCount = Math.min(
      ...available.map((item) => stats[item.idx] || 0)
    );

    const candidates = available.filter(
      (item) => (stats[item.idx] || 0) === minSelectCount
    );

    const needCount = Math.min(QUESTIONS_PER_ROUND, available.length);

    let selected;
    if (candidates.length >= needCount) {
      selected = weightedRandomSelect(candidates, needCount, stats);
    } else {
      const remaining = available.filter(
        (item) => !candidates.some((c) => c.idx === item.idx)
      );
      const extra = weightedRandomSelect(
        remaining,
        needCount - candidates.length,
        stats
      );
      selected = [...candidates, ...extra];
    }

    selected.forEach((item) => {
      stats[item.idx] = (stats[item.idx] || 0) + 1;
    });

    setCurrentQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResult(false);
    setIsSpeaking(false);
    // KHÔNG đụng tới isChanting / isChantingRef -> tụng tiếp tục
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
  }, [dataToDisplay, practiseMode]);

  // Tự động phát âm khi chuyển câu (chỉ khi KHÔNG tụng kinh)
  useEffect(() => {
    if (
      currentQuestions.length > 0 &&
      !showResult &&
      !isChantingRef.current
    ) {
      const currentQ = currentQuestions[currentIndex];
      if (currentQ?.hira) {
        triggerSpeak(currentQ.hira);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQuestions, showResult]);

  const handleFinishQuiz = (finalAnswers) => {
    // KHÔNG stopChanting() ở đây nữa -> tụng xuyên suốt qua cả màn kết quả.
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

    // Không dừng tụng kinh khi trả lời
    if (!isChantingRef.current) {
      const currentQ = currentQuestions[currentIndex];
      if (currentQ?.hira) {
        triggerSpeak(currentQ.hira);
      }
    }
  };

  const handleMarkMastered = () => {
    if (!practiseMode) return;
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ) return;

    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.add(currentQ.idx);
      return next;
    });

    if (currentIndex === currentQuestions.length - 1) {
      handleFinishQuiz(selectedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleNextManual = () => {
    setIsSpeaking(false);

    if (currentIndex === currentQuestions.length - 1) {
      handleFinishQuiz(selectedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBackManual = () => {
    if (currentIndex <= 0) return;
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
    // KHÔNG stopChanting -> tụng tiếp tục qua ván mới
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

  const allMastered =
    practiseMode &&
    dataToDisplay.length > 0 &&
    masteredIds.size >= dataToDisplay.length;

  if (allMastered) {
    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center gap-2 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center justify-center p-3 rounded-full bg-emerald-500/10 text-emerald-600">
            <span className="material-symbols-outlined text-4xl flex items-center justify-center">
              verified
            </span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">Hoàn thành!</h3>
          <p className="text-xs text-on-surface-variant">
            Bạn đã thuộc hết {dataToDisplay.length} câu. Không còn câu nào để luyện tập.
          </p>
        </div>

        <button
          onClick={() => {
            setMasteredIds(new Set());
            selectionStatsRef.current = {};
            setTimeout(() => generatePractiseQuestions(), 0);
          }}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer shadow-md"
        >
          <span className="material-symbols-outlined text-lg flex items-center justify-center">
            restart_alt
          </span>
          <span>Reset &amp; Luyện lại từ đầu</span>
        </button>
      </div>
    );
  }

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
    const accuracy = results.length
      ? Math.round((totalCorrect / results.length) * 100)
      : 0;

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

          {practiseMode && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm flex items-center justify-center">
                school
              </span>
              <span>
                Đã thuộc: {masteredIds.size} / {dataToDisplay.length}
              </span>
            </div>
          )}
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
            <span className="text-on-surface-variant/50 font-normal ml-1">
              (nhấn để xem chi tiết)
            </span>
          </span>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {results.map((r, idx) => (
              <ReviewItem
                key={idx}
                result={r}
                index={idx}
                onSpeak={triggerSpeak}
                isMastered={masteredIds.has(r.idx)}
              />
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          {practiseMode && (
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-surface-container-low border border-outline-variant/10">
              <span className="material-symbols-outlined text-base text-primary flex items-center justify-center">
                school
              </span>
              <span className="text-xs font-medium text-on-surface-variant">
                Đã thuộc{' '}
                <strong className="text-primary">{masteredIds.size}</strong> /{' '}
                {dataToDisplay.length} câu
              </span>
              <div className="flex-1 max-w-[120px] h-1.5 bg-surface-container-high rounded-full overflow-hidden ml-1">
                <div
                  className="h-1.5 bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${(masteredIds.size / dataToDisplay.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg flex items-center justify-center">
              replay
            </span>
            <span>
              {practiseMode ? 'Ván luyện tập tiếp theo' : 'Start New Session'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  const hasAnswered = selectedAnswers[currentIndex] !== undefined;
  const isCurrentMastered = masteredIds.has(currentQ.idx);

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
          {practiseMode && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <span className="material-symbols-outlined text-[10px] flex items-center justify-center">
                school
              </span>
              {masteredIds.size}/{dataToDisplay.length}
            </span>
          )}
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

      {/* Question box */}
      <div className="p-5 bg-surface rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center text-center gap-3 min-h-[120px]">
        {mode === 'listening' ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Listening Mode
            </span>
            <div className="flex items-center gap-2">
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

              {/* Nút tụng kinh - trạng thái xuyên suốt các vòng */}
              <button
                onClick={() => {
                  if (isChanting) {
                    stopChanting();
                  } else {
                    startChanting();
                  }
                }}
                title={isChanting ? 'Dừng tụng kinh' : 'Tụng kinh - đọc liên hồi'}
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full font-semibold text-sm transition-all cursor-pointer active:scale-95 shadow-sm border ${
                  isChanting
                    ? 'bg-amber-500/20 text-amber-700 border-amber-500/40 animate-pulse'
                    : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-xl flex items-center justify-center">
                  {isChanting ? 'stop_circle' : 'graphic_eq'}
                </span>
                <span>{isChanting ? 'Đang tụng...' : 'Tụng kinh'}</span>
              </button>
            </div>
          </div>
        ) : (
          // Reading mode: nhấn vào ô là đọc
          <button
            onClick={() => {
              if (currentQ?.hira) {
                triggerSpeak(currentQ.hira);
              }
            }}
            title="Nhấn để nghe phát âm"
            className="flex flex-col items-center justify-center w-full cursor-pointer hover:bg-surface-container-low/50 rounded-xl transition-all p-2 active:scale-[0.99]"
          >
            <div className="text-3xl font-medium text-on-surface tracking-wide break-words w-full">
              {currentQ.ques}
            </div>
          </button>
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
                !hasAnswered
                  ? 'cursor-pointer active:scale-[0.99]'
                  : 'cursor-default'
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

      <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
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

        <div className="flex items-center gap-2">
          {practiseMode && hasAnswered && !isCurrentMastered && (
            <button
              onClick={handleMarkMastered}
              title="Đánh dấu câu này đã thuộc (sẽ không quay lại)"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-sm font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer active:scale-95 animate-fade-in"
            >
              <span className="material-symbols-outlined text-lg flex items-center justify-center">
                school
              </span>
              <span>Đã thuộc</span>
            </button>
          )}

          {isCurrentMastered && (
            <span className="inline-flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">
              <span className="material-symbols-outlined text-base flex items-center justify-center">
                verified
              </span>
              <span>Đã đánh dấu thuộc</span>
            </span>
          )}

          {hasAnswered && (
            <button
              onClick={handleNextManual}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm active:scale-95 animate-fade-in"
            >
              <span>
                {currentIndex === currentQuestions.length - 1
                  ? 'Finish'
                  : 'Next'}
              </span>
              <span className="material-symbols-outlined text-lg flex items-center justify-center">
                arrow_forward
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MultipleChoice;