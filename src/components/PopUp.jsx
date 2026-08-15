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
  const [selectedTime, setSelectedTime] = useState(20);

  const isHiragana = (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x3040 && code <= 0x309f;
  };

  const isKanji = (char) => {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)
    );
  };

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
    } else {
      setStep(2);
    }
  };

  const handleStartExercise = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3 && option === 'FlashCard') {
      setStep(1);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const exerciseOptions = [
    {
      id: 'FlashCard',
      title: 'Flashcard',
      desc: 'Lật thẻ học từ vựng và luyện phát âm',
      icon: 'style',
    },
    {
      id: 'MultipleChoice',
      title: 'Multiple Choice',
      desc: 'Trắc nghiệm chọn đáp án đúng',
      icon: 'quiz',
    },
    {
      id: 'Handwriting',
      title: 'Handwriting',
      desc: 'Luyện viết ký tự và từ vựng',
      icon: 'draw',
    },
    {
      id: 'WordScramble',
      title: 'Word Scramble',
      desc: 'Sắp xếp lại các ký tự xáo trộn',
      icon: 'extension',
    },
    {
      id: 'CardMatching',
      title: 'Card Matching',
      desc: 'Ghép cặp thẻ từ vựng tương ứng',
      icon: 'view_module',
    },
  ];

  const renderStep2 = () => {
    const isMatching = option === 'CardMatching';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-outline-variant/10">
          <div className="flex p-2.5 rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-xl">tune</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              {isMatching ? 'Cấu hình Matching Card' : 'Cấu hình bài tập'}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isMatching
                ? 'Lựa chọn các cột thẻ cần ghép cặp và thời gian giới hạn'
                : 'Tùy chỉnh câu hỏi, đáp án và chế độ luyện tập'}
            </p>
          </div>
        </div>

        {isMatching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Cột thẻ 1 (Card 1)
              </label>
              <select
                onChange={(e) => setCard1Col(Number(e.target.value))}
                value={card1_col}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Cột ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Cột thẻ 2 (Card 2)
              </label>
              <select
                onChange={(e) => setCard2Col(Number(e.target.value))}
                value={card2_col}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Cột ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Thời gian bài tập
              </label>
              <select
                onChange={(e) => setSelectedTime(Number(e.target.value))}
                value={selectedTime}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value={15}>15 giây</option>
                <option value={20}>20 giây</option>
                <option value={25}>25 giây</option>
                <option value={30}>30 giây</option>
                <option value={35}>35 giây</option>
                <option value={45}>45 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Cột câu hỏi
              </label>
              <select
                onChange={(e) => setQuesCol(Number(e.target.value))}
                value={quesCol}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Cột ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Cột đáp án
              </label>
              <select
                onChange={(e) => setAnsCol(Number(e.target.value))}
                value={ansCol}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Cột ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Chế độ hiển thị
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value="reading">Đọc (Reading)</option>
                <option value="listening">Nghe (Listening)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">
                Loại thực hành
              </label>
              <select
                value={practiseMode ? 'practise' : 'normal'}
                onChange={(e) => setPractiseMode(e.target.value === 'practise')}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value="normal">Bình thường</option>
                <option value="practise">Luyện tập</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-2 border-t border-outline-variant/10">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
          >
            Quay lại
          </button>
          <button
            onClick={handleStartExercise}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            Bắt đầu
          </button>
        </div>
      </div>
    );
  };

  const renderExercise = () => {
    if (option === 'FlashCard') {
      return (
        <FlashCard data={data} hiraCol={hiraCol} speakText={speakText} />
      );
    } else if (option === 'MultipleChoice') {
      return (
        <MultipleChoice
          data={data}
          quesCol={quesCol}
          ansCol={ansCol}
          hiraCol={hiraCol}
          mode={mode}
          practiseMode={practiseMode}
          speakText={speakText}
        />
      );
    } else if (option === 'Handwriting') {
      return (
        <HandwritingMode
          data={data}
          quesCol={quesCol}
          ansCol={ansCol}
          hiraCol={hiraCol}
          mode={mode}
          practiseMode={practiseMode}
          speakText={speakText}
        />
      );
    } else if (option === 'WordScramble') {
      return (
        <WordScrambleMode
          data={data}
          quesCol={quesCol}
          ansCol={ansCol}
          hiraCol={hiraCol}
          mode={mode}
          practiseMode={practiseMode}
          speakText={speakText}
        />
      );
    } else if (option === 'CardMatching') {
      return (
        <CardMatching
          data={data}
          card1_col={card1_col}
          card2_col={card2_col}
          hiraCol={hiraCol}
          speakText={speakText}
          selectedTime={selectedTime}
        />
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/30 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[85vh] bg-surface rounded-2xl shadow-xl border border-outline-variant/15 flex flex-col overflow-hidden">
        {/* Header PopUp */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/10 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-all cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
              </button>
            )}
            <span className="text-xs font-semibold text-on-surface-variant">
              {step === 1 && 'Chọn bài tập'}
              {step === 2 && 'Cấu hình'}
              {step === 3 && option}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-all cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Dynamic Body Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface tracking-tight">
                  Lựa chọn phương thức ôn tập
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exerciseOptions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOptionSelect(item.id)}
                    className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                      option === item.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center p-2 rounded-lg bg-surface-container text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-xl block">
                        {item.icon}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant/80 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && renderStep2()}
          {step === 3 && renderExercise()}
        </div>
      </div>
    </div>
  );
}

export default PopUp;