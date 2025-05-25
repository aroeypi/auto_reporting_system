// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const sampleMatches = [
  { date: '2025-05-22', home: 'LG 트윈스', away: '두산 베어스', result: '4:3 LG 승' },
  { date: '2025-05-23', home: '삼성 라이온즈', away: '기아 타이거즈', result: '7:2 삼성 승' },
  { date: '2025-05-24', home: 'SSG 랜더스', away: 'NC 다이노스', result: '3:3 무승부' },
  { date: '2025-05-25', home: '한화 이글스', away: '롯데 자이언츠', result: null }, // 예정
  { date: '2025-05-26', home: 'LG 트윈스', away: '키움 히어로즈', result: null }, // 예정
];

const baseballTeams = [
  { name: 'LG 트윈스', logo: '/assets/LG.png' },
  { name: '두산 베어스', logo: '/assets/DOOSAN.png' },
  { name: '삼성 라이온즈', logo: '/assets/SAMSUNG.png' },
  { name: '기아 타이거즈', logo: '/assets/KIA.png' },
  { name: 'SSG 랜더스', logo: '/assets/SSG.png' },
  { name: 'NC 다이노스', logo: '/assets/NC.png' },
  { name: '한화 이글스', logo: '/assets/HANWHA.png' },
  { name: '롯데 자이언츠', logo: '/assets/LOTTE.png' },
  { name: '키움 히어로즈', logo: '/assets/KIWOOM.png' },
  { name: 'KT WIZ', logo: '/assets/KT.png' },
];

const latestArticles = [
  { title: 'LG, 두산에 짜릿한 역전승!', summary: 'LG 트윈스가 9회말 끝내기 역전승을 거뒀습니다.', date: '2025-05-22' },
  { title: '삼성, 5연승 질주', summary: '삼성 라이온즈가 최근 5경기 연승을 달렸습니다.', date: '2025-05-23' },
  { title: '한화, 신인 투수 깜짝 데뷔', summary: '한화의 신인 투수가 첫 등판에서 호투를 선보였습니다.', date: '2025-05-21' },
];

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  // 달력 각 날짜별로 경기 정보 + 결과 표시
const tileContent = ({ date, view }) => {
  if (view === 'month') {
    const dateString = date.toISOString().slice(0, 10);
    const matches = sampleMatches.filter(m => m.date === dateString);

    // 항상 고정된 높이, 가운데 정렬(없으면 빈 div)
    return (
      <div style={{
        minHeight: 28, // 높이 원하는 값으로 (ex: 28~32px)
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}>
        {matches.length > 0 ? matches.map((m, i) => (
          <div
            key={i}
            style={{
              margin: '1px 0',
              width: '88%',
              background: '#F4F8FB',
              borderRadius: 6,
              padding: '2px 0',
              boxShadow: m.result ? '0 0 4px #d0e6e4' : '0 0 4px #ececec',
              textAlign: 'center',
              fontSize: 11,
              minHeight: 18, // 내용도 최소 높이
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 10, color: '#305078' }}>
              {m.home} <span style={{ color: '#777' }}>vs</span> {m.away}
            </span>
            {m.result && (
              <div style={{
                fontSize: 10,
                color: '#0A7D62',
                fontWeight: 700,
                marginTop: 1,
                lineHeight: 1.2,
              }}>
                {m.result}
              </div>
            )}
          </div>
        )) : null}
      </div>
    );
  }
  return null;
};



  return (
    <div style={{ padding: 0, background: '#F6FAFD', minHeight: 'calc(100vh - 90px)' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#092C4C' }}>
        ⚾ 오늘의 야구 뉴스 & 경기 일정
      </h2>

      {/* 1. 달력 + 최신 기사 카드 가로 배치 */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '30px' }}>
        {/* 달력 카드 */}
        <div style={{ flex: 1, ...cardStyle }}>
          <h3>야구 경기 일정</h3>
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            tileContent={tileContent}
            locale="ko-KR"
          />
        </div>

        {/* 최신 기사 카드 */}
        <div style={{ flex: 1, ...cardStyle }}>
          <h3>최신 기사</h3>
          {latestArticles.map((article, idx) => (
            <div key={idx} style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #EAEEF4' }}>
              <div style={{ fontWeight: 'bold', fontSize: 15, color: '#305078' }}>{article.title}</div>
              <div style={{ fontSize: 13, color: '#555', margin: '4px 0 6px' }}>{article.summary}</div>
              <div style={{ fontSize: 12, color: '#A0AEC0' }}>{article.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 야구 팀 목록 */}
      <div style={cardStyle}>
        <h3>2025 KBO 야구팀</h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '12px',
        }}>
          {baseballTeams.map((team, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '18px 18px',
                background: '#F6FAFD',
                border: '1px solid #EAEEF4',
                borderRadius: '14px',
                fontWeight: 'bold',
                color: '#305078',
                fontSize: 14,
                minWidth: 110,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              <img
                src={team.logo}
                alt={team.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  background: '#fff',
                  border: '2px solid #eee',
                  objectFit: 'contain'
                }}
              />
              <span style={{ marginTop: 8 }}>{team.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  marginBottom: '30px',
};

export default Dashboard;
