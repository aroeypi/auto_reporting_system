// src/pages/Edit.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Edit = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
  
      const reader = new FileReader();
      reader.onload = () => {
        // 텍스트로 인코딩한 파일 내용 localStorage에 저장
        localStorage.setItem('edit_file', reader.result);  // base64 또는 text
        localStorage.setItem('edit_fileName', file.name);
      };
      reader.readAsDataURL(file); // 바이너리를 base64로 읽음 (이미지나 PDF 등 가능)
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleNextStep = () => {
    localStorage.setItem('edit_subject', subject);
    localStorage.setItem('edit_tags', JSON.stringify(tags));
    localStorage.setItem('edit_fileName', fileName);
    navigate('/edit2');
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleChat = () => {
    navigate('/chat');
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
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#092C4C', fontSize: 18, fontWeight: 700 }}>보고서 시작하기</h2>
        <div
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
          onClick={handleCancel}
        >
          ×
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 주제 작성 */}
        <div>
          <label style={{ fontWeight: 700, color: '#092C4C' }}>주제 작성하기</label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="주제를 작성해주세요"
            style={{
              marginTop: 8,
              width: '95%',
              height: 120,
              padding: 16,
              borderRadius: 8,
              border: '1px solid #EAEEF4',
              background: '#F6FAFD',
              resize: 'none',
            }}
          />
        </div>

        {/* 작성할 분야 */}
        <div>
          <label style={{ fontWeight: 700, color: '#092C4C' }}>작성할 분야 설정</label>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 기술, 의료, 교육..."
            style={{
              marginTop: 8,
              width: '95%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #EAEEF4',
              background: '#F6FAFD',
            }}
          />
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((tag, index) => (
              <div
                key={index}
                style={{
                  padding: '4px 12px',
                  background: '#6E41E2',
                  borderRadius: 4,
                  color: '#F6FAFD',
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {tag}
                <span
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    marginLeft: 8,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 파일 첨부 */}
        <div>
          <label style={{ fontWeight: 700, color: '#092C4C' }}>첨부 파일</label>
          <label
            htmlFor="fileUpload"
            style={{
              marginTop: 8,
              width: '98%',
              height: 100,
              background: '#F6FAFD',
              border: '1px solid #EAEEF4',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7E92A2',
              cursor: 'pointer',
            }}
          >
            {fileName ? fileName : '파일을 선택하거나 여기에 드래그하세요'}
          </label>
          <input
            id="fileUpload"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
          <button style={buttonWhite} onClick={handleCancel}>취소</button>
          <button style={buttonPrimary} onClick={handleChat}>AI와 대화하기</button>
          <button style={buttonPrimary} onClick={handleNextStep}>다음단계</button>
        </div>
      </div>
    </div>
  );
};

const buttonWhite = {
  padding: '10px 24px',
  borderRadius: 70,
  border: '1px solid #EAEEF4',
  background: 'white',
  color: '#092C4C',
  fontWeight: 500,
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

export default Edit;
