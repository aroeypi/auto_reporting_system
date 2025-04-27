import React, { useState, useEffect, useRef } from 'react';

const AiChat = ({ setReportContent, onExit }) => {
  const [messages, setMessages] = useState([{ type: 'bot', text: '안녕하세요! 무엇을 도와드릴까요?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    const newMessage = { type: 'user', text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setMessages(prev => [...prev, { type: 'bot', text: '이건 가짜 응답입니다! (API 응답 없이)' }]);
    setReportContent('이건 가짜 응답입니다! (본문 수정)');
  
    setIsLoading(false);
    

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'My React GPT Chat',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: '너는 사용자의 문서 작성을 도와주는 AI야.' },
            ...messages.map((msg) => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text,
            })),
            { role: 'user', content: input },
          ],
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;

      if (reply) {
        setMessages(prev => [...prev, { type: 'bot', text: reply }]);
        setReportContent(reply); 
      }
    } catch (error) {
      setMessages(prev => [...prev, { type: 'bot', text: '서버 오류가 발생했습니다.' }]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: '#EEF6FB',
    }}>
      {/* 상단 버튼 */}
      <div style={{ padding: '8px 0' }}>
        <button
          onClick={onExit}
          style={{
            padding: '10px 16px',
            marginLeft:20,
            borderRadius: 8,
            background: 'gray',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          출처 선택으로 돌아가기
        </button>
      </div>

      {/* 메시지 출력 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
              background: msg.type === 'user' ? '#514EF3' : 'white',
              color: msg.type === 'user' ? 'white' : '#092C4C',
              padding: '10px 16px',
              borderRadius: 16,
              maxWidth: '70%',
              fontSize: 15,
              whiteSpace: 'pre-wrap',
              border: msg.type === 'bot' ? '1px solid #EAEEF4' : 'none',
              wordBreak: 'break-word',
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 영역 */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '20px 8px 8px 8px',
        borderTop: '1px solid #ccc',
        background: '#EEF6FB',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            padding: '20px 20px',
            borderRadius: 8,
            border: '1px solid #EAEEF4',
            background: '#F6FAFD',
            fontSize: 16,
            color: '#092C4C',
            marginBottom:40,
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '10px 16px',
            background: '#514EF3',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom:40,
          }}
          disabled={isLoading}
        >
          {isLoading ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
};

export default AiChat;
