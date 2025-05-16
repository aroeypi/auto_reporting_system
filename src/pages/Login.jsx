// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('네이티브 앱 키 입력'); // 🔥 본인 키로 대체
    }
  }, []);

  const handleRegister = () => navigate('/register');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      setUserInfo(data.user);
      setIsLoggedIn(true);
      navigate('/');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 실패');
    }
  };

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      alert('Kakao SDK 로딩 실패');
      return;
    }
    window.Kakao.Auth.login({
      success: (authObj) => {
        console.log('카카오 로그인 성공', authObj);
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async (res) => {
            const kakaoUser = {
              email: res.kakao_account.email || '',
              nickname: res.kakao_account.profile.nickname || '',
              kakaoId: res.id.toString(),
            };
            try {
              const serverRes = await fetch('http://localhost:8000/api/kakao-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kakaoUser),
              });
              if (!serverRes.ok) throw new Error('서버 로그인 실패');

              const data = await serverRes.json();
              localStorage.setItem('token', data.access_token);
              localStorage.setItem('user_info', JSON.stringify(data.user));
              localStorage.setItem('isLoggedIn', 'true');
              setUserInfo(data.user);
              setIsLoggedIn(true);
              navigate('/');
            } catch (error) {
              console.error('카카오 로그인 서버 실패:', error);
              alert('서버 로그인 실패');
            }
          },
          fail: (error) => {
            console.error('사용자 정보 요청 실패', error);
            alert('카카오 사용자 정보 요청 실패');
          },
        });
      },
      fail: (err) => {
        console.error('카카오 로그인 실패', err);
        alert('카카오 로그인 실패');
      },
    });
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={(e) => e.preventDefault()} style={formStyle}>
        <h2 style={{ textAlign: 'center', color: '#092C4C' }}>Login</h2>

        <input
          type="text"
          placeholder="ID"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="button"
          onClick={handleLogin}
          style={buttonStyle}
          onMouseOver={(e) => (e.currentTarget.style.background = '#3A5DE0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#4A6CF7')}
        >
          로그인
        </button>

        <button
          type="button"
          onClick={handleRegister}
          style={registerButtonStyle}
        >
          회원가입
        </button>

        <button
          type="button"
          onClick={handleKakaoLogin}
          style={kakaoButtonStyle}
        >
          카카오 로그인
        </button>
      </form>
    </div>
  );
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '60px',
  height: 'calc(100vh - 90px)',
  background: '#F6FAFD',
};

const formStyle = {
  background: 'white',
  padding: 40,
  borderRadius: 12,
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  width: '100%',
  maxWidth: 400,
};

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid #D6E1E6',
  fontSize: 14,
};

const baseButtonStyle = {
  width: '100%',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
};

const buttonStyle = {
  ...baseButtonStyle,
  background: '#4A6CF7',
  color: 'white',
};

const registerButtonStyle = {
  ...baseButtonStyle,
  background: '#4A6CF7',
  color: 'white',
};

const kakaoButtonStyle = {
  ...baseButtonStyle,
  background: '#FEE500',
  color: '#3C1E1E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
};

export default Login;
