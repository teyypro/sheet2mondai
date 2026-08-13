// components/CardMatching.jsx
import React, { useState, useEffect, useRef } from 'react';

// Hàm Fisher-Yates shuffle
function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function CardMatching({ data, card1_col, card2_col, hiraCol, speakText, onClose, selectedTime }) {
  // Cấu hình thời gian đếm ngược
  const [selectedTimeOption, setSelectedTimeOption] = useState(selectedTime || 20);
  const [timeLeft, setTimeLeft] = useState(selectedTime || 20);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'

  // Cơ chế tính điểm và lượt sai
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const maxWrongAttempts = 3;

  // Dữ liệu danh sách câu hỏi và danh sách 12 thẻ hiển thị
  const [baseList, setBaseList] = useState([]);
  const [displayCards, setDisplayCards] = useState([]);

  // Trạng thái chọn thẻ và ghép cặp
  const [firstCard, setFirstCard] = useState(null);
  const [secondCard, setSecondCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [lastMatchedRow, setLastMatchedRow] = useState(null);
  const [matchedRows, setMatchedRows] = useState([]); // Lưu thông tin các row đã khớp

  const poolRef = useRef([]);
  const timerRef = useRef(null);

  // 1. Khởi tạo danh sách baseList từ prop data dựa trên card1_col và card2_col
  useEffect(() => {
    if (!data || data.length === 0) return;

    const list = data.map((row, index) => ({
      idx: index,
      card1: row[card1_col],
      card2: row[card2_col],
      hira: row[hiraCol],
      originalRow: row
    }));

    setBaseList(list);
    poolRef.current = [];
  }, [data, card1_col, card2_col, hiraCol]);

  // 2. Thuật toán lấy 6 phần tử ngẫu nhiên phân bố đều từ baseList (sử dụng Fisher-Yates)
  const getNext6Pairs = () => {
    if (baseList.length === 0) return [];

    let pool = poolRef.current;

    // Nếu pool rỗng thì shuffle lại toàn bộ
    if (pool.length < 6) {
      const newPool = Array.from({ length: baseList.length }, (_, i) => i);
      pool = fisherYatesShuffle(newPool);
    }

    const selectedIndices = pool.slice(0, 6);
    poolRef.current = pool.slice(6);

    return selectedIndices.map(index => baseList[index]);
  };

  // 3. Khởi tạo ván chơi mới hoặc chơi tiếp
  const startNewGame = (resetScore = true) => {
    if (baseList.length === 0) return;

    const selected6Pairs = getNext6Pairs();
    const cards = [];

    // Tạo 12 thẻ từ 6 cặp dữ liệu
    selected6Pairs.forEach((pair) => {
      cards.push({
        cardId: `c1_${pair.idx}_${Math.random()}`,
        matchId: pair.idx,
        text: pair.card1,
        type: 'card1',
        originalRow: pair.originalRow,
        hira: pair.hira
      });
      cards.push({
        cardId: `c2_${pair.idx}_${Math.random()}`,
        matchId: pair.idx,
        text: pair.card2,
        type: 'card2',
        originalRow: pair.originalRow,
        hira: pair.hira
      });
    });

    // Xáo trộn vị trí 12 thẻ
    const shuffled12Cards = cards.sort(() => Math.random() - 0.5);

    setDisplayCards(shuffled12Cards);
    setFirstCard(null);
    setSecondCard(null);
    setMatchedIds([]);
    setLastMatchedRow(null);
    setMatchedRows([]); // Reset danh sách các row đã khớp
    setWrongAnswers(0);
    if (resetScore) {
      setScore(0);
    }
    setTimeLeft(selectedTimeOption);
    setGameStatus('playing');
  };

  // 4. Quản lý bộ đếm thời gian
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameStatus('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Tự động bắt đầu khi danh sách baseList sẵn sàng
  useEffect(() => {
    if (baseList.length > 0 && gameStatus === 'idle') {
      startNewGame(true);
    }
  }, [baseList]);

  // Hàm tính điểm động theo khoảng giây còn lại: 1-5s => 5đ, 6-10s => 10đ, 11-15s => 15đ, ...
  const calculatePoints = (secondsLeft) => {
    if (secondsLeft <= 0) return 0;
    return Math.ceil(secondsLeft / 5) * 5;
  };

  // 5. Xử lý thao tác lật thẻ và kiểm tra khớp
  const handleCardClick = (card) => {
    if (gameStatus !== 'playing') return;
    if (matchedIds.includes(card.matchId)) return;
    if (firstCard && firstCard.cardId === card.cardId) return;
    if (firstCard && secondCard) return;

    if (!firstCard) {
      setFirstCard(card);
    } else {
      setSecondCard(card);

      // Kiểm tra nếu chọn đúng cặp và không trùng loại thẻ (card1 không được tự khớp với chính nó)
      if (firstCard.matchId === card.matchId && firstCard.type !== card.type) {
        const newMatchedIds = [...matchedIds, card.matchId];
        setMatchedIds(newMatchedIds);
        setLastMatchedRow(card.originalRow);
        
        // Thêm row đã khớp vào danh sách
        setMatchedRows(prev => [...prev, card.originalRow]);

        // Cộng điểm dồn theo thời gian hiện tại
        const gainedPoints = calculatePoints(timeLeft);
        setScore((prevScore) => prevScore + gainedPoints);

        const textToSpeak = card.hira || card.text;
        if (textToSpeak && typeof speakText === 'function') {
          speakText(textToSpeak);
        }

        setFirstCard(null);
        setSecondCard(null);

        if (newMatchedIds.length === 6) {
          clearInterval(timerRef.current);
          setGameStatus('won');
        }
      } else {
        // Xử lý khi chọn sai cặp
        const newWrongCount = wrongAnswers + 1;
        setWrongAnswers(newWrongCount);

        if (newWrongCount >= maxWrongAttempts) {
          clearInterval(timerRef.current);
          setGameStatus('lost');
        }

        setTimeout(() => {
          setFirstCard(null);
          setSecondCard(null);
        }, 600);
      }
    }
  };

  if (baseList.length === 0) {
    return <div>Loading...</div>;
  }

  // Render màn hình bảng tổng kết khi ván đấu kết thúc (Thắng hoặc Thua)
  if (gameStatus === 'won' || gameStatus === 'lost') {
    return (
      <div className="game-summary" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h3>BẢNG TỔNG KẾT VÁN CHƠI</h3>
        <hr />
        
        {gameStatus === 'won' ? (
          <p style={{ color: 'green', fontSize: '18px' }}>
            🎉 <strong>Chúc mừng! Bạn đã hoàn thành xuất sắc màn chơi!</strong>
          </p>
        ) : (
          <p style={{ color: 'red', fontSize: '18px' }}>
            ❌ <strong>Thất bại! {wrongAnswers >= maxWrongAttempts ? 'Bạn đã hết lượt trả lời sai.' : 'Đã hết thời gian quy định.'}</strong>
          </p>
        )}

        <div>
          <p><strong>Tổng số điểm đạt được:</strong> {score} điểm</p>
          <p><strong>Số lượt trả lời sai:</strong> {wrongAnswers} / {maxWrongAttempts}</p>
          <p><strong>Số cặp đã hoàn thành:</strong> {matchedIds.length} / 6 cặp</p>
        </div>

        <hr />
        
        {/* Hiển thị tất cả thông tin của các row đã khớp */}
        {matchedRows.length > 0 && (
          <div>
            <h4>📋 Chi tiết các cặp đã ghép đúng:</h4>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px',
              marginTop: '10px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    {data[0].map((header, idx) => (
                      <th key={idx} style={{ 
                        padding: '8px', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontSize: '14px'
                      }}>
                        {header || `Cột ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchedRows.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ 
                          padding: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '13px'
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <hr />
        <div className="summary-actions" style={{ marginTop: '15px' }}>
          <button onClick={() => startNewGame(gameStatus === 'lost')} style={{ padding: '8px 16px' }}>
            {gameStatus === 'won' ? 'Tiếp tục ván mới (Cộng dồn điểm)' : 'Chơi lại từ đầu'}
          </button>
          {typeof onClose === 'function' && (
            <button onClick={onClose} style={{ marginLeft: '10px', padding: '8px 16px' }}>
              Thoát
            </button>
          )}
        </div>
      </div>
    );
  }

  // Giao diện chính của trò chơi đang diễn ra
  return (
    <div style={{ padding: '20px' }}>
      <h3>Matching Card Game</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label>
          <strong>Thời gian: </strong>
          <span style={{ fontWeight: 'bold', color: '#007bff' }}>{selectedTimeOption}s</span>
        </label>
        <button onClick={() => startNewGame(true)}>
          Làm mới điểm & Chơi lại
        </button>
      </div>

      <div style={{ margin: '10px 0' }}>
        <div><strong>Thời gian còn lại:</strong> {timeLeft}s</div>
        <div><strong>Điểm số hiện tại:</strong> {score}</div>
        <div><strong>Số lượt sai:</strong> {wrongAnswers} / {maxWrongAttempts}</div>
      </div>

      {lastMatchedRow && (
        <div style={{ margin: '10px 0', fontSize: '13px', color: '#555' }}>
          💡 <em>Vừa khớp: {lastMatchedRow[card1_col]} — {lastMatchedRow[card2_col]}</em>
        </div>
      )}

      {/* Hiển thị số cặp đã khớp */}
      <div style={{ marginBottom: '10px' }}>
        <strong>Tiến độ:</strong> {matchedIds.length}/6 cặp
      </div>

      <div className="card-grid" style={{ 
        marginTop: '15px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        maxWidth: '500px'
      }}>
        {displayCards.map((card) => {
          const isMatched = matchedIds.includes(card.matchId);
          const isSelected = firstCard?.cardId === card.cardId || secondCard?.cardId === card.cardId;

          return (
            <button
              key={card.cardId}
              onClick={() => handleCardClick(card)}
              disabled={isMatched || gameStatus !== 'playing'}
              style={{
                padding: '15px',
                minHeight: '60px',
                border: isSelected ? '3px solid #007bff' : '2px solid #ccc',
                backgroundColor: isMatched ? '#d4edda' : isSelected ? '#e6f2ff' : '#fff',
                opacity: isMatched ? 0.7 : 1,
                cursor: (isMatched || gameStatus !== 'playing') ? 'default' : 'pointer',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isSelected ? 'bold' : 'normal'
              }}
            >
              {isMatched ? '✓' : card.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CardMatching;