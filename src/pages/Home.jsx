// components/Home.jsx
import React, { useState } from 'react';
import PopUp from '../components/PopUp';

function Home() {
  const [data, setData] = useState([]);
  const [showPopUp, setShowPopUp] = useState(false);

  const handlePaste = (e) => {
    const text = e.target.value;
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const parsedData = rows.map(row => row.split('\t').map(cell => cell.trim()));
    setData(parsedData);
  };

  const handleSubmit = () => {
    if (data.length > 0) {
      setShowPopUp(true);
    }
  };

  return (
    <div>
      <h2>Nhập bảng dữ liệu tiếng Nhật</h2>
      <textarea 
        rows={10} 
        cols={50} 
        placeholder="Paste table here (tab-separated)"
        onChange={handlePaste}
      />
      <br />
      <button onClick={handleSubmit}>Tạo bài tập</button>
      {showPopUp && <PopUp data={data} onClose={() => setShowPopUp(false)} />}
    </div>
  );
}

export default Home;