import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { userInfo } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', category: '', due: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const dummyReports = [
      { title: 'AI 기술 동향', category: '기술', date: '2024-04-20' },
      { title: '마케팅 전략 분석', category: '마케팅', date: '2024-04-22' },
      { title: '시장 조사 리포트', category: '시장 조사', date: '2024-04-25' },
    ];
    const dummyPending = [
      { title: '고객 만족도 조사', category: '조사', due: '2024-04-28' },
      { title: '경쟁사 분석', category: '시장 조사', due: '2024-05-01' },
    ];
    setReports(dummyReports);
    setPendingReports(dummyPending);
  }, []);

  const allReports = [...reports, ...pendingReports.map(r => ({ ...r, date: r.due }))];
  const categoryCount = allReports.reduce((acc, report) => {
    acc[report.category] = (acc[report.category] || 0) + 1;
    return acc;
  }, {});
  const [showStartModal, setShowStartModal] = useState(false);
  const activityData = Object.keys(categoryCount).map((category) => ({
    name: category,
    value: categoryCount[category],
  }));

 

  

  const handleSaveNewReport = () => {
    if (!newReport.title || !newReport.category || !newReport.due) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const addedReport = { ...newReport };
    setPendingReports(prev => [...prev, addedReport]);
    setScheduledReports(prev => [...prev, { ...addedReport, date: addedReport.due }]);
    setNewReport({ title: '', category: '', due: '' });
    setShowModal(false);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const reportsOnDate = [
        ...reports.filter((r) => r.date === date.toISOString().slice(0, 10)),
        ...scheduledReports.filter((r) => r.date === date.toISOString().slice(0, 10))
      ];
      if (reportsOnDate.length > 0) {
        return (
          <div style={{ fontSize: 10, color: '#514EF3' }}>
            {reportsOnDate.map((r, idx) => (
              <div key={idx}>• {r.title}</div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div style={{ padding: 0, background: '#F6FAFD', minHeight: 'calc(100vh - 90px)' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#092C4C' }}>
        👋 {userInfo ? `${userInfo.firstName}${userInfo.lastName}` : '사용자'}님, 오늘도 좋은 하루 보내세요!
      </h2>

      {/* 내 활동 요약 + 작성 일정 카드 가로로 */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '30px' }}>
        {/* 내 활동 요약 카드 */}
        <div style={{ flex: 1, ...cardStyle }}>
          <h3>내 활동 요약</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: 24 }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: 16, color: '#092C4C' }}>
              총 작성한 보고서: {reports.length}개
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.keys(categoryCount).map((category, idx) => (
                <div key={idx} style={{ fontSize: 14, color: '#555' }}>
                  - {category}: {categoryCount[category]}개
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#514EF3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 작성 일정 카드 (달력) */}
        <div style={{ flex: 1, ...cardStyle }}>
          <h3>작성 일정</h3>
          <Calendar
            tileContent={tileContent}
            locale="ko-KR"
          />
        </div>
      </div>

      {/* 작성할 보고서 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap:12, alignItems: 'center', marginBottom: '16px' }}>
          <h3>오늘 작성해야 할 보고서</h3>
          <button
            onClick={() => setShowModal(true)}
            style={purpleButtonStyle}
          >
            추가하기
          </button>
          <button
  onClick={() => setShowStartModal(true)}
  style={grayButtonStyle}
>
  시작하기
</button>
        </div>

        {pendingReports.length === 0 ? (
          <p>오늘 작성할 보고서가 없습니다.</p>
        ) : (
          pendingReports
            .sort((a, b) => new Date(a.due) - new Date(b.due))
            .map((report, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: 14 }}>
                  - {report.title} ({report.category}) (D-{Math.ceil((new Date(report.due) - new Date()) / (1000 * 60 * 60 * 24))})
                </div>

              </div>
            ))
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
  <h3 style={{ marginBottom: '12px', color: '#092C4C' }}>공지사항</h3>
  <ul style={{ paddingLeft: '20px', margin: 0, color: '#555', fontSize: '15px', fontWeight: 500 }}>
    <li>4/30 업데이트: 보고서 자동 요약 기능 추가!</li>
  </ul>
</div>


{showStartModal && (
  <div style={modalBackground}>
    <div style={modalStyle}>
      <h3>작성할 보고서 선택</h3>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {pendingReports.length === 0 ? (
          <p>작성할 보고서가 없습니다.</p>
        ) : (
          pendingReports.map((report, idx) => (
            <li key={idx} style={{ marginBottom: '10px' }}>
              <button
                style={selectReportButtonStyle}
                onClick={() => {
                  navigate('/edit', { state: { title: report.title, category: report.category } });
                }}
              >
                {report.title} ({report.category})
              </button>
            </li>
          ))
        )}
      </ul>
      <button
        onClick={() => setShowStartModal(false)}
        style={{ ...grayButtonStyle, marginTop: '16px' }}
      >
        취소
      </button>
    </div>
  </div>
)}

      {/* 추가하기 모달 */}
      {showModal && (
        <div style={modalBackground}>
          <div style={modalStyle}>
            <h3>새 보고서 추가</h3>
            <input
              type="text"
              placeholder="제목 입력"
              value={newReport.title}
              onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="카테고리 입력"
              value={newReport.category}
              onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
              style={inputStyle}
            />
            <input
              type="date"
              value={newReport.due}
              onChange={(e) => setNewReport({ ...newReport, due: e.target.value })}
              style={inputStyle}
            />
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleSaveNewReport} style={purpleButtonStyle}>저장</button>
              <button onClick={() => setShowModal(false)} style={grayButtonStyle}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const selectReportButtonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#F0F2F5',
  border: 'none',
  borderRadius: '8px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
};
/* 스타일 정의 */
const cardStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  marginBottom: '30px',
};

const grayButtonStyle = {
  background: '#A0AEC0',
  color: 'white',
  padding: '6px 10px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
};

const purpleButtonStyle = {
  background: '#514EF3',
  color: 'white',
  padding: '6px 10px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
};

const modalBackground = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '12px',
  width: '30%',
  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
};

const inputStyle = {
  width: '95%',
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '8px',
  border: '1px solid #ccc',
};

export default Dashboard;
