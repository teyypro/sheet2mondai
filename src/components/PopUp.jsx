import React, { useState, useEffect } from 'react';
import FlashCard from './FlashCard';
import MultipleChoice from './MultipleChoice';
import HandwritingMode from './HandwritingMode';
import WordScrambleMode from './WordScrambleMode';
import CardMatching from './CardMatching';
import KanjiSvgFlashCard from './KanjiSvgFlashCard';
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
  const [kanjiCol, setKanjiCol] = useState(0);
  const [selectedTime, setSelectedTime] = useState(20);
  const [manualHiraCol, setManualHiraCol] = useState(null);

  const isHiragana = (char) => {
    const code = char.charCodeAt(0);
    return code >= 0x3040 && code <= 0x309f;
  };

  const isKanji = (char) => {
    const code = char.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
  };

  // Tự động nhận diện cột chứa Hiragana/Katakana
  const findHiraganaColumn = () => {
    if (!data || data.length === 0) return 0;
    let bestCol = 0;
    let maxScore = -1;

    for (let col = 0; col < data[0].length; col++) {
      let hiraganaCount = 0;
      for (let row = 0; row < data.length; row++) {
        const cell = data[row][col] || '';
        for (let i = 0; i < cell.length; i++) {
          if (isHiragana(cell[i])) hiraganaCount++;
        }
      }
      if (hiraganaCount > maxScore) {
        maxScore = hiraganaCount;
        bestCol = col;
      }
    }
    return bestCol;
  };

  // Tự động nhận diện cột chứa Kanji (bỏ qua cột chứa ký tự La-tinh/Anh/Việt)
  const findKanjiColumn = () => {
    if (!data || data.length === 0) return 0;
    let bestCol = 0;
    let maxKanjiCount = -1;

    for (let col = 0; col < data[0].length; col++) {
      let kanjiCount = 0;
      for (let row = 0; row < data.length; row++) {
        const cell = String(data[row][col] || '');
        for (let i = 0; i < cell.length; i++) {
          if (isKanji(cell[i])) kanjiCount++;
        }
      }
      if (kanjiCount > maxKanjiCount) {
        maxKanjiCount = kanjiCount;
        bestCol = col;
      }
    }
    return bestCol;
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const autoHira = findHiraganaColumn();
      const autoKanji = findKanjiColumn();
      setHiraCol(autoHira);
      setKanjiCol(autoKanji);
      if (manualHiraCol === null) {
        setManualHiraCol(autoHira);
      }
    }
  }, [data]);

  const handleOptionSelect = (opt) => {
    setOption(opt);
    setStep(opt === 'FlashCard' ? 3 : 2);
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
      desc: 'Review words & practice pronunciation',
      icon: 'style',
    },
    {
      id: 'KanjiSvg',
      title: 'Kanji SVG Flashcard',
      desc: 'View Kanji stroke orders & SVG animations',
      icon: 'draw',
    },
    {
      id: 'MultipleChoice',
      title: 'Multiple Choice',
      desc: 'Test knowledge with quizes',
      icon: 'quiz',
    },
    {
      id: 'Handwriting',
      title: 'Handwriting',
      desc: 'Practice stroke order & writing',
      icon: 'edit',
    },
    {
      id: 'WordScramble',
      title: 'Word Scramble',
      desc: 'Rearrange mixed characters',
      icon: 'extension',
    },
    {
      id: 'CardMatching',
      title: 'Card Matching',
      desc: 'Match corresponding terms',
      icon: 'view_module',
    },
  ];

  const renderStep2 = () => {
    const isMatching = option === 'CardMatching';
    const isKanjiSvg = option === 'KanjiSvg';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-outline-variant/10">
          <div className="flex items-center justify-center p-2.5 rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-xl flex items-center justify-center">tune</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              {isMatching ? 'Matching Setup' : isKanjiSvg ? 'Kanji SVG Setup' : 'Practice Settings'}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isMatching
                ? 'Configure card columns and time limit'
                : isKanjiSvg
                ? 'Select column containing Kanji characters'
                : 'Configure columns and practice modes'}
            </p>
          </div>
        </div>

        {isKanjiSvg ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Kanji Column (Auto-detected)</label>
              <select
                onChange={(e) => setKanjiCol(Number(e.target.value))}
                value={kanjiCol}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Column ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Reading/Pronunciation Column</label>
              <select
                onChange={(e) => setHiraCol(Number(e.target.value))}
                value={hiraCol}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Column ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : isMatching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Card Column 1</label>
              <select
                onChange={(e) => setCard1Col(Number(e.target.value))}
                value={card1_col}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Column ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Card Column 2</label>
              <select
                onChange={(e) => setCard2Col(Number(e.target.value))}
                value={card2_col}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Column ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Time Limit</label>
              <select
                onChange={(e) => setSelectedTime(Number(e.target.value))}
                value={selectedTime}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {[15, 20, 25, 30, 35, 45, 60].map((sec) => (
                  <option key={sec} value={sec}>
                    {sec} seconds
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Question Column</label>
              <select
                onChange={(e) => setQuesCol(Number(e.target.value))}
                value={quesCol}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Column ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Answer Column</label>
              <select
                onChange={(e) => setAnsCol(Number(e.target.value))}
                value={ansCol}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                {data[0].map((cell, idx) => (
                  <option key={idx} value={idx}>
                    {cell || `Column ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Display Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Practice Type</label>
              <select
                value={practiseMode ? 'practise' : 'normal'}
                onChange={(e) => setPractiseMode(e.target.value === 'practise')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value="normal">Standard</option>
                <option value="practise">Practice</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center justify-end gap-2 border-t border-outline-variant/10">
          <button
            onClick={() => setStep(1)}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={() => setStep(3)}
            className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base flex items-center justify-center">play_arrow</span>
            Start
          </button>
        </div>
      </div>
    );
  };

  const renderExercise = () => {
    switch (option) {
      case 'FlashCard':
        return <FlashCard data={data} hiraCol={hiraCol} speakText={speakText} />;
      case 'KanjiSvg':
        return <KanjiSvgFlashCard data={data} kanjiCol={kanjiCol} hiraCol={hiraCol} speakText={speakText} />;
      case 'MultipleChoice':
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
      case 'Handwriting':
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
      case 'WordScramble':
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
      case 'CardMatching':
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
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-scrim/30 backdrop-blur-sm">
      <div className="max-ful-screen max-h-[100vh] relative w-full max-w-2xl flex flex-col rounded-0 bg-surface border border-outline-variant/15 shadow-xl overflow-hidden lg:max-h-[95vh] ">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/10 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg flex items-center justify-center">arrow_back</span>
              </button>
            )}
            <span className="text-xs font-semibold text-on-surface-variant">
              {step === 1 && 'Select Mode'}
              {step === 2 && 'Configuration'}
              {step === 3 && option}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg flex items-center justify-center">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="px-2 py-3 overflow-y-auto flex-1 lg:p-5">
          {step === 1 && (
            <div className="space-y-6">

              {/* Hiragana Column Selection */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <label className="text-sm font-semibold text-on-surface block mb-2">
                  Hiragana Column
                </label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="hira-auto-step1"
                      name="hiraColOptionStep1"
                      value="auto"
                      checked={manualHiraCol === null}
                      onChange={() => {
                        setManualHiraCol(null);
                        setHiraCol(findHiraganaColumn());
                      }}
                      className="w-4 h-4 text-primary focus:ring-primary/20"
                    />
                    <label htmlFor="hira-auto-step1" className="text-sm text-on-surface-variant">
                      Auto-detect
                    </label>
                  </div>
                  {data && data[0] && data[0].map((cell, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`hira-col-step1-${idx}`}
                        name="hiraColOptionStep1"
                        value={idx}
                        checked={manualHiraCol === idx}
                        onChange={() => {
                          setManualHiraCol(idx);
                          setHiraCol(idx);
                        }}
                        className="w-4 h-4 text-primary focus:ring-primary/20"
                      />
                      <label htmlFor={`hira-col-step1-${idx}`} className="text-sm text-on-surface-variant">
                        {cell || `Column ${idx + 1}`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exerciseOptions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOptionSelect(item.id)}
                    className={`group flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      option === item.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-center shrink-0 p-2 rounded-lg bg-surface-container text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-xl flex items-center justify-center">
                        {item.icon}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-on-surface-variant/80 leading-snug">
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