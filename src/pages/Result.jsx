// src/pages/Result.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { MdEdit, MdHome, MdShare, MdSave, MdPictureAsPdf } from 'react-icons/md';
import jsPDF from 'jspdf';

// 헥스 컬러를 RGB로 변환
const hexToRgb = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
  return { r, g, b };
};

const Result = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(AuthContext);

  // 리포트 내용 & 편집 상태
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [editableDept, setEditableDept] = useState('');
  const [editableDate, setEditableDate] = useState('');

  // 콘텐츠 스타일 설정
  const [contentFontSize, setContentFontSize] = useState(14);
  const [contentColor, setContentColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [contentFontFamily, setContentFontFamily] = useState('Noto Sans KR');
  const [contentAlign, setContentAlign] = useState('left');

  // PDF 설정
  const [margins]   = useState({ top: 40, left: 40, right: 40 });
  const [positions] = useState({ headerY: 60, metaYStart: 100, contentYStart: 160 });
  const [fontBase64, setFontBase64] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  // 한글 폰트 Base64 로드
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/fonts/NotoSansKR-Regular.ttf.base64.txt`)
      .then(r => r.text())
      .then(setFontBase64)
      .catch(() => console.error('폰트 로드 실패'));
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    setReportTitle(localStorage.getItem('edit_subject') || '제목 없음');
    setReportContent(localStorage.getItem('edit_content') || '내용이 없습니다.');
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    setEditableDate(today);
    if (userInfo) {
      setEditableName(`${userInfo.firstName}${userInfo.lastName}`);
      setEditableDept(userInfo.department || '');
    }
  }, [userInfo]);

  // 저장
  const handleSaveClick = () => {
    setIsEditing(false);
    localStorage.setItem('edit_subject', reportTitle);
    localStorage.setItem('edit_content', reportContent);
    const updated = {
      ...userInfo,
      firstName: editableName.slice(0, 1),
      lastName:  editableName.slice(1),
      department: editableDept
    };
    setUserInfo(updated);
    localStorage.setItem('user_info', JSON.stringify(updated));
    alert('저장되었습니다!');
  };

  // 공유
  const handleShare = () => {
    alert('공유 기능은 아직 준비 중입니다!');
  };

  // PDF 인스턴스 생성
  const createPdfInstance = () => {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const { left, right, top } = margins;
    const pageWidth = pdf.internal.pageSize.getWidth() - left - right;

    // 한글 폰트 등록
    if (fontBase64) {
      pdf.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
      pdf.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
      pdf.setFont('NotoSansKR', 'normal');
    }

    // 제목
    pdf.setFontSize(18);
    pdf.text(reportTitle, pageWidth / 2 + left, positions.headerY, { align: 'center' });

    // 메타정보
    pdf.setFontSize(12);
    pdf.text(`작성자: ${editableName}`, left, positions.metaYStart);
    pdf.text(`부서: ${editableDept}`, left + 200, positions.metaYStart);
    pdf.text(`작성날짜: ${editableDate}`, pageWidth + left, positions.metaYStart, { align: 'right' });

    // 본문 스타일 적용
    const { r, g, b } = hexToRgb(contentColor);
    pdf.setTextColor(r, g, b);
    pdf.setFontSize(contentFontSize);
    if (isBold)   pdf.setFont(undefined, 'bold');
    if (isItalic) pdf.setFont(undefined, 'italic');

    // 본문 텍스트
    const lines = pdf.splitTextToSize(reportContent, pageWidth);
    let cursorY = positions.contentYStart;
    lines.forEach(line => {
      if (cursorY > pdf.internal.pageSize.getHeight() - top) {
        pdf.addPage();
        cursorY = top;
      }
      pdf.text(line, left, cursorY);
      cursorY += contentFontSize * 1.2;
    });

    return pdf;
  };

  // PDF 미리보기
  const handlePreview = () => {
    const pdf = createPdfInstance();
    const blob = pdf.output('blob');
    setPreviewUrl(URL.createObjectURL(blob));
  };

  // PDF 저장
  const handleDownloadPDF = () => {
    const pdf = createPdfInstance();
    pdf.save(`${reportTitle || 'report'}.pdf`);
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* PDF 미리보기 */}
      {previewUrl && (
        <iframe
          src={previewUrl}
          title="PDF Preview"
          style={{ width: '100%', height: '500px', border: '1px solid #ccc', marginBottom: '20px' }}
        />
      )}

      {/* 편집 툴바 */}
      {isEditing && (
        <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* 글씨 크기 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            글씨 크기:
            <input
              type="number"
              value={contentFontSize}
              onChange={e => setContentFontSize(Number(e.target.value))}
              style={{ width: '60px' }}
            />px
          </label>

          {/* 글자 색상 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            글자 색상:
            <input
              type="color"
              value={contentColor}
              onChange={e => setContentColor(e.target.value)}
            />
          </label>

          {/* Bold */}
          <button
            onClick={() => setIsBold(b => !b)}
            style={{
              fontWeight: 'bold',
              background: isBold ? '#ddd' : 'transparent',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '4px 8px'
            }}
          >
            B
          </button>

          {/* Italic */}
          <button
            onClick={() => setIsItalic(i => !i)}
            style={{
              fontStyle: 'italic',
              background: isItalic ? '#ddd' : 'transparent',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '4px 8px'
            }}
          >
            I
          </button>

          {/* Underline */}
          <button
            onClick={() => setIsUnderline(u => !u)}
            style={{
              textDecoration: 'underline',
              background: isUnderline ? '#ddd' : 'transparent',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '4px 8px'
            }}
          >
            U
          </button>

          {/* 폰트 패밀리 */}
          <select
            value={contentFontFamily}
            onChange={e => setContentFontFamily(e.target.value)}
            style={{ borderRadius: 4, border: '1px solid #ccc', padding: '4px' }}
          >
            <option value="Noto Sans KR">Noto Sans KR</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          {/* 정렬 */}
          {['left', 'center', 'right'].map(dir => (
            <button
              key={dir}
              onClick={() => setContentAlign(dir)}
              style={{
                background: contentAlign === dir ? '#ddd' : 'transparent',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '4px 8px'
              }}
            >
              {dir === 'left' ? 'L' : dir === 'center' ? 'C' : 'R'}
            </button>
          ))}
        </div>
      )}

      {/* 리포트 편집 & 내용 */}
      <div
        id="report-content"
        style={{
          padding: '40px',
          maxWidth: '900px',
          margin: '0 auto 20px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 0 10px rgba(0,0,0,0.05)'
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#EEF6FB',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}
        >
          <div style={{ display: 'flex', gap: '20px', fontSize: 16, color: '#092C4C' }}>
            {isEditing ? (
              <>
                <input
                  value={editableName}
                  onChange={e => setEditableName(e.target.value)}
                  placeholder="작성자"
                  style={{ padding: 8, width: 150, borderRadius: 8, border: '1px solid #ccc' }}
                />
                <input
                  value={editableDept}
                  onChange={e => setEditableDept(e.target.value)}
                  placeholder="부서"
                  style={{ padding: 8, width: 150, borderRadius: 8, border: '1px solid #ccc' }}
                />
                <input
                  value={editableDate}
                  onChange={e => setEditableDate(e.target.value)}
                  placeholder="작성날짜"
                  style={{ padding: 8, width: 150, borderRadius: 8, border: '1px solid #ccc' }}
                />
              </>
            ) : (
              <>
                <span>작성자: {editableName}</span>
                <span>부서: {editableDept}</span>
                <span>작성날짜: {editableDate}</span>
              </>
            )}
          </div>
          {isEditing ? (
            <button
              onClick={handleSaveClick}
              style={{ padding: '8px 16px', background: '#6789F7', color: '#fff', border: 'none', borderRadius: 8 }}
            >
              저장
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{ padding: 8, background: '#6789F7', color: '#fff', border: 'none', borderRadius: 8 }}
            >
              <MdEdit size={20} />
            </button>
          )}
        </div>

        {/* 제목 */}
        {isEditing ? (
          <input
            value={reportTitle}
            onChange={e => setReportTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 22,
              fontFamily: contentFontFamily,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              color: contentColor,
              textAlign: contentAlign,
              borderRadius: 8,
              border: '1px solid #ccc',
              marginBottom: '20px'
            }}
          />
        ) : (
          <h2
            style={{
              fontSize: 24,
              fontFamily: contentFontFamily,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              color: contentColor,
              textAlign: contentAlign,
              marginBottom: '20px'
            }}
          >
            {reportTitle}
          </h2>
        )}

        {/* 본문 */}
        {isEditing ? (
          <textarea
            value={reportContent}
            onChange={e => setReportContent(e.target.value)}
            placeholder="내용을 입력하세요"
            style={{
              width: '100%',
              height: 300,
              padding: 16,
              fontSize: contentFontSize,
              fontFamily: contentFontFamily,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              color: contentColor,
              textAlign: contentAlign,
              borderRadius: 8,
              border: '1px solid #ccc'
            }}
          />
        ) : (
          <p
            style={{
              whiteSpace: 'pre-line',
              fontSize: contentFontSize,
              fontFamily: contentFontFamily,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              color: contentColor,
              textAlign: contentAlign,
              lineHeight: 1.5
            }}
          >
            {reportContent}
          </p>
        )}
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 40 }}>
        <button
          onClick={handleSaveClick}
          style={{
            padding: '10px',
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdSave size={20} /> 저장
        </button>
        <button
          onClick={handlePreview}
          style={{
            padding: '10px',
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdPictureAsPdf size={20} /> 미리보기
        </button>
        {previewUrl && (
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '10px',
              background: '#6789F7',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 8
            }}
          >
            <MdPictureAsPdf size={20} /> PDF 저장
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px',
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdHome size={20} /> 홈
        </button>
        <button
          onClick={handleShare}
          style={{
            padding: '10px',
            background: '#6789F7',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8
          }}
        >
          <MdShare size={20} /> 공유
        </button>
      </div>
    </div>
  );
};

export default Result;
