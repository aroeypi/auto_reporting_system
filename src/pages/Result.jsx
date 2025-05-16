// src/pages/Result.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdEdit, MdHome, MdShare, MdSave, MdPictureAsPdf } from 'react-icons/md';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

    const formattedDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    setToday(formattedDate);
    setEditableDate(formattedDate);

    if (userInfo) {
      setEditableName(`${userInfo.firstName}${userInfo.lastName}`);
      setEditableDepartment(userInfo.department || '');
    }
  }, [userInfo]);

  const handleEditClick = () => setIsEditing(true);

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
    if (existingFiles.some((file) => file.title === reportTitle)) {
      alert('같은 제목의 파일이 이미 존재합니다. 제목을 바꿔주세요!');
      return;
    }

    const newFile = {
      id: Date.now(),
      title: reportTitle,
      content: reportContent,
      date: today,
    };
    localStorage.setItem('saved_files', JSON.stringify([...existingFiles, newFile]));

    const existingAlarms = JSON.parse(localStorage.getItem('alarm_list')) || [];
    const newAlarm = {
      id: Date.now(),
      message: `📄 새로운 보고서 "${reportTitle}" 이(가) 저장되었습니다.`,
      time: new Date().toLocaleString(),
    };
    localStorage.setItem('alarm_list', JSON.stringify([newAlarm, ...existingAlarms]));
    localStorage.setItem('hasNewAlarm', 'true');
    localStorage.setItem('hasNewDashboardAlert', 'true');

    alert('파일이 저장되었습니다!');
    navigate('/file');
  };

  const handleShare = () => alert('공유 기능은 아직 준비 중입니다!');

  const handleDownloadPDF = () => {
    const input = document.getElementById('report-content');
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${reportTitle || 'report'}.pdf`);
    });
  };

  const styles = {
    container: {
      padding: '40px',
      maxWidth: '900px',
      margin: '90px auto',
      fontFamily: 'Noto Sans KR, sans-serif',
    },
    box: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 0 10px rgba(0,0,0,0.05)',
      padding: '40px',
    },
    header: {
      marginBottom: '30px',
      background: '#EEF6FB',
      padding: '20px',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meta: {
      fontSize: '16px',
      color: '#092C4C',
      fontWeight: 400,
      display: 'flex',
      gap: '30px',
      alignItems: 'center',
    },
    input: {
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      background: '#fff',
      fontSize: '14px',
      width: '150px',
      marginRight: '10px',
    },
    editButton: {
      padding: '8px',
      borderRadius: '8px',
      background: '#6789F7',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
    },
    saveButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      background: '#6789F7',
      border: 'none',
      color: 'white',
      fontWeight: 600,
      cursor: 'pointer',
    },
    title: {
      marginBottom: '20px',
      color: '#092C4C',
      fontSize: '24px',
      fontWeight: '700',
    },
    titleInput: {
      marginBottom: '20px',
      width: '100%',
      padding: '12px',
      fontSize: '22px',
      fontWeight: 600,
      color: '#092C4C',
      borderRadius: '8px',
      border: '1px solid #ccc',
    },
    textarea: {
      width: '100%',
      height: '300px',
      padding: '16px',
      fontSize: '16px',
      color: '#333',
      lineHeight: '1.8',
      borderRadius: '8px',
      border: '1px solid #ccc',
      resize: 'none',
    },
    content: {
      whiteSpace: 'pre-line',
      fontSize: '16px',
      color: '#333',
      lineHeight: '1.8',
    },
    bottomButtonArea: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '40px',
    },
    bottomButton: {
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
    },
  };

  return (
    <div id="report-content" style={styles.container}>
      <div style={styles.box}>
        <div style={styles.header}>
          <div style={styles.meta}>
            {isEditing ? (
              <>  
                <input
                  style={styles.input}
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  placeholder="작성자"
                />
                <input
                  style={styles.input}
                  value={editableDepartment}
                  onChange={(e) => setEditableDepartment(e.target.value)}
                  placeholder="부서"
                />
                <input
                  style={styles.input}
                  value={editableDate}
                  onChange={(e) => setEditableDate(e.target.value)}
                  placeholder="작성날짜"
                />
              </>
            ) : (
              <>  
                <span>작성자: {editableName || '이름없음'}</span>
                <span>부서: {editableDepartment || '부서없음'}</span>
                <span>작성날짜: {editableDate}</span>
              </>
            )}
          </div>
          {isEditing ? (
            <button style={styles.saveButton} onClick={handleSaveClick}>
              저장하기
            </button>
          ) : (
            <button style={styles.editButton} onClick={handleEditClick}>
              <MdEdit size={20} />
            </button>
          )}
        </div>
        {isEditing ? (
          <input
            type="text"
            style={styles.titleInput}
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        ) : (
          <h2 style={styles.title}>{reportTitle}</h2>
        )}
        {isEditing ? (
          <textarea
            style={styles.textarea}
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />
        ) : (
          <p style={styles.content}>{reportContent}</p>
        )}
      </div>
      {!isEditing && (
        <div style={styles.bottomButtonArea}>
          <button style={styles.bottomButton} onClick={handleSaveFile}>
            <MdSave size={20} /> 저장하기
          </button>
          <button style={styles.bottomButton} onChange={handleDownloadPDF} onClick={handleDownloadPDF}>
            <MdPictureAsPdf size={20} /> PDF 다운로드
          </button>

    {/* 처음 화면 */}
    <button onClick={() => navigate('/')} style={bottomButtonStyle}>
      <MdHome size={20} /> 처음 화면
    </button>

    {/* 공유하기 */}
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
