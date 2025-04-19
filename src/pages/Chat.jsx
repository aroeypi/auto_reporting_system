// src/pages/Chat.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

//console.log('OpenRouter API KEY:', process.env.REACT_APP_OPENROUTER_API_KEY);

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { type: 'bot', text: '안녕하세요! 무엇을 도와드릴까요?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // ✅ 로딩 상태

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true); // ⏳ 전송 중

    const newMessage = { type: 'user', text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'My React GPT Chat',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...messages.map((msg) => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text,
            })),
            { role: 'user', content: input },
          ],
        }),
      });

      const data = await response.json();
      console.log('🧠 OpenRouter 응답:', data);

      const reply = data.choices?.[0]?.message?.content;

      if (reply) {
        setMessages((prev) => [...prev, { type: 'bot', text: reply }]);
      } else if (data.error?.message) {
        setMessages((prev) => [...prev, { type: 'bot', text: `❌ 오류: ${data.error.message}` }]);
      } else {
        setMessages((prev) => [...prev, { type: 'bot', text: '응답을 불러올 수 없습니다.' }]);
      }
    } catch (error) {
      console.error('OpenRouter API 호출 실패:', error);
      setMessages((prev) => [...prev, { type: 'bot', text: '서버 연결에 실패했어요 🥲' }]);
    }

    setIsLoading(false); // ✅ 로딩 완료
  };

  return (
    <div style={chatWrapper}>
      <div style={chatHeader}>
        <button onClick={() => navigate('/edit')} style={backButton}>←</button>
        <h3 style={{ margin: 0, color: '#092C4C' }}>AI와 대화하기</h3>
      </div>

      <div style={chatBody}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
              background: msg.type === 'user' ? '#514EF3' : '#EEF6FB',
              color: msg.type === 'user' ? 'white' : '#092C4C',
              padding: '10px 16px',
              borderRadius: 16,
              maxWidth: '70%',
              marginBottom: 8,
              fontSize: 15,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={chatInputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
          style={chatInput}
          disabled={isLoading}
        />
        <button onClick={handleSend} style={sendButton} disabled={isLoading}>
          {isLoading ? '응답 중...' : '전송'}
        </button>
      </div>
    </div>
  );
};

const chatWrapper = {
  width: '100%',
  maxWidth: 900,
  margin: '90px auto',
  display: 'flex',
  flexDirection: 'column',
  background: 'white',
  borderRadius: 12,
  padding: 20,
  height: '80vh',
  boxShadow: '0 0 10px rgba(0,0,0,0.05)',
};

const chatHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingBottom: 10,
  borderBottom: '1px solid #eee',
};

const backButton = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  color: '#514EF3',
};

const chatBody = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  marginTop: 20,
  paddingRight: 8,
};

const chatInputArea = {
  display: 'flex',
  marginTop: 16,
  gap: 12,
};

const chatInput = {
  flex: 1,
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #EAEEF4',
  background: '#F6FAFD',
  fontSize: 16,
  color: '#092C4C',
};

const sendButton = {
  padding: '10px 16px',
  background: '#514EF3',
  border: 'none',
  borderRadius: 8,
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
};

export default Chat;
