// src/pages/Result.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdEdit, MdHome, MdShare, MdSave } from 'react-icons/md';

const Result = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(AuthContext);

  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [today, setToday] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [editableName, setEditableName] = useState('');
  const [editableDepartment, setEditableDepartment] = useState('');
  const [editableDate, setEditableDate] = useState('');

  useEffect(() => {
    const title = localStorage.getItem('edit_subject');
    const content = localStorage.getItem('edit_content');
    setReportTitle(title || '제목 없음');
    setReportContent(content || '내용이 없습니다.');

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    setToday(formattedDate);

    if (userInfo) {
      setEditableName(`${userInfo.firstName}${userInfo.lastName}`);
      setEditableDepartment(userInfo.department || '');
    }
    setEditableDate(formattedDate);
  }, [userInfo]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);

    localStorage.setItem('edit_subject', reportTitle);
    localStorage.setItem('edit_content', reportContent);

    const updatedUser = {
      ...userInfo,
      firstName: editableName.slice(0, 1),
      lastName: editableName.slice(1),
      department: editableDepartment,
    };
    setUserInfo(updatedUser);
    localStorage.setItem('user_info', JSON.stringify(updatedUser));

    alert('수정된 내용이 저장되었습니다!');
  };

  const handleSaveFile = () => {
    const existingFiles = JSON.parse(localStorage.getItem('saved_files')) || [];

    const isDuplicate = existingFiles.some(file => file.title === reportTitle);
    if (isDuplicate) {
      alert('같은 제목의 파일이 이미 존재합니다. 제목을 바꿔주세요!');
      return;
    }

    const newFile = {
      id: Date.now(),
      title: reportTitle,
      content: reportContent,
      date: today,
    };

    const updatedFiles = [...existingFiles, newFile];
    localStorage.setItem('saved_files', JSON.stringify(updatedFiles));

    // ✅ 알림 생성
    const existingAlarms = JSON.parse(localStorage.getItem('alarm_list')) || [];
    const newAlarm = {
      id: Date.now(),
      message: `📄 새로운 보고서 "${reportTitle}" 이(가) 저장되었습니다.`,
      time: new Date().toLocaleString(),
    };
    const updatedAlarms = [newAlarm, ...existingAlarms];
    localStorage.setItem('alarm_list', JSON.stringify(updatedAlarms));
    localStorage.setItem('hasNewAlarm', 'true');
    localStorage.setItem('hasNewDashboardAlert', 'true');

    alert('파일이 저장되었습니다!');
    navigate('/file');
  };

  const handleShare = () => {
    alert('공유 기능은 아직 준비 중입니다!');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '90px auto' }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        padding: '40px',
      }}>
        <div style={{
          marginBottom: '30px',
          background: '#EEF6FB',
          padding: '20px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '16px',
            color: '#092C4C',
            fontWeight: 400,
            display: 'flex',
            gap: '30px',
            alignItems: 'center',
          }}>
            {isEditing ? (
              <>
                <input value={editableName} onChange={(e) => setEditableName(e.target.value)} placeholder="작성자" style={inputStyle} />
                <input value={editableDepartment} onChange={(e) => setEditableDepartment(e.target.value)} placeholder="부서" style={inputStyle} />
                <input value={editableDate} onChange={(e) => setEditableDate(e.target.value)} placeholder="작성날짜" style={inputStyle} />
              </>
            ) : (
              <>
                <span>작성자: {editableName || '이름없음'}</span>
                <span>부서: {editableDepartment || '부서없음'}</span>
                <span>작성날짜: {editableDate}</span>
              </>
            )}
          </div>

          {!isEditing ? (
            <button onClick={handleEditClick} style={editButtonStyle}>
              <MdEdit color="white" size={20} />
            </button>
          ) : (
            <button onClick={handleSaveClick} style={saveButtonStyle}>
              저장하기
            </button>
          )}
        </div>

        {isEditing ? (
          <input type="text" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} style={inputTitleStyle} />
        ) : (
          <h2 style={titleStyle}>{reportTitle}</h2>
        )}

        {isEditing ? (
          <textarea value={reportContent} onChange={(e) => setReportContent(e.target.value)} style={textareaStyle} />
        ) : (
          <p style={contentStyle}>{reportContent}</p>
        )}
      </div>

      {!isEditing && (
        <div style={bottomButtonArea}>
          <button onClick={handleSaveFile} style={bottomButtonStyle}>
            <MdSave size={20} /> 저장하기
          </button>
          <button onClick={() => navigate('/')} style={bottomButtonStyle}>
            <MdHome size={20} /> 처음 화면
          </button>
          <button onClick={handleShare} style={bottomButtonStyle}>
            <MdShare size={20} /> 공유하기
          </button>
        </div>
      )}
    </div>
  );
};

// ✨ 스타일 정리
const inputStyle = {
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  background: '#fff',
  fontSize: '14px',
  width: '150px',
};

const inputTitleStyle = {
  marginBottom: '20px',
  width: '100%',
  padding: '12px',
  fontSize: '22px',
  fontWeight: 600,
  color: '#092C4C',
  borderRadius: 8,
  border: '1px solid #ccc',
};

const textareaStyle = {
  width: '100%',
  height: '300px',
  padding: '16px',
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.8',
  borderRadius: 8,
  border: '1px solid #ccc',
  resize: 'none',
};

const titleStyle = {
  marginBottom: '20px',
  color: '#092C4C',
  fontSize: '24px',
  fontWeight: '700',
};

const contentStyle = {
  whiteSpace: 'pre-line',
  fontSize: '16px',
  color: '#333',
  lineHeight: '1.8',
};

const editButtonStyle = {
  padding: 8,
  borderRadius: 8,
  background: '#6789F7',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const saveButtonStyle = {
  padding: '8px 16px',
  borderRadius: 8,
  background: '#6789F7',
  border: 'none',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};

const bottomButtonArea = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  marginTop: '40px',
};

const bottomButtonStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  background: '#6789F7',
  color: 'white',
  fontWeight: 600,
  fontSize: '15px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export default Result;
