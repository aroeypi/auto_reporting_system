import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.js';
import AiChat from '../components/AiChat.jsx';

const Edit3 = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [today, setToday] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allSources, setAllSources] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedSources, setSelectedSources] = useState([]);
  const [isChatMode, setIsChatMode] = useState(false);

  const sidebarWidth = isSidebarOpen ? 600 : 300;

  useEffect(() => {
    const title = localStorage.getItem('edit_subject');
    setReportTitle(title || '제목 없음');
    setReportContent(`이 보고서는 "${title}"에 대한 AI가 자동 생성한 초안입니다. 내용을 수정할 수 있습니다.`);

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    setToday(formattedDate);

    const fakeData = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `제목 ${i + 1}`,
      summary: `요약 내용 ${i + 1}`,
    }));
    setAllSources(fakeData);
    setSelectedSources(fakeData.slice(0, 3).map((s) => s.id));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const handleSourceChange = (id) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const resetSources = () => {
    const reordered = allSources.filter((s) => selectedSources.includes(s.id));
    setVisibleCount(5);
    setAllSources(prev => {
      const selectedSet = new Set(selectedSources);
      return [...reordered, ...prev.filter((s) => !selectedSet.has(s.id))];
    });
  };

  return (
    <div style={{
      width: '100%',
      position: 'relative',
      padding: '20px',
      background: '#F6FAFD',
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      
      {/* 유저 정보 */}
      <div style={{
        background: '#EEF6FB',
        padding: 16,
        paddingRight: sidebarWidth + 50,
        borderRadius: 8,
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 14, color: '#7E92A2', width: '33%' }}>작성자</div>
          <div style={{ fontSize: 14, color: '#7E92A2', width: '33%', textAlign: 'center' }}>부서</div>
          <div style={{ fontSize: 14, color: '#7E92A2', width: '33%', textAlign: 'right' }}>작성날짜</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#092C4C', width: '33%' }}>
            {userInfo ? `${userInfo.firstName}${userInfo.lastName}` : '이름없음'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#092C4C', width: '33%', textAlign: 'center' }}>
            {userInfo?.department || '부서없음'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#092C4C', width: '33%', textAlign: 'right' }}>
            {today}
          </div>
        </div>
      </div>

      {/* 보고서 본문 */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        padding: '32px',
        width: `calc(100% - ${sidebarWidth}px)`,
        marginLeft: 0,
        marginTop: 0,
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        <h2 style={{ marginBottom: '16px' }}>{reportTitle}</h2>
        <p style={{ whiteSpace: 'pre-line' }}>{reportContent}</p>
      </div>

      {/* 사이드바 */}
      <aside style={{
        position: 'fixed',
        top: 90,
        right: 0,
        width: sidebarWidth,
        height: 'calc(100vh - 90px)',
        background: '#EEF6FB',
        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
        padding: '20px',
        overflowY: 'auto',
        transition: 'width 0.3s ease',
      }}>
        {isChatMode ? (
          <AiChat
            setReportContent={setReportContent}
            onExit={() => setIsChatMode(false)}
          />
        ) : (
          <>
            <div style={{ paddingLeft: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>이미지 추가하기</h3>
              <input 
                type="file" 
                style={{ marginTop: '20px', marginBottom: '24px' }} 
              />
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginTop: 30 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>출처 선택</label>
              <select style={{
                padding: '10px 16px',
                width: '100%',
                borderRadius: 8,
                border: '1px solid #EAEEF4',
                background: '#F6FAFD',
                marginBottom: 16
              }}>
                <option>출처 없음</option>
                <option>웹 기사</option>
                <option>논문</option>
                <option>기타</option>
              </select>
              <hr style={{ margin: '12px 0' }} />

              {/* 리스트 헤더 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 600,
                fontSize: 14,
                color: '#092C4C',
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid #EAEEF4',
              }}>
                <span style={{ width: '25%' }}>출처 위치</span>
                <span style={{ width: '35%' }}>제목</span>
                <span style={{ width: '40%' }}>요약</span>
              </div>

              {/* 출처 리스트 */}
              <div style={{ maxHeight: isSidebarOpen ? 300 : 150, overflowY: 'auto' }}>
                {allSources.slice(0, visibleCount).map((source) => (
                  <div key={source.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontSize: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid #F0F0F0'
                  }}>
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => handleSourceChange(source.id)}
                      />
                      <span style={{ marginLeft: '8px', fontWeight: 500, width: '20%' }}>위치 {source.id}</span>
                    </div>
                    <div style={{ fontWeight: 600, width: '35%' }}>{source.title}</div>
                    <div style={{ fontWeight: 300, width: '50%' }}>{source.summary}</div>
                  </div>
                ))}
              </div>

              {/* 버튼 */}
              {visibleCount < allSources.length && (
                <button onClick={() => setVisibleCount(allSources.length)}
                  style={{ ...btnStyle, background: 'transparent', color: '#514EF3' }}>
                  View more
                </button>
              )}
              <button style={{ width: '100%', ...btnStyle }} onClick={resetSources}>
                출처 재선택
              </button>
            </div>
          </>
        )}
      </aside>

      {/* 사이드바 토글 버튼 */}
      <div
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          top: 0,
          left: `calc(100% - ${sidebarWidth + 40}px)`,
          width: 28,
          height: 80,
          background: '#D0E6F8',
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#555',
          fontSize: 14,
          zIndex: 20,
          transition: 'left 0.3s ease',
        }}
      >
        {isSidebarOpen ? '>' : '<'}
      </div>

      {/* 하단 버튼 */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: sidebarWidth + 70,
        display: 'flex',
        gap: '12px',
        transition: 'right 0.3s ease',
      }}>
        <button onClick={() => navigate('/edit2')} style={btnStyle}>이전 단계</button>
        <button onClick={() => setIsChatMode(true)} style={btnStyle}>AI 대화수정하기</button>
        <button onClick={() => {localStorage.setItem('edit_content', reportContent); // 🔥 최종 내용 저장
        navigate('/Result');}} style={btnStyle}>완료하기</button>
      </div>
    </div>
  );
};

const btnStyle = {
  padding: '10px 16px',
  borderRadius: 8,
  background: '#514EF3',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
};

export default Edit3;
