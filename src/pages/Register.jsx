import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const { setIsLoggedIn, setUserInfo } = useContext(AuthContext);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    department: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('회원가입 실패');

      const data = await response.json();

      localStorage.setItem('user_info', JSON.stringify(data));
      localStorage.setItem('isLoggedIn', 'true');

      setUserInfo(data);
      setIsLoggedIn(true);
      navigate('/');
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입에 실패했습니다.');
    }
  };

  return (
    <div
      style={{
        marginTop: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#F6FAFD',
        minHeight: 'calc(100vh - 90px)',
        padding: '40px 20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          background: 'white',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
        }}
      >
        <h2 style={{ color: '#092C4C', width: '30%' }}>회원가입</h2>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First Name</label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="눈송"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last Name</label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="김"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="noonsong@example.com"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Department</label>
          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="부서 입력"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>ID</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="아이디 입력"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호 입력"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          style={submitButtonStyle}
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

const labelStyle = {
  color: '#092C4C',
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 8,
  display: 'block',
};

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 8,
  border: '1px solid #D6E1E6',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  minWidth: '0',
};

const submitButtonStyle = {
  width: '100%',
  padding: 12,
  background: '#514EF3',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: 12,
};

export default Register;
