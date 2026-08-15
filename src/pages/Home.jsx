import React, { useState } from 'react';
import PopUp from '../components/PopUp';

function Home() {
  const [data, setData] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showPopUp, setShowPopUp] = useState(false);

  // Hàm xử lý parse dữ liệu chuỗi sang mảng 2 chiều
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

  // Nút dán dữ liệu trực tiếp từ Clipboard
  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        processTextData(text);
      }
    } catch (err) {
      console.error('Không thể đọc dữ liệu từ bộ nhớ tạm:', err);
    }
  };

  // Nút xóa sạch dữ liệu nhập
  const handleClear = () => {
    setInputText('');
    setData([]);
  };

  const handleSubmit = () => {
    if (data.length > 0) {
      setShowPopUp(true);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-on-surface mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">
              grid_on
            </span>
            Nhập bảng dữ liệu tiếng Nhật
          </h2>
          <p className="text-on-surface-variant text-sm">
            Dán dữ liệu từ bảng tính (cách nhau bằng dấu Tab)
          </p>
        </div>

        {/* Khung Grid chính bao bọc phần nhập và phần hiển thị */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột trái: Nhập liệu */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-md border border-outline-variant/20 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  edit_note
                </span>
                Dữ liệu văn bản
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleClipboardPaste}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg 
                             bg-secondary-container text-on-secondary-container 
                             hover:bg-secondary-container/80 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    content_paste
                  </span>
                  Dán từ bộ nhớ tạm
                </button>

                {inputText && (
                  <button
                    onClick={handleClear}
                    type="button"
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg 
                               text-error hover:bg-error-container/20 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={12}
              value={inputText}
              className="w-full flex-1 px-4 py-3 bg-surface rounded-xl border border-outline-variant/30 
                         text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                         transition-all duration-200 resize-none font-mono text-xs leading-relaxed"
              placeholder={`Từ vựng\tNghĩa\tPhát âm\nこんにちは\tXin chào\tKonnichiwa\nありがとう\tCảm ơn\tArigatou`}
              onChange={handleInputChange} spellcheck="false"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant/60">
              <span>Hỗ trợ định dạng Excel / Google Sheets</span>
              {data.length > 0 && <span>Đã đọc {data.length} dòng</span>}
            </div>
          </div>

          {/* Cột phải: Xem trước toàn bộ bảng */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-md border border-outline-variant/20 flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  table_chart
                </span>
                Xem trước bảng ({data.length} dòng)
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
                        <td className="px-3 py-2 text-xs font-mono text-on-surface-variant/40 bg-surface-container-lowest/50 select-none w-8 text-center border-r border-outline-variant/10">
                          {idx + 1}
                        </td>
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2 text-on-surface border-r border-outline-variant/10 last:border-0 whitespace-nowrap"
                          >
                            {cell || <span className="text-on-surface-variant/30 italic">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/40 p-6 text-center">
                  <span className="material-symbols-outlined text-4xl mb-2">
                    dataset
                  </span>
                  <p className="text-xs">Chưa có dữ liệu để hiển thị</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nút thao tác chính */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={data.length === 0}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                       ${
                         data.length > 0
                           ? 'bg-primary text-on-primary hover:bg-primary/90 hover:shadow-lg active:scale-95 cursor-pointer'
                           : 'bg-surface-container-high text-on-surface/40 cursor-not-allowed'
                       }`}
          >
            <span className="material-symbols-outlined text-xl">
              extension
            </span>
            Tạo bài tập
          </button>

          {data.length > 0 && (
            <span className="text-sm text-on-surface-variant/70 flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-primary">
                check_circle
              </span>
              Sẵn sàng tạo bài tập từ {data.length} dòng dữ liệu
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