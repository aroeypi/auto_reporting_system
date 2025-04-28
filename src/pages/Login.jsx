import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('네이티브 앱 키 입력'); // 🔥 본인 키로 대체
    }
  }, []);

  

  const handleRegister = () => {
    navigate('/register');
  };
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
  
      if (!response.ok) throw new Error('Login failed');
  
      const data = await response.json();
      console.log('로그인 성공 데이터:', data);
  
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
      success: function (authObj) {
        console.log('카카오 로그인 성공', authObj);
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async function (res) {
            console.log('카카오 사용자 정보', res);

            const kakaoUser = {
              email: res.kakao_account.email || '',
              nickname: res.kakao_account.profile.nickname || '',
              kakaoId: res.id.toString(),
            };

            try {
              const serverRes = await fetch('http://localhost:8000/api/kakao-login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(kakaoUser),
              });

              if (!serverRes.ok) throw new Error('서버 로그인 실패');

              const data = await serverRes.json();
              console.log('서버 데이터:', data);

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
          fail: function (error) {
            console.error('사용자 정보 요청 실패', error);
            alert('카카오 사용자 정보 요청 실패');
          }
        });
      },
      fail: function (err) {
        console.error('카카오 로그인 실패', err);
        alert('카카오 로그인 실패');
      }
    });
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={(e) => e.preventDefault()} style={formStyle}>
        <h2 style={{ textAlign: 'center', color: '#092C4C' }}>Login</h2>

        

        {/* 이메일 입력 */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        {/* 비밀번호 입력 */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
<button
  onClick={handleKakaoLogin}
  style={{
    width: '100%',           // 버튼 가로 100%
    padding: '12px',
    background: '#FEE500',   // 카카오 노란색
    color: '#3C1E1E',        // 카카오 글자색
    border: 'none',
    borderRadius: '8px',     // 살짝 둥글게
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',         // 아이콘 + 텍스트 정렬
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',             // 아이콘과 글자 사이 여백
  }}
>
  {/* 카카오 아이콘 (선택사항) */}
  
  카카오 로그인
</button>



        {/* 일반 로그인 버튼 */}
        <button type="button" onClick={handleLogin} style={buttonStyle}>
          Login
        </button>

        {/* 회원가입 버튼 */}
        <button type="button" onClick={handleRegister} style={buttonStyle}>
          Register
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

const buttonStyle = {
  width: '100%',
  padding: 12,
  background: '#514EF3',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};



export default Login;
