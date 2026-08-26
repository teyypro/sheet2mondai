import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';

// ======================= CONSTANTS =======================
const STROKE_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#D81B60', '#3949AB', '#00897B', '#FDD835'
];

const ANIMATION_DURATION = 500; // ms
const BASE_DELAY = 100; // ms
const STROKE_DELAY = 300; // ms

// ======================= UTILITY FUNCTIONS =======================
const getKanjiHex = (char) => {
  const code = char.charCodeAt(0).toString(16).toLowerCase();
  return code.padStart(5, '0');
};

const isKanjiChar = (char) => {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
};

const extractKanjis = (text) => {
  if (!text) return [];
  const chars = String(text).split('');
  return Array.from(new Set(chars.filter(isKanjiChar)));
};

// ======================= SVG PROCESSOR =======================
const processKanjiSvg = (svgRaw, strokeColors = STROKE_COLORS) => {
  if (!svgRaw) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) return null;

    // Loại bỏ các phần tử chữ số thứ tự nét nếu không cần thiết
    const textNodes = doc.querySelectorAll('text');
    textNodes.forEach((node) => node.remove());

    const paths = doc.querySelectorAll('path[id*="kvg:"]');

    paths.forEach((path, index) => {
      const color = strokeColors[index % strokeColors.length];
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      
      // Inject CSS Variable cho từng path để tính delay chính xác trong CSS
      path.style.setProperty('--stroke-index', index);
    });

    return svgEl.outerHTML;
  } catch (error) {
    console.error('Error processing SVG:', error);
    return null;
  }
};

// ======================= SUB-COMPONENT: KANJI ITEM =======================
const KanjiSvgItem = memo(({ char, svgContent, isAnimated, animKey, onClick }) => {
  if (!svgContent) {
    return (
      <div 
        onClick={onClick}
        className="w-32 h-32 border border-outline-variant/20 rounded-2xl bg-surface flex items-center justify-center text-4xl font-extrabold text-on-surface cursor-pointer"
      >
        {char}
      </div>
    );
  }

  return (
    <div
      key={`${char}-${animKey}-${isAnimated}`}
      onClick={onClick}
      className={`w-32 h-32 border border-outline-variant/20 rounded-2xl p-2 bg-surface flex items-center justify-center shadow-inner hover:border-primary transition-all cursor-pointer [&>svg]:w-full [&>svg]:h-full ${
        isAnimated ? 'kanji-animated-svg' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      title="Nhấp để vẽ lại Kanji"
    />
  );
});

KanjiSvgItem.displayName = 'KanjiSvgItem';

// ======================= MAIN COMPONENT =======================
function KanjiSvgFlashCard({ data = [], kanjiCol, hiraCol, speakText }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [svgMap, setSvgMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [animKey, setAnimKey] = useState(() => Date.now());
  const [animatingChar, setAnimatingChar] = useState(null);

  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  // Parse dữ liệu đầu vào
  useEffect(() => {
    if (!data?.length) {
      setCards([]);
      setLoading(false);
      return;
    }

    const list = data.map((row, index) => ({
      row,
      index,
      kanjiText: String(row[kanjiCol] || ''),
      hiraText: hiraCol !== undefined ? String(row[hiraCol] || '') : '',
    }));

    setCards(list);
    setCurrentIndex(0);
  }, [data, kanjiCol, hiraCol]);

  // Tải SVG Kanji có cờ Cache
  useEffect(() => {
    if (!cards.length) {
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const allKanjiSet = new Set();
    cards.forEach((item) => {
      extractKanjis(item.kanjiText).forEach((k) => allKanjiSet.add(k));
    });

    const kanjiArray = Array.from(allKanjiSet);
    const uncachedKanjis = kanjiArray.filter((k) => !cacheRef.current[k]);

    if (uncachedKanjis.length === 0) {
      setSvgMap({ ...cacheRef.current });
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchPromises = uncachedKanjis.map((char) => {
      const hex = getKanjiHex(char);
      const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`;

      return fetch(url, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`SVG not found for ${char}`);
          return res.text();
        })
        .then((svgText) => ({
          char,
          svgText: processKanjiSvg(svgText),
        }))
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.warn(`Failed to load SVG for ${char}:`, error.message);
          }
          return { char, svgText: null };
        });
    });

    Promise.all(fetchPromises)
      .then((results) => {
        if (controller.signal.aborted) return;

        results.forEach(({ char, svgText }) => {
          if (svgText) {
            cacheRef.current[char] = svgText;
          }
        });

        setSvgMap({ ...cacheRef.current });
        setLoading(false);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error fetching SVGs:', error);
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [cards]);

  // Handlers
  const handleSpeak = useCallback(
    (text) => {
      if (speakText && text) {
        speakText(text);
      }
    },
    [speakText]
  );

  const goToCard = useCallback(
    (index) => {
      setCurrentIndex(index);
      setAnimKey(Date.now());
      setAnimatingChar(null);

      const card = cards[index];
      if (card) {
        handleSpeak(card.hiraText || card.kanjiText);
      }
    },
    [cards, handleSpeak]
  );

  const nextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      goToCard(currentIndex + 1);
    }
  }, [currentIndex, cards.length, goToCard]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  }, [currentIndex, goToCard]);

  const handlePlayAllAnimation = useCallback(() => {
    setAnimatingChar(null);
    setAnimKey(Date.now());
  }, []);

  const handleCharClick = useCallback((char) => {
    setAnimatingChar(char);
    setAnimKey(Date.now());
  }, []);

  const currentCard = cards[currentIndex];
  
  const kanjiChars = useMemo(() => {
    return extractKanjis(currentCard?.kanjiText);
  }, [currentCard?.kanjiText]);

  // CSS Animation được tối ưu hóa chuẩn xác cho SVG stroke
  const strokeAnimationStyle = useMemo(() => {
    return `
      @keyframes drawStroke {
        from {
          stroke-dashoffset: 300;
        }
        to {
          stroke-dashoffset: 0;
        }
      }
      
      .kanji-animated-svg path[id*="kvg:"] {
        stroke-dasharray: 300;
        stroke-dashoffset: 300;
        animation: drawStroke ${ANIMATION_DURATION}ms ease-in-out forwards;
        animation-delay: calc(${BASE_DELAY}ms + (${STROKE_DELAY}ms * var(--stroke-index, 0)));
      }
    `;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-4xl mb-3 text-primary">
          progress_activity
        </span>
        <p className="text-sm font-medium">Đang tải dữ liệu nét vẽ Kanji...</p>
      </div>
    );
  }

  if (!cards.length || !currentCard) {
    return (
      <div className="p-8 text-center text-on-surface-variant">
        Không có dữ liệu Kanji.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">
      <style>{strokeAnimationStyle}</style>

      {/* Top Controller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
          <span className="material-symbols-outlined text-base text-primary">draw</span>
          <span>
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayAllAnimation}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-semibold hover:bg-secondary-container/80 transition-all cursor-pointer"
            title="Phát lại hiệu ứng vẽ"
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            <span>Draw</span>
          </button>

          <button
            onClick={() => handleSpeak(currentCard?.hiraText || currentCard?.kanjiText)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-semibold hover:bg-primary-container/80 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">volume_up</span>
    
          </button>
        </div>
      </div>

      {/* FlashCard Main */}
      <div className="min-h-[280px] p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md flex flex-col items-center justify-center text-center gap-4 select-none">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {kanjiChars.length > 0 ? (
            kanjiChars.map((char) => {
              const svgContent = svgMap[char];
              const isAnimated = animatingChar === null || animatingChar === char;

              return (
                <div key={char} className="flex flex-col items-center gap-1 group">
                  <KanjiSvgItem
                    char={char}
                    svgContent={svgContent}
                    isAnimated={isAnimated}
                    animKey={animKey}
                    onClick={() => handleCharClick(char)}
                  />
                  <span className="text-xs text-on-surface-variant font-medium group-hover:text-primary">
                    {char}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-3xl font-extrabold text-on-surface">
              {currentCard?.kanjiText || '—'}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-bold text-primary">
            {currentCard?.kanjiText}
          </div>
          {currentCard?.hiraText && (
            <div className="text-sm font-semibold text-on-surface-variant">
              {currentCard.hiraText}
            </div>
          )}
        </div>

        {/* Row Data Details */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
          {currentCard?.row.map((cell, idx) => (
            <span
              key={`row-${idx}-${cell}`}
              className="px-2 py-0.5 rounded-lg bg-surface-container-high text-base font-medium text-on-surface border border-outline-variant/15"
            >
              {cell}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>

        <button
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default KanjiSvgFlashCard;