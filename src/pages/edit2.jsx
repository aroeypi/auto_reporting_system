/*상단 제목: 스포츠 기사 세부 정보 입력

추천제목 → 기사 제목 (수정 가능)

외부 소스 → 참고 AI/소스 선택 (옵션 예시: Bing 스포츠, naver 스포츠AI 등)

작성 날짜 → 기사 작성 날짜

특별 요청사항 placeholder → "팀명과 선수 이름을 정확하게 표기해 주세요. 기사 스타일은 스포츠 신문처럼 써주세요."

하단 버튼 → "기사 작성 시작"
*/
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Edit2 = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [customTitle, setCustomTitle] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    const storedSubject = localStorage.getItem('edit_subject');
    if (storedSubject) {
      setCustomTitle(storedSubject);
    }

    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    setToday(formatted);
  }, []);

  const handleBack = () => {
    navigate('/edit');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 900,
        background: 'white',
        borderRadius: 12,
        padding: 32,
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* 헤더 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#092C4C', fontSize: 18, fontWeight: 700 }}>스포츠 기사 세부 정보 입력</h2>
        <div
          onClick={handleHome}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#7E92A2',
            cursor: 'pointer',
          }}
        >
          ×
        </div>
      </div>

      {/* 유저 정보 */}
      <div
        style={{
          background: '#EEF6FB',
          padding: 16,
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#D6E1E6',
            }}
          />
          <div>
            <div style={{ fontSize: 14, color: '#7E92A2' }}>
              {userInfo?.department || '부서없음'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#092C4C' }}>
              {userInfo ? `${userInfo.firstName}${userInfo.lastName}` : '이름없음'}
            </div>
          </div>
        </div>
      </div>

      {/* 추천제목 입력 */}
      <div>
        <label style={{ fontWeight: 700, fontSize: 16, color: '#092C4C' }}>
          기사 제목 (수정 가능)
        </label>
        <input
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          style={{
            marginTop: 8,
            width: '95%',
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid #EAEEF4',
            background: '#F6FAFD',
            fontSize: 16,
            color: '#092C4C',
          }}
        />
      </div>

      {/* 외부 소스 선택 */}
      <div>
        <label style={{ fontWeight: 700, fontSize: 16, color: '#092C4C', marginRight: 20 }}>
          참고 AI/소스 선택
        </label>
        <select
          style={{
            marginTop: 8,
            width: '30%',
            padding: '10px 1px',
            borderRadius: 8,
            border: '1px solid #EAEEF4',
            background: '#F6FAFD',
            fontSize: 16,
            color: '#092C4C',
          }}
        >
          <option>ChatGPT-4.0</option>
          <option>Bing</option>
          <option>naver 스포츠AI</option>
          <option>daum 뉴스AI</option>
        </select>
      </div>

      {/* 작성날짜 */}
      <div>
        <label style={{ fontWeight: 700, fontSize: 16, color: '#092C4C' }}>기사 작성 날짜</label>
        <div
          style={{
            width: '30%',
            marginTop: 8,
            background: '#F6FAFD',
            padding: '10px 20px',
            border: '1px solid #EAEEF4',
            borderRadius: 8,
            fontSize: 16,
            color: '#7E92A2',
          }}
        >
          {today}
        </div>
      </div>

      {/* 특별 요청사항 */}
      <div>
        <label style={{ fontWeight: 700, fontSize: 16, color: '#092C4C' }}>특별 요청사항</label>
        <textarea
          rows={4}
          placeholder="예: 팀명과 선수 이름을 정확하게 표기해 주세요. 기사 스타일은 스포츠 신문처럼 써주세요."
          style={{
            marginTop: 8,
            width: '95%',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #EAEEF4',
            background: '#F6FAFD',
            resize: 'none',
            fontSize: 16,
            color: '#092C4C',
          }}
        />
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button style={buttonPrimary} onClick={() => navigate('/edit3')}>기사 작성 시작</button>
      </div>
    </div>
  );
};

const buttonWhite = {
  padding: '10px 24px',
  borderRadius: 70,
  background: '#514EF3',
  color: 'white',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
};

const buttonPrimary = {
  padding: '10px 24px',
  borderRadius: 70,
  background: '#514EF3',
  color: 'white',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
};

export default Edit2;
