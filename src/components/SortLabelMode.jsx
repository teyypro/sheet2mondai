// components/SortLabelMode.jsx
import React, { useState, useEffect, useRef } from 'react';

function SortLabelMode({ data, quesCol, ansCol, hiraCol, mode, practiseMode, speakText }) {
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
      const ans = String(row[ansCol]);
      
      // SỬA ĐỔI: Sử dụng toán tử spread [...] thay cho split('') để bóc tách chính xác từng chữ Kanji
      const chars = [...ans];
      
      // Thu thập toàn bộ các ký tự từ cột đáp án để tạo kho chữ nhiễu
      const allChars = data.map(r => [...String(r[ansCol])]).flat();
      
      // Lọc các ký tự không trùng với đáp án hiện tại để làm chữ nhiễu
      const extraChars = allChars.filter(c => !chars.includes(c));
      const shuffledExtra = extraChars.sort(() => Math.random() - 0.5);
      const selectedExtra = shuffledExtra.slice(0, 2);
      
      // Trộn chữ chuẩn và chữ nhiễu
      const rawOpts = [...chars, ...selectedExtra].sort(() => Math.random() - 0.5);
      
      // Gán định danh duy nhất cho từng chữ Kanji/Kana để không bị lẫn vị trí khi click
      const optWithId = rawOpts.map((char, index) => ({
        id: `${char}_${index}_${Math.random()}`,
        char: char
      }));

      return {
        ques: row[quesCol],
        ans: ans,
        hira: row[hiraCol],
        opt: optWithId,
        originalRow: row
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

    const selectedQuestions = selectedIndices.map(index => dataset[index]);

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
    if (currentQuestions.length > 0 && currentIndex < currentQuestions.length && !showResult) {
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
    setAvailableChars(availableChars.filter(c => c.id !== charObj.id));
  };

  // Thao tác gỡ ký tự khỏi hàng đáp án trả về hàng đợi
  const handleRemoveChar = (index) => {
    if (isSubmitted) return;
    const charObj = selectedChars[index];
    setSelectedChars(selectedChars.filter((_, i) => i !== index));
    setAvailableChars([...availableChars, charObj]);
  };

  // Điều phối chuyển đổi câu hỏi kế tiếp
  const moveToNextQuestion = (latestResults) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  // 4. Xử lý kích hoạt nút "Kiểm tra"
  const handleCheck = () => {
    if (isSubmitted) return;

    const currentQ = currentQuestions[currentIndex];
    const userAnswer = selectedChars.map(item => item.char).join('');
    
    // Chuẩn hóa chuỗi so sánh loại bỏ khoảng trắng thừa
    const cleanUserAns = userAnswer.trim().replace(/[\u3000\s]+/g, '').toLowerCase();
    const cleanTargetAns = currentQ.ans.trim().replace(/[\u3000\s]+/g, '').toLowerCase();
    
    const isCorrect = cleanUserAns === cleanTargetAns;

    const updatedResultItem = {
      ...currentQ,
      userAnswer: userAnswer,
      correct: isCorrect
    };

    const newResults = [...results, updatedResultItem];
    setResults(newResults);
    setIsSubmitted(true);

    const textToSpeak = currentQ?.hira || currentQ?.ans;
    if (textToSpeak && typeof speakText === 'function') {
      speakText(textToSpeak);
    }

    timerRef.current = setTimeout(() => {
      moveToNextQuestion(newResults);
    }, 2000);
  };

  const handleNextManual = () => {
    moveToNextQuestion(results);
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

  const handleCancel = () => {
    setCurrentQuestions([]);
    setShowResult(false);
    setResults([]);
  };

  if (currentQuestions.length === 0) {
    return <div>Loading...</div>;
  }

  if (showResult) {
    return (
      <div>
        <h3>Kết quả Sort Label</h3>
        {results.map((r, idx) => (
          <div key={idx}>
            <div><strong>Câu {idx + 1}:</strong> {mode === 'listening' ? '[Ẩn câu hỏi ở chế độ nghe]' : r.ques}</div>
            <div>Đáp án đúng: {r.ans}</div>
            <div>Bạn sắp xếp: {r.userAnswer || '(Bỏ trống)'}</div>
            <div>
              {r.correct ? '✅ Đúng' : '❌ Sai'}
            </div>
            <div>
              <strong>Dữ liệu hàng gốc:</strong> {JSON.stringify(r.originalRow)}
            </div>
            <hr />
          </div>
        ))}
        <button onClick={handleContinue}>Tiếp tục</button>
        <button onClick={handleCancel}>Hủy</button>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return null;

  return (
    <div>
      <h3>Sort Label Mode</h3>
      <div>
        
        {mode === 'listening' ? (
          <div>
            <strong>Câu hỏi:</strong> [Chế độ nghe]
            <div>
              <button onClick={() => speakText(currentQ.hira || currentQ.ans)}>🔊 Nghe lại</button>
            </div>
          </div>
        ) : (
          <div><strong>Câu hỏi:</strong> {currentQ.ques}</div>
        )}

        <div>
          <button onClick={() => setShowHint(!showHint)}>
            {showHint ? '🙈 Ẩn gợi ý' : '👀 Hiện gợi ý'}
          </button>
          {showHint && (
            <div>
              <strong>Gợi ý đáp án:</strong> {currentQ.ans}
            </div>
          )}
        </div>

        <div>
          <strong>Đáp án của bạn:</strong>
          <div>
            {selectedChars.map((item, idx) => (
              <span key={item.id} onClick={() => handleRemoveChar(idx)}>
                {item.char} ✕
              </span>
            ))}
          </div>
        </div>

        <div>
          <strong>Chọn ký tự:</strong>
          <div>
            {availableChars.map((item) => (
              <button 
                key={item.id} 
                onClick={() => handleSelectChar(item)}
                disabled={isSubmitted}
              >
                {item.char}
              </button>
            ))}
          </div>
        </div>

        <div>
          {!isSubmitted ? (
            <button onClick={handleCheck} disabled={selectedChars.length === 0}>
              Kiểm tra
            </button>
          ) : (
            <button onClick={handleNextManual}>
              Chuyển tiếp ➔
            </button>
          )}
        </div>

        {isSubmitted && (
          <div>
            <div>
              {results[results.length - 1]?.correct ? '✅ Đúng' : '❌ Sai'}
            </div>
            <div>Đáp án đúng: <strong>{currentQ.ans}</strong></div>
            
            <div>
              <strong>Chi tiết dòng dữ liệu gốc:</strong>
              <pre>
                {JSON.stringify(currentQ.originalRow, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div>
          Câu {currentIndex + 1} / {currentQuestions.length}
        </div>
      </div>
    </div>
  );
}

export default SortLabelMode;