// components/PopUp.jsx
import React, { useState, useEffect } from 'react';
import FlashCard from './FlashCard';
import MultipleChoice from './MultipleChoice';
import HandwritingMode from './HandwritingMode';
import WordScrambleMode from './WordScrambleMode';
import CardMatching from './CardMatching';
import { speakText } from '../utils/text_to_speech.js';

function PopUp({ data, onClose }) {
  const [step, setStep] = useState(1);
  const [option, setOption] = useState('');
  const [quesCol, setQuesCol] = useState(0);
  const [ansCol, setAnsCol] = useState(1);
  const [card1_col, setCard1Col] = useState(0);
  const [card2_col, setCard2Col] = useState(1);
  const [mode, setMode] = useState('reading');
  const [practiseMode, setPractiseMode] = useState(false);
  const [hiraCol, setHiraCol] = useState(0);
  const [selectedTime, setSelectedTime] = useState(20); // Thêm state cho thời gian

  // Hàm kiểm tra ký tự Hiragana
  const isHiragana = (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x3040 && code <= 0x309F;
  };

  // Hàm kiểm tra ký tự Kanji
  const isKanji = (char) => {
    const code = char.charCodeAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF) || 
           (code >= 0x3400 && code <= 0x4DBF);
  };

  // Tự động tìm cột hiragana
  const findHiraganaColumn = () => {
    if (!data || data.length === 0) return 0;

    let bestCol = 0;
    let maxScore = -1;

    for (let col = 0; col < data[0].length; col++) {
      let hiraganaCount = 0;
      let kanjiCount = 0;

      for (let row = 0; row < data.length; row++) {
        const cell = data[row][col] || '';
        for (let i = 0; i < cell.length; i++) {
          const char = cell[i];
          if (isHiragana(char)) hiraganaCount++;
          else if (isKanji(char)) kanjiCount++;
        }
      }

      const score = hiraganaCount * 100 + kanjiCount;
      if (score > maxScore) {
        maxScore = score;
        bestCol = col;
      }
    }

    return bestCol;
  };

  // Tự động tìm cột hiragana khi data thay đổi
  useEffect(() => {
    if (data && data.length > 0) {
      const bestCol = findHiraganaColumn();
      setHiraCol(bestCol);
    }
  }, [data]);

  const handleOptionSelect = (opt) => {
    setOption(opt);
    if (opt === 'FlashCard') {
      setStep(3);
    } else if (opt === 'MultipleChoice' || opt === 'Handwriting' || opt === 'WordScramble' || opt === 'CardMatching') {
      setStep(2);
    }
  };

  const handleStartExercise = () => {
    setStep(3);
  };

  const renderStep2 = () => {
    // Nếu chọn chế độ Matching Card, giao diện hiển thị cấu hình chọn Cột Card 1 và Cột Card 2
    if (option === 'CardMatching') {
      return (
        <div>
          <h3>Cấu hình bài tập Matching Card</h3>
          <div>
            <label>Cột thẻ 1 (Card 1): </label>
            <select onChange={(e) => setCard1Col(Number(e.target.value))} value={card1_col}>
              {data[0].map((cell, idx) => (
                <option key={idx} value={idx}>
                  {cell || `Cột ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Cột thẻ 2 (Card 2): </label>
            <select onChange={(e) => setCard2Col(Number(e.target.value))} value={card2_col}>
              {data[0].map((cell, idx) => (
                <option key={idx} value={idx}>
                  {cell || `Cột ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Thời gian: </label>
            <select onChange={(e) => setSelectedTime(Number(e.target.value))} value={selectedTime}>
              <option value={15}>15 giây</option>
              <option value={20}>20 giây</option>
              <option value={25}>25 giây</option>
              <option value={30}>30 giây</option>
              <option value={35}>35 giây</option>
              <option value={45}>45 giây</option>
              <option value={60}>60 giây</option>
            </select>
          </div>
          <button onClick={handleStartExercise}>Bắt đầu</button>
        </div>
      );
    }

    // Giao diện cấu hình mặc định cho các chế độ Trắc nghiệm, Handwriting và Sắp xếp nhãn
    return (
      <div>
        <h3>Cấu hình bài tập</h3>
        <div>
          <label>Cột câu hỏi: </label>
          <select onChange={(e) => setQuesCol(Number(e.target.value))} value={quesCol}>
            {data[0].map((cell, idx) => (
              <option key={idx} value={idx}>
                {cell || `Cột ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Cột đáp án: </label>
          <select onChange={(e) => setAnsCol(Number(e.target.value))} value={ansCol}>
            {data[0].map((cell, idx) => (
              <option key={idx} value={idx}>
                {cell || `Cột ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Chế độ: </label>
          <select onChange={(e) => setMode(e.target.value)}>
            <option value="reading">Đọc (Reading)</option>
            <option value="listening">Nghe (Listening)</option>
          </select>
        </div>
        <div>
          <label>Loại: </label>
          <select onChange={(e) => setPractiseMode(e.target.value === 'practise')}>
            <option value="normal">Bình thường</option>
            <option value="practise">Luyện tập</option>
          </select>
        </div>
        <button onClick={handleStartExercise}>Bắt đầu</button>
      </div>
    );
  };

  const renderExercise = () => {
    if (option === 'FlashCard') {
      return <FlashCard data={data} hiraCol={hiraCol} speakText={speakText} />;
    } else if (option === 'MultipleChoice') {
      return <MultipleChoice 
        data={data} 
        quesCol={quesCol} 
        ansCol={ansCol} 
        hiraCol={hiraCol}
        mode={mode}
        practiseMode={practiseMode}
        speakText={speakText}
      />;
    } else if (option === 'Handwriting') {
      return <HandwritingMode 
        data={data} 
        quesCol={quesCol} 
        ansCol={ansCol} 
        hiraCol={hiraCol}
        mode={mode}
        practiseMode={practiseMode}
        speakText={speakText}
      />;
    } else if (option === 'WordScramble') {
      return <WordScrambleMode 
        data={data} 
        quesCol={quesCol} 
        ansCol={ansCol} 
        hiraCol={hiraCol}
        mode={mode}
        practiseMode={practiseMode}
        speakText={speakText}
      />;
    } else if (option === 'CardMatching') {
      return <CardMatching
        data={data}
        card1_col={card1_col}
        card2_col={card2_col}
        hiraCol={hiraCol}
        speakText={speakText}
        selectedTime={selectedTime} // Truyền thời gian xuống
      />;
    }
  };

  return (
    <div className="popup" style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      border: '1px solid #ccc',
      zIndex: 1000,
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <button onClick={onClose} style={{ float: 'right' }}>Đóng</button>
      {step === 1 && (
        <div>
          <h2>Chọn loại bài tập</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>
              <input
                type="radio"
                name="exerciseOption"
                value="FlashCard"
                checked={option === 'FlashCard'}
                onChange={(e) => handleOptionSelect(e.target.value)}
              />
              Flashcard
            </label>
            <label>
              <input
                type="radio"
                name="exerciseOption"
                value="MultipleChoice"
                checked={option === 'MultipleChoice'}
                onChange={(e) => handleOptionSelect(e.target.value)}
              />
              Multiple Choice
            </label>
            <label>
              <input
                type="radio"
                name="exerciseOption"
                value="Handwriting"
                checked={option === 'Handwriting'}
                onChange={(e) => handleOptionSelect(e.target.value)}
              />
              Handwriting
            </label>
            <label>
              <input
                type="radio"
                name="exerciseOption"
                value="WordScramble"
                checked={option === 'WordScramble'}
                onChange={(e) => handleOptionSelect(e.target.value)}
              />
              Word Scramble
            </label>
            <label>
              <input
                type="radio"
                name="exerciseOption"
                value="CardMatching"
                checked={option === 'CardMatching'}
                onChange={(e) => handleOptionSelect(e.target.value)}
              />
              Card Matching
            </label>
          </div>
        </div>
      )}
      {step === 2 && renderStep2()}
      {step === 3 && renderExercise()}
    </div>
  );
}

export default PopUp;