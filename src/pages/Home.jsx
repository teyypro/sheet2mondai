import React, { useState, useEffect } from 'react';
import PopUp from '../components/PopUp';

function Home() {
  const [data, setData] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showPopUp, setShowPopUp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const processTextData = (text) => {
    setInputText(text);
    const rows = text.split('\n').filter((row) => row.trim() !== '');
    const parsedData = rows.map((row) =>
      row.split('\t').map((cell) => cell.trim())
    );
    setData(parsedData);
  };

  const handleInputChange = (e) => {
    processTextData(e.target.value);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) processTextData(text);
    } catch (err) {
      console.error('Clipboard access denied:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setData([]);
  };

  const handleSubmit = () => {
    if (data.length > 0) setShowPopUp(true);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 text-on-surface transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl flex items-center justify-center">
                grid_on
              </span>
              Sheet2Mondai
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Automatically converts your vocabulary spreadsheets into interactive Japanese test papers and exercises in seconds.
            </p>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant transition-all cursor-pointer shadow-sm border border-outline-variant/30"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-xl flex items-center justify-center">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="text-xs font-medium hidden sm:inline">
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>

        {/* Input & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-base flex items-center justify-center">
                  edit_note
                </span>
                Raw Data
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClipboardPaste}
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary-container text-on-secondary-container hover:opacity-90 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm flex items-center justify-center">
                    content_paste
                  </span>
                  Paste
                </button>

                {inputText && (
                  <button
                    onClick={handleClear}
                    type="button"
                    className="inline-flex items-center justify-center p-1.5 text-xs font-medium rounded-lg text-error hover:bg-error-container/20 transition-all cursor-pointer"
                    title="Clear text"
                  >
                    <span className="material-symbols-outlined text-sm flex items-center justify-center">
                      delete
                    </span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={12}
              value={inputText}
              className="w-full flex-1 px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none text-xs leading-relaxed"
              placeholder={`Từ vựng\tNghĩa\tPhát âm\nこんにちは\tXin chào\tKonnichiwa\nありがとう\tCảm ơn\tArigatou`}
              onChange={handleInputChange}
              spellCheck="false"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant/70">
              <span>Supports Excel / Google Sheets format</span>
              {data.length > 0 && <span>{data.length} rows loaded</span>}
            </div>
          </div>

          {/* Preview Column */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/20 flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-base flex items-center justify-center">
                  table_chart
                </span>
                Preview ({data.length} rows)
              </h3>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-outline-variant/20 bg-surface">
              {data.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <tbody className="divide-y divide-outline-variant/10">
                    {data.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-surface-container-high/50 transition-colors"
                      >
                        <td className="px-3 py-2 text-xs text-on-surface-variant/50 bg-surface-container-lowest select-none w-8 text-center border-r border-outline-variant/10">
                          {idx + 1}
                        </td>
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2 border-r border-outline-variant/10 last:border-0 whitespace-nowrap"
                          >
                            {cell || (
                              <span className="text-on-surface-variant/30 italic">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/50 p-6 text-center">
                  <span className="material-symbols-outlined text-4xl mb-2 flex items-center justify-center">
                    dataset
                  </span>
                  <p className="text-xs">No data to display</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={data.length === 0}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              data.length > 0
                ? 'bg-primary text-on-primary hover:bg-primary/90 hover:shadow-md active:scale-95 cursor-pointer'
                : 'bg-surface-container-high text-on-surface/40 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-xl flex items-center justify-center">
              extension
            </span>
            Generate Exercises
          </button>

          {data.length > 0 && (
            <span className="text-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary flex items-center justify-center">
                check_circle
              </span>
              Ready to generate exercises from {data.length} rows.
            </span>
          )}
        </div>
      </div>

      {/* PopUp */}
      {showPopUp && <PopUp data={data} onClose={() => setShowPopUp(false)} />}
    </div>
  );
}

export default Home;