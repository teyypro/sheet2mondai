// components/MultipleChoice.jsx
import React, { useState, useEffect, useRef } from 'react';

function MultipleChoice({ data, quesCol, ansCol, hiraCol, mode, practiseMode, speakText }) {
  const [dataToDisplay, setDataToDisplay] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState([]);
  
  const questionsPoolRef = useRef([]);
  const timerRef = useRef(null);

  // 1. Khởi tạo dữ liệu hiển thị
  useEffect(() => {
    if (!data || data.length === 0) return;

    const generated = data.map((row, idx) => {
      const correctAns = row[ansCol];
      const allAnswers = data.map(r => r[ansCol]);
      const uniqueAnswers = [...new Set(allAnswers)];
      let options = uniqueAnswers.filter(ans => ans !== correctAns);
      
      const shuffled = options.sort(() => Math.random() - 0.5);
      const selectedOpts = shuffled.slice(0, 3);
      
      const finalOpts = [...selectedOpts, correctAns];
      const shuffledOpts = finalOpts.sort(() => Math.random() - 0.5);
      
      return {
        ques: row[quesCol],
        // Lưu kèm thông tin hàng gốc (originalRow) và index gốc (info_id) của từng option
        opt: shuffledOpts.map(opt => {
          const originalIndex = data.findIndex(r => r[ansCol] === opt);
          return { 
            opt, 
            info_id: originalIndex,
            optionRow: data[originalIndex] // Giữ object data gốc của riêng option này
          };
        }),
        ans: shuffledOpts.indexOf(correctAns),
        hira: row[hiraCol],
        originalRow: row // Hàng gốc của câu hỏi hiện tại
      };
    });

    setDataToDisplay(generated);
    questionsPoolRef.current = [];
  }, [data, quesCol, ansCol, hiraCol]);

  // Thuật toán lấy 5 câu hỏi phân bố đều
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

    const selectedQuestions = selectedIndices.map(index => dataset[index]);

    setCurrentQuestions(selectedQuestions);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResult(false);
  };

  useEffect(() => {
    if (dataToDisplay.length === 0) return;

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

  // Tự động phát âm thanh (Listening Mode)
  useEffect(() => {
    if (mode === 'listening' && currentQuestions.length > 0 && !showResult) {
      const currentQ = currentQuestions[currentIndex];
      if (currentQ && currentQ.hira && typeof speakText === 'function') {
        speakText(currentQ.hira);
      }
    }
  }, [currentIndex, currentQuestions, mode, showResult]);

  // Hàm thực hiện chuyển dịch câu hỏi (tách riêng để dùng chung cho tự động và nút bấm)
  const moveToNextQuestion = (updatedAnswers) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const isLastQuestion = currentIndex === currentQuestions.length - 1;
    if (isLastQuestion) {
      const newResults = currentQuestions.map((q, idx) => ({
        correct: updatedAnswers[idx] === q.ans,
        selected: updatedAnswers[idx],
        ...q
      }));
      setResults(newResults);
      setShowResult(true);
    } else {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  // 4. Xử lý khi chọn đáp án
  const handleAnswer = (optIndex) => {
    if (selectedAnswers[currentIndex] !== undefined) return;

    const newSelected = { ...selectedAnswers, [currentIndex]: optIndex };
    setSelectedAnswers(newSelected);
    speakText(currentQ.hira)
    // Tự động chuyển câu sau 2 giây
    timerRef.current = setTimeout(() => {
      moveToNextQuestion(newSelected);
    }, 2000);
  };

  // Xử lý khi người dùng nhấn nút "Chuyển tiếp" thủ công
  const handleNextManual = () => {
    moveToNextQuestion(selectedAnswers);
  };

  const handleContinue = () => {
    if (practiseMode) {
      generatePractiseQuestions();
    } else {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowResult(false);
    }
  };

  const handleCancel = () => {
    setCurrentQuestions([]);
    setShowResult(false);
  };

  if (currentQuestions.length === 0) {
    return <div>Loading...</div>;
  }

  if (showResult) {
    return (
      <div>
        <h3>Kết quả</h3>
        {results.map((r, idx) => (
          <div key={idx} style={{ margin: '15px 0', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <div><strong>Câu {idx + 1}:</strong> {mode === 'listening' ? '[Ẩn câu hỏi ở chế độ nghe]' : r.ques}</div>
            <div>Đáp án đúng: {r.opt[r.ans].opt}</div>
            <div>Bạn chọn: {r.opt[r.selected]?.opt || 'Chưa chọn'}</div>
            <div style={{ color: r.correct ? 'green' : 'red', fontWeight: 'bold' }}>
              {r.correct ? '✅ Đúng' : '❌ Sai'}
            </div>
          </div>
        ))}
        <button onClick={handleContinue}>Tiếp tục</button>
        <button onClick={handleCancel}>Hủy</button>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  const hasAnswered = selectedAnswers[currentIndex] !== undefined;

  return (
    <div>
      <h3>Multiple Choice</h3>
      <div style={{ margin: '20px 0' }}>
        
        {mode === 'listening' ? (
          <div>
            <strong>Câu hỏi:</strong> [Chế độ nghe]
            <div style={{ marginTop: '5px' }}>
              <button onClick={() => speakText(currentQ.hira)}>🔊 Nghe lại</button>
            </div>
          </div>
        ) : (
          <div><strong>Câu hỏi:</strong> {currentQ.ques}</div>
        )}

        {/* Danh sách các phương án lựa chọn */}
        <div style={{ marginTop: '10px' }}>
          {currentQ.opt.map((opt, idx) => {
            let itemColor = 'black';
            if (hasAnswered) {
              if (idx === currentQ.ans) {
                itemColor = 'green';
              } else if (idx === selectedAnswers[currentIndex]) {
                itemColor = 'red';
              }
            }

            return (
              <div key={idx} style={{ color: itemColor, margin: '10px 0', padding: '5px', border: '1px solid #eee' }}>
                <label style={{ cursor: hasAnswered ? 'not-allowed' : 'pointer', display: 'block' }}>
                  <input 
                    type="radio" 
                    name={`answer_${currentIndex}`} 
                    value={idx}
                    onChange={() => handleAnswer(idx)}
                    checked={selectedAnswers[currentIndex] === idx}
                    disabled={hasAnswered}
                  />
                  <strong>{opt.opt}</strong>
                  {hasAnswered && idx === currentQ.ans && ' (Đáp án đúng)'}
                  {hasAnswered && idx === selectedAnswers[currentIndex] && idx !== currentQ.ans && ' (Lựa chọn của bạn)'}
                </label>

                {/* YÊU CẦU 1: Hiển thị full data hàng gốc của RIÊNG option này sau khi đã chọn xong câu hỏi */}
                {hasAnswered && opt.optionRow && (
                  <div style={{ marginTop: '5px', fontSize: '0.85em', color: '#666', background: '#f5f5f5', padding: '5px' }}>
                    <span>Thông tin chi tiết: {JSON.stringify(opt.optionRow)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* YÊU CẦU 2: Nút Chuyển tiếp xuất hiện ngay sau khi chọn đáp án */}
        {hasAnswered && (
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleNextManual} style={{ padding: '6px 12px', fontWeight: 'bold' }}>
              Chuyển tiếp ➔
            </button>
          </div>
        )}

        <div style={{ marginTop: '15px', fontSize: '0.9em' }}>
          Câu {currentIndex + 1} / {currentQuestions.length}
        </div>
      </div>
    </div>
  );
}

export default MultipleChoice;