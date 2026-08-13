// components/HandwritingMode.jsx
import React, { useState, useEffect, useRef } from 'react';

function HandwritingMode({ data, quesCol, ansCol, hiraCol, mode, practiseMode, speakText }) {
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

  useEffect(() => {
    if (!data || data.length === 0) return;

    const generated = data.map((row) => ({
      ques: row[quesCol],
      ans: row[ansCol],
      hira: row[hiraCol],
      originalRow: row
    }));

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

    const selectedQuestions = selectedIndices.map(index => dataset[index]);

    setCurrentQuestions(selectedQuestions);
    setCurrentIndex(0);
    setUserInput('');
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

  const checkAnswerCorrectness = (input, targetAns) => {
    if (targetAns === undefined || targetAns === null) return false;
    
    const cleanInput = String(input).trim().replace(/[\u3000\s]+/g, ' ').toLowerCase();
    
    const validAnswers = String(targetAns)
      .split(/[,;/|]/)
      .map(ans => ans.trim().replace(/[\u3000\s]+/g, ' ').toLowerCase());

    return validAnswers.includes(cleanInput);
  };

  const moveToNextQuestion = (latestResults) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setUserInput('');
      setIsSubmitted(false);
      setShowHint(false);
    }
  };

  const handleCheck = () => {
    if (isSubmitted) return;

    const currentQ = currentQuestions[currentIndex];
    const isCorrect = checkAnswerCorrectness(userInput, currentQ.ans);

    const updatedResultItem = {
      ...currentQ,
      userAnswer: userInput,
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
      setUserInput('');
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
        <h3>Kết quả Handwriting</h3>
        {results.map((r, idx) => (
          <div key={idx}>
            <div><strong>Câu {idx + 1}:</strong> {mode === 'listening' ? '[Ẩn câu hỏi ở chế độ nghe]' : r.ques}</div>
            <div>Đáp án đúng: {r.ans}</div>
            <div>Bạn viết: {r.userAnswer || '(Bỏ trống)'}</div>
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
      <h3>Handwriting Mode</h3>
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
          <input 
            type="text" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Nhập đáp án..."
            disabled={isSubmitted}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (!isSubmitted) {
                  handleCheck();
                } else {
                  handleNextManual();
                }
              }
            }}
          />
          {!isSubmitted ? (
            <button onClick={handleCheck}>Kiểm tra</button>
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
              <pre style={{ whiteSpace: 'pre-wrap' }}>
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

export default HandwritingMode;