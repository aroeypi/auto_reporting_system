import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { setIsLoggedIn } = useContext(AuthContext); // ✅ 함수 안에서 선언
  const navigate = useNavigate(); // ✅ 함수 안에서 선언

  const handleLogin = () => {
    console.log('로그인 시도:', { email, password });
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100vh - 90px)',
        marginTop: 90,
        background: '#F6FAFD',
      }}
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          background: 'white',
          padding: 40,
          borderRadius: 12,
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#092C4C' }}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #D6E1E6',
            fontSize: 14,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #D6E1E6',
            fontSize: 14,
          }}
        />

        <button
          type="button"
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: 10,
            background: '#514EF3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Login
        </button>

        <button
          type="button"
          onClick={handleRegister}
          style={{
            marginTop: 12,
            width: '100%',
            padding: 10,
            background: '#514EF3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Login;

